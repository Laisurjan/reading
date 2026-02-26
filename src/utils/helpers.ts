/**
 * 工具函式
 */

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
export function getStepLabel(step: string): string {
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
