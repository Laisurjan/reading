/**
 * Firebase 設定與初始化
 */

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

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
