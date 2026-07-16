# Tino 福岡三代同堂旅行 App

手機優先、可安裝、可離線查看文字行程的純前端 PWA。沒有帳號、資料庫或付費 API。

## 本機預覽

不能直接雙擊 `index.html` 測試 PWA，請在資料夾內啟動本機伺服器：

```bash
python3 -m http.server 8080
```

再開啟 `http://localhost:8080`。

## 更新行程

所有 Day 1–Day 7 行程都在 `data.js` 的 `window.ITINERARY`。修改站點名稱、時間、說明、座標後重新提交即可，不必改介面程式。

不要自行填入尚未確認的班次、表演時間、訂位結果或票券狀態。

## GitHub Pages 部署

1. 新增 GitHub repository，將本資料夾全部檔案放在 repository 根目錄。
2. Push 到 `main`。
3. Repository → Settings → Pages → Source 選擇 **GitHub Actions**。
4. workflow 完成後，Actions 頁面會顯示公開網址。

所有資源均採相對路徑，因此 repository 名稱不需寫死，也沒有重新整理路由問題。

## 離線與資料保存

- 首次連網開啟後，行程文字與介面會快取在裝置上。
- 地圖圖磚與 Google Maps 導航仍需要網路。
- 完成勾選存在該裝置的 `localStorage`；清除瀏覽器網站資料後會消失。
