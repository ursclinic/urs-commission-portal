# 悅姿醫美｜業績獎金試算入口

奶茶金版入口，員工版及規則文件直接開啟，主管入口使用 Google 登入與 Firestore 名單驗證。

## 上傳 GitHub
1. 建立公開儲存庫 `urs-commission-portal`。
2. 將 `index.html`、`portal.js`、`README.md` 上傳儲存庫最外層。
3. Settings → Pages → Deploy from a branch → main → / (root) → Save。
4. 網址：https://ursclinic.github.io/urs-commission-portal/

## Firebase 設定
專案：urs-commission-portal。Google 登入已啟用，已授權網域需含 ursclinic.github.io。
Firestore 的 admins 集合，以完整 Google 電子郵件作為文件 ID，enabled 為布林值 true。
管理者可以在 Firebase 控制台新增文件、改為 false 或刪除來取消入口資格。網頁不提供修改名單功能。

## 使用與驗證
主管每次點選入口時選擇 Google 帳號，網站向伺服器確認自身文件，成功才提供對應主管版按鈕。驗證後登出，不保留登入狀態。Firebase SDK 載入失敗不影響一般連結。
上線後請測試：名單內帳號通過、名單外帳號拒絕、enabled=false 拒絕、取消登入可重試，以及兩個主管版的連結正確。
實際 Google 登入必須在已授權的網站網域驗證，本機檔案預覽不能代表登入驗證成功。

## 範圍
依本專案需求，僅管制入口；既有主管計算機仍是公開 GitHub Pages 網站，知道直接網址仍可開啟。名單不寫入前端程式。Firebase 網頁設定不是伺服器密鑰，名單權限由已發布的 Firestore 規則控制。

官方說明：https://firebase.google.com/docs/auth/web/google-signin
