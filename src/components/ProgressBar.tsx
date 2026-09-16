/**
 * RIA 進度條元件
 * 只顯示這份任務實際會走到的步驟，名稱依玩法而異
 * （經典：R → I → 互看 → A1 → 互看 → A2；賣書：選書 → 寫推薦 → 投票 → 結果）
 */

import type { Step, OptionalStep, ActivityType } from '../types'
import { getStepLabel } from '../utils/helpers'

interface ProgressBarProps {
  currentStep: Step
  /** 這份任務啟用的可選步驟。未提供時顯示全部（向後相容） */
  enabledSteps?: OptionalStep[]
  activityType?: ActivityType
}

/** 全部步驟的順序與顏色 */
const ALL_STEPS: { key: Step; color: string }[] = [
  { key: 'R', color: 'bg-step-r' },
  { key: 'I', color: 'bg-step-i' },
  { key: 'I-share', color: 'bg-step-i' },
  { key: 'A1', color: 'bg-step-a1' },
  { key: 'A1-share', color: 'bg-step-a1' },
  { key: 'A2', color: 'bg-step-a2' },
]

export function ProgressBar({ currentStep, enabledSteps, activityType = 'classic' }: ProgressBarProps) {
  // 賣書模式的最後一格是「結果」，即使 A2 沒啟用也要顯示
  const showFinalAsResult = activityType === 'pitch'

  const steps = ALL_STEPS.filter((s) => {
    if (s.key === 'R' || s.key === 'I') return true
    if (!enabledSteps) return true
    if (s.key === 'A2' && showFinalAsResult) return true
    return enabledSteps.includes(s.key as OptionalStep)
  })

  const currentIndex = steps.findIndex((s) => s.key === currentStep)

  return (
    <div className="w-full py-4">
      {/* 手機版：簡化顯示 */}
      <div className="flex items-center justify-between md:hidden">
        {steps.map((step, index) => {
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
                {getStepLabel(step.key, activityType)}
              </span>
            </div>
          )
        })}
      </div>

      {/* 桌面版：完整顯示 */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {steps.map((step, index) => {
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
                {getStepLabel(step.key, activityType)}
              </div>
              {index < steps.length - 1 && (
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
