/**
 * Firebase 設定與初始化
 */

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyARtu424A4t1QICRbE5bQ98FiHwTu-fD-s",
  authDomain: "reading-192b8.firebaseapp.com",
  projectId: "reading-192b8",
  storageBucket: "reading-192b8.firebasestorage.app",
  messagingSenderId: "389758368300",
  appId: "1:389758368300:web:67a130f94cf35568f1af89"
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)

// 初始化 Firestore
export const db = getFirestore(app)

// 初始化 Auth
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// 不在這裡限制網域，改為登入後驗證
// 這樣 @stu.hlbh.hlc.edu.tw 和 @hlbh.hlc.edu.tw 都能選擇帳號

/** 允許的 email 網域 */
export const ALLOWED_DOMAINS = ['hlbh.hlc.edu.tw', 'stu.hlbh.hlc.edu.tw']

/** 老師的 email */
export const TEACHER_EMAIL = 'walala@hlbh.hlc.edu.tw'

/** 檢查 email 是否允許 */
export function isAllowedEmail(email: string): boolean {
  return ALLOWED_DOMAINS.some(domain => email.endsWith('@' + domain))
}

/** 檢查是否為老師 */
export function isTeacher(email: string): boolean {
  return email === TEACHER_EMAIL
}

/** 檢查是否為學生（@stu.hlbh.hlc.edu.tw 或 @hlbh.hlc.edu.tw，但排除老師） */
export function isStudent(email: string): boolean {
  // 老師不是學生
  if (email === TEACHER_EMAIL) return false
  // 學生網域或教職員網域都可當學生登入
  return email.endsWith('@stu.hlbh.hlc.edu.tw') || email.endsWith('@hlbh.hlc.edu.tw')
}
