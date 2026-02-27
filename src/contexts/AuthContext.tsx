/**
 * 認證 Context
 * 管理 Google 登入狀態
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider, isAllowedEmail, isTeacher, isStudent, TEACHER_EMAIL } from '../lib/firebase'

interface AuthContextType {
  /** 當前使用者 */
  user: User | null
  /** 是否正在載入 */
  loading: boolean
  /** 使用者角色 */
  role: 'teacher' | 'student' | null
  /** 錯誤訊息 */
  error: string | null
  /** Google 登入 */
  login: () => Promise<void>
  /** 登出 */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 監聽登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        // 檢查是否為允許的 email
        if (isAllowedEmail(user.email)) {
          setUser(user)
          setError(null)
        } else {
          // 不允許的 email，自動登出
          signOut(auth)
          setUser(null)
          setError('此帳號無法使用本系統，請使用學校帳號登入')
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // 計算角色
  const role = user?.email
    ? isTeacher(user.email)
      ? 'teacher'
      : isStudent(user.email)
        ? 'student'
        : null
    : null

  // Google 登入
  const login = async () => {
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const email = result.user.email

      if (!email || !isAllowedEmail(email)) {
        await signOut(auth)
        setError('此帳號無法使用本系統\n\n允許的帳號：\n• 學生：@stu.hlbh.hlc.edu.tw\n• 老師：' + TEACHER_EMAIL)
        return
      }

      // 檢查是否為有效角色
      if (!isTeacher(email) && !isStudent(email)) {
        await signOut(auth)
        setError('此帳號無法使用本系統\n\n允許的帳號：\n• 學生：@stu.hlbh.hlc.edu.tw\n• 老師：' + TEACHER_EMAIL)
        return
      }
    } catch (err: unknown) {
      console.error('登入失敗:', err)
      if (err instanceof Error && err.message.includes('popup-closed')) {
        // 使用者關閉彈窗，不顯示錯誤
        return
      }
      setError('登入失敗，請稍後再試')
    }
  }

  // 登出
  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
