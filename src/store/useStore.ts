/**
 * Zustand 狀態管理 + Firebase Firestore
 */

import { create } from 'zustand'
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type {
  Session,
  Student,
  Response,
  CreateSessionInput,
  Step,
  Class,
  Reaction,
  MyBook,
  ShareStep,
} from '../types'
import { generateId, generateJoinCode, buildAnonMap } from '../utils/helpers'

interface Store {
  /** 所有班級 */
  classes: Class[]
  /** 所有任務 */
  sessions: Session[]
  /** 所有學生（當前任務的） */
  students: Student[]
  /** 當前學生（加入任務後） */
  currentStudent: Student | null
  /** 所有學生回答（當前任務的） */
  responses: Response[]
  /** 所有 💡（當前任務的） */
  reactions: Reaction[]
  /** 載入狀態 */
  loading: boolean

  /** 初始化：載入班級和任務 */
  init: () => Promise<void>
  /** 建立新班級 */
  createClass: (name: string) => Promise<Class>
  /** 取得班級 */
  getClass: (id: string) => Class | undefined
  /** 取得班級的所有任務 */
  getClassSessions: (classId: string) => Session[]
  /** 建立新任務 */
  createSession: (data: CreateSessionInput) => Promise<Session>
  /** 刪除任務 */
  deleteSession: (id: string) => Promise<void>
  /** 取得任務（透過 ID） */
  getSession: (id: string) => Session | undefined
  /** 取得任務（透過加入代碼） */
  getSessionByCode: (code: string) => Promise<Session | null>
  /** 學生加入任務 */
  joinSession: (code: string, name: string) => Promise<Student | null>
  /** 訂閱任務資料（即時更新） */
  subscribeToSession: (sessionId: string) => Unsubscribe
  /** 更新學生步驟 */
  updateStudentStep: (step: Step) => Promise<void>
  /** 提交回答 */
  submitResponse: (step: 'I' | 'A1' | 'A2', content: string, extra?: Partial<Response>) => Promise<void>
  /** 取得學生在某步驟的回答 */
  getResponse: (step: 'I' | 'A1' | 'A2') => Response | undefined
  /** 更新自己帶來的那本書（賣書模式） */
  updateMyBook: (book: MyBook) => Promise<void>
  /** 切換 💡（已投過就收回）。超過票數上限時回傳 false 不寫入 */
  toggleReaction: (responseId: string) => Promise<boolean>
  /** 某則回答收到幾顆 💡 */
  getReactionCount: (responseId: string) => number
  /** 自己是否投過這則 */
  hasReacted: (responseId: string) => boolean
  /** 自己已經投出幾票 */
  getMyReactionCount: () => number
  /**
   * 取得同一任務其他學生的回答（互看用）。
   * shareStep 決定要顯示真名還是匿名代號——由任務的 attribution 設定決定。
   */
  getOtherResponses: (
    step: 'I' | 'A1',
    shareStep?: ShareStep
  ) => Array<Response & { studentName: string; myBook?: MyBook }>
  /** 儲存草稿（本地） */
  saveDraft: (step: 'I' | 'A1' | 'A2', content: string) => void
  /** 取得草稿 */
  getDraft: (step: 'I' | 'A1' | 'A2') => string
  /** 清除當前學生 */
  clearCurrentStudent: () => void
  /** 取得任務的所有學生（老師用） */
  getSessionStudents: (sessionId: string) => Student[]
  /**
   * 取得任務的所有回答（老師用）。
   * 老師端一律顯示真名，另附匿名代號方便對照學生畫面。
   */
  getSessionResponses: (
    sessionId: string
  ) => Array<Response & { studentName: string; anonCode: string; inspireCount: number; myBook?: MyBook }>
  /** 賣書模式的得票排行（只收錄有票的，票數由高到低） */
  getPitchRanking: (
    sessionId: string
  ) => Array<Response & { studentName: string; anonCode: string; inspireCount: number; myBook?: MyBook }>
}

/** 草稿儲存 key 前綴 */
const DRAFT_KEY_PREFIX = 'ria_draft_'

export const useStore = create<Store>()((set, get) => ({
  classes: [],
  sessions: [],
  students: [],
  currentStudent: null,
  responses: [],
  reactions: [],
  loading: true,

  init: async () => {
    try {
      // 載入班級
      const classesSnap = await getDocs(collection(db, 'classes'))
      const classes = classesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Class))

      // 載入任務
      const sessionsSnap = await getDocs(collection(db, 'sessions'))
      const sessions = sessionsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Session))

      set({ classes, sessions, loading: false })
    } catch (error) {
      console.error('初始化失敗 | Init failed:', error)
      set({ loading: false })
    }
  },

  createClass: async (name) => {
    const newClass: Class = {
      id: '', // 會被 Firestore 覆蓋
      name,
      createdAt: new Date().toISOString(),
    }
    const docRef = await addDoc(collection(db, 'classes'), newClass)
    const classWithId = { ...newClass, id: docRef.id }
    set((state) => ({ classes: [...state.classes, classWithId] }))
    return classWithId
  },

  getClass: (id) => {
    return get().classes.find((c) => c.id === id)
  },

  getClassSessions: (classId) => {
    return get().sessions.filter((s) => s.classId === classId)
  },

  createSession: async (data) => {
    // 建立 session 物件
    const sessionData = {
      classId: data.classId,
      title: data.title,
      mode: data.mode,
      activityType: data.activityType,
      isPaperMode: data.isPaperMode,
      enabledSteps: data.enabledSteps,
      attribution: data.attribution,
      reactionQuota: data.reactionQuota,
      theme: data.theme,
      texts: data.texts.map((t) => ({ ...t, id: generateId() })),
      joinCode: generateJoinCode(),
      grouping: data.grouping,
      groupSize: data.groupSize,
      flowControl: data.flowControl,
      currentStep: 'waiting' as const,
      createdAt: new Date().toISOString(),
      bookInfo: data.bookInfo,
    }

    // 移除所有 undefined 的欄位（Firestore 不接受 undefined）
    const session = Object.fromEntries(
      Object.entries(sessionData).filter(([_, value]) => value !== undefined)
    ) as Omit<Session, 'id'>

    const docRef = await addDoc(collection(db, 'sessions'), session)
    const sessionWithId = { ...session, id: docRef.id } as Session
    set((state) => ({ sessions: [...state.sessions, sessionWithId] }))
    return sessionWithId
  },

  deleteSession: async (id) => {
    await deleteDoc(doc(db, 'sessions', id))
    // 刪除相關學生和回答
    const studentsQuery = query(collection(db, 'students'), where('sessionId', '==', id))
    const studentsSnap = await getDocs(studentsQuery)
    for (const studentDoc of studentsSnap.docs) {
      await deleteDoc(studentDoc.ref)
    }
    const responsesQuery = query(collection(db, 'responses'), where('sessionId', '==', id))
    const responsesSnap = await getDocs(responsesQuery)
    for (const responseDoc of responsesSnap.docs) {
      await deleteDoc(responseDoc.ref)
    }
    const reactionsQuery = query(collection(db, 'reactions'), where('sessionId', '==', id))
    const reactionsSnap = await getDocs(reactionsQuery)
    for (const reactionDoc of reactionsSnap.docs) {
      await deleteDoc(reactionDoc.ref)
    }
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      students: state.students.filter((s) => s.sessionId !== id),
      responses: state.responses.filter((r) => r.sessionId !== id),
      reactions: state.reactions.filter((r) => r.sessionId !== id),
    }))
  },

  getSession: (id) => {
    return get().sessions.find((s) => s.id === id)
  },

  getSessionByCode: async (code) => {
    const q = query(collection(db, 'sessions'), where('joinCode', '==', code))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const docSnap = snap.docs[0]!
    return { ...docSnap.data(), id: docSnap.id } as Session
  },

  joinSession: async (code, name) => {
    const session = await get().getSessionByCode(code)
    if (!session) return null

    // 檢查是否已有同名學生
    const q = query(
      collection(db, 'students'),
      where('sessionId', '==', session.id),
      where('name', '==', name)
    )
    const snap = await getDocs(q)

    if (!snap.empty) {
      // 恢復既有學生
      const docSnap = snap.docs[0]!
      const existingStudent = { ...docSnap.data(), id: docSnap.id } as Student
      set({ currentStudent: existingStudent })
      return existingStudent
    }

    // 建立新學生
    const student: Omit<Student, 'id'> = {
      sessionId: session.id,
      name,
      chosenTextId: session.texts[0]?.id,
      currentStep: 'R',
      joinedAt: new Date().toISOString(),
    }
    const docRef = await addDoc(collection(db, 'students'), student)
    const studentWithId = { ...student, id: docRef.id } as Student
    set((state) => ({
      currentStudent: studentWithId,
      students: [...state.students, studentWithId],
    }))
    return studentWithId
  },

  subscribeToSession: (sessionId) => {
    // 訂閱學生
    const studentsUnsub = onSnapshot(
      query(collection(db, 'students'), where('sessionId', '==', sessionId)),
      (snap) => {
        const students = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student))
        set({ students })
      }
    )

    // 訂閱回答
    const responsesUnsub = onSnapshot(
      query(collection(db, 'responses'), where('sessionId', '==', sessionId)),
      (snap) => {
        const responses = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Response))
        set({ responses })
      }
    )

    // 訂閱 💡（票數要即時跳動，作者才看得到自己被肯定）
    const reactionsUnsub = onSnapshot(
      query(collection(db, 'reactions'), where('sessionId', '==', sessionId)),
      (snap) => {
        const reactions = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Reaction))
        set({ reactions })
      }
    )

    // 回傳取消訂閱函式
    return () => {
      studentsUnsub()
      responsesUnsub()
      reactionsUnsub()
    }
  },

  updateStudentStep: async (step) => {
    const student = get().currentStudent
    if (!student) return

    await updateDoc(doc(db, 'students', student.id), { currentStep: step })
    const updatedStudent = { ...student, currentStep: step }
    set((state) => ({
      currentStudent: updatedStudent,
      students: state.students.map((s) =>
        s.id === student.id ? updatedStudent : s
      ),
    }))
  },

  submitResponse: async (step, content, extra) => {
    const student = get().currentStudent
    if (!student) return

    const response: Omit<Response, 'id'> = {
      studentId: student.id,
      sessionId: student.sessionId,
      textId: student.chosenTextId ?? '',
      step,
      content,
      submittedAt: new Date().toISOString(),
      ...extra,
    }
    const docRef = await addDoc(collection(db, 'responses'), response)
    const responseWithId = { ...response, id: docRef.id } as Response
    set((state) => ({ responses: [...state.responses, responseWithId] }))

    // 清除草稿
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${student.id}_${step}`)
  },

  getResponse: (step) => {
    const student = get().currentStudent
    if (!student) return undefined
    return get().responses.find(
      (r) => r.studentId === student.id && r.step === step
    )
  },

  updateMyBook: async (book) => {
    const student = get().currentStudent
    if (!student) return

    await updateDoc(doc(db, 'students', student.id), { myBook: book })
    const updatedStudent = { ...student, myBook: book }
    set((state) => ({
      currentStudent: updatedStudent,
      students: state.students.map((s) => (s.id === student.id ? updatedStudent : s)),
    }))
  },

  toggleReaction: async (responseId) => {
    const student = get().currentStudent
    if (!student) return false

    const existing = get().reactions.find(
      (r) => r.responseId === responseId && r.fromStudentId === student.id
    )

    // 已經投過就收回
    if (existing) {
      await deleteDoc(doc(db, 'reactions', existing.id))
      set((state) => ({ reactions: state.reactions.filter((r) => r.id !== existing.id) }))
      return true
    }

    // 檢查票數上限（未設定 quota 代表不限）
    const session = get().sessions.find((s) => s.id === student.sessionId)
    const quota = session?.reactionQuota
    if (quota !== undefined && get().getMyReactionCount() >= quota) {
      return false
    }

    const reaction: Omit<Reaction, 'id'> = {
      sessionId: student.sessionId,
      responseId,
      fromStudentId: student.id,
      createdAt: new Date().toISOString(),
    }
    const docRef = await addDoc(collection(db, 'reactions'), reaction)
    set((state) => ({ reactions: [...state.reactions, { ...reaction, id: docRef.id }] }))
    return true
  },

  getReactionCount: (responseId) => {
    return get().reactions.filter((r) => r.responseId === responseId).length
  },

  hasReacted: (responseId) => {
    const student = get().currentStudent
    if (!student) return false
    return get().reactions.some(
      (r) => r.responseId === responseId && r.fromStudentId === student.id
    )
  },

  getMyReactionCount: () => {
    const student = get().currentStudent
    if (!student) return 0
    return get().reactions.filter((r) => r.fromStudentId === student.id).length
  },

  getOtherResponses: (step, shareStep) => {
    const student = get().currentStudent
    if (!student) return []

    const students = get().students
    const session = get().sessions.find((s) => s.id === student.sessionId)

    // 未設定時預設 'real'，舊任務的行為完全不變
    const attribution = shareStep ? session?.attribution?.[shareStep] ?? 'real' : 'real'
    const anonMap = buildAnonMap(
      students.filter((s) => s.sessionId === student.sessionId).map((s) => s.id)
    )

    const otherResponses = get().responses.filter(
      (r) => r.sessionId === student.sessionId &&
             r.step === step &&
             r.studentId !== student.id
    )

    return otherResponses.map((r) => {
      const s = students.find((s) => s.id === r.studentId)
      return {
        ...r,
        studentName:
          attribution === 'anon'
            ? anonMap.get(r.studentId) ?? '同學'
            : s?.name ?? '同學',
        myBook: s?.myBook,
      }
    })
  },

  saveDraft: (step, content) => {
    const student = get().currentStudent
    if (!student) return
    localStorage.setItem(`${DRAFT_KEY_PREFIX}${student.id}_${step}`, content)
  },

  getDraft: (step) => {
    const student = get().currentStudent
    if (!student) return ''
    return localStorage.getItem(`${DRAFT_KEY_PREFIX}${student.id}_${step}`) ?? ''
  },

  clearCurrentStudent: () => {
    set({ currentStudent: null })
  },

  getSessionStudents: (sessionId) => {
    return get().students.filter((s) => s.sessionId === sessionId)
  },

  getSessionResponses: (sessionId) => {
    const students = get().students
    const reactions = get().reactions
    const responses = get().responses.filter((r) => r.sessionId === sessionId)
    const anonMap = buildAnonMap(
      students.filter((s) => s.sessionId === sessionId).map((s) => s.id)
    )

    return responses.map((r) => {
      const student = students.find((s) => s.id === r.studentId)
      return {
        ...r,
        studentName: student?.name ?? '未知學生',
        anonCode: anonMap.get(r.studentId) ?? '—',
        inspireCount: reactions.filter((x) => x.responseId === r.id).length,
        myBook: student?.myBook,
      }
    })
  },

  getPitchRanking: (sessionId) => {
    return get()
      .getSessionResponses(sessionId)
      .filter((r) => r.step === 'I' && r.inspireCount > 0)
      .sort((a, b) => b.inspireCount - a.inspireCount)
  },
}))
