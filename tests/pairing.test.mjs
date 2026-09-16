/**
 * 瓶中信環狀配對的測試。
 *
 * 這段邏輯在課堂上出錯會很難看（有人收不到信、有人收到自己的信），
 * 而它又沒有畫面可以肉眼檢查，所以用測試守住。
 *
 * 直接匯入 src 的 TypeScript 正本（Node 會自動剝掉型別），
 * 不另外複製一份，避免兩邊邏輯日後走鐘。
 *
 * 執行：npm test
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDeliveryPlan,
  buildAnonMap,
  getAnonCode,
  stripUndefined,
} from '../src/utils/helpers.ts'

/** 產生 n 位學生與他們的信 */
function makeClass(n) {
  const ids = Array.from({ length: n }, (_, i) => `stu${String(i + 1).padStart(2, '0')}`)
  const letters = ids.map((id) => ({ id: `res-${id}`, studentId: id }))
  const letterIdOf = new Map(ids.map((id) => [id, `res-${id}`]))
  return { ids, letters, letterIdOf }
}

test('16 人：每人恰好收到一封，沒有人收到自己的信', () => {
  const { ids, letters, letterIdOf } = makeClass(16)
  const plan = buildDeliveryPlan(ids, letterIdOf, letters)

  assert.equal(plan.length, 16, '應該每個人都配到')

  // 每位學生只出現一次
  const receivers = plan.map((p) => p.studentId)
  assert.equal(new Set(receivers).size, 16, '有人被配到兩次')

  // 沒有人拿到自己的信
  for (const p of plan) {
    const writer = letters.find((l) => l.id === p.responseId).studentId
    assert.notEqual(writer, p.studentId, `${p.studentId} 拿到自己的信`)
  }

  // 每封信都恰好被一個人收到（16 人成環時不該有信重複或漏掉）
  const delivered = plan.map((p) => p.responseId)
  assert.equal(new Set(delivered).size, 16, '有信被重複投遞或漏掉')
})

test('2 人：互相交換', () => {
  const { ids, letters, letterIdOf } = makeClass(2)
  const plan = buildDeliveryPlan(ids, letterIdOf, letters)

  assert.equal(plan.length, 2)
  assert.equal(plan[0].responseId, 'res-stu02')
  assert.equal(plan[1].responseId, 'res-stu01')
})

test('1 人落單：從別人的信裡補一封，不會收到自己的', () => {
  const { letters } = makeClass(5)
  // 只有 stu03 在等，其他四人已經拿到信了
  const solo = ['stu03']
  const letterIdOf = new Map([['stu03', 'res-stu03']])

  // 注入固定的挑選方式，讓結果可預期
  const plan = buildDeliveryPlan(solo, letterIdOf, letters, () => 0)

  assert.equal(plan.length, 1, '落單的人也要收到信')
  assert.equal(plan[0].studentId, 'stu03')
  assert.notEqual(plan[0].responseId, 'res-stu03', '不可以拿到自己的信')

  // 隨機挑也絕不會挑到自己
  for (let i = 0; i < 50; i++) {
    const p = buildDeliveryPlan(solo, letterIdOf, letters)
    assert.notEqual(p[0].responseId, 'res-stu03')
  }
})

test('全班只有 1 個人送出：沒有人可以配，回傳空的', () => {
  const letters = [{ id: 'res-stu01', studentId: 'stu01' }]
  const plan = buildDeliveryPlan(['stu01'], new Map([['stu01', 'res-stu01']]), letters)
  assert.equal(plan.length, 0, '只有自己一封信時不該配對')
})

test('沒有人在等：回傳空的', () => {
  const { letters } = makeClass(5)
  assert.deepEqual(buildDeliveryPlan([], new Map(), letters), [])
})

test('奇數人數（15 人）一樣成環，沒有人落單', () => {
  const { ids, letters, letterIdOf } = makeClass(15)
  const plan = buildDeliveryPlan(ids, letterIdOf, letters)
  assert.equal(plan.length, 15)
  assert.equal(new Set(plan.map((p) => p.studentId)).size, 15)
  for (const p of plan) {
    const writer = letters.find((l) => l.id === p.responseId).studentId
    assert.notEqual(writer, p.studentId)
  }
})

test('匿名代號：依 id 排序固定配發，同一個人不會變動', () => {
  const ids = ['stuC', 'stuA', 'stuB']
  const map1 = buildAnonMap(ids)
  const map2 = buildAnonMap([...ids].reverse())

  // 傳入順序不同，但同一個人拿到同一個代號
  assert.equal(map1.get('stuA'), '同學A')
  assert.equal(map1.get('stuB'), '同學B')
  assert.equal(map1.get('stuC'), '同學C')
  assert.deepEqual([...map1.entries()].sort(), [...map2.entries()].sort())
})

test('匿名代號超過 26 人時接著往下編', () => {
  assert.equal(getAnonCode(0), '同學A')
  assert.equal(getAnonCode(15), '同學P') // 16 人班的最後一位
  assert.equal(getAnonCode(25), '同學Z')
  assert.equal(getAnonCode(26), '同學AA')

  // 不會有兩個人拿到同一個代號
  const codes = Array.from({ length: 60 }, (_, i) => getAnonCode(i))
  assert.equal(new Set(codes).size, 60)
})

test('stripUndefined 濾掉 undefined，保留空字串與 0', () => {
  assert.deepEqual(
    stripUndefined({ title: '書名', callNumber: undefined, page: '', n: 0 }),
    { title: '書名', page: '', n: 0 }
  )
})
