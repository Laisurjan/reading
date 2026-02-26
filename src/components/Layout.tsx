/**
 * 頁面框架元件
 */

import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  /** 是否顯示頁首 */
  showHeader?: boolean
  /** 頁面標題 */
  title?: string
}

export function Layout({ children, showHeader = true, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-secondary font-sans">
      {showHeader && (
        <header className="bg-primary text-white px-4 py-3 shadow-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="font-serif text-lg font-semibold">
              {title ?? '深度共讀'}
            </h1>
          </div>
        </header>
      )}
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
