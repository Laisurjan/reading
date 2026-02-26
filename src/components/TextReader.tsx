/**
 * 文本閱讀元件
 * 舒適排版的閱讀區，支援字體大小調整
 */

import { useState } from 'react'
import type { Text } from '../types'

interface TextReaderProps {
  text: Text
  /** 是否可收合（在 I/A1 步驟時） */
  collapsible?: boolean
  /** 預設收合狀態 */
  defaultCollapsed?: boolean
}

export function TextReader({
  text,
  collapsible = false,
  defaultCollapsed = false,
}: TextReaderProps) {
  const [fontSize, setFontSize] = useState(18)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const increaseFontSize = () => setFontSize((s) => Math.min(s + 2, 28))
  const decreaseFontSize = () => setFontSize((s) => Math.max(s - 2, 14))

  if (collapsible && isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="w-full p-4 bg-white rounded-lg shadow-sm border border-gray-100 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            原文：《{text.title}》
          </span>
          <span className="text-xs text-primary">點擊展開 ▼</span>
        </div>
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* 標題區 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-primary">
              {text.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {text.author}．{text.source}
            </p>
          </div>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-xs text-gray-400 hover:text-primary transition-colors"
            >
              收合 ▲
            </button>
          )}
        </div>
      </div>

      {/* 字體大小控制 */}
      <div className="px-4 py-2 flex items-center justify-end gap-2 border-b border-gray-100">
        <span className="text-xs text-gray-400">字體大小</span>
        <button
          onClick={decreaseFontSize}
          className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition-colors"
          aria-label="縮小字體"
        >
          A-
        </button>
        <button
          onClick={increaseFontSize}
          className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition-colors"
          aria-label="放大字體"
        >
          A+
        </button>
      </div>

      {/* 內文區 */}
      <div
        className="p-6 font-serif text-gray-800 leading-relaxed"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: '1.9',
        }}
      >
        {text.content.split('\n').map((paragraph, index) => (
          <p key={index} className={index > 0 ? 'mt-4' : ''}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}
