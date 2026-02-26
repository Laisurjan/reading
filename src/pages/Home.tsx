/**
 * 首頁 - 角色選擇
 */

import { useNavigate } from 'react-router-dom'

export function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6">
      {/* 標題區 */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
          深度共讀
        </h1>
        <p className="text-gray-600 text-lg">
          RIA 閱讀思考平台
        </p>
        <p className="text-gray-500 text-sm mt-2">
          閱讀 → 理解 → 連結 → 行動
        </p>
      </div>

      {/* 角色選擇 */}
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => navigate('/teacher')}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl p-6 text-left transition-all hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">📚</span>
            <div>
              <h2 className="text-xl font-medium">我是老師</h2>
              <p className="text-sm text-white/80 mt-1">建立或查看閱讀任務</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/join')}
          className="w-full bg-white hover:bg-gray-50 text-primary border-2 border-primary rounded-xl p-6 text-left transition-all hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">✏️</span>
            <div>
              <h2 className="text-xl font-medium">我是學生</h2>
              <p className="text-sm text-gray-600 mt-1">輸入代碼，加入課堂活動</p>
            </div>
          </div>
        </button>
      </div>

      {/* 底部說明 */}
      <p className="text-gray-400 text-xs mt-12 text-center">
        基於 RIA 閱讀法設計，讓閱讀更有深度
      </p>
    </div>
  )
}
