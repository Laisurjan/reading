/**
 * RIA 拆書共讀平台 - 路由設定
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { TeacherHome } from './pages/teacher/TeacherHome'
import { CreateSession } from './pages/teacher/CreateSession'
import { Dashboard } from './pages/teacher/Dashboard'
import { Join } from './pages/student/Join'
import { Session } from './pages/student/Session'

export function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
