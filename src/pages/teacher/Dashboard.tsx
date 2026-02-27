/**
 * 老師端 - 即時儀表板
 * 查看全班學生進度與回答內容
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { useStore } from '../../store/useStore'
import { getStepLabel } from '../../utils/helpers'
import type { Step } from '../../types'

export function Dashboard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const getSession = useStore((s) => s.getSession)
  const getClass = useStore((s) => s.getClass)
  const deleteSession = useStore((s) => s.deleteSession)
  const getSessionStudents = useStore((s) => s.getSessionStudents)
  const getSessionResponses = useStore((s) => s.getSessionResponses)
  const subscribeToSession = useStore((s) => s.subscribeToSession)

  const session = id ? getSession(id) : undefined
  const sessionClass = session ? getClass(session.classId) : undefined
  const students = id ? getSessionStudents(id) : []
  const responses = id ? getSessionResponses(id) : []

  const [selectedStep, setSelectedStep] = useState<'all' | 'I' | 'A1' | 'A2'>('all')
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  // 訂閱即時更新
  useEffect(() => {
    if (!id) return
    const unsubscribe = subscribeToSession(id)
    return () => unsubscribe()
  }, [id, subscribeToSession])

  if (!session) {
    return (
      <Layout title="找不到任務">
        <div className="text-center py-12">
          <p className="text-gray-600">找不到這個任務</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-primary hover:underline"
          >
            返回首頁
          </button>
        </div>
      </Layout>
    )
  }

  // 統計各步驟人數
  const stepCounts = students.reduce(
    (acc, student) => {
      const step = student.currentStep
      acc[step] = (acc[step] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // 篩選回答
  const filteredResponses =
    selectedStep === 'all'
      ? responses
      : responses.filter((r) => r.step === selectedStep)

  // 按學生篩選
  const displayResponses = selectedStudent
    ? filteredResponses.filter((r) => r.studentId === selectedStudent)
    : filteredResponses

  return (
    <Layout title={`${session.title} - 儀表板`}>
      {/* 任務資訊 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {sessionClass && (
                <span className="text-sm text-accent font-medium">{sessionClass.name}</span>
              )}
              {session.isPaperMode && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  📄 紙本模式
                </span>
              )}
            </div>
            <h2 className="font-serif text-xl font-bold text-primary">
              {session.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              加入代碼：<span className="font-mono font-bold text-lg text-primary">{session.joinCode}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{students.length}</p>
            <p className="text-sm text-gray-500">位學生</p>
          </div>
        </div>
      </div>

      {/* 進度總覽 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="font-medium text-gray-700 mb-4">進度總覽</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {(['R', 'I', 'I-share', 'A1', 'A1-share', 'A2'] as Step[]).map((step) => {
            const count = stepCounts[step] ?? 0
            const colors: Record<string, string> = {
              R: 'bg-step-r',
              I: 'bg-step-i',
              'I-share': 'bg-step-i/70',
              A1: 'bg-step-a1',
              'A1-share': 'bg-step-a1/70',
              A2: 'bg-step-a2',
            }
            return (
              <div
                key={step}
                className={`rounded-lg p-3 text-center ${colors[step]} text-white`}
              >
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs opacity-90">{getStepLabel(step)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 篩選工具 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={selectedStep}
          onChange={(e) => setSelectedStep(e.target.value as 'all' | 'I' | 'A1' | 'A2')}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
        >
          <option value="all">全部回答</option>
          <option value="I">I 重述</option>
          <option value="A1">A1 經驗</option>
          <option value="A2">A2 行動</option>
        </select>

        <select
          value={selectedStudent ?? ''}
          onChange={(e) => setSelectedStudent(e.target.value || null)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
        >
          <option value="">全部學生</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* 學生回答列表 */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-700">
          學生回答（{displayResponses.length} 筆）
        </h3>

        {displayResponses.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">目前還沒有學生提交回答</p>
          </div>
        ) : (
          displayResponses.map((response) => {
            const stepColors: Record<string, string> = {
              I: 'bg-step-i',
              A1: 'bg-step-a1',
              A2: 'bg-step-a2',
            }
            return (
              <div
                key={response.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-primary">
                      {response.studentName}
                    </span>
                    <span
                      className={`text-xs text-white px-2 py-0.5 rounded ${stepColors[response.step] ?? 'bg-gray-400'}`}
                    >
                      {response.step}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(response.submittedAt).toLocaleTimeString('zh-TW', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-gray-800 font-serif leading-relaxed whitespace-pre-wrap break-words">
                    {response.content}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 底部操作 */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={() => navigate('/teacher')}
          className="text-gray-500 hover:text-primary transition-colors"
        >
          ← 返回老師專區
        </button>
        <button
          onClick={async () => {
            if (confirm(`確定要刪除「${session.title}」嗎？此操作無法復原。\n\nAre you sure to delete this session?`)) {
              await deleteSession(session.id)
              navigate('/teacher')
            }
          }}
          className="text-red-500 hover:text-red-700 text-sm transition-colors"
        >
          刪除此任務
        </button>
      </div>
    </Layout>
  )
}
