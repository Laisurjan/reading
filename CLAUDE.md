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
