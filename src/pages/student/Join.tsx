/**
 * 學生端 - 加入任務頁面
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { useStore } from '../../store/useStore'
import { useAuth } from '../../contexts/AuthContext'

export function Join() {
  const navigate = useNavigate()
  const joinSession = useStore((s) => s.joinSession)
  const { user } = useAuth()

  const [code, setCode] = useState('')
  const [seatNumber, setSeatNumber] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 組合姓名：座號 + Google 顯示名稱
  const displayName = user?.displayName || user?.email?.split('@')[0] || '學生'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const trimmedCode = code.trim()
    const trimmedSeat = seatNumber.trim()

    if (!trimmedCode) {
      setError('請填寫代碼 ｜ Please fill in code')
      setIsLoading(false)
      return
    }

    // 組合完整姓名
    const fullName = trimmedSeat ? `${trimmedSeat}${displayName}` : displayName

    try {
      // 加入任務（會自動檢查是否存在）
      const student = await joinSession(trimmedCode, fullName)
      if (!student) {
        setError('找不到此任務，請確認代碼是否正確 ｜ Session not found')
        setIsLoading(false)
        return
      }

      // 導向任務頁面
      navigate(`/session/${student.sessionId}`)
    } catch (err) {
      setError('加入失敗，請稍後再試 ｜ Failed to join')
      setIsLoading(false)
    }
  }

  return (
    <Layout title="加入課堂">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <span className="text-5xl">✏️</span>
          <h2 className="text-2xl font-serif font-bold text-primary mt-4">
            加入閱讀任務
          </h2>
          <p className="text-gray-600 mt-2">
            輸入老師提供的代碼
          </p>
        </div>

        {/* 顯示登入身份 */}
        <div className="bg-accent/10 rounded-lg px-4 py-3 mb-6 text-center">
          <p className="text-sm text-gray-600">
            登入身份：<span className="font-medium text-primary">{displayName}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 加入代碼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              加入代碼
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                // 只允許數字，最多 6 位
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(val)
              }}
              placeholder="輸入 6 位數字代碼"
              className="w-full px-4 py-4 text-center text-2xl font-mono tracking-widest rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              maxLength={6}
              inputMode="numeric"
              autoFocus
            />
          </div>

          {/* 座號（可選） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              座號（選填）
            </label>
            <input
              type="text"
              value={seatNumber}
              onChange={(e) => {
                // 只允許數字，最多 2 位
                const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                setSeatNumber(val)
              }}
              placeholder="例如：05"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              maxLength={2}
              inputMode="numeric"
            />
            <p className="text-xs text-gray-400 mt-1">
              顯示名稱：{seatNumber ? `${seatNumber}${displayName}` : displayName}
            </p>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 按鈕 */}
          <div className="space-y-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-3 px-6 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '加入中...' : '加入任務'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-3 px-6 transition-colors"
            >
              返回首頁
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
