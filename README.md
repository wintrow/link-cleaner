# 連結淨化

去除網址追蹤碼，附上標題或貼文文字（合計 ≤ 350 字元）。

## 本機執行

```bash
node server.mjs
```

開啟 http://localhost:3456

## 手機使用（部署到 Vercel）

此工具需要後端 API 擷取網頁內容，**GitHub Pages 無法使用**（僅支援靜態檔案）。

建議用 [Vercel](https://vercel.com) 免費部署：

1. 將程式碼推送到 GitHub
2. 登入 Vercel → **Add New Project** → 選擇 `wintrow/link-cleaner`
3. 直接按 **Deploy**（無需額外設定）
4. 部署完成後會得到 `https://xxx.vercel.app`，用手機瀏覽器開啟即可

之後每次 push 到 `main` 分支，Vercel 會自動重新部署。
