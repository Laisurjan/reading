/**
 * 深度共讀平台 - 進入點
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

// 進出開發預覽頁（#/dev）要整頁重載。
// App 那邊刻意用靜態判斷（正式建置才搖得掉預覽頁），代價是改 hash 不會重新判斷，
// 所以在這裡補一次 reload。整段包在 DEV 裡，正式站不會有這段。
if (import.meta.env.DEV) {
  let wasDev = window.location.hash.startsWith('#/dev')
  window.addEventListener('hashchange', () => {
    const isDev = window.location.hash.startsWith('#/dev')
    if (isDev !== wasDev) {
      wasDev = isDev
      window.location.reload()
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
