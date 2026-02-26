/**
 * RIA 進度條元件
 * 顯示：R → I → 互看 → A1 → 互看 → A2
 */

import type { Step } from '../types'

interface ProgressBarProps {
  currentStep: Step
}

/** 所有步驟定義 */
const STEPS: { key: Step; label: string; color: string }[] = [
  { key: 'R', label: 'R 閱讀', color: 'bg-step-r' },
  { key: 'I', label: 'I 重述', color: 'bg-step-i' },
  { key: 'I-share', label: '互看', color: 'bg-step-i' },
  { key: 'A1', label: 'A1 經驗', color: 'bg-step-a1' },
  { key: 'A1-share', label: '互看', color: 'bg-step-a1' },
  { key: 'A2', label: 'A2 行動', color: 'bg-step-a2' },
]

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="w-full py-4">
      {/* 手機版：簡化顯示 */}
      <div className="flex items-center justify-between md:hidden">
        {STEPS.map((step, index) => {
          const isActive = index === currentIndex
          const isDone = index < currentIndex

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                  transition-all duration-300
                  ${isActive ? `${step.color} text-white scale-110 shadow-lg` : ''}
                  ${isDone ? `${step.color} text-white opacity-60` : ''}
                  ${!isActive && !isDone ? 'bg-gray-200 text-gray-400' : ''}
                `}
              >
                {index + 1}
              </div>
              <span
                className={`
                  mt-1 text-xs
                  ${isActive ? 'text-primary font-medium' : 'text-gray-400'}
                `}
              >
                {step.label.split(' ')[0]}
              </span>
            </div>
          )
        })}
      </div>

      {/* 桌面版：完整顯示 */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {STEPS.map((step, index) => {
          const isActive = index === currentIndex
          const isDone = index < currentIndex

          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`
                  px-4 py-2 rounded-full text-sm font-medium
                  transition-all duration-300
                  ${isActive ? `${step.color} text-white shadow-lg` : ''}
                  ${isDone ? `${step.color} text-white opacity-60` : ''}
                  ${!isActive && !isDone ? 'bg-gray-200 text-gray-400' : ''}
                `}
              >
                {step.label}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`
                    w-6 h-0.5 mx-1
                    ${index < currentIndex ? 'bg-primary' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
