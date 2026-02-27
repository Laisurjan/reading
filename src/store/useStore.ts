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
import type { Session, Student, Response, CreateSessionInput, Step, Class } from '../types'
import { generateId, generateJoinCode } from '../utils/helpers'

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
  /** 取得同一任務其他學生的回答（互看用） */
  getOtherResponses: (step: 'I' | 'A1') => Array<Response & { studentName: string }>
  /** 儲存草稿（本地） */
  saveDraft: (step: 'I' | 'A1' | 'A2', content: string) => void
  /** 取得草稿 */
  getDraft: (step: 'I' | 'A1' | 'A2') => string
  /** 清除當前學生 */
  clearCurrentStudent: () => void
  /** 取得任務的所有學生（老師用） */
  getSessionStudents: (sessionId: string) => Student[]
  /** 取得任務的所有回答（老師用） */
  getSessionResponses: (sessionId: string) => Array<Response & { studentName: string }>
}

/** 草稿儲存 key 前綴 */
const DRAFT_KEY_PREFIX = 'ria_draft_'

export const useStore = create<Store>()((set, get) => ({
  classes: [],
  sessions: [],
  students: [],
  currentStudent: null,
  responses: [],
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
    const session: Omit<Session, 'id'> = {
      classId: data.classId,
      title: data.title,
      mode: data.mode,
      isPaperMode: data.isPaperMode,
      enabledSteps: data.enabledSteps,
      theme: data.theme,
      texts: data.texts.map((t) => ({ ...t, id: generateId() })),
      joinCode: generateJoinCode(),
      grouping: data.grouping,
      groupSize: data.groupSize,
      flowControl: data.flowControl,
      currentStep: 'waiting',
      createdAt: new Date().toISOString(),
      bookInfo: data.bookInfo,
    }
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
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      students: state.students.filter((s) => s.sessionId !== id),
      responses: state.responses.filter((r) => r.sessionId !== id),
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

    // 回傳取消訂閱函式
    return () => {
      studentsUnsub()
      responsesUnsub()
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

  getOtherResponses: (step) => {
    const student = get().currentStudent
    if (!student) return []

    const students = get().students
    const otherResponses = get().responses.filter(
      (r) => r.sessionId === student.sessionId &&
             r.step === step &&
             r.studentId !== student.id
    )

    return otherResponses.map((r) => {
      const s = students.find((s) => s.id === r.studentId)
      return {
        ...r,
        studentName: s?.name ?? '同學',
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
    const responses = get().responses.filter((r) => r.sessionId === sessionId)

    return responses.map((r) => {
      const student = students.find((s) => s.id === r.studentId)
      return {
        ...r,
        studentName: student?.name ?? '未知學生',
      }
    })
  },
}))
