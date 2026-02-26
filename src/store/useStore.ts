/**
 * Zustand 狀態管理 + localStorage 持久化
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, Student, Response, CreateSessionInput, Step, Class } from '../types'
import { generateId, generateJoinCode } from '../utils/helpers'

interface Store {
  /** 所有班級 */
  classes: Class[]
  /** 所有任務 */
  sessions: Session[]
  /** 所有學生（加入過任務的） */
  students: Student[]
  /** 當前學生（加入任務後） */
  currentStudent: Student | null
  /** 所有學生回答 */
  responses: Response[]

  /** 建立新班級 */
  createClass: (name: string) => Class
  /** 取得班級 */
  getClass: (id: string) => Class | undefined
  /** 取得班級的所有任務 */
  getClassSessions: (classId: string) => Session[]
  /** 建立新任務 */
  createSession: (data: CreateSessionInput) => Session
  /** 刪除任務 */
  deleteSession: (id: string) => void
  /** 取得任務（透過 ID） */
  getSession: (id: string) => Session | undefined
  /** 取得任務（透過加入代碼） */
  getSessionByCode: (code: string) => Session | undefined
  /** 學生加入任務 */
  joinSession: (code: string, name: string) => Student | null
  /** 更新學生步驟 */
  updateStudentStep: (step: Step) => void
  /** 提交回答 */
  submitResponse: (step: 'I' | 'A1' | 'A2', content: string, extra?: Partial<Response>) => void
  /** 取得學生在某步驟的回答 */
  getResponse: (step: 'I' | 'A1' | 'A2') => Response | undefined
  /** 取得同一任務其他學生的回答（互看用） */
  getOtherResponses: (step: 'I' | 'A1') => Array<Response & { studentName: string }>
  /** 儲存草稿（自動儲存） */
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

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      classes: [],
      sessions: [],
      students: [],
      currentStudent: null,
      responses: [],

      createClass: (name) => {
        const newClass: Class = {
          id: generateId(),
          name,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ classes: [...state.classes, newClass] }))
        return newClass
      },

      getClass: (id) => {
        return get().classes.find((c) => c.id === id)
      },

      getClassSessions: (classId) => {
        return get().sessions.filter((s) => s.classId === classId)
      },

      createSession: (data) => {
        const session: Session = {
          id: generateId(),
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
        }
        set((state) => ({ sessions: [...state.sessions, session] }))
        return session
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          // 同時刪除相關的學生和回答
          students: state.students.filter((s) => s.sessionId !== id),
          responses: state.responses.filter((r) => r.sessionId !== id),
        }))
      },

      getSession: (id) => {
        return get().sessions.find((s) => s.id === id)
      },

      getSessionByCode: (code) => {
        return get().sessions.find((s) => s.joinCode === code)
      },

      joinSession: (code, name) => {
        const session = get().getSessionByCode(code)
        if (!session) return null

        const student: Student = {
          id: generateId(),
          sessionId: session.id,
          name,
          chosenTextId: session.texts[0]?.id,
          currentStep: 'R',
          joinedAt: new Date().toISOString(),
        }
        set((state) => ({
          currentStudent: student,
          students: [...state.students, student],
        }))
        return student
      },

      updateStudentStep: (step) => {
        set((state) => {
          if (!state.currentStudent) return state
          const updatedStudent = { ...state.currentStudent, currentStep: step }
          return {
            currentStudent: updatedStudent,
            // 同步更新 students 陣列中的學生狀態
            students: state.students.map((s) =>
              s.id === state.currentStudent?.id ? updatedStudent : s
            ),
          }
        })
      },

      submitResponse: (step, content, extra) => {
        const student = get().currentStudent
        if (!student) return

        const response: Response = {
          id: generateId(),
          studentId: student.id,
          sessionId: student.sessionId,
          textId: student.chosenTextId ?? '',
          step,
          content,
          submittedAt: new Date().toISOString(),
          ...extra,
        }
        set((state) => ({ responses: [...state.responses, response] }))

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

        // 取得同一任務中其他學生的回答
        const otherResponses = get().responses.filter(
          (r) => r.sessionId === student.sessionId &&
                 r.step === step &&
                 r.studentId !== student.id
        )

        // 因為原型階段沒有學生列表，這裡用匿名顯示
        return otherResponses.map((r, index) => ({
          ...r,
          studentName: `同學 ${index + 1}`,
        }))
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
    }),
    {
      name: 'ria-reading-storage',
      partialize: (state) => ({
        classes: state.classes,
        sessions: state.sessions,
        students: state.students,
        currentStudent: state.currentStudent,
        responses: state.responses,
      }),
    }
  )
)
