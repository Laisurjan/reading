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
import type { Text, Response, Step, OptionalStep, Session } from '../../types'

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

  const session = id ? getSession(id) : undefined
  const text = session?.texts[0]

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
      <ProgressBar currentStep={currentStudent.currentStep} />

      <div className="mt-6">
        {currentStudent.currentStep === 'R' && (
          <StepR
            text={text}
            isPaperMode={session.isPaperMode}
            onComplete={() => handleStepComplete('R')}
          />
        )}
        {currentStudent.currentStep === 'I' && (
          <StepI
            text={text}
            isPaperMode={session.isPaperMode}
            onComplete={() => handleStepComplete('I')}
            submitResponse={submitResponse}
            getResponse={getResponse}
            saveDraft={saveDraft}
            getDraft={getDraft}
          />
        )}
        {currentStudent.currentStep === 'I-share' && session.enabledSteps?.includes('I-share') && (
          <StepShare
            step="I"
            title="看看同學怎麼說"
            description="看看其他同學如何理解這段文字"
            myResponse={getResponse('I')}
            otherResponses={getOtherResponses('I')}
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
            otherResponses={getOtherResponses('A1')}
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
          <StepComplete
            session={session}
            text={text}
            getResponse={getResponse}
            onExit={handleExit}
          />
        )}
      </div>
    </Layout>
  )
}

// 為了向後兼容，保留 Session 作為 export
export { SessionPage as Session }

/** R 步驟：閱讀 */
function StepR({
  text,
  isPaperMode,
  onComplete,
}: {
  text: Text
  isPaperMode: boolean
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
  onComplete,
}: {
  step: 'I' | 'A1'
  title: string
  description: string
  myResponse: Response | undefined
  otherResponses: Array<Response & { studentName: string }>
  onComplete: () => Promise<void> | void
}) {
  const [inspired, setInspired] = useState<Set<string>>(new Set())
  const stepColor = step === 'I' ? 'bg-step-i' : 'bg-step-a1'

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <span className={`inline-block ${stepColor} text-white text-sm font-medium px-4 py-1.5 rounded-full`}>
          互看
        </span>
        <h2 className="text-xl font-serif font-bold text-primary mt-3">{title}</h2>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>

      {myResponse && (
        <div className="bg-accent/10 rounded-lg p-4 border-2 border-accent/30">
          <span className="text-xs font-medium text-accent bg-accent/20 px-2 py-0.5 rounded">我的回答</span>
          <p className="text-gray-800 font-serif leading-relaxed whitespace-pre-wrap break-words mt-2">
            {myResponse.content}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500">同學的回答</h3>
        {otherResponses.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">目前還沒有其他同學的回答</p>
            <p className="text-gray-400 text-sm mt-1">你是第一個完成的！</p>
          </div>
        ) : (
          otherResponses.map((r) => (
            <div key={r.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <span className="text-xs text-gray-400">{r.studentName}</span>
              <p className="text-gray-800 font-serif leading-relaxed whitespace-pre-wrap break-words mt-2">
                {r.content}
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setInspired((prev) => {
                    const next = new Set(prev)
                    next.has(r.id) ? next.delete(r.id) : next.add(r.id)
                    return next
                  })}
                  className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                    inspired.has(r.id) ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  💡 有啟發 {inspired.has(r.id) && '✓'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onComplete}
        className={`w-full ${stepColor} hover:opacity-90 text-white rounded-lg py-4 px-6 font-medium transition-colors text-lg`}
      >
        繼續下一步
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
