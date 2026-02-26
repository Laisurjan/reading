/**
 * 精準提問鷹架面板
 * 包含「追問前因後果」和「適用範圍」兩組引導問題
 */

import { useState } from 'react'
import { SCAFFOLD_CAUSE_EFFECT, SCAFFOLD_SCOPE } from '../types'

interface ScaffoldPanelProps {
  /** 點擊問題時的回調，將問題插入輸入框 */
  onInsertQuestion?: (question: string) => void
}

export function ScaffoldPanel({ onInsertQuestion }: ScaffoldPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleQuestionClick = (question: string) => {
    onInsertQuestion?.(question)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm text-gray-600">
          需要靈感？試試這些問題 →
        </span>
        <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* 追問前因後果 */}
          <div>
            <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-step-i" />
              追問前因後果
            </h4>
            <div className="space-y-2">
              {SCAFFOLD_CAUSE_EFFECT.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleQuestionClick(item.question)}
                  className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-accent/10 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-accent">
                      【{item.key}】{item.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-primary transition-colors">
                    {item.question}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 明確適用範圍 */}
          <div>
            <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-step-a1" />
              明確適用範圍
            </h4>
            <div className="space-y-2">
              {SCAFFOLD_SCOPE.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleQuestionClick(item.question)}
                  className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-accent/10 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-accent">
                      【{item.key}】{item.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-primary transition-colors">
                    {item.question}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">
            點擊問題可以插入到輸入框，作為思考的起點
          </p>
        </div>
      )}
    </div>
  )
}
