/**
 * 學生端 - 加入任務頁面
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { useStore } from '../../store/useStore'

export function Join() {
  const navigate = useNavigate()
  const joinSession = useStore((s) => s.joinSession)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const trimmedCode = code.trim()
    const trimmedName = name.trim()

    if (!trimmedCode || !trimmedName) {
      setError('請填寫代碼和座號姓名 ｜ Please fill in code and name')
      setIsLoading(false)
      return
    }

    try {
      // 加入任務（會自動檢查是否存在）
      const student = await joinSession(trimmedCode, trimmedName)
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
            />
          </div>

          {/* 座號姓名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              座號姓名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：05王小明"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              maxLength={20}
            />
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
