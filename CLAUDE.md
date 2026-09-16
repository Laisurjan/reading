# CLAUDE.md

> **版本：v1.3** ｜ 更新日期：2026-02-27

## Coding Style

請用 **Vibe Coding**，遵守 **KISS / DRY / YAGNI / SOLID**。

---

## 設計原則

### KISS（Keep It Simple & Stupid）

能簡單就不複雜，優先讓人看得懂、敢改。

### DRY（Don't Repeat Yourself）

相同邏輯不要重寫，集中管理，避免改一處壞多處。

### YAGNI（You Ain't Gonna Need It）

現在用不到就先不做，避免過早設計造成複雜。

### SOLID（好結構的五個方向）

| 原則 | 說明 |
|------|------|
| **SRP** — Single Responsibility | 一個模組只負責一件事 |
| **OCP** — Open/Closed | 用擴充新增功能，不亂改舊程式 |
| **LSP** — Liskov Substitution | 子類可替換父類，不破壞行為 |
| **ISP** — Interface Segregation | 不強迫實作用不到的介面 |
| **DIP** — Dependency Inversion | 依賴抽象，不綁死具體實作 |

---

## 命名與註解

- 變數與函式名稱使用**英文**，採 `snake_case`（Python）或 `camelCase`（JS/TS）。
- 所有註解使用**中文**，讓非工程背景的協作者也能理解。
- 函式開頭加上中文 docstring，簡述「做什麼」和「回傳什麼」。

```python
def calculate_score(raw_data: list) -> float:
    """計算學生原始成績的加權平均分數。回傳：float 加權平均值。"""
```

---

## 錯誤處理

- 錯誤訊息一律採用**中英雙語**格式，方便貼上搜尋也方便人員確認。
- 格式範本：`[English message] ｜ [中文說明]`

```python
try:
    result = process_data(file_path)
except FileNotFoundError:
    print("Error: File not found ｜ 錯誤：找不到指定檔案", file_path)
except ValueError as e:
    print(f"Error: Invalid value - {e} ｜ 錯誤：數值不合法 - {e}")
```

- 優先使用**提早 return** 減少巢狀，複雜流程再用 try-catch。

---

## 版本控制

- **每次改版 CLAUDE.md 或專案程式碼前，必須先 `git commit` 保存當前狀態。**
- commit 訊息格式：`v版號 異動摘要`，與下方版次紀錄對應。

```bash
# 範例流程
git add .
git commit -m "v1.2 新增：版本控制規範"

# 需要倒回前一版時
git log --oneline
git checkout <commit編號> -- CLAUDE.md
```

---

## 部署踩坑筆記

### GitHub Pages + React Router

| 問題 | 原因 | 解法 |
|------|------|------|
| 部署後空白頁面 | `BrowserRouter` 無法在靜態託管運作 | 改用 `HashRouter` |
| 路由 404 | GitHub Pages 找不到實際檔案 | URL 變成 `/#/path` 格式 |

```tsx
// ❌ 錯誤
import { BrowserRouter } from 'react-router-dom'

// ✅ 正確（GitHub Pages）
import { HashRouter } from 'react-router-dom'
```

### Vite + GitHub Pages

```ts
// vite.config.ts
export default defineConfig({
  base: '/repo-name/',  // 必須設定，否則資源路徑錯誤
})
```

### Firebase Authentication + GitHub Pages

| 問題 | 原因 | 解法 |
|------|------|------|
| 登入失敗 | GitHub Pages 網域未授權 | Firebase Console → Authentication → Settings → Authorized domains → 新增 `username.github.io` |

### Google OAuth 網域限制

| 問題 | 原因 | 解法 |
|------|------|------|
| 子網域帳號無法登入 | `hd` 參數限制太嚴格 | 移除 `hd` 參數，改為登入後驗證 email |

```ts
// ❌ 錯誤：@stu.hlbh.hlc.edu.tw 無法選擇帳號
googleProvider.setCustomParameters({
  hd: 'hlbh.hlc.edu.tw'
})

// ✅ 正確：登入後再驗證
const result = await signInWithPopup(auth, googleProvider)
if (!isAllowedEmail(result.user.email)) {
  await signOut(auth)
  setError('請使用學校帳號登入')
}
```

---

## 資料安全（2026-09-16 起）

**權限的唯一來源是 `firestore.rules`，不是前端。** `src/lib/firebase.ts` 的
`isAllowedEmail()`、`isTeacher()` 與 `App.tsx` 的 role 判斷都只是介面——
`firebaseConfig` 打包在網頁裡是公開的，任何人都能繞過畫面直接打 API。
新增任何集合或寫入路徑時，**先問「規則擋得住嗎」**，再寫前端。

```bash
firebase deploy --only firestore:rules      # 專案已寫在 .firebaserc
firebase deploy --only firestore:rules --dry-run   # 只檢查語法，不套用
```

規則改壞了可在 Console → Firestore → 規則 → 版本紀錄一鍵回滾。

### 身分是 uid，不是姓名

`Student.uid` 存 Google 帳號的 uid，是這筆紀錄的主人：規則靠它判斷「這筆能不能改」，
`joinSession()` 也靠它把人接回原本的紀錄。**不要再用姓名字串比對身分**——
座號填 `5` 和 `05` 會變成兩個人，經典模式的進度被拆散，老師儀表板上多一個
永遠停在閱讀的幽靈。`name` 只是顯示用，重新加入時會更新成最新寫法。

改版前建立的學生文件沒有 uid，規則會擋下它們的更新；那些人重新加入會建立新紀錄。
所以**規則與前端要在同一節課之間一起上**，不要在課中途部署。

### 匿名是「畫面上不顯示」，不是「查不到」

互看與投票要即時，學生端會訂閱整個任務的 `students`／`responses`／`replies`，
**姓名就在每個學生自己的瀏覽器裡**，開發者工具看得到。所以：

- 對學生只能說「畫面上不會出現名字，老師看得到」，**不要說「完全匿名」**
- 瓶中信要多講一句「寫你願意讓老師讀到的內容」
- 要做到真的查不到，得把姓名移出學生讀得到的集合（`responses` 只留 anonId，
  姓名收進只有老師與本人可讀的文件）——那是資料結構改動，還沒做

### Firebase Firestore 免費方案

- 儲存空間：1 GB
- 讀取：50,000 次/天
- 寫入：20,000 次/天
- 適合：80 人以下的班級教學使用綽綽有餘

---

## 版次紀錄

| 版本 | 日期 | 異動說明 |
|------|------|----------|
| v1.0 | 2026-02-26 | 初版：建立 KISS / DRY / YAGNI / SOLID 設計原則 |
| v1.1 | 2026-02-26 | 新增：命名與中文註解規範、中英雙語錯誤處理、版次紀錄 |
| v1.2 | 2026-02-26 | 新增：版本控制規範，每次改版前須先 git commit |
| v1.3 | 2026-02-27 | 新增：部署踩坑筆記（GitHub Pages、Firebase Auth、Google OAuth） |
| v1.4 | 2026-09-16 | 新增：資料安全章節（firestore.rules 為權限唯一來源、uid 身分、匿名的界線） |
