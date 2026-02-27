/**
 * 首頁 - 根據角色顯示不同內容
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Home() {
  const navigate = useNavigate()
  const { user, role, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6">
      {/* 標題區 */}
      <div className="text-center mb-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
          深度共讀
        </h1>
        <p className="text-gray-600 text-xl">
          RIA 閱讀思考平台
        </p>
      </div>

      {/* 使用者資訊 */}
      <div className="bg-white rounded-lg shadow-sm px-6 py-4 mb-8 text-center">
        <p className="text-gray-600">
          {role === 'teacher' ? '👩‍🏫 老師' : '👨‍🎓 學生'}：
          <span className="font-medium text-primary ml-1">{user?.displayName}</span>
        </p>
        <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
      </div>

      {/* 根據角色顯示不同按鈕 */}
      <div className="w-full max-w-md space-y-5">
        {role === 'teacher' ? (
          /* 老師：進入老師專區 */
          <button
            onClick={() => navigate('/teacher')}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl p-6 text-left transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">📚</span>
              <div>
                <h2 className="text-2xl font-medium">進入老師專區</h2>
                <p className="text-base text-white/80 mt-1">建立或查看閱讀任務</p>
              </div>
            </div>
          </button>
        ) : (
          /* 學生：加入任務 */
          <button
            onClick={() => navigate('/join')}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl p-6 text-left transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">✏️</span>
              <div>
                <h2 className="text-2xl font-medium">加入閱讀任務</h2>
                <p className="text-base text-white/80 mt-1">輸入代碼，開始學習</p>
              </div>
            </div>
          </button>
        )}

        {/* 登出按鈕 */}
        <button
          onClick={handleLogout}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl p-4 transition-all"
        >
          登出
        </button>
      </div>

      {/* 底部說明 */}
      <p className="text-gray-400 text-sm mt-12 text-center">
        閱讀 → 理解 → 連結 → 行動
      </p>
    </div>
  )
}
