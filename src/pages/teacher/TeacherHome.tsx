/**
 * 老師端 - 首頁
 * 班級管理、任務列表
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { useStore } from '../../store/useStore'
import { formatDateTime } from '../../utils/helpers'

export function TeacherHome() {
  const navigate = useNavigate()
  const classes = useStore((s) => s.classes)
  const createClass = useStore((s) => s.createClass)
  const getClassSessions = useStore((s) => s.getClassSessions)
  const getSessionStudents = useStore((s) => s.getSessionStudents)

  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    classes[0]?.id ?? null
  )
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')

  // 取得選中班級的任務
  const selectedClassSessions = selectedClassId
    ? getClassSessions(selectedClassId).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : []

  const handleCreateClass = () => {
    if (!newClassName.trim()) return
    const newClass = createClass(newClassName.trim())
    setSelectedClassId(newClass.id)
    setNewClassName('')
    setIsCreatingClass(false)
  }

  return (
    <Layout title="老師專區">
      <div className="space-y-6">
        {/* 班級選擇區 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700">我的班級</h3>
            <button
              onClick={() => setIsCreatingClass(true)}
              className="text-sm text-primary hover:underline"
            >
              + 新增班級
            </button>
          </div>

          {/* 新增班級表單 */}
          {isCreatingClass && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="輸入班級名稱（如：301）"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateClass()
                  if (e.key === 'Escape') setIsCreatingClass(false)
                }}
              />
              <button
                onClick={handleCreateClass}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                建立
              </button>
              <button
                onClick={() => {
                  setIsCreatingClass(false)
                  setNewClassName('')
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
            </div>
          )}

          {/* 班級列表 */}
          {classes.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              還沒有建立任何班級，請先新增班級
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedClassId === cls.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 選中班級的內容 */}
        {selectedClassId && (
          <>
            {/* 建立新任務按鈕 */}
            <button
              onClick={() => navigate(`/teacher/create?classId=${selectedClassId}`)}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl p-6 text-left transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">➕</span>
                <div>
                  <h2 className="text-xl font-medium">建立新任務</h2>
                  <p className="text-sm text-white/80 mt-1">
                    為 {classes.find((c) => c.id === selectedClassId)?.name} 建立閱讀任務
                  </p>
                </div>
              </div>
            </button>

            {/* 任務列表 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                任務列表（{selectedClassSessions.length}）
              </h3>

              {selectedClassSessions.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500">這個班級還沒有任務</p>
                  <p className="text-gray-400 text-sm mt-1">點擊上方按鈕建立第一個任務</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedClassSessions.map((session) => {
                    const studentCount = getSessionStudents(session.id).length
                    return (
                      <button
                        key={session.id}
                        onClick={() => navigate(`/teacher/dashboard/${session.id}`)}
                        className="w-full bg-white hover:bg-gray-50 rounded-lg p-4 text-left shadow-sm border border-gray-100 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-primary truncate">
                                {session.title}
                              </h4>
                              {session.isPaperMode && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  📄 紙本
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span>
                                代碼：<span className="font-mono font-bold">{session.joinCode}</span>
                              </span>
                              <span>{studentCount} 位學生</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDateTime(session.createdAt)}
                            </p>
                          </div>
                          <span className="text-gray-400 ml-4">→</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* 返回首頁 */}
        <div className="pt-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-primary transition-colors"
          >
            ← 返回首頁
          </button>
        </div>
      </div>
    </Layout>
  )
}
