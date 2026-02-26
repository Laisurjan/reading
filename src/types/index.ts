/**
 * 深度共讀平台 - 型別定義
 */

/** 步驟類型 */
export type Step = 'R' | 'I' | 'I-share' | 'A1' | 'A1-share' | 'A2'

/** 共讀模式 */
export type SessionMode = 'single' | 'multi'

/** 流程控制模式 */
export type FlowControl = 'teacher' | 'free'

/** 分組方式 */
export type GroupingType = 'random' | 'manual' | 'none'

/** 班級 */
export interface Class {
  id: string
  name: string
  createdAt: string
}

/** 文本（拆頁） */
export interface Text {
  id: string
  title: string
  author: string
  source: string
  content: string
}

/** 可選步驟 */
export type OptionalStep = 'I-share' | 'A1' | 'A1-share' | 'A2'

/** 閱讀任務 */
export interface Session {
  id: string
  classId: string
  title: string
  mode: SessionMode
  /** 紙本模式：學生閱讀實體紙本，不在螢幕上閱讀 */
  isPaperMode: boolean
  /** 啟用的步驟（R 和 I 為必要步驟） */
  enabledSteps: OptionalStep[]
  theme?: string
  texts: Text[]
  joinCode: string
  grouping: GroupingType
  groupSize?: number
  flowControl: FlowControl
  currentStep: 'waiting' | Step
  createdAt: string
}

/** 學生 */
export interface Student {
  id: string
  sessionId: string
  name: string
  group?: number
  chosenTextId?: string
  currentStep: Step
  joinedAt: string
}

/** 學生回答 */
export interface Response {
  id: string
  studentId: string
  sessionId: string
  textId: string
  step: 'I' | 'A1' | 'A2'
  content: string
  a2Goal?: string
  a2Action?: string
  a2Connection?: string
  a2Deadline?: string
  submittedAt: string
}

/** 建立任務的輸入資料 */
export interface CreateSessionInput {
  classId: string
  title: string
  mode: SessionMode
  isPaperMode: boolean
  enabledSteps: OptionalStep[]
  theme?: string
  texts: Omit<Text, 'id'>[]
  grouping: GroupingType
  groupSize?: number
  flowControl: FlowControl
}

/** 品質標準 */
export interface QualityStandard {
  label: string
  description: string
}

/** 各步驟的品質標準 */
export const QUALITY_STANDARDS: Record<'I' | 'A1' | 'A2', QualityStandard[]> = {
  I: [
    { label: '詮釋', description: '用自己的語言來寫，不是抄原文' },
    { label: '準確', description: '解讀不能偏離原意' },
    { label: '清晰', description: '邏輯要清楚簡練' },
    { label: '實用', description: '試著轉化為具體操作或建議' },
  ],
  A1: [
    { label: '鮮活', description: '必須是親眼所見、親耳所聞的事' },
    { label: '故事', description: '敘事要完整，有起承轉合' },
    { label: '對應', description: '要與原文或 I 的內容對應' },
    { label: '思考', description: '能更深地幫助自己理解原文' },
  ],
  A2: [
    { label: '目標', description: '是否規劃了明確目標？' },
    { label: '行動', description: '行動是否能拉近與目標的距離？' },
    { label: '關聯', description: '是否使用了原文的方法？' },
    { label: '可控', description: '自己能做得到嗎？' },
  ],
}

/** 提問鷹架 - 追問前因後果 */
export const SCAFFOLD_CAUSE_EFFECT = [
  { key: '前', label: '前車可鑒', question: '為什麼這件事對我重要？是怎麼出現這問題的？' },
  { key: '因', label: '相因相生', question: '有哪些關於原因的假設？怎麼驗證或排除這些假設？' },
  { key: '後', label: '以觀後效', question: '若問題解決了，最好的結果是什麼？' },
  { key: '果', label: '自食其果', question: '如果我什麼都不做，會發生什麼？' },
]

/** 提問鷹架 - 明確適用範圍 */
export const SCAFFOLD_SCOPE = [
  { key: '適', label: '適用其反', question: '有沒有不符合這觀點的例子？' },
  { key: '用', label: '使用條件', question: '要應用這觀點，需要具備什麼條件？' },
  { key: '範', label: '尋求範本', question: '其他人如何處理類似的問題？' },
  { key: '圍', label: '檢視圍牆', question: '不同意見和我的想法，真正的區別是什麼？' },
]
