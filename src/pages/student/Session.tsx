/**
 * 學生端 - 閱讀任務主介面
 * 根據啟用步驟動態流程
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import { Layout } from '../../components/Layout'
import { ProgressBar } from '../../components/ProgressBar'
import { TextReader } from '../../components/TextReader'
import { QualityStandards } from '../../components/QualityStandards'
import { ScaffoldPanel } from '../../components/ScaffoldPanel'
import { useStore } from '../../store/useStore'
import { assetUrl, buildAnonMap } from '../../utils/helpers'
import type {
  Text,
  Response,
  Step,
  OptionalStep,
  Session,
  BookInfo,
  MyBook,
  ActivityType,
} from '../../types'
import { ACTIVITY_META } from '../../types'

export function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const currentStudent = useStore((s) => s.currentStudent)
  const getSession = useStore((s) => s.getSession)
  const updateStudentStep = useStore((s) => s.updateStudentStep)
  const submitResponse = useStore((s) => s.submitResponse)
  const getResponse = useStore((s) => s.getResponse)
  const getOtherResponses = useStore((s) => s.getOtherResponses)
  const saveDraft = useStore((s) => s.saveDraft)
  const getDraft = useStore((s) => s.getDraft)
  const clearCurrentStudent = useStore((s) => s.clearCurrentStudent)
  const subscribeToSession = useStore((s) => s.subscribeToSession)
  const updateMyBook = useStore((s) => s.updateMyBook)

  const session = id ? getSession(id) : undefined
  const text = session?.texts[0]
  // 舊任務沒有 activityType 欄位，一律當成經典模式
  const activityType: ActivityType = session?.activityType ?? 'classic'
  const isPitch = activityType === 'pitch'

  // 訂閱即時更新（互看功能需要）
  useEffect(() => {
    if (!id) return
    const unsubscribe = subscribeToSession(id)
    return () => unsubscribe()
  }, [id, subscribeToSession])

  // 如果沒有登入或找不到任務，導回首頁
  useEffect(() => {
    if (!currentStudent || !session) {
      navigate('/join')
    }
  }, [currentStudent, session, navigate])

  if (!currentStudent || !session || !text) {
    return null
  }

  // 取得下一個步驟
  const getNextStep = (currentStep: Step): Step => {
    const allSteps: Step[] = ['R', 'I', 'I-share', 'A1', 'A1-share', 'A2']
    const currentIndex = allSteps.indexOf(currentStep)

    for (let i = currentIndex + 1; i < allSteps.length; i++) {
      const nextStep = allSteps[i]
      if (!nextStep) continue
      // R 和 I 是必要步驟
      if (nextStep === 'R' || nextStep === 'I') {
        return nextStep
      }
      // 檢查可選步驟是否啟用
      if (session.enabledSteps?.includes(nextStep as OptionalStep)) {
        return nextStep
      }
    }
    // 沒有下一步了，用 A2 代表完成狀態（即使 A2 未啟用也返回以觸發完成畫面）
    return 'A2'
  }

  const handleStepComplete = async (fromStep: Step) => {
    const nextStep = getNextStep(fromStep)
    await updateStudentStep(nextStep)
  }

  const handleExit = () => {
    clearCurrentStudent()
    navigate('/')
  }

  // 判斷是否顯示完成畫面
  const showComplete = currentStudent.currentStep === 'A2' && !session.enabledSteps?.includes('A2')

  return (
    <Layout title={session.title}>
      <ProgressBar
        currentStep={currentStudent.currentStep}
        enabledSteps={session.enabledSteps}
        activityType={activityType}
      />

      <div className="mt-6">
        {currentStudent.currentStep === 'R' && (
          isPitch ? (
            <StepPickBook
              myBook={currentStudent.myBook}
              updateMyBook={updateMyBook}
              onComplete={() => handleStepComplete('R')}
            />
          ) : (
            <StepR
              text={text}
              isPaperMode={session.isPaperMode}
              bookInfo={session.bookInfo}
              onComplete={() => handleStepComplete('R')}
            />
          )
        )}
        {currentStudent.currentStep === 'I' && (
          isPitch ? (
            <StepPitch
              myBook={currentStudent.myBook}
              onComplete={() => handleStepComplete('I')}
              submitResponse={submitResponse}
              getResponse={getResponse}
              saveDraft={saveDraft}
              getDraft={getDraft}
            />
          ) : (
            <StepI
              text={text}
              isPaperMode={session.isPaperMode}
              onComplete={() => handleStepComplete('I')}
              submitResponse={submitResponse}
              getResponse={getResponse}
              saveDraft={saveDraft}
              getDraft={getDraft}
            />
          )
        )}
        {currentStudent.currentStep === 'I-share' && session.enabledSteps?.includes('I-share') && (
          <StepShare
            step="I"
            title={isPitch ? '哪一本讓你最想去借？' : '看看同學怎麼說'}
            description={
              isPitch
                ? `讀完同學的推薦，把 💡 投給最打動你的${session.reactionQuota ? `（你有 ${session.reactionQuota} 票）` : ''}`
                : '看看其他同學如何理解這段文字'
            }
            myResponse={getResponse('I')}
            otherResponses={getOtherResponses('I', 'I-share')}
            reactionQuota={session.reactionQuota}
            showBook={isPitch}
            onComplete={() => handleStepComplete('I-share')}
          />
        )}
        {currentStudent.currentStep === 'A1' && session.enabledSteps?.includes('A1') && (
          <StepA1
            onComplete={() => handleStepComplete('A1')}
            submitResponse={submitResponse}
            getResponse={getResponse}
            saveDraft={saveDraft}
            getDraft={getDraft}
          />
        )}
        {currentStudent.currentStep === 'A1-share' && session.enabledSteps?.includes('A1-share') && (
          <StepShare
            step="A1"
            title="看看同學的經驗"
            description="看看其他同學連結了什麼經驗"
            myResponse={getResponse('A1')}
            otherResponses={getOtherResponses('A1', 'A1-share')}
            reactionQuota={session.reactionQuota}
            onComplete={() => handleStepComplete('A1-share')}
          />
        )}
        {currentStudent.currentStep === 'A2' && session.enabledSteps?.includes('A2') && (
          <StepA2
            submitResponse={submitResponse}
            getResponse={getResponse}
            saveDraft={saveDraft}
            getDraft={getDraft}
            session={session}
            text={text}
            onExit={handleExit}
          />
        )}
        {showComplete && (
          isPitch ? (
            <PitchResult
              session={session}
              myResponse={getResponse('I')}
              onExit={handleExit}
            />
          ) : (
            <StepComplete
              session={session}
              text={text}
              getResponse={getResponse}
              onExit={handleExit}
            />
          )
        )}
      </div>
    </Layout>
  )
}

// 為了向後兼容，保留 Session 作為 export
export { SessionPage as Session }

/** 玩法開場大圖 */
function ModeHero({ activityType }: { activityType: ActivityType }) {
  const meta = ACTIVITY_META[activityType]
  return (
    <div className="rounded-xl overflow-hidden shadow-sm relative">
      <img
        src={assetUrl(meta.image)}
        alt={meta.studentName}
        className="w-full h-40 md:h-56 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent flex items-end">
        <div className="p-4 text-white">
          <h2 className="font-serif text-xl md:text-2xl font-bold drop-shadow">
            {meta.studentName}
          </h2>
          <p className="text-sm opacity-90 drop-shadow">{meta.tagline}</p>
        </div>
      </div>
    </div>
  )
}

/** 賣書模式的 R 步驟：登記自己手上那本書 */
function StepPickBook({
  myBook,
  updateMyBook,
  onComplete,
}: {
  myBook?: MyBook
  updateMyBook: (book: MyBook) => Promise<void>
  onComplete: () => Promise<void> | void
}) {
  const [title, setTitle] = useState(myBook?.title ?? '')
  const [callNumber, setCallNumber] = useState(myBook?.callNumber ?? '')
  const [page, setPage] = useState(myBook?.page ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('請先填書名 ｜ Please fill in the book title')
      return
    }
    setIsSaving(true)
    try {
      await updateMyBook({
        title: title.trim(),
        callNumber: callNumber.trim() || undefined,
        page: page.trim() || undefined,
      })
      await onComplete()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <ModeHero activityType="pitch" />

      <div className="text-center py-2">
        <span className="inline-block bg-step-r text-white text-sm font-medium px-4 py-1.5 rounded-full">
          選書
        </span>
        <p className="text-gray-600 mt-2">
          翻一翻你手上那本書，然後把它登記起來
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            書名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="照書封抄就好"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">索書號</label>
            <input
              type="text"
              value={callNumber}
              onChange={(e) => setCallNumber(e.target.value)}
              placeholder="例如：177.2 4050"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">書背標籤上那串數字</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">讀到第幾頁</label>
            <input
              type="text"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="例如：23"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">沒讀完也沒關係</p>
          </div>
        </div>
      </div>

      <div className="bg-accent/10 rounded-lg p-4 text-sm text-gray-600">
        等一下你要用<span className="font-medium text-primary">一句話</span>把這本書推坑給全班。
        現在先翻個幾頁，找一個你覺得別人會有興趣的點。
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSaving}
        className="w-full bg-step-r hover:bg-step-r/90 text-white rounded-lg py-4 px-6 font-medium transition-colors text-lg disabled:opacity-50"
      >
        {isSaving ? '儲存中...' : '登記好了，開始寫推薦'}
      </button>
    </div>
  )
}

/** 賣書模式的 I 步驟：寫一句 30 字以內的推薦詞 */
function StepPitch({
  myBook,
  onComplete,
  submitResponse,
  getResponse,
  saveDraft,
  getDraft,
}: {
  myBook?: MyBook
  onComplete: () => Promise<void> | void
  submitResponse: (step: 'I' | 'A1' | 'A2', content: string) => Promise<void>
  getResponse: (step: 'I' | 'A1' | 'A2') => Response | undefined
  saveDraft: (step: 'I' | 'A1' | 'A2', content: string) => void
  getDraft: (step: 'I' | 'A1' | 'A2') => string
}) {
  /** 推薦詞字數上限。限制是刻意的——一句話寫壞了不丟臉，所以人敢寫 */
  const MAX_LENGTH = 30

  const existingResponse = getResponse('I')
  const [content, setContent] = useState(existingResponse?.content ?? getDraft('I'))

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) saveDraft('I', content)
    }, 1000)
    return () => clearTimeout(timer)
  }, [content, saveDraft])

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('寫一句就好，隨便一句都行 ｜ Please write one sentence')
      return
    }
    await submitResponse('I', content.trim())
    await onComplete()
  }

  const remaining = MAX_LENGTH - content.length

  return (
    <div className="space-y-6">
      <div className="text-center py-2">
        <span className="inline-block bg-step-i text-white text-sm font-medium px-4 py-1.5 rounded-full">
          寫推薦
        </span>
        <h2 className="text-xl font-serif font-bold text-primary mt-3">
          用一句話，讓別人想借走這本書
        </h2>
        <p className="text-gray-600 mt-1">{MAX_LENGTH} 字以內，寫完就送出</p>
      </div>

      {myBook && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <span className="text-gray-500 text-sm">你的書：</span>
          <span className="font-serif font-medium text-primary ml-1">《{myBook.title}》</span>
        </div>
      )}

      <div className="bg-accent/10 rounded-lg p-4">
        <p className="text-sm font-medium text-primary mb-2">卡住的話可以這樣起頭：</p>
        <ul className="text-sm text-gray-600 space-y-1.5">
          <li>•「如果你也覺得⋯⋯，這本會講到你心裡。」</li>
          <li>•「這本最猛的是⋯⋯」</li>
          <li>•「我本來以為很無聊，結果⋯⋯」</li>
          <li>•「整本都是圖，五分鐘就能翻完。」</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="一句話就好..."
          rows={3}
          maxLength={MAX_LENGTH}
          className="w-full px-4 py-4 outline-none resize-none font-serif text-xl leading-relaxed"
        />
        <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {content.length} / {MAX_LENGTH} 字
          </span>
          <span className={`text-xs ${remaining <= 5 ? 'text-amber-500' : 'text-gray-400'}`}>
            {remaining <= 5 && remaining > 0 && `還剩 ${remaining} 字`}
            {remaining === 0 && '已經滿了，這樣就夠了'}
          </span>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        送出後會跟全班的推薦一起出現在牆上，<span className="font-medium">同學看不到是誰寫的</span>
        （老師看得到）。
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-step-i hover:bg-step-i/90 text-white rounded-lg py-4 px-6 font-medium transition-colors text-lg"
      >
        送出，去看大家寫了什麼
      </button>
    </div>
  )
}

/** 書籍資訊卡片 */
function BookInfoCard({ bookInfo }: { bookInfo: BookInfo }) {
  const [expanded, setExpanded] = useState(false)
  const hasInfo = bookInfo.author || bookInfo.publisher || bookInfo.libraryCallNumber || bookInfo.coverImage

  if (!hasInfo) return null

  return (
    <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-amber-100 transition-colors"
      >
        <span className="text-sm font-medium text-amber-800">
          📖 想借閱或購買這本書？
        </span>
        <span className="text-amber-600">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 flex gap-4">
          {bookInfo.coverImage && (
            <img
              src={bookInfo.coverImage}
              alt="書籍封面"
              className="w-20 h-28 object-cover rounded shadow-sm flex-shrink-0"
            />
          )}
          <div className="space-y-1 text-sm">
            {bookInfo.author && (
              <p className="text-gray-700">
                <span className="text-gray-500">作者：</span>{bookInfo.author}
              </p>
            )}
            {bookInfo.publisher && (
              <p className="text-gray-700">
                <span className="text-gray-500">出版社：</span>{bookInfo.publisher}
              </p>
            )}
            {bookInfo.libraryCallNumber && (
              <p className="text-gray-700">
                <span className="text-gray-500">花商圖書館索書號：</span>
                <span className="font-mono font-medium text-primary">{bookInfo.libraryCallNumber}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** R 步驟：閱讀 */
function StepR({
  text,
  isPaperMode,
  bookInfo,
  onComplete,
}: {
  text: Text
  isPaperMode: boolean
  bookInfo?: BookInfo
  onComplete: () => Promise<void> | void
}) {
  if (isPaperMode) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <span className="inline-block bg-step-r text-white text-sm font-medium px-4 py-1.5 rounded-full">
            R 閱讀
          </span>
          <p className="text-gray-600 mt-2">請閱讀老師發放的紙本講義</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="font-serif text-xl font-bold text-primary mb-2">
            《{text.title}》
          </h3>
          <p className="text-gray-500 text-sm">
            {text.author}．{text.source}
          </p>
          <p className="text-gray-600 mt-6">
            請仔細閱讀老師發放的紙本講義，<br />
            讀完後點擊下方按鈕繼續。
          </p>
        </div>
        {bookInfo && <BookInfoCard bookInfo={bookInfo} />}
        <button
          onClick={onComplete}
          className="w-full bg-step-r hover:bg-step-r/90 text-white rounded-lg py-4 px-6 font-medium transition-colors text-lg"
        >
          我讀完紙本了，繼續下一步
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <span className="inline-block bg-step-r text-white text-sm font-medium px-4 py-1.5 rounded-full">
          R 閱讀
        </span>
        <p className="text-gray-600 mt-2">專心閱讀以下文章</p>
      </div>
      <TextReader text={text} />
      {bookInfo && <BookInfoCard bookInfo={bookInfo} />}
      <button
        onClick={onComplete}
        className="w-full bg-step-r hover:bg-step-r/90 text-white rounded-lg py-4 px-6 font-medium transition-colors text-lg"
      >
        我讀完了，繼續下一步
      </button>
    </div>
  )
}

/** I 步驟：重述 */
function StepI({
  text,
  isPaperMode,
  onComplete,
  submitResponse,
  getResponse,
  saveDraft,
  getDraft,
}: {
  text: Text
  isPaperMode: boolean
  onComplete: () => Promise<void> | void
  submitResponse: (step: 'I' | 'A1' | 'A2', content: string) => Promise<void>
  getResponse: (step: 'I' | 'A1' | 'A2') => Response | undefined
  saveDraft: (step: 'I' | 'A1' | 'A2', content: string) => void
  getDraft: (step: 'I' | 'A1' | 'A2') => string
}) {
  const existingResponse = getResponse('I')
  const [content, setContent] = useState(existingResponse?.content ?? getDraft('I'))

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) saveDraft('I', content)
    }, 1000)
    return () => clearTimeout(timer)
  }, [content, saveDraft])

  const handleInsertQuestion = useCallback((question: string) => {
    setContent((prev) => prev.trim() ? prev + '\n\n' + question : question)
  }, [])

  const handleSubmit = async () => {
    if (content.trim().length < 10) {
      alert('內容太短了，再多寫一點吧 ｜ Content too short')
      return
    }
    await submitResponse('I', content.trim())
    await onComplete()
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <span className="inline-block bg-step-i text-white text-sm font-medium px-4 py-1.5 rounded-full">
          I 重述
        </span>
        <p className="text-gray-600 mt-2">用自己的話，說說這段文字的重點是什麼？</p>
      </div>

      {isPaperMode ? (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <span className="text-gray-500">閱讀文本：</span>
          <span className="font-serif font-medium text-primary ml-1">《{text.title}》</span>
        </div>
      ) : (
        <TextReader text={text} collapsible defaultCollapsed />
      )}

      <QualityStandards step="I" />

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="用你自己的話，說說這段文字在講什麼..."
          rows={8}
          className="w-full px-4 py-4 outline-none resize-none font-serif text-lg leading-relaxed"
        />
        <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center">
          <span className={`text-sm ${content.length < 30 ? 'text-amber-500' : 'text-gray-400'}`}>
            {content.length < 30 && content.length > 0 && '再多寫一點會更好喔！'}
            {content.length} 字
          </span>
          <span className="text-xs text-gray-400">建議 80 字以上</span>
        </div>
      </div>

      <ScaffoldPanel onInsertQuestion={handleInsertQuestion} />

      <button
        onClick={handleSubmit}
        className="w-full bg-step-i hover:bg-step-i/90 text-white rounded-lg py-4 px-6 font-medium transition-colors text-lg"
      >
        完成重述，繼續下一步
      </button>
    </div>
  )
}

/** 互看步驟 */
function StepShare({
  step,
  title,
  description,
  myResponse,
  otherResponses,
  reactionQuota,
  showBook = false,
  onComplete,
}: {
  step: 'I' | 'A1'
  title: string
  description: string
  myResponse: Response | undefined
  otherResponses: Array<Response & { studentName: string; myBook?: MyBook }>
  reactionQuota?: number
  /** 賣書模式才顯示每則推薦是哪本書 */
  showBook?: boolean
  onComplete: () => Promise<void> | void
}) {
  const toggleReaction = useStore((s) => s.toggleReaction)
  const getReactionCount = useStore((s) => s.getReactionCount)
  const hasReacted = useStore((s) => s.hasReacted)
  const getMyReactionCount = useStore((s) => s.getMyReactionCount)
  // 訂閱 reactions 陣列本身，票數變動時才會重繪
  useStore((s) => s.reactions)

  const [quotaWarning, setQuotaWarning] = useState(false)
  const stepColor = step === 'I' ? 'bg-step-i' : 'bg-step-a1'

  const used = getMyReactionCount()
  const remaining = reactionQuota !== undefined ? reactionQuota - used : undefined

  const handleToggle = async (responseId: string) => {
    const ok = await toggleReaction(responseId)
    if (!ok) {
      setQuotaWarning(true)
      setTimeout(() => setQuotaWarning(false), 2500)
    }
  }

  // 自己收到的票數：0 票時不顯示數字。
  // 匿名牆上公開掛著「你收到 0 顆」，對本來就不敢發言的人是反效果。
  const myCount = myResponse ? getReactionCount(myResponse.id) : 0

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <span className={`inline-block ${stepColor} text-white text-sm font-medium px-4 py-1.5 rounded-full`}>
          {showBook ? '投票' : '互看'}
        </span>
        <h2 className="text-xl font-serif font-bold text-primary mt-3">{title}</h2>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>

      {/* 剩餘票數 */}
      {remaining !== undefined && (
        <div
          className={`rounded-lg px-4 py-3 text-center transition-colors ${
            quotaWarning ? 'bg-amber-100 text-amber-800' : 'bg-white shadow-sm border border-gray-100'
          }`}
        >
          {quotaWarning ? (
            <span className="text-sm font-medium">
              票用完了。想改投別則的話，先把已經投的收回來。
            </span>
          ) : (
            <span className="text-sm text-gray-600">
              你還有 <span className="text-2xl font-bold text-accent mx-1">{Math.max(remaining, 0)}</span> 票
            </span>
          )}
        </div>
      )}

      {myResponse && (
        <div className="bg-accent/10 rounded-lg p-4 border-2 border-accent/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-accent bg-accent/20 px-2 py-0.5 rounded">
              {showBook ? '我的推薦' : '我的回答'}
            </span>
            {myCount > 0 && (
              <span className="text-sm font-medium text-yellow-700 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                💡 {myCount} 個人覺得有啟發
              </span>
            )}
          </div>
          <p className="text-gray-800 font-serif leading-relaxed whitespace-pre-wrap break-words mt-2">
            {myResponse.content}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500">
          {showBook ? '同學的推薦' : '同學的回答'}
        </h3>
        {otherResponses.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">目前還沒有其他同學的回答</p>
            <p className="text-gray-400 text-sm mt-1">你是第一個完成的！</p>
          </div>
        ) : (
          otherResponses.map((r) => {
            const count = getReactionCount(r.id)
            const mine = hasReacted(r.id)
            return (
              <div key={r.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400">{r.studentName}</span>
                  {showBook && r.myBook && (
                    <span className="text-xs text-gray-500 font-serif truncate">
                      《{r.myBook.title}》
                      {r.myBook.callNumber && (
                        <span className="font-mono text-gray-400 ml-1">{r.myBook.callNumber}</span>
                      )}
                    </span>
                  )}
                </div>
                <p
                  className={`text-gray-800 font-serif leading-relaxed whitespace-pre-wrap break-words mt-2 ${
                    showBook ? 'text-xl' : ''
                  }`}
                >
                  {r.content}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggle(r.id)}
                    className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                      mine ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    💡 有啟發
                    {/* 0 票的卡片不顯示數字，不讓任何人被公開標記為「沒人投」 */}
                    {count > 0 && <span className="ml-1 font-medium">{count}</span>}
                    {mine && ' ✓'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <button
        onClick={onComplete}
        className={`w-full ${stepColor} hover:opacity-90 text-white rounded-lg py-4 px-6 font-medium transition-colors text-lg`}
      >
        {showBook ? '投完了，看結果' : '繼續下一步'}
      </button>
    </div>
  )
}

/** A1 步驟：經驗連結 */
function StepA1({
  onComplete,
  submitResponse,
  getResponse,
  saveDraft,
  getDraft,
}: {
  onComplete: () => Promise<void> | void
  submitResponse: (step: 'I' | 'A1' | 'A2', content: string) => Promise<void>
  getResponse: (step: 'I' | 'A1' | 'A2') => Response | undefined
  saveDraft: (step: 'I' | 'A1' | 'A2', content: string) => void
  getDraft: (step: 'I' | 'A1' | 'A2') => string
}) {
  const existingResponse = getResponse('A1')
  const [content, setContent] = useState(existingResponse?.content ?? getDraft('A1'))

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) saveDraft('A1', content)
    }, 1000)
    return () => clearTimeout(timer)
  }, [content, saveDraft])

  const handleInsertQuestion = useCallback((question: string) => {
    setContent((prev) => prev.trim() ? prev + '\n\n' + question : question)
  }, [])

  const handleSubmit = async () => {
    if (content.trim().length < 10) {
      alert('內容太短了，再多寫一點吧 ｜ Content too short')
      return
    }
    await submitResponse('A1', content.trim())
    await onComplete()
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <span className="inline-block bg-step-a1 text-white text-sm font-medium px-4 py-1.5 rounded-full">
          A1 經驗連結
        </span>
        <p className="text-gray-600 mt-2">這段文字讓你想到自己生活中的什麼經歷？</p>
      </div>

      <div className="bg-accent/10 rounded-lg p-4">
        <p className="text-sm font-medium text-primary mb-3">你可以從這些方向思考：</p>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• 讀完這段，你想到自己什麼經歷？</li>
          <li>• 你身邊有沒有人經歷過類似的事情？</li>
          <li>• 這讓你回想起什麼場景或對話？</li>
        </ul>
      </div>

      <QualityStandards step="A1" />

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的經歷或故事..."
          rows={8}
          className="w-full px-4 py-4 outline-none resize-none font-serif text-lg leading-relaxed"
        />
        <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center">
          <span className={`text-sm ${content.length < 30 ? 'text-amber-500' : 'text-gray-400'}`}>
            {content.length < 30 && content.length > 0 && '再多寫一點會更好喔！'}
            {content.length} 字
          </span>
          <span className="text-xs text-gray-400">建議 80 字以上</span>
        </div>
      </div>

      <ScaffoldPanel onInsertQuestion={handleInsertQuestion} />

      <button
        onClick={handleSubmit}
        className="w-full bg-step-a1 hover:bg-step-a1/90 text-white rounded-lg py-4 px-6 font-medium transition-colors text-lg"
      >
        完成經驗連結
      </button>
    </div>
  )
}

/** A2 步驟：行動規劃 */
function StepA2({
  submitResponse,
  getResponse,
  saveDraft,
  getDraft,
  session,
  text,
  onExit,
}: {
  submitResponse: (step: 'I' | 'A1' | 'A2', content: string) => Promise<void>
  getResponse: (step: 'I' | 'A1' | 'A2') => Response | undefined
  saveDraft: (step: 'I' | 'A1' | 'A2', content: string) => void
  getDraft: (step: 'I' | 'A1' | 'A2') => string
  session: Session
  text: Text
  onExit: () => void
}) {
  const existingResponse = getResponse('A2')
  const [isCompleted, setIsCompleted] = useState(!!existingResponse)
  const [goal, setGoal] = useState('')
  const [action, setAction] = useState('')
  const [connection, setConnection] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    const draft = getDraft('A2')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setGoal(parsed.goal || '')
        setAction(parsed.action || '')
        setConnection(parsed.connection || '')
        setDeadline(parsed.deadline || '')
      } catch {
        // 不是 JSON 格式，忽略
      }
    }
  }, [getDraft])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (goal || action || connection || deadline) {
        saveDraft('A2', JSON.stringify({ goal, action, connection, deadline }))
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [goal, action, connection, deadline, saveDraft])

  const handleSubmit = async () => {
    if (!goal.trim() || !action.trim()) {
      alert('請填寫目標和行動 ｜ Please fill in goal and action')
      return
    }
    const content = `【目標】${goal}\n【行動】${action}\n【與文章的關聯】${connection}\n【預計完成時間】${deadline}`
    await submitResponse('A2', content)
    setIsCompleted(true)
  }

  if (isCompleted) {
    return (
      <StepComplete
        session={session}
        text={text}
        getResponse={getResponse}
        onExit={onExit}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <span className="inline-block bg-step-a2 text-white text-sm font-medium px-4 py-1.5 rounded-full">
          A2 行動規劃
        </span>
        <p className="text-gray-600 mt-2">讀完這段文字，你打算做什麼改變或嘗試？</p>
      </div>

      <QualityStandards step="A2" />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            我的目標是 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例如：更主動表達自己的想法"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            我打算這樣做 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="例如：每天課堂上至少舉手一次..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            這和文章的關聯是
          </label>
          <textarea
            value={connection}
            onChange={(e) => setConnection(e.target.value)}
            placeholder="例如：文章說到「幸福是做自己」，所以我要..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            我預計在這個時間前完成
          </label>
          <input
            type="text"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="例如：這週五之前"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-step-a2 hover:bg-step-a2/90 text-white rounded-lg py-4 px-6 font-medium transition-colors text-lg"
      >
        完成行動規劃
      </button>
    </div>
  )
}

/**
 * 賣書模式的結果畫面：前三名。
 * 刻意只顯示前三、不顯示完整名次，也不顯示 0 票的人——
 * 前三名是獎勵，完整排名是懲罰，這裡只做前者。
 */
function PitchResult({
  session,
  myResponse,
  onExit,
}: {
  session: Session
  myResponse: Response | undefined
  onExit: () => void
}) {
  const getPitchRanking = useStore((s) => s.getPitchRanking)
  const getReactionCount = useStore((s) => s.getReactionCount)
  const students = useStore((s) => s.students)
  useStore((s) => s.reactions)

  const ranking = getPitchRanking(session.id).slice(0, 3)
  const myCount = myResponse ? getReactionCount(myResponse.id) : 0
  const medals = ['🥇', '🥈', '🥉']

  // 結果頁也要匿名，用與互看牆同一份代號對照表
  const anonMap = buildAnonMap(
    students.filter((s) => s.sessionId === session.id).map((s) => s.id)
  )

  return (
    <div className="space-y-6">
      <ModeHero activityType="pitch" />

      <div className="text-center py-2">
        <h2 className="text-2xl font-serif font-bold text-primary">
          最多人想借走的三本
        </h2>
        <p className="text-gray-600 mt-1">下課後可以直接去架上找</p>
      </div>

      {ranking.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">票還沒開出來</p>
          <p className="text-gray-400 text-sm mt-1">等大家都投完再回來看看</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ranking.map((r, i) => {
            const isMine = myResponse && r.id === myResponse.id
            return (
              <div
                key={r.id}
                className={`rounded-xl p-5 shadow-sm border-2 ${
                  isMine ? 'bg-accent/10 border-accent' : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl leading-none">{medals[i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-xl text-gray-800 leading-relaxed break-words">
                      {r.content}
                    </p>
                    {r.myBook && (
                      <p className="mt-2 text-sm text-gray-600 font-serif">
                        《{r.myBook.title}》
                        {r.myBook.callNumber && (
                          <span className="font-mono text-primary ml-2">{r.myBook.callNumber}</span>
                        )}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-yellow-700 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                        💡 {r.inspireCount}
                      </span>
                      <span className="text-xs text-gray-400">
                        {anonMap.get(r.studentId) ?? '同學'}
                      </span>
                      {isMine && (
                        <span className="text-xs font-medium text-accent bg-accent/20 px-2 py-0.5 rounded-full">
                          這是你寫的
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 自己的成績：只在有票時報數字 */}
      {myResponse && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 text-center">
          {myCount > 0 ? (
            <p className="text-gray-700">
              你的推薦收到了
              <span className="text-2xl font-bold text-accent mx-1.5">{myCount}</span>
              顆 💡
            </p>
          ) : (
            <p className="text-gray-600">你的推薦已經上牆了，全班都看過了。</p>
          )}
          <p className="font-serif text-lg text-gray-800 mt-2 break-words">{myResponse.content}</p>
        </div>
      )}

      <div className="bg-accent/10 rounded-lg p-4 text-sm text-gray-600">
        別忘了把剛剛寫的那句抄到紙本學習單上，順便補上書名跟讀到第幾頁。
      </div>

      <button
        onClick={onExit}
        className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-3 px-6 font-medium transition-colors"
      >
        返回首頁
      </button>
    </div>
  )
}

/** 完成畫面 */
function StepComplete({
  session,
  text,
  getResponse,
  onExit,
}: {
  session: Session
  text: Text
  getResponse: (step: 'I' | 'A1' | 'A2') => Response | undefined
  onExit: () => void
}) {
  const iResponse = getResponse('I')
  const a1Response = getResponse('A1')
  const a2Response = getResponse('A2')

  // 匯出學習紀錄為 DOCX
  const handleExport = async () => {
    const children: Paragraph[] = []

    // 標題
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '深度共讀學習紀錄', bold: true, size: 36 })],
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      })
    )

    // 文本資訊
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '文本資訊', bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_1,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2D5A4A' } },
        spacing: { before: 200, after: 200 },
      }),
      new Paragraph({ children: [new TextRun({ text: `標題：《${text.title}》`, size: 24 })] }),
      new Paragraph({ children: [new TextRun({ text: `作者：${text.author}`, size: 24 })] }),
      new Paragraph({ children: [new TextRun({ text: `出處：${text.source}`, size: 24 })], spacing: { after: 300 } })
    )

    // 原文內容（非紙本模式）
    if (!session.isPaperMode && text.content !== '（紙本閱讀）') {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '【原文內容】', bold: true, size: 28, color: '4A6FA5' })],
          spacing: { before: 300, after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: text.content, size: 24 })],
          spacing: { after: 300 },
        })
      )
    }

    // I 重述
    if (iResponse) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '【I 重述】', bold: true, size: 28, color: 'E07A5F' })],
          spacing: { before: 300, after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: iResponse.content, size: 24 })],
          spacing: { after: 300 },
        })
      )
    }

    // A1 經驗連結
    if (a1Response) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '【A1 經驗連結】', bold: true, size: 28, color: '81B29A' })],
          spacing: { before: 300, after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: a1Response.content, size: 24 })],
          spacing: { after: 300 },
        })
      )
    }

    // A2 行動規劃
    if (a2Response) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '【A2 行動規劃】', bold: true, size: 28, color: 'C97064' })],
          spacing: { before: 300, after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: a2Response.content, size: 24 })],
          spacing: { after: 300 },
        })
      )
    }

    // 匯出時間
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `匯出時間：${new Date().toLocaleString('zh-TW')}`,
            size: 20,
            color: '888888',
            italics: true,
          }),
        ],
        spacing: { before: 400 },
      })
    )

    // 建立文件
    const doc = new Document({
      sections: [{ children }],
    })

    // 下載
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `閱讀紀錄_${text.title}_${new Date().toISOString().slice(0, 10)}.docx`)
  }

  // 判斷完成了哪些步驟
  const completedSteps = []
  completedSteps.push({ color: 'bg-step-r', label: `閱讀了《${text.title}》` })
  if (iResponse) completedSteps.push({ color: 'bg-step-i', label: '完成了重述' })
  if (session.enabledSteps?.includes('I-share')) completedSteps.push({ color: 'bg-step-i', label: '看了同學的重述' })
  if (a1Response) completedSteps.push({ color: 'bg-step-a1', label: '連結了個人經驗' })
  if (session.enabledSteps?.includes('A1-share')) completedSteps.push({ color: 'bg-step-a1', label: '看了同學的經驗' })
  if (a2Response) completedSteps.push({ color: 'bg-step-a2', label: '規劃了行動方案' })

  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-6">🎉</div>
      <h2 className="text-2xl font-serif font-bold text-primary mb-4">
        太棒了！
      </h2>
      <p className="text-gray-600 mb-2">
        你已經完成這次的閱讀活動
      </p>

      <div className="mt-8 p-6 bg-white rounded-lg shadow-sm max-w-md mx-auto text-left">
        <h3 className="font-medium text-primary mb-3">你的學習足跡</h3>
        <div className="space-y-2 text-sm text-gray-600">
          {completedSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${step.color}`} />
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-3 max-w-md mx-auto">
        <button
          onClick={handleExport}
          className="w-full bg-accent hover:bg-accent/90 text-white rounded-lg py-3 px-6 font-medium transition-colors"
        >
          📥 匯出學習紀錄 (Word)
        </button>
        <button
          onClick={onExit}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-3 px-6 font-medium transition-colors"
        >
          返回首頁
        </button>
      </div>

      <p className="text-gray-400 text-xs mt-6">
        學習紀錄可作為學習歷程檔案的參考資料
      </p>
    </div>
  )
}
