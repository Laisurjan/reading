/**
 * 認證 Context
 * 管理 Google 登入狀態
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider, isAllowedEmail, isTeacher, isStudent } from '../lib/firebase'

interface AuthContextType {
  /** 當前使用者 */
  user: User | null
  /** 是否正在載入 */
  loading: boolean
  /** 使用者角色 */
  role: 'teacher' | 'student' | null
  /** 錯誤訊息 */
  error: string | null
  /** Google 登入（需指定選擇的角色） */
  login: (selectedRole: 'teacher' | 'student') => Promise<void>
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

  // Google 登入（需指定選擇的角色）
  const login = async (selectedRole: 'teacher' | 'student') => {
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const email = result.user.email

      if (!email || !isAllowedEmail(email)) {
        await signOut(auth)
        setError('此帳號無法使用本系統，請使用學校帳號登入')
        return
      }

      // 驗證角色是否符合
      if (selectedRole === 'teacher') {
        // 老師必須是指定帳號
        if (!isTeacher(email)) {
          await signOut(auth)
          setError('此帳號沒有老師權限')
          return
        }
      } else {
        // 學生必須是學生帳號
        if (!isStudent(email)) {
          await signOut(auth)
          setError('請使用學校的學生帳號登入')
          return
        }
      }
    } catch (err: unknown) {
      console.error('登入失敗:', err)
      if (err instanceof Error) {
        // 使用者關閉彈窗
        if (err.message.includes('popup-closed') || err.message.includes('cancelled')) {
          return
        }
        // 彈窗被阻擋
        if (err.message.includes('popup-blocked')) {
          setError('彈出視窗被阻擋，請允許此網站的彈出視窗')
          return
        }
        // 顯示實際錯誤訊息以便除錯
        setError(`登入失敗：${err.message}`)
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
