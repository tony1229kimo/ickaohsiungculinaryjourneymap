# IC 高雄 · 大富翁遊戲 — 使用手冊

> **版本:** 2026-05-15 (Phase 8.2)
> **適用範圍:** 5 餐廳 — Zhan Lu 湛露 · Seeds 大地 · WA-RA 日式 · Hawker 南洋 · BLT33 大廳酒吧
> **線上 URL:**
> - 遊戲:`https://ickhh-culinary-game-v2.zeabur.app`
> - API:`https://ickhh-culinary-api-v2.zeabur.app`
> - 服務人員結帳 QR:`https://ickhh-culinary-game-v2.zeabur.app/admin/checkout`
> - 行銷後台:`https://ickhh-culinary-game-v2.zeabur.app/admin/customers`

---

## 📑 目錄

1. [系統概覽](#1-系統概覽)
2. [客人使用手冊](#2-客人使用手冊)
3. [服務人員使用手冊](#3-服務人員使用手冊)
4. [管理員使用手冊](#4-管理員使用手冊)
5. [應變措施 / Contingency Plan](#5-應變措施--contingency-plan)
6. [反作弊規則一覽](#6-反作弊規則一覽)
7. [常見問題 FAQ](#7-常見問題-faq)
8. [緊急聯絡](#8-緊急聯絡)
9. [附錄:URL / 環境變數 / Routing 一覽](#9-附錄)

---

## 1. 系統概覽

**這是什麼?**
IC 高雄洲際酒店 5 間餐廳的會員忠誠度遊戲。客人在餐廳消費後可拿擲骰機會、走大富翁地圖、抽獎或拿固定獎品(餐券、酒水折抵等)。

**設計原則:**
- 客人**全程自助**,服務人員介入越少越好
- 兌換規則:**每 NT$2,000 = 1 次擲骰**,單次上限 5 次
- 過 15 點抽到大獎 → **自動進入下一季**(progress 歸零、獎品紀錄保留)

**三種拿擲骰機會的方式:**

| 路徑 | 適用情境 | 客人動作 |
|------|---------|---------|
| 📄 掃發票 | 客人有電子發票證明聯紙本 | 自助掃發票左側 QR Code |
| 📸 拍小白單 | 客人用載具(沒拿到實體發票) | 自助拍小白單 → AI 辨識 |
| 📷 結帳 QR | 緊急備援 / 上述都失敗 | 服務人員開 QR → 客人掃 |

**反作弊鎖** 4 道,自動運作,服務人員不用管:
- 賣方統編必須 = `91097496`(IC 高雄)
- 發票/小白單日期必須是**今天或昨天**
- 同一桌同一次用餐限**一張**
- 同一張發票編號全世界只能用一次

---

## 2. 客人使用手冊

### A. 首次來店完整流程

**步驟 1:加 LINE 好友 + 綁桌**
1. 入座後,看到桌上立牌的 QR Code
2. **手機 LINE → 掃描 → 加好友**(IC 高雄洲際酒店 LINE 官方帳號)
3. 收到歡迎訊息

**步驟 2:綁定桌號**
1. LINE 對話框輸入桌號,格式:`table:ZL05`(您的桌號代碼,例如:湛露 = ZL01~ZL30、Seeds = SD01~SD40)
2. 收到「綁定成功」訊息,點訊息裡的按鈕進遊戲

**步驟 3:選角色**
- 從熊熊、兔兔等卡通角色中選一個

**步驟 4:結帳後拿擲骰機會** — 3 選 1:

#### 📄 路徑 A:掃發票(有電子發票證明聯)
1. 主畫面點「📄 掃發票拿擲骰機會」
2. 對著發票**左側 QR Code** 掃(不是右側)
3. 系統秒內驗證 → 顯示「✅ 兌換成功! 消費 NT$X → N 次擲骰機會」

#### 📸 路徑 B:拍小白單(用載具的客人)
1. 主畫面點「📸 我用載具(拍小白單)」
2. 開相機,把整張小白單拍清楚
   - 光線充足
   - 不要遮住 IC 抬頭
   - 總計欄位要看得清
3. 確認預覽 → 按「✓ 確認送出」
4. AI 辨識 ~3 秒 → 兌換成功

#### 📷 路徑 C:結帳 QR(服務人員主動發的)
1. 服務人員手機螢幕出現 QR Code
2. 客人用 LINE 內建相機掃這個 QR
3. 自動進 LIFF 兌換成功

**步驟 5:開始玩**
- 主畫面顯示「🎲 您還有 N 次擲骰機會」
- 點擲骰 → 走格子 → 抽獎或拿固定獎品
- 過 15 點抽到大獎 → 自動下一季

### B. 重複來店

1. **不用重新加 LINE 好友**(已加過了)
2. 同桌位重新打 `table:XX` 綁桌(綁定 20 分鐘內有效)
3. 之後步驟同 A 的步驟 4 起

### C. 出問題了怎麼辦?

- 看到「請洽現場服務人員」黃色 banner → **直接找穿制服的服務人員**
- 服務人員會用「結帳 QR」幫您補發,30 秒搞定

---

## 3. 服務人員使用手冊

### A. 90% 時間 — 您什麼都不用做
- 客人自己會掃 QR 加好友
- 客人自己會掃發票 / 拍小白單
- 系統會自動發擲骰機會給客人

### B. 客人問「這遊戲怎麼玩?」
1. 帶客人到桌邊立牌前
2. 講:「您看這個 QR,先用 LINE 掃,加我們好友;然後在對話框打 `table:` 加桌號送出。系統會傳遊戲連結給您。消費滿 NT$2,000 結帳後就能玩。」

### C. 客人卡關 — 看手機螢幕對照處理

#### 客人 LIFF 紅色錯誤訊息對照表

| 客人螢幕看到的訊息 | 真實原因 | 您的處理 |
|-------------------|---------|---------|
| 「請先掃描桌邊立牌 QR Code 加入 LINE 並綁定桌號」 | 還沒綁桌 | 帶他重新掃桌邊立牌 + 對話框打 `table:XX` |
| 「這 QR 不是電子發票格式」 | 客人掃錯了(掃成菜單 QR 或別的) | 引導對準發票**左側** QR Code |
| 「這張發票不是 IC 高雄洲際開的」 | 客人手上發票是別家的 | 確認手上是 IC 的發票,若客人堅持是 IC 的 → 走 **D 緊急備援** |
| 「發票日期過期,只能使用今天/昨天開立的發票」 | 客人翻出舊發票 | 走 **D 緊急備援**(您手動補發) |
| 「此發票已被使用過」 | 真的已領過,或同一張掃兩次 | 確認客人沒重複領 — 若客人說沒領過 → 走 **D 緊急備援** |
| 「您這一桌已經兌換過一張發票了」 | 同一桌已掃過(可能同行人已領) | 確認後告訴客人「您同行已領」;若真的沒領 → 走 **D 緊急備援** |
| 「金額需滿 NT$2,000 才能換擲骰機會」 | 消費未達門檻 | 解釋規則,沒辦法補發 |
| 「圖片不夠清楚,請在光線充足處重拍」(拍小白單時) | OCR 信心度低 | 引導去光線好的位置重拍,或走 **D 緊急備援** |
| 「這張不像是 IC 高雄洲際的單據」(拍小白單時) | AI 看不出 IC 抬頭 | 確認單據完整有抬頭,或走 **D 緊急備援** |

#### 黃色 banner「🛎️ 已嘗試 2 次仍無法兌換」
- 不管原因,**直接走 D 緊急備援**
- 客人按「關閉,我去找服務人員」會回到主畫面

### D. 緊急備援:結帳 QR(您主動補發)

**這是您要練熟的 5 個動作:**

1. **您手機開** `https://ickhh-culinary-game-v2.zeabur.app/admin/checkout`
   - 建議存桌面或 LINE Keep,以後一鍵開啟

2. **第一次用要輸 PIN** `91097496`
   - PIN 由餐飲部主管告知
   - 輸完瀏覽器會記住,瀏覽器關掉(或登出)才會再問

3. **輸入消費金額**(例:5000)→ 點「✓ 產生 QR Code」
   - 系統會自動算擲骰機會數:**NT$2,000 = 1 次**,上限 5 次
   - 金額 < 2,000 系統會擋下

4. **手機螢幕顯示 QR Code + 倒數 2 分鐘**
   - 給客人看

5. **客人用 LINE 相機掃這個 QR**
   - 客人 LIFF 直接收到擲骰機會

6. **下一桌** → 按「下一桌」按鈕清空繼續

**注意事項:**
- QR 2 分鐘內客人沒掃就失效,要重新產生
- 同一個 QR 第一個掃的人就拿到,不要傳給多人
- PIN 不要寫在紙上貼牆上 — 口頭傳達就好

---

## 4. 管理員使用手冊

### A. 看客戶數據 / 行銷分析

1. 開 `https://ickhh-culinary-game-v2.zeabur.app/admin/customers`
2. 第一次進需要 LINE 登入,而且您的 LINE 帳號要在 staff_whitelist 裡(見 B)
3. 看到的內容:
   - 客戶總數、本月新增
   - 5 餐廳熱度排行
   - 個別客戶 timeline(綁桌 → 兌換 → 擲骰 → 抽獎 全紀錄)
   - CSV 匯出(行銷分析用)

### B. 加 staff 白名單

1. 取得對方的 LINE userId(請對方加 IC LINE 好友,然後您查 backend 的 customer_profiles 找他)
2. 用 ADMIN_TOKEN 呼叫 API:
   ```bash
   curl -X POST https://ickhh-culinary-api-v2.zeabur.app/api/admin/staff \
     -H "X-Admin-Token: <YOUR_ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "U1234abcd...", "name": "張三", "role": "super_admin"}'
   ```
3. ADMIN_TOKEN 存在 Zeabur backend 環境變數,只有 IT 知道

### C. 換 PIN(懷疑外洩或週期性輪替)

1. 開 Zeabur dashboard → culinary-journey-map → backend 服務 → 環境變數
2. 找到 `STAFF_NUMERIC_PASSWORD` → 點編輯 → 改新值 → 儲存
3. Zeabur 自動 redeploy(~30 秒)
4. 通知餐飲部主管新 PIN,主管口頭告知各餐廳服務人員

### D. 換 OpenAI vision 模型(如果想升級)

1. 同 C 但改 `OPENAI_VISION_MODEL`
2. 可選值:
   - `gpt-4o`(目前預設,中文 OCR 準確)
   - `gpt-4o-mini`(便宜 10 倍,中文小字偶爾出錯)
   - `gpt-5` / `gpt-5-mini`(如果 OpenAI API 已支援)
3. 儲存自動 redeploy

### E. 監控異常 / debug

1. **Zeabur backend 服務 → 「日誌」分頁**
2. 關鍵字串:
   - `[invoice/redeem]` — 客人掃發票嘗試
   - `[invoice/redeem-receipt]` — 客人拍小白單嘗試
   - `[receiptVision]` — OpenAI vision API 呼叫
   - `[checkout-ticket/issue]` — 服務人員開結帳 QR
   - `[invoice/redeem] result=` — 後面 JSON 是兌換結果
3. 看失敗模式,如 `reason: "stale_invoice"` 多 → 可能客人理解錯,訓練服務人員提醒

---

## 5. 應變措施 / Contingency Plan

### 異常 1:Backend 整個掛掉(全部客人都掃不過)

**症狀:**
- 客人 LIFF 點任何按鈕都失敗
- `https://ickhh-culinary-api-v2.zeabur.app/api/health` 不回 200

**現場處理:**
- 服務人員告知客人:「系統維護中,請稍後再試」
- 餐廳保留客人發票/小白單,記下姓名 + LINE ID
- 主動聯絡 IT

**IT 處理:**
1. Zeabur dashboard 看 backend 服務狀態
2. 若 service down → 按「重啟目前版本」
3. 若 service up 但 API 錯 → 看日誌找 stack trace
4. 若 5 分鐘內修不好 → 通知餐飲部進入「全人工模式」(見異常 8)

### 異常 2:Frontend 掛掉(網頁打不開)

**症狀:**
- 客人點 LINE 連結後白屏或 404

**處理:**
1. 確認是不是 Zeabur frontend 服務問題
2. 若是 DNS 或 SSL 問題 → 用 `-v2` 備用 URL `ickhh-culinary-game-v2.zeabur.app`
3. 若是 frontend code 錯誤 → 看最近一次 deploy,rollback 到前一版本

### 異常 3:OpenAI API 掛掉(小白單拍照全失敗)

**症狀:**
- 客人拍小白單,server 回 `vision_unavailable` 或 `vision_error`

**現場處理:**
- 客人會看到「拍照辨識暫時無法使用,請洽詢服務人員」
- 服務人員走「結帳 QR」緊急備援補發

**IT 處理:**
1. 檢查 OpenAI 帳號餘額 / API key 有效性
2. 短期:在 Zeabur env 設 `OPENAI_API_KEY=disabled` 讓客人路徑直接導到結帳 QR
3. 長期:換 API key 或 升 quota

### 異常 4:資料庫 (Postgres) 掛掉

**症狀:**
- backend 啟動失敗,健康檢查 fail
- 日誌看到 `[db] Postgres smoke failed`

**IT 處理:**
1. Zeabur dashboard 看 postgresql 服務狀態
2. 若 service down → 重啟
3. 若 service up 但 connect 失敗 → 檢查 DATABASE_URL env var 是否正確
4. **千萬不要** drop 任何 table — 客戶 game_state、發票紀錄、customer_events 都在裡面

### 異常 5:PIN 外洩 / 被亂用

**症狀:**
- 行銷後台看到大量無消費的 dice_pool 紀錄
- 服務人員回報「我沒開 QR 但客人說已經有擲骰機會」

**緊急處理:**
1. IT 立刻在 Zeabur 改 `STAFF_NUMERIC_PASSWORD`(見 4-C)
2. 通知所有餐飲部主管新 PIN
3. 餐飲部主管口頭告知各餐廳服務人員
4. 行銷主管查 `[checkout-ticket/issue]` 日誌,統計異常 issue 數量,估算損失

### 異常 6:同行人領了我也想領

**症狀:**
- 客人 A 領完一張發票後,同行 B 也想領,但同一桌 → 系統擋

**現場處理:**
- 服務人員告知:「每桌每次用餐只能領一張發票拿擲骰,您可以下次自己一桌時再玩」
- 不該因「同行抱怨」就破壞規則 — 這是設計上的反作弊
- 若是「兩人不同桌但坐一起」(罕見場景)→ 服務人員可開兩張結帳 QR(輸入兩人各自消費金額),但前提是兩人**真的在系統綁不同桌**

### 異常 7:客人手機卡住、LINE 掃不到、LIFF 不開

**症狀:**
- 客人說「我手機掃不到 QR」、「LINE 連結點開白屏」

**現場處理:**
1. 確認手機相機沒髒
2. 確認 LINE 是最新版本(2018 之前的版本不支援掃 QR)
3. 確認手機網路通(讓客人連飯店 WiFi)
4. 若還是不行 → 走「結帳 QR」備援,反正客人有 LINE 帳號就好

### 異常 8:全人工模式(系統全掛 30 分鐘以上)

**情境:** backend 掛掉、IT 短期修不好、demo 中或重要客人在場

**現場處理:**
1. 服務人員給客人「紙本兌換券」(餐飲部準備 100 張備用)
2. 兌換券寫:「IC 高雄遊戲 — 系統維護備用券 — 持券下次來店免費換 X 」
3. 寫清楚:日期、桌號、消費金額、客人 LINE 暱稱
4. 客人下次來時憑紙券補發擲骰機會(IT 開 admin/checkout 補)

### 異常 9:Demo 當天有 VIP / 大量客人

**事前:**
- 5/30 提前一天測試所有路徑
- 5/31 demo 當天主管駐場
- IT 開 Zeabur 監控頁面盯緊

**現場備援:**
- 餐飲部多備 5 部「服務人員手機」,預先登入 `/admin/checkout` 並輸過 PIN
- 行銷主管手機也準備好,可同時操作
- 任何客人卡關不超過 1 分鐘就介入,不要讓 VIP 等

### 異常 10:服務人員不會操作

**事前訓練:**
1. 主管把 `/admin/checkout` 加進服務人員手機桌面
2. 跑一次「假裝結帳 → 開 QR → 自己掃」的演練
3. 印一張小卡片(在服務站抽屜):
   ```
   結帳 QR SOP:
   1. 開連結:.../admin/checkout
   2. PIN: 91097496
   3. 輸金額 → 出 QR → 客人掃
   ```

**現場救援:** 服務人員當場有問題 → 找主管或 LINE 群組問

### 異常 11:客人作弊 / 用假發票

**反作弊系統會擋:**
- 偽造 QR Code → 賣方統編 ≠ 91097496 → 擋
- 舊發票截圖 → 日期 ≠ 今天/昨天 → 擋
- 同張發票多次掃 → invoice_no PK dedup → 擋
- 用 Photoshop 改小白單金額 → 客人在發票上動手腳,法律已歸 IC 一邊

**真的有重大作弊事件:**
1. 行銷主管在 `/admin/customers` 找該客人的事件 timeline
2. 截圖存證
3. 若涉刑(偽造文書),走法務流程

---

## 6. 反作弊規則一覽

| 鎖 | 規則 | 失敗訊息 | HTTP code |
|----|------|---------|-----------|
| 賣方 | sellerVat 必須 = `91097496` | 「這張發票不是 IC 高雄洲際開的」 | 403 |
| 日期 | invoice_date 必須是今天 / 昨天 | 「發票日期過期,只能使用今天/昨天開立的發票」 | 410 |
| 一桌一張 | 同 user + 同 table_id 在 20 分鐘內限一次 | 「您這一桌已經兌換過一張」 | 409 |
| 全域 dedup | invoice_no PK 唯一 | 「此發票已被使用過」 | 409 |
| 金額門檻 | total ≥ NT$2,000 | 「金額需滿 NT$2,000」 | 400 |
| 綁桌時效 | 必須 20 分鐘內綁過桌 | 「請先掃描桌邊立牌 QR Code」 | 412 |
| OCR 信心度 | gpt-4o vision confidence ≥ 0.85 | 「圖片不夠清楚,請重拍」 | 422 |
| Vision IC 確認 | AI 確認看到 IC Kaohsiung 抬頭 | 「這張不像是 IC 高雄洲際的單據」 | 403 |

---

## 7. 常見問題 FAQ

### Q1:消費 NT$3,500 應該幾次擲骰?
A:**1 次**。系統公式是 `floor(amount / 2000)`,3500/2000 = 1.75 → floor 是 1。

### Q2:消費 NT$15,000 是幾次?
A:**5 次**(系統上限,即使 15000/2000=7.5 也只給 5)。

### Q3:客人分兩次結帳,兩張發票可不可以分別掃?
A:**不行**。同一桌 20 分鐘內限一張。請客人合併結帳。

### Q4:同行兩人各自有 LINE,可不可以各拿一份?
A:**不行**,還是同桌限一張。若要兩人都玩,得分兩桌坐。

### Q5:客人加了 LINE 但沒玩,過幾天回來還算他嗎?
A:**算**。LINE 好友身份永久,只是 table_binding 失效(20 分鐘 TTL)。客人下次來重新打 `table:XX` 即可。

### Q6:大富翁過 15 點抽到大獎,progress 歸零後獎品紀錄會消失嗎?
A:**不會**。`earned_rewards` 永遠保留(這是設計的)。客人下一季從 0 點開始走,但獎品歷史隨身。

### Q7:結帳 QR 失效後再產一張,前一張就完全沒用嗎?
A:**沒用**。每個 token 有獨立 expires_at + used_at,過期或被掃過都不能再用。

### Q8:管理員可以「補發」擲骰給特定客人嗎?
A:**沒有直接 UI**,要走「結帳 QR」流程開 QR 給客人。或 IT 直接寫 SQL `INSERT INTO dice_pool ...`(技術手段,留紀錄)。

### Q9:服務人員看到結帳 QR 顯示「金額需滿 NT$2,000」怎辦?
A:客人消費沒到 2000,就告知:「您消費 NT$X 還沒到參加門檻 NT$2,000,下次再來玩」。

### Q10:同一張結帳 QR 兩個客人同時掃?
A:**第一個掃的人拿到**,第二個會看到「此 QR Code 已被使用過」。服務人員為第二人重產一張即可。

---

## 8. 緊急聯絡

| 狀況 | 找誰 | 預期回應時間 |
|------|------|--------------|
| 客人多次卡關、現場服務人員處理不來 | 餐飲部主管 | < 5 分鐘 |
| Backend 整個掛(`/api/health` 不通) | IT 部門 | < 15 分鐘 |
| OpenAI 帳號超額 / vision 全錯 | 行銷主管 → IT | < 30 分鐘 |
| PIN 外洩 | IT(立刻在 Zeabur 改) | < 10 分鐘 |
| Demo 5/31 當天系統異常 | 行銷主管(Tony) + IT 雙重 on-call | 立即 |
| 客人投訴 / 客訴 | 餐飲部主管 + 行銷主管 | < 1 小時 |

**主要負責人:**
- 行銷產品主導:Tony Chen — `tony.chen6@ihg.com`
- 餐飲部主管:[現場填]
- IT 部門:[現場填]

---

## 9. 附錄

### A. Routing 一覽

| URL | 誰用 | 認證 | 備註 |
|------|------|------|------|
| `/` | 客人玩遊戲 | LINE LIFF | 主遊戲頁 |
| `/about` | 分享連結看到的人 | 無 | 純資訊頁,不能玩 |
| `/admin/checkout` | 服務人員開結帳 QR | 數字 PIN | **主要服務人員工具** |
| `/admin/customers` | 行銷主管看數據 | LINE LIFF + staff_whitelist | 行銷後台 |
| `/admin/tables` | ⚠️ 已棄用,緊急備用 | LINE LIFF + staff_whitelist | 舊流程,不要主動用 |
| `/qrcode` | 老 QR 顯示頁 | 無 | 備援 |

### B. 環境變數一覽(Zeabur backend)

| 變數名 | 用途 | 例值 |
|--------|------|------|
| `DATABASE_URL` | Postgres 連線 | `postgresql://...` |
| `LINE_CHANNEL_ID` | LIFF id_token 驗證 | `1656533531` |
| `LINE_MESSAGING_ACCESS_TOKEN_KH` | LINE push 訊息 | (token) |
| `LINE_MESSAGING_CHANNEL_SECRET_KH` | LINE webhook 簽名驗證 | (secret) |
| `STAFF_NUMERIC_PASSWORD` | 結帳 QR PIN | `91097496` |
| `OPENAI_API_KEY` | 小白單 vision OCR | `sk-proj-...` |
| `OPENAI_VISION_MODEL` | OCR 模型 | `gpt-4o` |
| `ADMIN_TOKEN` | 後台管理 API | (token) |
| `QR_GENERATOR_URL` | 舊 ticket 驗證(已不用) | `https://qrcode-generator.zeabur.app` |
| `VERIFY_SECRET` | 同上 | (secret) |
| `NODE_ENV` | 環境 | `production` |

### C. 月成本估算

| 項目 | 估算 |
|------|------|
| Zeabur(backend + frontend + postgres) | ~NT$500 |
| OpenAI gpt-4o vision(載具客約佔 30%,200 客/天 × 5 餐廳 × 30 天) | ~NT$300 |
| LINE Messaging API(< 1000 訊息/月) | 免費 |
| **總計** | **~NT$800 / 月** |

### D. 季度檢查清單(每 3 個月跑一次)

- [ ] 換 PIN(`STAFF_NUMERIC_PASSWORD`)
- [ ] 檢查 OpenAI 帳號餘額
- [ ] 看 staff_whitelist 是否還有離職員工
- [ ] 看 dice_pool 異常數據,有無作弊或服務人員濫用
- [ ] 備份 Postgres(用 Zeabur backup 或手動 pg_dump)
- [ ] 看 ICKaohsiung LINE 好友數,評估遊戲帶動效益
- [ ] 月對帳:`SELECT date(redeemed_at), COUNT(*), SUM(amount_total) FROM invoices GROUP BY 1`

---

**手冊版本 2026-05-15**
有任何修正請直接 PR `docs/OPERATIONS.md`,或聯絡 Tony Chen。
