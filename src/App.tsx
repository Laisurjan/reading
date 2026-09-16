/**
 * 深度共讀平台 - 路由設定
 */

import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { TeacherHome } from './pages/teacher/TeacherHome'
import { CreateSession } from './pages/teacher/CreateSession'
import { Dashboard } from './pages/teacher/Dashboard'
import { PrintView } from './pages/teacher/PrintView'
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
      <Route
        path="/teacher/print/:id"
        element={role === 'teacher' ? <PrintView /> : <Navigate to="/" replace />}
      />

      {/* 學生端 */}
      <Route path="/join" element={<Join />} />
      <Route path="/session/:id" element={<Session />} />
    </Routes>
  )
}

export function App() {
  // 開發用預覽：不登入、不連 Firebase，直接看三種玩法的畫面。
  //
  // 這個判斷式必須維持這個「靜態」寫法（import.meta.env.DEV 直接寫在 if 裡），
  // 正式建置時才會被判定為永遠 false，連同 DevPreview 整包被搖掉。
  // 改成用 hook／state 包起來 Rollup 就推不出來，預覽頁會被打包進正式站。
  // 網址在載入後才改成 #/dev 的情況由 main.tsx 的 hashchange 整頁重載處理。
  if (import.meta.env.DEV && window.location.hash.startsWith('#/dev')) {
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
