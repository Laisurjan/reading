/**
 * 工具函式
 */

import type { ActivityType } from '../types'

/**
 * 產生隨機加入代碼（6 位數字）
 * 回傳：string 6 位數字代碼
 */
export function generateJoinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 產生唯一 ID
 * 回傳：string UUID 格式的唯一識別碼
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * 格式化日期時間
 * 回傳：string 格式化後的日期時間字串
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 取得步驟顯示名稱
 * 回傳：string 步驟的中文名稱
 */
export function getStepLabel(step: string, activityType: ActivityType = 'classic'): string {
  // 賣書模式沿用同一組步驟機制，但學生看到的名稱要換掉——
  // 在賣書模式裡顯示「A1 經驗」是沒有意義的
  if (activityType === 'pitch') {
    const pitchLabels: Record<string, string> = {
      R: '選書',
      I: '寫推薦',
      'I-share': '投票',
      A2: '結果',
      waiting: '等待中',
    }
    return pitchLabels[step] ?? step
  }
  const labels: Record<string, string> = {
    R: '閱讀',
    I: '重述',
    'I-share': '互看',
    A1: '經驗',
    'A1-share': '互看',
    A2: '行動',
    waiting: '等待中',
  }
  return labels[step] ?? step
}

/**
 * 依序號產生匿名代號：0 → 同學A、25 → 同學Z、26 → 同學AA。
 * 回傳：string 匿名代號
 */
export function getAnonCode(index: number): string {
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let n = index
  let code = ''
  do {
    code = LETTERS[n % 26] + code
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return `同學${code}`
}

/**
 * 為一份任務的所有學生配發固定的匿名代號。
 * 依 student.id 排序，所以同一個人在整場活動中代號不會變動
 * （前後兩個互看步驟看到的「同學A」是同一個人，討論時才對得上話）。
 * 回傳：Map<學生 id, 匿名代號>
 */
export function buildAnonMap(studentIds: string[]): Map<string, string> {
  const sorted = [...studentIds].sort()
  return new Map(sorted.map((id, i) => [id, getAnonCode(i)]))
}

/**
 * 取得 public/ 底下靜態資源的完整網址。
 * Vite 的 base 是 /reading/，直接寫死絕對路徑在本機 dev 會壞掉。
 * 回傳：string 可直接放進 img src 的路徑
 */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`
}

/**
 * 取得步驟顏色
 * 回傳：string Tailwind CSS 顏色類別
 */
export function getStepColor(step: string): string {
  const colors: Record<string, string> = {
    R: 'bg-step-r',
    I: 'bg-step-i',
    'I-share': 'bg-step-i',
    A1: 'bg-step-a1',
    'A1-share': 'bg-step-a1',
    A2: 'bg-step-a2',
  }
  return colors[step] ?? 'bg-gray-400'
}
