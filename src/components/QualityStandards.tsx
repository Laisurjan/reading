/**
 * 品質標準提示面板
 * 顯示各步驟的 4 項標準（詮釋、準確、清晰、實用 等）
 */

import { useState } from 'react'
import { QUALITY_STANDARDS } from '../types'

interface QualityStandardsProps {
  step: 'I' | 'A1' | 'A2'
}

export function QualityStandards({ step }: QualityStandardsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const standards = QUALITY_STANDARDS[step]

  const stepNames = {
    I: '重述',
    A1: '經驗連結',
    A2: '行動規劃',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-accent/10 hover:bg-accent/20 transition-colors"
      >
        <span className="text-sm font-medium text-primary">
          {stepNames[step]}的品質標準
        </span>
        <span className="text-primary">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {standards.map((standard, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-primary text-xs flex items-center justify-center font-medium">
                {standard.label.charAt(0)}
              </span>
              <div>
                <span className="font-medium text-primary text-sm">
                  {standard.label}
                </span>
                <p className="text-gray-600 text-sm mt-0.5">
                  {standard.description}
                </p>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            這些標準是幫助你思考的方向，不需要每項都完美達成
          </p>
        </div>
      )}
    </div>
  )
}
