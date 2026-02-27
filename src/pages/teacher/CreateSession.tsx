/**
 * 老師端 - 建立任務頁面
 */

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { useStore } from '../../store/useStore'
import type { OptionalStep } from '../../types'

export function CreateSession() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const classId = searchParams.get('classId') ?? ''

  const createSession = useStore((s) => s.createSession)
  const getClass = useStore((s) => s.getClass)

  const currentClass = getClass(classId)

  const [isPaperMode, setIsPaperMode] = useState(false)
  const [title, setTitle] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [textAuthor, setTextAuthor] = useState('')
  const [textSource, setTextSource] = useState('')
  const [textContent, setTextContent] = useState('')

  // 步驟設定（預設全部啟用）
  const [enableIShare, setEnableIShare] = useState(true)
  const [enableA1, setEnableA1] = useState(true)
  const [enableA1Share, setEnableA1Share] = useState(true)
  const [enableA2, setEnableA2] = useState(true)

  const [createdSession, setCreatedSession] = useState<{ joinCode: string; id: string } | null>(null)

  // 如果沒有班級 ID，導回老師專區
  if (!classId || !currentClass) {
    return (
      <Layout title="錯誤">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">請先選擇班級</p>
          <button
            onClick={() => navigate('/teacher')}
            className="text-primary hover:underline"
          >
            返回老師專區
          </button>
        </div>
      </Layout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 紙本模式只需要任務名稱和文本標題
    if (!title.trim() || !textTitle.trim()) {
      alert('請填寫必要欄位 ｜ Please fill in required fields')
      return
    }

    // 線上模式需要文本內容
    if (!isPaperMode && !textContent.trim()) {
      alert('請填寫文本內容 ｜ Please fill in text content')
      return
    }

    // 組合啟用的步驟
    const enabledSteps: OptionalStep[] = []
    if (enableIShare) enabledSteps.push('I-share')
    if (enableA1) enabledSteps.push('A1')
    if (enableA1Share && enableA1) enabledSteps.push('A1-share')
    if (enableA2) enabledSteps.push('A2')

    const session = await createSession({
      classId,
      title: title.trim(),
      mode: 'single',
      isPaperMode,
      enabledSteps,
      texts: [
        {
          title: textTitle.trim(),
          author: textAuthor.trim() || '佚名',
          source: textSource.trim() || '未註明出處',
          content: isPaperMode ? '（紙本閱讀）' : textContent.trim(),
        },
      ],
      grouping: 'none',
      flowControl: 'free',
    })

    setCreatedSession({ joinCode: session.joinCode, id: session.id })
  }

  // 建立成功畫面
  if (createdSession) {
    return (
      <Layout title="任務建立成功">
        <div className="text-center py-12">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-serif font-bold text-primary mb-4">
            任務建立成功！
          </h2>
          <p className="text-gray-600 mb-8">請將以下加入代碼告訴學生</p>

          {/* 加入代碼 */}
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-sm mx-auto mb-8">
            <p className="text-sm text-gray-500 mb-2">加入代碼</p>
            <p className="text-5xl font-mono font-bold text-primary tracking-wider">
              {createdSession.joinCode}
            </p>
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdSession.joinCode)
                alert('已複製代碼 ｜ Code copied')
              }}
              className="w-full bg-accent hover:bg-accent/90 text-white rounded-lg py-3 px-6 font-medium transition-colors"
            >
              複製代碼
            </button>
            <button
              onClick={() => navigate(`/teacher/dashboard/${createdSession.id}`)}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-3 px-6 font-medium transition-colors"
            >
              進入儀表板
            </button>
            <button
              onClick={() => navigate('/teacher')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-3 px-6 transition-colors"
            >
              返回老師專區
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`建立任務 - ${currentClass.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 班級提示 */}
        <div className="bg-accent/10 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-600">班級：</span>
          <span className="font-medium text-primary ml-1">{currentClass.name}</span>
        </div>

        {/* 閱讀模式選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            閱讀模式
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsPaperMode(false)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                !isPaperMode
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📱</div>
              <div className="font-medium text-gray-800">線上閱讀</div>
              <div className="text-xs text-gray-500 mt-1">
                學生在螢幕上閱讀文本
              </div>
            </button>
            <button
              type="button"
              onClick={() => setIsPaperMode(true)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isPaperMode
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium text-gray-800">紙本閱讀</div>
              <div className="text-xs text-gray-500 mt-1">
                學生閱讀實體講義或課本
              </div>
            </button>
          </div>
        </div>

        {/* 任務名稱 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            任務名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：第三課《論幸福》深度閱讀"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        <hr className="border-gray-100" />

        {/* 文本資訊 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-primary">文本資訊</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文本標題 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder="例如：論幸福"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                作者
              </label>
              <input
                type="text"
                value={textAuthor}
                onChange={(e) => setTextAuthor(e.target.value)}
                placeholder="例如：赫爾曼・赫塞"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出處
              </label>
              <input
                type="text"
                value={textSource}
                onChange={(e) => setTextSource(e.target.value)}
                placeholder="例如：《乞食行者》節選"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* 線上模式才需要輸入文本內容 */}
          {!isPaperMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文本內容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="貼上 800-1500 字的文本片段..."
                rows={12}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-serif leading-relaxed resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                目前字數：{textContent.length} 字
              </p>
            </div>
          )}

          {/* 紙本模式提示 */}
          {isPaperMode && (
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">📄 紙本模式</p>
              <p className="text-blue-600">
                學生將閱讀您發放的實體講義或課本。平台上只會顯示文本標題供參考，學生直接進入「重述」步驟開始作答。
              </p>
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* 步驟設定 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-primary">練習步驟設定</h3>
          <p className="text-sm text-gray-500">
            R（閱讀）和 I（重述）為必要步驟，以下步驟可依課堂需求自由選擇
          </p>

          <div className="space-y-3">
            {/* 必要步驟提示 */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-5 h-5 rounded bg-step-r text-white text-xs flex items-center justify-center">R</span>
              <span className="text-gray-600">閱讀文本</span>
              <span className="text-xs text-gray-400 ml-auto">必要</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-5 h-5 rounded bg-step-i text-white text-xs flex items-center justify-center">I</span>
              <span className="text-gray-600">用自己的話重述</span>
              <span className="text-xs text-gray-400 ml-auto">必要</span>
            </div>

            {/* 可選步驟 */}
            <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={enableIShare}
                onChange={(e) => setEnableIShare(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="w-5 h-5 rounded bg-step-i/70 text-white text-xs flex items-center justify-center">互</span>
              <span className="text-gray-700">互看同學的重述</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={enableA1}
                onChange={(e) => {
                  setEnableA1(e.target.checked)
                  if (!e.target.checked) setEnableA1Share(false)
                }}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="w-5 h-5 rounded bg-step-a1 text-white text-xs flex items-center justify-center">A1</span>
              <span className="text-gray-700">連結個人經驗</span>
            </label>

            <label className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer ${enableA1 ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}>
              <input
                type="checkbox"
                checked={enableA1Share}
                onChange={(e) => setEnableA1Share(e.target.checked)}
                disabled={!enableA1}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="w-5 h-5 rounded bg-step-a1/70 text-white text-xs flex items-center justify-center">互</span>
              <span className="text-gray-700">互看同學的經驗</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={enableA2}
                onChange={(e) => setEnableA2(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="w-5 h-5 rounded bg-step-a2 text-white text-xs flex items-center justify-center">A2</span>
              <span className="text-gray-700">規劃行動方案</span>
            </label>
          </div>
        </div>

        {/* 送出按鈕 */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/teacher')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-3 px-6 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg py-3 px-6 font-medium transition-colors"
          >
            建立任務
          </button>
        </div>
      </form>
    </Layout>
  )
}
