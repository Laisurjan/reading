/**
 * 深度共讀平台 - 路由設定
 */

import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { TeacherHome } from './pages/teacher/TeacherHome'
import { CreateSession } from './pages/teacher/CreateSession'
import { Dashboard } from './pages/teacher/Dashboard'
import { Join } from './pages/student/Join'
import { Session } from './pages/student/Session'
import { useStore } from './store/useStore'

export function App() {
  const init = useStore((s) => s.init)
  const loading = useStore((s) => s.loading)

  useEffect(() => {
    init()
  }, [init])

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        {/* 首頁 */}
        <Route path="/" element={<Home />} />

        {/* 老師端 */}
        <Route path="/teacher" element={<TeacherHome />} />
        <Route path="/teacher/create" element={<CreateSession />} />
        <Route path="/teacher/dashboard/:id" element={<Dashboard />} />

        {/* 學生端 */}
        <Route path="/join" element={<Join />} />
        <Route path="/session/:id" element={<Session />} />
      </Routes>
    </HashRouter>
  )
}
