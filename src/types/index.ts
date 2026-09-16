/**
 * 深度共讀平台 - 型別定義
 */

/** 步驟類型 */
export type Step = 'R' | 'I' | 'I-share' | 'A1' | 'A1-share' | 'A2'

/** 共讀模式（文本來源：老師貼一篇 or 老師貼多篇讓學生選） */
export type SessionMode = 'single' | 'multi'

/**
 * 活動玩法。與 SessionMode 是兩個不同的軸：
 * SessionMode 管「文本從哪來」，ActivityType 管「這節課怎麼玩」。
 * - classic：經典 RIA（全班同一份拆頁，R→I→互看→A1→互看→A2）
 * - pitch：賣書（各讀各的書，寫一句推薦詞，匿名投票選出前三）
 * - bottle：瓶中信（各讀各的書，摘抄一段，環狀配對後互相回一句）
 */
export type ActivityType = 'classic' | 'pitch' | 'bottle'

/**
 * 互看時的署名方式。
 * - real：顯示座號＋姓名（舊任務沒有此設定時的預設值）
 * - anon：顯示匿名代號（同學A、同學B…）
 *
 * ⚠ 這只換掉「畫面上顯示的字」，不是真的匿名。學生端為了互看與投票，
 * 會訂閱整個任務的 students／responses／replies，姓名其實就躺在每個學生自己的
 * 瀏覽器裡，打開開發者工具就對得回去（這是資處科，真的有人會打開）。
 *
 * 所以對學生只能說「畫面上不會出現名字，老師看得到」，不能說「沒有人知道是誰」。
 * 瓶中信尤其要先講清楚，請他們寫願意被老師讀到的內容。
 * 要做到查也查不到，得把姓名移出學生讀得到的集合，那是資料結構的改動。
 */
export type Attribution = 'anon' | 'real'

/** 有互看畫面的步驟 */
export type ShareStep = 'I-share' | 'A1-share'

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

/** 書籍資訊（選填） */
export interface BookInfo {
  /** 書籍封面圖（base64） */
  coverImage?: string
  /** 書籍作者 */
  author?: string
  /** 出版社 */
  publisher?: string
  /** 花蓮高商圖書館索書號 */
  libraryCallNumber?: string
}

/** 閱讀任務 */
export interface Session {
  id: string
  classId: string
  title: string
  mode: SessionMode
  /**
   * 活動玩法。舊任務沒有這個欄位，讀取時一律當成 'classic'，
   * 所以既有任務的行為完全不變。
   */
  activityType?: ActivityType
  /** 紙本模式：學生閱讀實體紙本，不在螢幕上閱讀 */
  isPaperMode: boolean
  /** 啟用的步驟（R 和 I 為必要步驟） */
  enabledSteps: OptionalStep[]
  /**
   * 各互看步驟的署名方式。未設定的步驟預設 'real'（維持舊任務行為）。
   * 兩個互看步驟可以不同，例如重述掛名、經驗匿名。
   */
  attribution?: Partial<Record<ShareStep, Attribution>>
  /** 每人可投的 💡 票數上限。未設定＝不限 */
  reactionQuota?: number
  theme?: string
  texts: Text[]
  joinCode: string
  grouping: GroupingType
  groupSize?: number
  flowControl: FlowControl
  currentStep: 'waiting' | Step
  createdAt: string
  /** 書籍資訊（選填）。整個任務共用一本書時才用，各讀各的書請看 Student.myBook */
  bookInfo?: BookInfo
}

/** 學生自己帶來的那本書（賣書模式：每人一本不同的書） */
export interface MyBook {
  title: string
  /** 花蓮高商圖書館索書號 */
  callNumber?: string
  /** 讀到第幾頁——等於紙本學習單那一格，明說「不用讀完也可以交」 */
  page?: string
}

/** 學生 */
export interface Student {
  id: string
  sessionId: string
  /**
   * Google 帳號的 uid，等於這筆紀錄的主人。
   * 這是唯一的身分依據：安全規則靠它判斷「這筆能不能改」，
   * 重新加入時也靠它把人接回原本的紀錄，不再拿姓名字串比對。
   * 選填只是為了讀得動改版前留下的舊資料，新資料一定會有。
   */
  uid?: string
  /** 顯示名稱（座號＋Google 顯示名稱）。只是拿來顯示，不做身分比對 */
  name: string
  /** Google 帳號 email（未來認證用） */
  email?: string
  group?: number
  chosenTextId?: string
  currentStep: Step
  joinedAt: string
  /** 賣書／瓶中信模式：學生自己挑的那本書 */
  myBook?: MyBook
  /**
   * 瓶中信模式：老師按「投遞」後，分配給這位學生要回覆的那封信（Response id）。
   * 由環狀配對產生，永遠不會分到自己的信。
   */
  assignedResponseId?: string
}

/**
 * 瓶中信的回信。
 * 一對一通道比公開牆危險（公開牆有全班當證人），所以老師端看得到每一封，
 * 而且這件事要先跟學生說。
 */
export interface Reply {
  id: string
  sessionId: string
  /** 回覆的是哪一封信 */
  toResponseId: string
  /** 那封信的作者，用來快速查「回給我的信」 */
  toStudentId: string
  fromStudentId: string
  /** 回信者選用的引導語 */
  prompt: string
  content: string
  createdAt: string
}

/**
 * 瓶中信回信的三個引導語。
 *
 * 設計重點：回信不是評論那段文字，是回應那個人。
 * 三句話都把焦點從「這段寫得如何」移到「這段在我身上引起什麼」——
 * 這也是唯一一種「沒讀過那本書也寫得出來」的回應。
 */
export const BOTTLE_PROMPTS: { key: string; label: string; starter: string; hint: string }[] = [
  {
    key: 'remind',
    label: '這段讓我想到⋯⋯',
    starter: '這段讓我想到',
    hint: '想到自己的事、看過的影片、認識的人都可以',
  },
  {
    key: 'words',
    label: '我最有感的是「⋯⋯」這幾個字',
    starter: '我最有感的是「',
    hint: '把那幾個字挑出來，再說為什麼',
  },
  {
    key: 'ask',
    label: '看完我想問你：⋯⋯',
    starter: '看完我想問你：',
    hint: '問一個你真的好奇的問題',
  },
]

/** 一則「💡 有啟發」。每位學生對同一則回答最多一票 */
export interface Reaction {
  id: string
  sessionId: string
  responseId: string
  fromStudentId: string
  createdAt: string
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
  /** 瓶中信：摘抄的那段在第幾頁 */
  page?: string
  /** 瓶中信：為什麼選這一段 */
  why?: string
  submittedAt: string
}

/** 建立任務的輸入資料 */
export interface CreateSessionInput {
  classId: string
  title: string
  mode: SessionMode
  activityType?: ActivityType
  isPaperMode: boolean
  enabledSteps: OptionalStep[]
  attribution?: Partial<Record<ShareStep, Attribution>>
  reactionQuota?: number
  theme?: string
  texts: Omit<Text, 'id'>[]
  grouping: GroupingType
  groupSize?: number
  flowControl: FlowControl
  /** 書籍資訊（選填） */
  bookInfo?: BookInfo
}

/** 三種玩法的說明文字與配圖（老師選擇卡片與學生開場畫面共用） */
export const ACTIVITY_META: Record<
  ActivityType | 'bottle',
  {
    name: string
    /** 學生端看到的標題，刻意跟老師端不同——用學生的語言 */
    studentName: string
    tagline: string
    description: string
    image: string
    card: string
    available: boolean
  }
> = {
  classic: {
    name: '經典模式',
    studentName: '一起拆同一段',
    tagline: '全班讀同一份拆頁',
    description: '老師指定一段文字，全班一起走 R 閱讀 → I 重述 → 互看 → A1 經驗 → A2 行動。討論最聚焦。',
    image: 'modes/classic.jpg',
    card: 'modes/classic-card.jpg',
    available: true,
  },
  pitch: {
    name: '賣書模式',
    studentName: '把這本書推坑給別人',
    tagline: '各讀各的書，一句話決勝負',
    description:
      '每人讀自己手上的書，寫一句 30 字以內的推薦詞。全部匿名上牆，每人 3 票，選出最想被推坑的前三名。',
    image: 'modes/pitch.jpg',
    card: 'modes/pitch-card.jpg',
    available: true,
  },
  bottle: {
    name: '瓶中信模式',
    studentName: '把想說的話裝進瓶子裡',
    tagline: '寫給一個不知道是誰的人',
    description:
      '每人從自己的書裡抄一段、說說為什麼選它。老師按「投遞」後環狀配對漂給另一個人，收到的人回一句。保證每個人都收得到回信。',
    image: 'modes/bottle.jpg',
    card: 'modes/bottle-card.jpg',
    available: true,
  },
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
