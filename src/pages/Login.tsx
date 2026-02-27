/**
 * 登入頁面
 * 先選擇身份，再用 Google 學校帳號登入
 */

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

type SelectedRole = 'teacher' | 'student' | null

export function Login() {
  const { login, error, loading } = useAuth()
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null)

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

  /** 處理登入 */
  const handleLogin = async () => {
    await login(selectedRole!)
  }

  /** 回到角色選擇 */
  const handleBack = () => {
    setSelectedRole(null)
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6">
      {/* 標題區 */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
          深度共讀
        </h1>
        <p className="text-gray-600 text-xl">
          RIA 閱讀思考平台
        </p>
        <p className="text-gray-500 text-base mt-2">
          花蓮高商專用
        </p>
      </div>

      {/* 尚未選擇角色：顯示角色選擇 */}
      {!selectedRole && (
        <div className="w-full max-w-md space-y-5">
          <p className="text-center text-gray-600 mb-4">請選擇您的身份</p>

          {/* 老師按鈕 */}
          <button
            onClick={() => setSelectedRole('teacher')}
            className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-primary rounded-xl p-6 text-left transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">👩‍🏫</span>
              <div>
                <h2 className="text-2xl font-medium text-gray-800">我是老師</h2>
                <p className="text-base text-gray-500 mt-1">建立及管理閱讀任務</p>
              </div>
            </div>
          </button>

          {/* 學生按鈕 */}
          <button
            onClick={() => setSelectedRole('student')}
            className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-primary rounded-xl p-6 text-left transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">👨‍🎓</span>
              <div>
                <h2 className="text-2xl font-medium text-gray-800">我是學生</h2>
                <p className="text-base text-gray-500 mt-1">加入閱讀任務</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 已選擇角色：顯示登入按鈕 */}
      {selectedRole && (
        <div className="w-full max-w-sm space-y-4">
          {/* 角色提示 */}
          <div className="text-center mb-6">
            <span className="text-4xl">
              {selectedRole === 'teacher' ? '👩‍🏫' : '👨‍🎓'}
            </span>
            <p className="text-gray-600 mt-2">
              {selectedRole === 'teacher' ? '老師登入' : '學生登入'}
            </p>
          </div>

          {/* Google 登入按鈕 */}
          <button
            onClick={handleLogin}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl p-5 transition-all hover:shadow-lg flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-lg font-medium">使用學校 Google 帳號登入</span>
          </button>

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-4 rounded-lg text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          {/* 學生提示 */}
          {selectedRole === 'student' && (
            <p className="text-center text-gray-400 text-sm mt-4">
              請使用學校的學生帳號登入
            </p>
          )}

          {/* 返回按鈕 */}
          <button
            onClick={handleBack}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl p-4 transition-all mt-4"
          >
            返回選擇身份
          </button>
        </div>
      )}

      {/* 底部說明 */}
      <p className="text-gray-400 text-sm mt-12 text-center">
        閱讀 → 理解 → 連結 → 行動
      </p>
    </div>
  )
}
