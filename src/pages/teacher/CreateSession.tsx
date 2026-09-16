/**
 * 老師端 - 建立任務頁面
 */

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { useStore } from '../../store/useStore'
import { assetUrl } from '../../utils/helpers'
import type { OptionalStep, ActivityType, Attribution, ShareStep } from '../../types'
import { ACTIVITY_META } from '../../types'

/** 單一互看步驟的署名方式切換 */
function AttributionPicker({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string
  hint: string
  value: Attribution
  onChange: (v: Attribution) => void
  disabled?: boolean
}) {
  const options: { key: Attribution; title: string; desc: string }[] = [
    { key: 'real', title: '掛名', desc: '顯示座號＋姓名' },
    { key: 'anon', title: '匿名', desc: '顯示同學A、同學B…' },
  ]

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">{hint}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
              value === o.key
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-800 text-sm">{o.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{o.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function CreateSession() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const classId = searchParams.get('classId') ?? ''

  const createSession = useStore((s) => s.createSession)
  const getClass = useStore((s) => s.getClass)

  const currentClass = getClass(classId)

  /** 這節課怎麼玩。賣書模式會自動套用它該有的設定，老師不必自己勾 */
  const [activityType, setActivityType] = useState<ActivityType>('classic')
  const isPitch = activityType === 'pitch'

  const [isPaperMode, setIsPaperMode] = useState(false)
  const [title, setTitle] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [textAuthor, setTextAuthor] = useState('')
  const [textSource, setTextSource] = useState('')
  const [textContent, setTextContent] = useState('')

  // 書籍資訊（選填）
  const [bookCoverImage, setBookCoverImage] = useState('')
  const [bookAuthor, setBookAuthor] = useState('')
  const [bookPublisher, setBookPublisher] = useState('')
  const [libraryCallNumber, setLibraryCallNumber] = useState('')

  // 步驟設定（預設全部啟用）
  const [enableIShare, setEnableIShare] = useState(true)
  const [enableA1, setEnableA1] = useState(true)
  const [enableA1Share, setEnableA1Share] = useState(true)
  const [enableA2, setEnableA2] = useState(true)

  // 互看時的署名方式。預設「重述掛名、經驗匿名」——
  // 重述只是講課文，掛名無妨；經驗講的是自己的事，匿名才敢寫真的
  const [attrIShare, setAttrIShare] = useState<Attribution>('real')
  const [attrA1Share, setAttrA1Share] = useState<Attribution>('anon')

  const [createdSession, setCreatedSession] = useState<{ joinCode: string; id: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  /** 處理書籍封面上傳 */
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 限制檔案大小（500KB）
    if (file.size > 500 * 1024) {
      alert('圖片檔案過大，請選擇 500KB 以下的圖片 ｜ Image too large, please select under 500KB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setBookCoverImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 如果沒有班級 ID，導回老師專區
  if (!classId || !currentClass) {
    return (
      <Layout title="錯誤">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">請先選擇班級</p>
          <p className="text-gray-400 text-sm mb-4">
            （除錯：classId={classId || '空'}, currentClass={currentClass ? '有' : '無'}）
          </p>
          <button
            onClick={() => navigate('/teacher')}
            className="text-primary hover:underline cursor-pointer"
          >
            返回老師專區
          </button>
        </div>
      </Layout>
    )
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    console.log('handleSubmit 被呼叫了！')
    e?.preventDefault()
    setSubmitError(null)

    // 賣書模式各讀各的書，老師不用貼文本，只需要任務名稱
    if (!title.trim()) {
      alert('請填寫任務名稱 ｜ Please fill in the session title')
      return
    }
    if (!isPitch && !textTitle.trim()) {
      alert('請填寫必要欄位 ｜ Please fill in required fields')
      return
    }

    // 線上模式需要文本內容
    if (!isPitch && !isPaperMode && !textContent.trim()) {
      alert('請填寫文本內容 ｜ Please fill in text content')
      return
    }

    // 組合啟用的步驟
    // 賣書模式的流程固定是 選書 → 寫推薦 → 投票 → 結果，不開放 A1／A2
    const enabledSteps: OptionalStep[] = []
    if (isPitch) {
      enabledSteps.push('I-share')
    } else {
      if (enableIShare) enabledSteps.push('I-share')
      if (enableA1) enabledSteps.push('A1')
      if (enableA1Share && enableA1) enabledSteps.push('A1-share')
      if (enableA2) enabledSteps.push('A2')
    }

    // 署名方式與票數上限
    const attribution: Partial<Record<ShareStep, Attribution>> = isPitch
      ? { 'I-share': 'anon' }
      : { 'I-share': attrIShare, 'A1-share': attrA1Share }
    const reactionQuota = isPitch ? 3 : undefined

    // 組合書籍資訊（只有有填寫的欄位才加入）
    const bookInfo = (bookCoverImage || bookAuthor || bookPublisher || libraryCallNumber)
      ? {
          coverImage: bookCoverImage || undefined,
          author: bookAuthor.trim() || undefined,
          publisher: bookPublisher.trim() || undefined,
          libraryCallNumber: libraryCallNumber.trim() || undefined,
        }
      : undefined

    setIsSubmitting(true)

    try {
      const session = await createSession({
        classId,
        title: title.trim(),
        mode: 'single',
        activityType,
        // 賣書模式一定是紙本：學生讀的是自己手上那本實體書
        isPaperMode: isPitch ? true : isPaperMode,
        enabledSteps,
        attribution,
        reactionQuota,
        texts: [
          {
            title: isPitch ? '各自帶來的書' : textTitle.trim(),
            author: isPitch ? '—' : textAuthor.trim() || '佚名',
            source: isPitch ? '—' : textSource.trim() || '未註明出處',
            content: isPitch || isPaperMode ? '（紙本閱讀）' : textContent.trim(),
          },
        ],
        grouping: 'none',
        flowControl: 'free',
        bookInfo,
      })

      setCreatedSession({ joinCode: session.joinCode, id: session.id })
    } catch (error) {
      console.error('建立任務失敗 | Failed to create session:', error)
      setSubmitError(
        error instanceof Error
          ? `建立失敗：${error.message} ｜ Failed: ${error.message}`
          : '建立任務失敗，請稍後再試 ｜ Failed to create session, please try again'
      )
    } finally {
      setIsSubmitting(false)
    }
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

        {/* 玩法選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            這節課怎麼玩
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['classic', 'pitch', 'bottle'] as const).map((key) => {
              const meta = ACTIVITY_META[key]
              const selected = key === activityType
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!meta.available}
                  onClick={() => meta.available && setActivityType(key as ActivityType)}
                  className={`rounded-xl border-2 overflow-hidden text-left transition-all ${
                    selected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!meta.available ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="relative">
                    <img
                      src={assetUrl(meta.card)}
                      alt={meta.name}
                      className="w-full h-28 object-cover"
                    />
                    {!meta.available && (
                      <span className="absolute top-2 right-2 bg-gray-800/80 text-white text-xs px-2 py-0.5 rounded-full">
                        製作中
                      </span>
                    )}
                    {selected && (
                      <span className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                        已選
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-gray-800">{meta.name}</div>
                    <div className="text-xs text-accent mt-0.5">{meta.tagline}</div>
                    <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      {meta.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 賣書模式的設定都是固定的，直接說明清楚，不給微調 */}
        {isPitch && (
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 space-y-1.5">
            <p className="font-medium">賣書模式會自動套用這些設定：</p>
            <ul className="text-blue-700 space-y-1">
              <li>• 學生讀的是自己手上的實體書，老師不用貼文本</li>
              <li>• 推薦詞上限 30 字</li>
              <li>• 投票牆匿名，每人 3 票</li>
              <li>• 只顯示前三名，不公布完整名次、不顯示 0 票的人</li>
            </ul>
            <p className="text-blue-600 pt-1">
              記得口頭講一次：<span className="font-medium">同學看不到是誰寫的，但老師看得到。</span>
            </p>
          </div>
        )}

        {/* 閱讀模式選擇（賣書模式固定紙本，不需要選） */}
        <div className={isPitch ? 'hidden' : ''}>
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
            placeholder={isPitch ? '例如：9/16 班級讀書會・推坑大會' : '例如：第三課《論幸福》深度閱讀'}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        <hr className={`border-gray-100 ${isPitch ? 'hidden' : ''}`} />

        {/* 文本資訊（賣書模式每人一本不同的書，由學生自己登記） */}
        <div className={`space-y-4 ${isPitch ? 'hidden' : ''}`}>
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

        <hr className={`border-gray-100 ${isPitch ? 'hidden' : ''}`} />

        {/* 書籍資訊（選填）。賣書模式每人一本，書名由學生在「選書」步驟自己填 */}
        <div className={`space-y-4 ${isPitch ? 'hidden' : ''}`}>
          <h3 className="text-lg font-medium text-primary">
            書籍資訊
            <span className="text-sm text-gray-400 font-normal ml-2">（選填，讓學生可借閱或購買）</span>
          </h3>

          {/* 書籍封面 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              書籍封面截圖
            </label>
            <div className="flex items-start gap-4">
              {bookCoverImage ? (
                <div className="relative">
                  <img
                    src={bookCoverImage}
                    alt="書籍封面"
                    className="w-24 h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setBookCoverImage('')}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <span className="text-2xl text-gray-400">📷</span>
                  <span className="text-xs text-gray-400 mt-1">上傳圖片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-xs text-gray-400 mt-2">
                建議尺寸：封面比例約 3:4<br />
                檔案上限：500KB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                書籍作者
              </label>
              <input
                type="text"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="例如：村上春樹"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出版社
              </label>
              <input
                type="text"
                value={bookPublisher}
                onChange={(e) => setBookPublisher(e.target.value)}
                placeholder="例如：時報出版"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              花蓮高商圖書館索書號
            </label>
            <input
              type="text"
              value={libraryCallNumber}
              onChange={(e) => setLibraryCallNumber(e.target.value)}
              placeholder="例如：861.57 8466"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              填寫後學生可前往圖書館借閱
            </p>
          </div>
        </div>

        <hr className={`border-gray-100 ${isPitch ? 'hidden' : ''}`} />

        {/* 步驟設定（賣書模式流程固定，不開放調整） */}
        <div className={`space-y-4 ${isPitch ? 'hidden' : ''}`}>
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

        {/* 互看署名方式 */}
        <div className={`space-y-4 ${isPitch ? 'hidden' : ''}`}>
          <hr className="border-gray-100" />
          <h3 className="text-lg font-medium text-primary">互看時要不要掛名</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            這只影響<span className="font-medium">學生看到的畫面</span>。回答一定掛學號才存得進資料庫，
            所以<span className="font-medium">老師端一律看得到真名</span>。
            跟學生說明時請說「同學看不到是誰，老師看得到」，不要說「完全匿名」。
          </div>

          <AttributionPicker
            label="互看同學的重述（I）"
            hint="重述講的是課文，掛名通常沒問題"
            value={attrIShare}
            onChange={setAttrIShare}
            disabled={!enableIShare}
          />
          <AttributionPicker
            label="互看同學的經驗（A1）"
            hint="經驗講的是自己的事，匿名才敢寫真的"
            value={attrA1Share}
            onChange={setAttrA1Share}
            disabled={!enableA1 || !enableA1Share}
          />
        </div>

        {/* 錯誤訊息 */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {submitError}
          </div>
        )}

        {/* 送出按鈕 */}
        <div className="flex gap-4 pt-4 relative z-10">
          <button
            type="button"
            onClick={() => navigate('/teacher')}
            disabled={isSubmitting}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-3 px-6 transition-colors disabled:opacity-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg py-3 px-6 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? '建立中...' : '建立任務'}
          </button>
        </div>
      </form>
    </Layout>
  )
}
