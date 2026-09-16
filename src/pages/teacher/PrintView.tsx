/**
 * 老師端 - 全班成果匯出（列印／存成 PDF）
 *
 * 用瀏覽器的「列印 → 另存為 PDF」，不用 PDF 函式庫。
 * 原因是中文：jsPDF 要嵌中日韓字型（好幾 MB，會讓 bundle 翻倍），
 * html2canvas 則是把文字畫成圖（模糊、檔案大、不能選取）。
 * 交給瀏覽器列印可以拿到向量文字、正確的中文字型，版面由 CSS 控制，
 * 而且不必多裝任何東西。
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { buildAnonMap } from '../../utils/helpers'
import type { ActivityType } from '../../types'
import { ACTIVITY_META } from '../../types'

export function PrintView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const getSession = useStore((s) => s.getSession)
  const getClass = useStore((s) => s.getClass)
  const getSessionStudents = useStore((s) => s.getSessionStudents)
  const getSessionResponses = useStore((s) => s.getSessionResponses)
  const getPitchRanking = useStore((s) => s.getPitchRanking)
  const replies = useStore((s) => s.replies)

  /**
   * 署名方式。預設真名（這是老師自己的紀錄），
   * 但如果要投影或貼在教室後面，就得切成代號——
   * 學生當初是在「同學看不到是誰」的前提下寫的，印出來掛上名字等於事後翻約。
   */
  const [showNames, setShowNames] = useState(true)

  const session = id ? getSession(id) : undefined
  const sessionClass = session ? getClass(session.classId) : undefined
  const students = id ? getSessionStudents(id) : []
  const responses = id ? getSessionResponses(id) : []

  if (!session || !id) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-600">找不到這個任務</p>
        <button onClick={() => navigate('/teacher')} className="mt-4 text-primary hover:underline">
          返回老師專區
        </button>
      </div>
    )
  }

  const activityType: ActivityType = session.activityType ?? 'classic'
  const anonMap = buildAnonMap(students.map((s) => s.id))
  const nameOf = (studentId: string) =>
    showNames
      ? students.find((s) => s.id === studentId)?.name ?? '—'
      : anonMap.get(studentId) ?? '—'

  const ranking = activityType === 'pitch' ? getPitchRanking(id) : []
  const sessionReplies = replies.filter((r) => r.sessionId === id)

  /** 依座號排序，印出來才跟點名簿對得起來 */
  const ordered = [...students].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))

  const dateStr = new Date(session.createdAt).toLocaleDateString('zh-TW')

  return (
    <div className="print-root min-h-screen bg-gray-100">
      {/* 工具列：列印時整條不會出現 */}
      <div className="no-print sticky top-0 z-10 bg-primary text-white px-4 py-3 shadow">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate(`/teacher/dashboard/${id}`)}
            className="text-white/80 hover:text-white text-sm"
          >
            ← 返回儀表板
          </button>

          <label className="flex items-center gap-2 text-sm ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={showNames}
              onChange={(e) => setShowNames(e.target.checked)}
              className="w-4 h-4"
            />
            顯示姓名
          </label>

          <button
            onClick={() => window.print()}
            className="bg-accent hover:bg-accent/90 text-white rounded-lg px-5 py-2 font-medium"
          >
            列印 / 存成 PDF
          </button>
        </div>
        {!showNames && (
          <div className="max-w-4xl mx-auto mt-2 text-xs text-white/80">
            目前是匿名代號。要投影或張貼時用這個——學生是在「同學看不到是誰」的前提下寫的。
          </div>
        )}
      </div>

      {/* 這裡開始是會被印出來的內容 */}
      <div className="print-page max-w-4xl mx-auto bg-white my-6 p-10 shadow-sm">
        {/* 標題區 */}
        <header className="border-b-2 border-primary pb-4 mb-6">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h1 className="font-serif text-2xl font-bold text-primary">{session.title}</h1>
            <span className="text-sm text-gray-500">{dateStr}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {sessionClass && <span>{sessionClass.name}</span>}
            <span>{ACTIVITY_META[activityType].name}</span>
            <span>{students.length} 人</span>
            {activityType === 'pitch' && <span>投出 {ranking.reduce((n, r) => n + r.inspireCount, 0)} 票</span>}
            {activityType === 'bottle' && <span>回信 {sessionReplies.length} 封</span>}
          </div>
        </header>

        {/* 賣書模式：前三名放最前面 */}
        {activityType === 'pitch' && ranking.length > 0 && (
          <section className="mb-8 avoid-break">
            <h2 className="font-serif text-lg font-bold text-primary mb-3">最多人想借走的三本</h2>
            <div className="space-y-2">
              {ranking.slice(0, 3).map((r, i) => (
                <div key={r.id} className="flex items-start gap-3 bg-amber-50 rounded-lg p-3 avoid-break">
                  <span className="text-xl leading-none">{['🥇', '🥈', '🥉'][i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-gray-800">{r.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {r.myBook && <span>《{r.myBook.title}》</span>}
                      {r.myBook?.callNumber && (
                        <span className="font-mono ml-2">{r.myBook.callNumber}</span>
                      )}
                      <span className="ml-2">{nameOf(r.studentId)}</span>
                      <span className="ml-2 text-yellow-700">💡 {r.inspireCount}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 全班成果 */}
        <section>
          <h2 className="font-serif text-lg font-bold text-primary mb-3">全班成果</h2>
          <div className="space-y-4">
            {ordered.map((student) => {
              const mine = responses.filter((r) => r.studentId === student.id)
              const iRes = mine.find((r) => r.step === 'I')
              const a1Res = mine.find((r) => r.step === 'A1')
              const a2Res = mine.find((r) => r.step === 'A2')
              const gotReplies = sessionReplies.filter((r) => r.toStudentId === student.id)

              return (
                <article
                  key={student.id}
                  className="avoid-break border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-baseline justify-between gap-2 border-b border-gray-100 pb-2 mb-3">
                    <h3 className="font-medium text-primary">{nameOf(student.id)}</h3>
                    {student.myBook && (
                      <span className="text-xs text-gray-500 font-serif">
                        《{student.myBook.title}》
                        {student.myBook.callNumber && (
                          <span className="font-mono ml-1">{student.myBook.callNumber}</span>
                        )}
                        {student.myBook.page && <span className="ml-1">讀到 p.{student.myBook.page}</span>}
                      </span>
                    )}
                  </div>

                  {!iRes && !a1Res && !a2Res && (
                    <p className="text-sm text-gray-400">（沒有作答）</p>
                  )}

                  {/* 瓶中信：摘抄 + 為什麼 + 收到的回信 */}
                  {activityType === 'bottle' && iRes && (
                    <div className="space-y-3">
                      <blockquote className="pl-3 border-l-4 border-accent/50">
                        <p className="font-serif text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                          {iRes.content}
                        </p>
                        {iRes.page && <p className="text-xs text-gray-400 mt-1">p.{iRes.page}</p>}
                      </blockquote>
                      {iRes.why && (
                        <p className="text-sm text-gray-700">
                          <span className="text-gray-400">選它的理由｜</span>
                          {iRes.why}
                        </p>
                      )}
                      {gotReplies.map((rep) => (
                        <div key={rep.id} className="bg-gray-50 rounded p-3">
                          <p className="text-xs text-gray-400 mb-1">
                            {nameOf(rep.fromStudentId)} 回信・{rep.prompt}
                          </p>
                          <p className="font-serif text-gray-800 whitespace-pre-wrap break-words">
                            {rep.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 賣書：一句推薦 + 得票 */}
                  {activityType === 'pitch' && iRes && (
                    <p className="font-serif text-lg text-gray-800 break-words">
                      {iRes.content}
                      {iRes.inspireCount > 0 && (
                        <span className="text-sm text-yellow-700 ml-2">💡 {iRes.inspireCount}</span>
                      )}
                    </p>
                  )}

                  {/* 經典：I / A1 / A2 */}
                  {activityType === 'classic' && (
                    <div className="space-y-3">
                      {iRes && (
                        <Block label="I 重述" color="text-step-i" text={iRes.content} />
                      )}
                      {a1Res && (
                        <Block label="A1 經驗" color="text-step-a1" text={a1Res.content} />
                      )}
                      {a2Res && (
                        <Block label="A2 行動" color="text-step-a2" text={a2Res.content} />
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <footer className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          深度共讀・{session.title}・{dateStr}
        </footer>
      </div>
    </div>
  )
}

/** 經典模式用的小段落 */
function Block({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <div>
      <p className={`text-xs font-medium ${color} mb-1`}>{label}</p>
      <p className="font-serif text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
        {text}
      </p>
    </div>
  )
}
