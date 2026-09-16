/**
 * 深度共讀平台 - 路由設定
 */

import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { TeacherHome } from './pages/teacher/TeacherHome'
import { CreateSession } from './pages/teacher/CreateSession'
import { Dashboard } from './pages/teacher/Dashboard'
import { Join } from './pages/student/Join'
import { Session } from './pages/student/Session'
import { useStore } from './store/useStore'
import { DevPreview } from './pages/DevPreview'

/** 需要登入才能訪問的路由 */
function ProtectedRoutes() {
  const { user, loading: authLoading, role } = useAuth()
  const init = useStore((s) => s.init)
  const storeLoading = useStore((s) => s.loading)

  useEffect(() => {
    if (user) {
      init()
    }
  }, [user, init])

  // 等待認證狀態
  if (authLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  // 未登入，顯示登入頁
  if (!user) {
    return <Login />
  }

  // 等待資料載入
  if (storeLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600">載入資料中...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* 首頁 - 根據角色導向 */}
      <Route path="/" element={<Home />} />

      {/* 老師端 - 只有老師能進 */}
      <Route
        path="/teacher"
        element={role === 'teacher' ? <TeacherHome /> : <Navigate to="/" replace />}
      />
      <Route
        path="/teacher/create"
        element={role === 'teacher' ? <CreateSession /> : <Navigate to="/" replace />}
      />
      <Route
        path="/teacher/dashboard/:id"
        element={role === 'teacher' ? <Dashboard /> : <Navigate to="/" replace />}
      />

      {/* 學生端 */}
      <Route path="/join" element={<Join />} />
      <Route path="/session/:id" element={<Session />} />
    </Routes>
  )
}

/** 目前網址是不是預覽頁 */
function useIsDevPreview() {
  const [isDev, setIsDev] = useState(
    () => import.meta.env.DEV && window.location.hash.startsWith('#/dev')
  )

  // 頁面已經載入後才把網址改成 #/dev 時，瀏覽器不會重新載入，
  // 所以要聽 hashchange，否則會停在原本的畫面（登入頁）不動
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const onHashChange = () => setIsDev(window.location.hash.startsWith('#/dev'))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return isDev
}

export function App() {
  // 開發用預覽：不登入、不連 Firebase，直接看三種玩法的畫面。
  // 只在 dev 存在，正式站不會有這條路由。
  const isDevPreview = useIsDevPreview()
  if (isDevPreview) {
    return <DevPreview />
  }

  return (
    <AuthProvider>
      <HashRouter>
        <ProtectedRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
