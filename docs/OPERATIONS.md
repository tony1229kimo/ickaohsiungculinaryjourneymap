# IC 高雄 · 大富翁遊戲 — 全角色操作流程清單

> **版本:** 2026-05-15 (Phase 8.1 — 結帳 QR + 三重鎖 + 小白單 vision)
> **適用範圍:** 5 餐廳 — Zhan Lu 湛露 · Seeds 大地 · WA-RA 日式 · Hawker 南洋 · BLT33 大廳酒吧
> **線上 URL:** Game `https://ickhh-culinary-game-v2.zeabur.app` · API `https://ickhh-culinary-api-v2.zeabur.app`

---

## 🎮 角色 1:客人(Customer)

### A. 首次來店,完整流程
1. **入座** → 看到桌邊立牌 QR Code
2. **手機 LINE 相機掃 QR** → 自動加 LINE OA 好友(IC 高雄洲際酒店)
3. **LINE 跳出歡迎訊息** → 輸入 `table:ZL05`(或對應桌號)送出
4. **收到「綁定成功」訊息** → 點訊息裡的按鈕進入 LIFF 遊戲
5. **遊戲首頁** → 選角色(熊熊 / 兔兔 etc.)
6. **結帳後** → 主畫面有 3 個按鈕,擇一執行:
   - **📄 掃發票拿擲骰機會** — 掃電子發票證明聯左側 QR(2 字母 + 8 數字字軌)
   - **📸 我用載具(拍小白單)** — 用載具沒拿到發票,拍小白單
   - **📷 掃店家 QR Code** — 備援:服務人員開的結帳 QR
7. **獲得擲骰機會** → 主畫面顯示「🎲 您還有 N 次擲骰機會」→ 開始玩
8. **過 15 點抽到大獎** → 自動進入「下一季」(progress 歸零,獎品紀錄保留)

### B. 重複來店(同 LINE 帳號)
1. **入座** → **不用再掃桌邊 QR**(LINE 好友已加),直接打開 LIFF
2. **若桌綁失效** → LINE 對話框輸入 `table:XX` 重新綁桌
3. 之後同 A 的步驟 6 起

### C. 兩次掃描失敗 → escalation
1. 客人連續 2 次掃發票 / 拍小白單失敗 → LIFF 跳出黃色 banner「請洽現場服務人員」
2. **客人主動找服務人員** → 進入「角色 2-D 緊急備援」

---

## 🛎️ 角色 2:服務人員(Service Staff)

### A. 一般客人(會自己掃)
1. **結帳** → 開電子發票證明聯 / 給小白單(若客人用載具)
2. **告知客人** → 「您可以掃發票/小白單參加遊戲拿獎品,LINE 加我們好友後就能玩」
3. **完成,不需介入**

### B. 客人問「怎麼玩」
1. 帶客人到桌邊立牌前
2. 「您看這個 QR,先用 LINE 掃這個加我們好友,然後對話框打 `table:` 加桌號送出。我們系統會傳遊戲連結給您」

### C. 看到客人卡在 LIFF
1. 看客人手機螢幕的錯誤訊息
2. **常見錯誤對照:**
   | 客人螢幕訊息 | 原因 | 您怎麼做 |
   |--------------|------|---------|
   | 「請先掃描桌邊立牌 QR Code...」 | 還沒綁桌 | 帶他去掃桌邊立牌 + 輸入 `table:XX` |
   | 「這張發票不是 IC 高雄洲際開的」 | 客人掃錯 / 別家發票 | 確認手上發票是 IC 的 |
   | 「發票日期過期」 | 客人翻出舊發票(只能用今天/昨天) | 走 D 緊急備援 |
   | 「已被使用過」 | 已領過 | 走 D 緊急備援(若客人確實沒領過) |
   | 「您這一桌已經兌換過一張」 | 同桌已用一張 | 走 D 緊急備援 |
   | 黃色「請洽服務人員」banner | 連續 2 次失敗 | 走 D 緊急備援 |

### D. 緊急備援 — 結帳 QR(您主動補發)
1. **您的手機開** `https://ickhh-culinary-game-v2.zeabur.app/admin/checkout`
2. **第一次用要輸 PIN** `91097496`(餐飲部主管會告訴您;PIN 存在瀏覽器 session,瀏覽器關掉才會再問)
3. **輸入客人消費金額**(例:5000)→ 點「✓ 產生 QR Code」
4. **手機螢幕顯示 QR Code + 倒數 2 分鐘**
5. **客人用 LINE 相機掃這個 QR** → 客人 LIFF 直接拿擲骰機會
6. **下一桌** → 按「下一桌」清空繼續

**規則提醒:**
- 金額 < NT$2,000 不會給擲骰機會(系統會擋)
- 每 NT$2,000 = 1 次擲骰,上限 5 次
- QR 2 分鐘內客人沒掃就失效,要重產

---

## 👨‍💼 角色 3:管理員(IT / 行銷主管)

### A. 看客戶數據 / 行銷分析
1. **手機/電腦開** `https://ickhh-culinary-game-v2.zeabur.app/admin/customers`
2. **首次進** → LINE 登入(您的 LINE 帳號要先進 staff_whitelist,B 流程)
3. **看到** 客戶總數、餐廳熱度排行、客戶 timeline、CSV 下載

### B. 加 staff 白名單(讓某 LINE 帳號可進 /admin/customers)
1. 取得對方的 LINE userId(請對方加 IC LINE 好友 → 進 LIFF → 截 setting 頁面)
2. 用 ADMIN_TOKEN 呼叫:
   ```bash
   curl -X POST https://ickhh-culinary-api-v2.zeabur.app/api/admin/staff \
     -H "X-Admin-Token: <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "U1234...", "name": "Tony Chen", "role": "super_admin"}'
   ```
3. ADMIN_TOKEN 在 Zeabur backend 的環境變數裡

### C. 換 PIN(若懷疑外洩)
1. Zeabur 開 backend 服務 → 環境變數 → 編輯 `STAFF_NUMERIC_PASSWORD` → 改新值 → 儲存
2. 自動 redeploy(~30 秒)
3. 通知餐飲部主管新 PIN,主管口頭告知各餐廳服務人員

### D. 換 OpenAI vision 模型(若想升級)
1. Zeabur 開 backend → 環境變數 → 編輯 `OPENAI_VISION_MODEL`
2. 可選值:`gpt-4o`(目前)、`gpt-4o-mini`(便宜)、`gpt-5`/`gpt-5-mini`(若 API 支援)
3. 儲存自動 redeploy

### E. 監控異常 / debug
1. **Zeabur backend 服務 → 「日誌」分頁** 看 server log
2. 關鍵 log 字串:
   - `[invoice/redeem]` — 發票掃描嘗試
   - `[invoice/redeem-receipt]` — 小白單拍照嘗試
   - `[receiptVision]` — OpenAI vision API 呼叫
   - `[checkout-ticket/issue]` — 服務人員開 QR
3. 看 `result=` 後面的 JSON 找失敗原因

---

## 🛡️ 反作弊鎖一覽

所有兌換路徑都套用,**任何違反就拒絕**:

| 鎖 | 規則 | 適用路徑 |
|----|------|---------|
| 賣方統編 | 必須是 `91097496`(IC 高雄) | 電子發票 QR ✅ / 小白單 vision ✅(改用視覺辨識 IC 抬頭) |
| 日期窗 | invoice_date 必須是今天 / 昨天 | 兩條路徑都 ✅ |
| 一桌一張 | 同 user + 同 table_id 在 20 分鐘內只能用一次 | 兩條路徑共用 ✅ |
| 全域 dedup | invoice_no 是 PK,同一張全世界只能用一次 | 兩條路徑共用 ✅ |

---

## 📞 緊急聯絡

| 情況 | 找誰 |
|------|------|
| 客人多次卡關 / 體驗差 | 餐飲部主管 |
| Backend 整個掛掉(/api/health 不回 200) | IT 部門 + 看 Zeabur 服務狀態 |
| OpenAI 帳號超額 / vision OCR 全錯 | 行銷主管(換 API key 或關閉小白單路徑) |
| PIN 外洩 | IT 部門立即換 PIN |

---

## 🗂️ Routing 一覽

| URL | 誰用 | 認證 |
|------|------|------|
| `/` | 客人玩遊戲 | LINE LIFF |
| `/about` | 分享連結看到的人 | 無 |
| `/admin/checkout` | 服務人員開結帳 QR | 數字 PIN |
| `/admin/customers` | 行銷主管看數據 | LINE LIFF + staff_whitelist |
| `/admin/tables` | ⚠️ 已棄用,緊急備用 | LINE LIFF + staff_whitelist |
| `/qrcode` | 老 QR 顯示頁(備援) | 無 |
