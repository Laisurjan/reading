/**
 * 開發用預覽頁（只在 dev 存在，不會進正式站）
 *
 * 用途：不必登入 Google、不連 Firebase，就能把三種玩法的學生畫面整套點過一遍。
 * 做法是把 zustand store 裡的資料與「會寫入 Firestore 的動作」整組換成純記憶體版本，
 * 所以 Session.tsx 一行都不用改，看到的就是學生真正會看到的畫面。
 *
 * 用法：npm run dev → http://localhost:5173/reading/#/dev
 *   ?mode=pitch|bottle|classic 切換玩法
 *   畫面上的工具列可以直接跳步驟、模擬別人送出、模擬老師投遞
 */

import { useState, useEffect } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { buildDeliveryPlan } from '../utils/helpers'
import { SessionPage } from './student/Session'
import { CreateSession } from './teacher/CreateSession'
import { Dashboard } from './teacher/Dashboard'
import { PrintView } from './teacher/PrintView'
import type { Session, Student, Response, ActivityType, Step, Reply, Reaction } from '../types'

const SESSION_ID = 'dev-session'
const ME = 'stu-me'

/** 假同學。名字刻意用「同學」開頭，避免誤以為是真資料 */
const PEERS = [
  { id: 'stu-a', name: '01 假資料甲', book: '（漫畫版）30秒動力實驗', call: '177.2 4050' },
  { id: 'stu-b', name: '02 假資料乙', book: '電玩遊戲進化史（圖解漫畫版）', call: '947.41 6042' },
  { id: 'stu-c', name: '03 假資料丙', book: '圖解地表最可愛的錢錢教科書', call: '561 2434' },
  // 第四位的存在是為了讓 3 票的上限真的會被踩到
  { id: 'stu-d', name: '04 假資料丁', book: '火柴人圖解大全', call: '947.45 8420' },
]

const PEER_PITCH = [
  '整本都是圖，五分鐘翻完但我笑了三次',
  '看完我終於知道手遊為什麼讓人停不下來',
  '錢的事情第一次有人講得我聽得懂',
  '不會畫畫也能把事情講清楚，這招我學起來了',
]

const PEER_LETTER = [
  '習慣不是靠意志力撐出來的，是靠環境把你推過去的。',
  '遊戲設計師的工作，就是精準計算你什麼時候會想放棄。',
  '你以為你在選擇，其實選項是別人擺好的。',
  '畫得像不像不重要，對方看懂了才重要。',
]

const PEER_WHY = [
  '因為我每次都撐不過三天',
  '因為我昨天又熬夜打到兩點',
  '因為我每次逛超商都會多買東西',
  '因為我上台報告永遠講不清楚',
]

function buildSession(activityType: ActivityType): Session {
  const isOwnBook = activityType !== 'classic'
  return {
    id: SESSION_ID,
    classId: 'dev-class',
    title: `預覽：${activityType}`,
    mode: 'single',
    activityType,
    isPaperMode: true,
    enabledSteps: isOwnBook ? ['I-share'] : ['I-share', 'A1', 'A1-share'],
    attribution: isOwnBook
      ? { 'I-share': 'anon' }
      : { 'I-share': 'real', 'A1-share': 'anon' },
    reactionQuota: activityType === 'pitch' ? 3 : undefined,
    texts: [
      {
        id: 'text-1',
        title: isOwnBook ? '各自帶來的書' : '論幸福',
        author: isOwnBook ? '—' : '赫爾曼・赫塞',
        source: isOwnBook ? '—' : '《乞食行者》節選',
        content: isOwnBook
          ? '（紙本閱讀）'
          : '幸福的本質，就在於你願意並且能夠做你自己。一個人若總是想做別人，模仿別人的生活，不管他獲得了多大的成功，他依舊不會幸福。',
      },
    ],
    joinCode: '000000',
    grouping: 'none',
    flowControl: 'free',
    currentStep: 'waiting',
    createdAt: new Date().toISOString(),
  }
}

/** 把整個 store 換成純記憶體版本 */
function seed(activityType: ActivityType, step: Step) {
  const isOwnBook = activityType !== 'classic'

  const me: Student = {
    id: ME,
    sessionId: SESSION_ID,
    name: '99 我自己',
    currentStep: step,
    joinedAt: new Date().toISOString(),
    ...(isOwnBook
      ? { myBook: { title: '原子習慣 WORKBOOK', callNumber: '176.74 4021', page: '23' } }
      : {}),
  }

  const peers: Student[] = PEERS.map((p, i) => ({
    id: p.id,
    sessionId: SESSION_ID,
    name: p.name,
    currentStep: 'I-share' as Step,
    joinedAt: new Date().toISOString(),
    ...(isOwnBook ? { myBook: { title: p.book, callNumber: p.call, page: `${10 + i * 7}` } } : {}),
  }))

  const peerResponses: Response[] = PEERS.map((p, i) => ({
    id: `res-${p.id}`,
    studentId: p.id,
    sessionId: SESSION_ID,
    textId: 'text-1',
    step: 'I' as const,
    content:
      activityType === 'pitch'
        ? PEER_PITCH[i]!
        : activityType === 'bottle'
          ? PEER_LETTER[i]!
          : '作者想說的是，幸福不是達成什麼目標，而是你有沒有在過自己的人生。',
    submittedAt: new Date().toISOString(),
    ...(activityType === 'bottle' ? { page: `${10 + i * 7}`, why: PEER_WHY[i]! } : {}),
  }))

  // 走到互看之後的步驟時，我自己那則也要存在
  const myResponse: Response[] =
    step === 'R' || step === 'I'
      ? []
      : [
          {
            id: 'res-me',
            studentId: ME,
            sessionId: SESSION_ID,
            textId: 'text-1',
            step: 'I',
            content:
              activityType === 'pitch'
                ? '本來以為是雞湯，結果整本都是空格要你自己填'
                : activityType === 'bottle'
                  ? '你不需要更多動力，你需要更少的阻力。'
                  : '這段在說，模仿別人活得再成功也不是自己的人生。',
            submittedAt: new Date().toISOString(),
            ...(activityType === 'bottle' ? { page: '23', why: '因為我一直以為是我不夠努力' } : {}),
          },
        ]

  // 假票數：讓前三名與「0 票不顯示數字」兩種狀況都看得到
  const reactions: Reaction[] =
    activityType === 'pitch'
      ? [
          ...Array.from({ length: 4 }, (_, i) => ({
            id: `rx-a-${i}`,
            sessionId: SESSION_ID,
            responseId: 'res-stu-a',
            fromStudentId: `ghost-${i}`,
            createdAt: new Date().toISOString(),
          })),
          ...Array.from({ length: 2 }, (_, i) => ({
            id: `rx-b-${i}`,
            sessionId: SESSION_ID,
            responseId: 'res-stu-b',
            fromStudentId: `ghost-b-${i}`,
            createdAt: new Date().toISOString(),
          })),
          // res-stu-c 刻意 0 票，用來檢查不會顯示「0」
        ]
      : []

  // 瓶中信：走到「回信」時已經投遞，走到「看回音」時已經有人回我
  const assigned = activityType === 'bottle' && step !== 'R' && step !== 'I'
  const replies: Reply[] =
    activityType === 'bottle' && step === 'A2'
      ? [
          {
            id: 'rep-1',
            sessionId: SESSION_ID,
            toResponseId: 'res-me',
            toStudentId: ME,
            fromStudentId: 'stu-c',
            prompt: '這段讓我想到⋯⋯',
            content: '這段讓我想到我房間的吉他，放在櫃子裡三年，搬出來之後我就每天彈了。',
            createdAt: new Date().toISOString(),
          },
        ]
      : []

  const noop = async () => {}

  useStore.setState({
    loading: false,
    classes: [{ id: 'dev-class', name: '預覽班級', createdAt: new Date().toISOString() }],
    sessions: [buildSession(activityType)],
    students: [{ ...me, ...(assigned ? { assignedResponseId: 'res-stu-a' } : {}) }, ...peers],
    currentStudent: { ...me, ...(assigned ? { assignedResponseId: 'res-stu-a' } : {}) },
    responses: [...peerResponses, ...myResponse],
    reactions,
    replies,

    // 以下把所有會寫 Firestore 的動作換成純記憶體版本
    subscribeToSession: () => () => {},
    // 這兩支一定要同時更新 students 陣列與 currentStudent。
    // 正式站寫進 Firestore 後快照會把兩邊一起刷新；這裡只改 currentStudent 的話，
    // 之後任何「從 students 重新取出自己」的動作（例如投遞）都會把步驟倒回 R。
    updateStudentStep: async (s: Step) => {
      useStore.setState((st) => ({
        currentStudent: st.currentStudent ? { ...st.currentStudent, currentStep: s } : null,
        students: st.students.map((x) => (x.id === ME ? { ...x, currentStep: s } : x)),
      }))
    },
    updateMyBook: async (book) => {
      useStore.setState((st) => ({
        currentStudent: st.currentStudent ? { ...st.currentStudent, myBook: book } : null,
        students: st.students.map((x) => (x.id === ME ? { ...x, myBook: book } : x)),
      }))
    },
    submitResponse: async (st, content, extra) => {
      useStore.setState((s) => ({
        responses: [
          ...s.responses.filter((r) => !(r.studentId === ME && r.step === st)),
          {
            id: 'res-me',
            studentId: ME,
            sessionId: SESSION_ID,
            textId: 'text-1',
            step: st,
            content,
            submittedAt: new Date().toISOString(),
            ...extra,
          } as Response,
        ],
      }))
    },
    toggleReaction: async (responseId: string) => {
      const s = useStore.getState()
      const existing = s.reactions.find(
        (r) => r.responseId === responseId && r.fromStudentId === ME
      )
      if (existing) {
        useStore.setState({ reactions: s.reactions.filter((r) => r.id !== existing.id) })
        return true
      }
      const quota = s.sessions[0]?.reactionQuota
      if (quota !== undefined && s.reactions.filter((r) => r.fromStudentId === ME).length >= quota) {
        return false
      }
      useStore.setState({
        reactions: [
          ...s.reactions,
          {
            id: `rx-me-${responseId}`,
            sessionId: SESSION_ID,
            responseId,
            fromStudentId: ME,
            createdAt: new Date().toISOString(),
          },
        ],
      })
      return true
    },
    submitReply: async (toResponseId, toStudentId, prompt, content) => {
      useStore.setState((s) => ({
        replies: [
          ...s.replies,
          {
            id: 'rep-me',
            sessionId: SESSION_ID,
            toResponseId,
            toStudentId,
            fromStudentId: ME,
            prompt,
            content,
            createdAt: new Date().toISOString(),
          },
        ],
      }))
    },
    clearCurrentStudent: noop as never,

    // 老師端：不要真的寫進 Firestore
    createSession: async (data) => {
      const fake = { ...buildSession(data.activityType ?? 'classic'), joinCode: '123456' }
      useStore.setState({ sessions: [fake] })
      return fake
    },
    deleteSession: noop as never,
    deliverLetters: async () => {
      const s = useStore.getState()
      const letters = s.responses.filter((r) => r.step === 'I')
      const pendingIds = s.students
        .filter((st) => letters.some((l) => l.studentId === st.id) && !st.assignedResponseId)
        .map((st) => st.id)
        .sort()
      const plan = buildDeliveryPlan(
        pendingIds,
        new Map(letters.map((l) => [l.studentId, l.id])),
        letters.map((l) => ({ id: l.id, studentId: l.studentId }))
      )
      const byId = new Map(plan.map((p) => [p.studentId, p.responseId]))
      const nextStudents = s.students.map((st) =>
        byId.has(st.id) ? { ...st, assignedResponseId: byId.get(st.id) } : st
      )
      useStore.setState({
        students: nextStudents,
        // currentStudent 也要一起更新。正式站是 Firestore 快照同時更新這兩個，
        // 這裡只改 students 的話 getAssignedLetter() 讀不到，學生會卡在等待畫面。
        currentStudent: nextStudents.find((st) => st.id === ME) ?? s.currentStudent,
      })
      return {
        assigned: plan.length,
        waiting: s.students.filter((st) => !letters.some((l) => l.studentId === st.id)).length,
      }
    },
  })
}

const STEPS: Step[] = ['R', 'I', 'I-share', 'A2']

/** 要預覽哪一端的畫面 */
type View = 'student' | 'create' | 'dashboard' | 'print'

export function DevPreview() {
  // 參數在 hash 裡（#/dev?mode=pitch），不是在 location.search
  const [activityType, setActivityType] = useState<ActivityType>(
    (new URLSearchParams(location.hash.split('?')[1] ?? '').get('mode') as ActivityType) || 'pitch'
  )
  const [step, setStep] = useState<Step>('R')
  const [view, setView] = useState<View>('student')
  const [ready, setReady] = useState(false)
  const [deliverMsg, setDeliverMsg] = useState<string | null>(null)

  // 切換老師端／學生端時「不可以」重新 seed，否則剛剛送出的信與投遞結果會被洗掉，
  // 跨角色的流程（學生送出 → 老師投遞 → 學生收信）就永遠測不起來。
  useEffect(() => {
    seed(activityType, step)
    setReady(true)
  }, [activityType, step])

  // 在已開著的分頁直接改網址的 ?mode=，也要跟著切換
  useEffect(() => {
    const onHashChange = () => {
      const m = new URLSearchParams(location.hash.split('?')[1] ?? '').get('mode')
      if (m === 'classic' || m === 'pitch' || m === 'bottle') setActivityType(m)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const current = useStore((s) => s.currentStudent?.currentStep)

  /** 老師端兩頁各自需要的路由參數 */
  const teacherRoute =
    view === 'create'
      ? {
          entry: '/teacher/create?classId=dev-class',
          path: '/teacher/create',
          el: <CreateSession />,
        }
      : view === 'print'
        ? {
            entry: `/teacher/print/${SESSION_ID}`,
            path: '/teacher/print/:id',
            el: <PrintView />,
          }
        : {
            entry: `/teacher/dashboard/${SESSION_ID}`,
            path: '/teacher/dashboard/:id',
            el: <Dashboard />,
          }

  return (
    <div>
      {/* 匯出頁自己有一條 sticky 工具列，這裡再 sticky 兩條會疊在一起，
          所以只有在其他檢視才固定 */}
      <div
        className={`bg-gray-900 text-white px-4 py-2 text-sm flex flex-wrap items-center gap-3 z-50 ${
          view === 'print' ? 'relative' : 'sticky top-0'
        }`}
      >
        <span className="font-bold text-amber-400">預覽模式．全部是假資料</span>
        <span className="text-gray-400">|</span>
        {(['classic', 'pitch', 'bottle'] as ActivityType[]).map((m) => (
          <button
            key={m}
            onClick={() => setActivityType(m)}
            className={`px-2 py-0.5 rounded ${
              activityType === m ? 'bg-amber-400 text-gray-900 font-medium' : 'bg-gray-700'
            }`}
          >
            {m}
          </button>
        ))}
        <span className="text-gray-400">|</span>
        {([
          ['student', '學生端'],
          ['create', '老師：建立'],
          ['dashboard', '老師：儀表板'],
          ['print', '老師：匯出'],
        ] as [View, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-2 py-0.5 rounded ${
              view === v ? 'bg-emerald-400 text-gray-900 font-medium' : 'bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
        {view === 'student' && (
          <>
            <span className="text-gray-400">|</span>
            {STEPS.map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`px-2 py-0.5 rounded ${
                  current === s ? 'bg-amber-400 text-gray-900 font-medium' : 'bg-gray-700'
                }`}
              >
                {s}
              </button>
            ))}
            {/* 瓶中信要有人按投遞瓶子才會漂過來，放在這裡才不用切到老師端 */}
            {activityType === 'bottle' && (
              <button
                onClick={async () => {
                  const r = await useStore.getState().deliverLetters(SESSION_ID)
                  setDeliverMsg(`投遞 ${r.assigned} 封，${r.waiting} 人還沒送出`)
                  setTimeout(() => setDeliverMsg(null), 4000)
                }}
                className="px-2 py-0.5 rounded bg-sky-500 text-white font-medium"
              >
                🌊 模擬老師投遞
              </button>
            )}
            <span className="text-gray-500 ml-auto">
              {deliverMsg ?? `目前：${current}`}
            </span>
          </>
        )}
      </div>
      {/* 這些頁面都會用 useParams／useNavigate，所以要有 Router 包著。
          用 MemoryRouter 才不會去動真正的網址列 */}
      {ready &&
        (view === 'student' ? (
          <MemoryRouter initialEntries={[`/session/${SESSION_ID}`]}>
            <Routes>
              <Route path="/session/:id" element={<SessionPage />} />
              <Route path="*" element={<div className="p-8 text-center text-gray-500">已離開任務</div>} />
            </Routes>
          </MemoryRouter>
        ) : (
          // key 是必要的：MemoryRouter 只在掛載時讀 initialEntries，
          // 不換 key 的話切換老師端兩頁時會沿用前一頁的網址而對不到路由
          <MemoryRouter key={view} initialEntries={[teacherRoute.entry]}>
            <Routes>
              <Route path={teacherRoute.path} element={teacherRoute.el} />
              <Route path="*" element={<div className="p-8 text-center text-gray-500">已離開</div>} />
            </Routes>
          </MemoryRouter>
        ))}
    </div>
  )
}
