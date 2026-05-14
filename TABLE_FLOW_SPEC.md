# 桌邊 LINE 加好友 + 結帳推送遊戲機會 · Spec

> 版本 v0.1 · 2026-05-14 · 草稿(等 Tony review)
> 目的:減少服務人員介入,客戶自助加 LINE → 結帳後一鍵推送遊戲機會。
> 跨飯店擴展設計:今天先做 IC 高雄,IC 台北日後加入只需 INSERT 一筆 hotel,不改 code。

---

## 1. 為何做這個

### 痛點(現狀)
- 客戶消費滿 NT$2,000 → **服務人員拿出 QR**(平板/印刷)→ 客戶掃 → 玩遊戲
- 每一桌都要做一次,規則要解釋,客戶有問題還要回答

### 目標
- 服務人員介入降到 **1 個按鈕**(結帳完點桌號 → 確認金額 → 完)
- 客戶體驗:從「被動接受 QR」變「主動加 LINE,結帳後自然收到通知」
- 副產物:LINE 官方帳號粉絲自然累積

---

## 2. 系統元件圖

```
┌─────────────────┐         ┌─────────────────┐
│  桌邊立牌       │  scan   │  LINE 官方帳號  │
│  (靜態壓克力 QR)│ ──────► │  (IC 高雄)      │
│  Add Friend URL │         │  Messaging API  │
│  + table:A05    │         └────────┬────────┘
└─────────────────┘                  │ webhook
                                     ▼
┌─────────────────┐         ┌─────────────────┐
│  服務人員 LIFF   │ ──API─► │  Game Backend   │
│  admin (餐廳/桌) │ ◄──────│  /api/tables/*  │
│  按啟用 + 金額   │         │  /api/webhook/  │
└─────────────────┘         │  /api/dice-pool │
                            └────────┬────────┘
                                     │ push
                                     ▼
┌─────────────────┐         ┌─────────────────┐
│  客戶 LINE       │ ──tap─► │  遊戲 LIFF       │
│  收到推送訊息    │         │  (棋盤 / 擲骰)  │
└─────────────────┘         └─────────────────┘
```

---

## 3. 完整流程

### 3.1 客戶端流程

```
[客戶坐下 A05 桌]
   │
   │ 掃桌邊 QR
   ▼
[加 IC 高雄 LINE 官方帳號 + deep link 帶 table:A05]
   │
   ▼
[LINE bot 收到首訊息 "table:A05"]
   │
   ▼
[後端 webhook handler:
   - 確認 table A05 存在
   - 寫入 table_bindings: (table_id=A05, user_id=Ux, bound_at=now)
   - 回 LINE 訊息:"您已綁定 A05 桌,結帳後即可開始遊戲 🎲"]
   │
   ▼
[客戶用餐...]
   │
   ▼
[服務人員啟用 A05 + 輸入金額 2400 (見 3.2)]
   │
   ▼
[後端 push LINE 訊息給 Ux:
   "🎉 您可開始遊戲! 共 1 次擲骰機會 → [立即遊玩]"]
   │
   ▼
[客戶點訊息按鈕]
   │
   ▼
[LIFF 開遊戲頁 → 自動帶 ticket → 進遊戲]
   │
   ▼
[擲骰 1 次,看點數]
   │
   ▼
[若還有 dice pool > 0:繼續擲;若 0:停在當前位置等下次推送]
```

### 3.2 服務人員流程

```
[結帳完成,看到 POS 顯示金額]
   │
   │ 開手機 / POS 旁平板的 admin LIFF
   ▼
[admin LIFF:選擇所在餐廳 → 看到桌號 grid]
   │
   │ 點 A05 (狀態顯示「客戶已綁定 12:48」)
   ▼
[彈出確認:
   - 顯示綁定的 LINE 客戶頭像 + 名字
   - 輸入消費金額: [ 2400 ]
   - 預計給予:1 次擲骰機會
   - [取消]  [✓ 啟用並推送]]
   │
   │ 點啟用
   ▼
[後端:
   - 計算 dice_rolls = floor(2400/2000) = 1
   - 寫入 dice_pool: (user_id=Ux, restaurant_id=A, dice_rolls_remaining=1)
   - call LINE Messaging API push 給 Ux
   - 標 A05 為「已啟用 → 等待客戶領取」
   - 設 cooldown 30 分鐘後自動回到 idle]
   │
   ▼
[admin 介面 A05 變灰色「已推送」]
```

---

## 4. 防作弊機制

### 4.1 拍照帶走 QR
| 攻擊嘗試 | 防範 |
|---|---|
| 拍 QR 帶走 → 加 LINE | 拍到的只是「加好友 QR」,加完只是 follower,沒任何特權 |
| 加好友後送 `table:A05` 給 bot | 後端記錄綁定,但「啟用」這事**只有服務人員手動觸發** |
| 沒在現場 → 沒人會幫他啟用 | 永遠拿不到 dice pool |
| 多人搶綁同桌(下節 4.2) | 用「先到先得」或「最後綁定者」策略 |

### 4.2 跨用戶搶綁
**問題:** A 在家 polling LINE,看 B 在 A05 用餐時 B 剛 send `table:A05` → A 隨後也 send,覆蓋了 B?

**防範:**
- `table_bindings` 表記錄**所有**綁定紀錄,不只 latest
- 啟用時 push **所有 30 分鐘內綁定過該桌的用戶**(option C「多人共享」)或**最後一個**(option A「最後綁定者」)
- 配合 cooldown:啟用後該桌 + 該批綁定者全部 expire
- 攻擊者 A 必須**剛好在現場有人結帳前**搶綁,但啟用瞬間之後再綁也無效 → 風險窗口極小

### 4.3 已啟用 → ticket / dice 重用
- 每次 push 訊息含一個 **dice_pool 而非單純 ticket**
- dice_pool 紀錄 `dice_rolls_remaining`,擲一次扣 1
- 客戶把 LINE 訊息 URL 截給朋友:朋友打開 → LIFF 認證後 sub != dice_pool.user_id → 401
- 即使同一個 LINE 帳號 → 還是會扣 pool,擲完就停

### 4.4 服務人員按錯桌
- admin UI 顯示「綁定客戶頭像 + 名字」,服務人員可以肉眼確認對不對
- 啟用後 30 分鐘內未被領取 → 自動取消(避免錯誤啟用 lock 該桌太久)
- 操作日誌 staff_actions:誰、何時、啟用哪桌、金額多少,可審計

---

## 5. Database Schema

> SQLite (in-memory file via sql.js) - 跟現有 `game_state` 同一個 DB,放 `server/db.ts` 一起 init

```sql
-- 5.1 hotels — 跨飯店擴展用
CREATE TABLE IF NOT EXISTS hotels (
  id          TEXT PRIMARY KEY,     -- 'KH' (高雄) / 'TPE' (台北)
  name_zh     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  line_channel_id TEXT,             -- 各飯店各自 LINE channel (NULL=共用)
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5.2 restaurants — 餐廳清單
CREATE TABLE IF NOT EXISTS restaurants (
  id          TEXT PRIMARY KEY,     -- 'A' / 'B' / ... (內部代碼)
  hotel_id    TEXT NOT NULL REFERENCES hotels(id),
  code        TEXT NOT NULL,        -- 顯示用短碼 e.g. 'MARCO'
  name_zh     TEXT NOT NULL,        -- '馬可波羅'
  name_en     TEXT NOT NULL,        -- 'Marco Polo'
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5.3 tables — 各餐廳的桌號(立牌對應)
CREATE TABLE IF NOT EXISTS tables (
  id              TEXT PRIMARY KEY, -- 'A05' = restaurant_id + 桌號
  restaurant_id   TEXT NOT NULL REFERENCES restaurants(id),
  display_label   TEXT NOT NULL,    -- '05' or '包廂 VIP-3' 等
  state           TEXT NOT NULL DEFAULT 'idle',
                                    -- idle | bound | activated | cooldown
  state_changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5.4 table_bindings — 哪個客戶綁哪桌(歷史紀錄,可審計)
CREATE TABLE IF NOT EXISTS table_bindings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id        TEXT NOT NULL REFERENCES tables(id),
  user_id         TEXT NOT NULL,
  bound_at        TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at      TEXT NOT NULL,    -- 預設 bound_at + 30 min
  consumed_at     TEXT,             -- 啟用推送時填入,代表這次綁定已 used
  CONSTRAINT bindings_unique_active UNIQUE (table_id, user_id, consumed_at)
);
CREATE INDEX IF NOT EXISTS idx_bindings_table_active
  ON table_bindings(table_id, consumed_at, expires_at);

-- 5.5 dice_pool — 每位 LINE 用戶累積的擲骰機會
CREATE TABLE IF NOT EXISTS dice_pool (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT NOT NULL,
  restaurant_id   TEXT NOT NULL REFERENCES restaurants(id),
  dice_remaining  INTEGER NOT NULL,
  amount_spent    INTEGER NOT NULL, -- 多少錢換的,審計用
  issued_at       TEXT NOT NULL DEFAULT (datetime('now')),
  issued_by_staff_id TEXT NOT NULL,  -- 哪個服務人員批的
  table_id        TEXT REFERENCES tables(id), -- 哪桌觸發的
  exhausted_at    TEXT              -- 全部擲完的時間
);
CREATE INDEX IF NOT EXISTS idx_dice_pool_user_active
  ON dice_pool(user_id, exhausted_at);

-- 5.6 staff_actions — admin 操作 audit log
CREATE TABLE IF NOT EXISTS staff_actions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_user_id   TEXT NOT NULL,     -- LINE userId of staff
  staff_name      TEXT,
  action          TEXT NOT NULL,     -- 'activate' / 'cancel' / 'manual_reset'
  table_id        TEXT REFERENCES tables(id),
  payload         TEXT,              -- JSON: { amount, dice, ... }
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5.7 staff_whitelist — 誰是服務人員(誰能用 admin LIFF)
CREATE TABLE IF NOT EXISTS staff_whitelist (
  user_id         TEXT PRIMARY KEY,  -- LINE userId
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,     -- 'staff' | 'admin' | 'super_admin'
  restaurant_id   TEXT REFERENCES restaurants(id), -- NULL = 全餐廳
  added_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 6. API Endpoints

### 6.1 LINE webhook
- `POST /api/webhook/line` — LINE Messaging API webhook
  - 驗證 signature (HMAC SHA256 with Channel Secret)
  - 處理 `message` event,內文 `table:A05` → 綁定該 user 到 A05
  - 處理 `follow` event → 歡迎訊息

### 6.2 Customer-facing
- `GET /api/dice-pool/:userId` — 客戶看自己 dice 剩多少(用 LIFF id_token 驗證)
- `POST /api/dice/roll` — 客戶擲骰,扣 1 dice,回點數 1-3

### 6.3 Staff admin
所有 admin endpoint 都加 `requireStaffAuth` middleware(查 staff_whitelist):

- `GET  /api/admin/restaurants` — 該 staff 能管的餐廳列表
- `GET  /api/admin/restaurants/:rid/tables` — 該餐廳桌號 grid(含 state + 綁定客戶)
- `POST /api/admin/tables/:tid/activate` — body: { amount: 2400 } → 推送 + 寫 dice_pool
- `POST /api/admin/tables/:tid/cancel` — 取消綁定(誤觸救援)

### 6.4 已有(不變)
- `/api/game-state/*` — 棋盤位置 / claimed tiles / earned rewards(現狀沿用)
- `/api/ticket/redeem` — 舊「店家掃 QR」流程仍保留 backup

---

## 7. 跨飯店擴展設計

今天:
- `INSERT INTO hotels VALUES ('KH', '高雄洲際酒店', 'InterContinental Kaohsiung', '<line_channel_id>')`
- `INSERT INTO restaurants ...` 5 筆
- `INSERT INTO tables ...` ~250 筆

IC 台北加入:
- 不改 code,直接:
  - `INSERT INTO hotels VALUES ('TPE', '台北洲際酒店', '...', '<其 line channel>')`
  - `INSERT INTO restaurants ...`
  - `INSERT INTO tables ...`
- 立牌印刷照 IC 台北的 LINE QR
- staff_whitelist 加 IC 台北人員

**LINE Channel 可二選一:**
- 共用一個 channel(管理單純,但訊息對外品牌可能想分)
- 各飯店各自 channel(品牌獨立,但要分流 webhook 邏輯 — 後端用 `hotels.line_channel_id` 路由)

預設留**各自一個 channel**(更乾淨)— 後端依 webhook source channel ID 路由到對應 hotel。

---

## 8. 環境變數(新增,在現有上加)

```bash
# 既有(不變)
LINE_CHANNEL_ID            # LIFF channel for game frontend (LINE login)
ADMIN_TOKEN
QR_GENERATOR_URL
VERIFY_SECRET
NODE_ENV

# 新增(IC 高雄 LINE 官方帳號 Messaging API)
LINE_MESSAGING_CHANNEL_SECRET_KH    # 接 webhook 驗 signature
LINE_MESSAGING_ACCESS_TOKEN_KH      # push 訊息用
LINE_OFFICIAL_ACCOUNT_ID_KH         # @xxx (給立牌 deep link 用)

# 給遊戲 LIFF link 生成 (push 訊息含的 URL)
GAME_LIFF_ID                        # 遊戲 LIFF ID
GAME_BASE_URL                       # https://game.<domain>

# 未來 IC 台北加入
LINE_MESSAGING_CHANNEL_SECRET_TPE
LINE_MESSAGING_ACCESS_TOKEN_TPE
LINE_OFFICIAL_ACCOUNT_ID_TPE
```

---

## 9. 開發階段

| 階段 | 內容 | 估時 | 阻塞? |
|---|---|---|---|
| **A. Schema** | 寫 migration,init script 跑得起來 | 1hr | 否 |
| **B. LINE webhook** | 接 `follow` + `message`,綁定邏輯 | 3hr | 要 Channel Secret |
| **C. Staff admin LIFF** | 餐廳 grid + 啟用按鈕 + 金額輸入 + push call | 4hr | 要 staff LIFF channel(可重用主 channel) |
| **D. Messaging API push** | 推送訊息含 LIFF deep link | 2hr | 要 Channel Access Token |
| **E. Dice pool API** | issued by activate / consumed by roll / 與 gameState 整合 | 3hr | 否 |
| **F. 客戶 LIFF 端串接** | LIFF 開遊戲時讀 dice_pool / 擲骰扣 pool | 2hr | 否 |
| **G. 立牌設計檔** | SVG mock + 給設計部 / 印刷協調 | 1hr 設計 + 1-2 週印刷 | 行銷部對接窗口 |
| **H. seed 餐廳 + 桌號** | SQL seed data | 1hr | 要 5 餐廳清單 |
| **I. e2e + production deploy** | 全流程跑通 | 3hr | 全部依賴項到位 |

**估總:約 19 工時 + 印刷 lead time**

---

## 10. TBD(Tony 要決定)

| # | 問題 | 我的傾向 |
|---|---|---|
| 1 | 多人同桌邏輯:A(最後綁定)/ B(第一個)/ C(全部廣播先到先得)| **C** |
| 2 | dice pool 上限(一張帳單最多幾次)| 5 次(防 banquet 大單一次走光獎)|
| 3 | 跨餐廳累積進度?(A 餐廳到第 8 格 → B 餐廳繼續) | **是**(LINE userId 為主鍵)|
| 4 | dice pool 過期時間?(不擲就作廢)| 14 天 |
| 5 | 服務人員 admin LIFF 是「現有遊戲 LIFF channel 同一個」還是「新開一個 admin channel」 | 同一個(成本最低,用 staff_whitelist 控權限)|
| 6 | LINE 官方帳號各飯店獨立 vs 共用 | 各自一個(品牌獨立)|
| 7 | 立牌印刷:壓克力立架 vs 紙本卡 vs e-ink | 壓克力(五星級調性 + 耐用)|

---

## 11. 後續延伸(不在本期)

- 客戶歷次消費紀錄查詢(LINE rich menu)
- 服務人員「結帳金額 」由 POS 自動帶(POS 整合)
- 大富翁進度分享給好友(已做)
- 跨飯店遊戲交叉行銷(IC 高雄玩家可解鎖 IC 台北專屬獎)

---

## 12. 開放問題(問 Tony)

1. ✋ ZEABUR_TOKEN 何時可以給(阻塞 Phase 1-4 production deploy)
2. ✋ IC 高雄 LINE 官方帳號狀態 — 已存在?Messaging API 已開?認證帳號?
3. ✋ 5 餐廳代碼 + 中英名 + 桌數
4. ✋ 服務人員 LINE userId 名單(誰能進 admin)
5. ✋ 立牌設計部對接窗口
6. ✋ 預期上線日

寫到這裡 ↓ 跟我講 OK 還是要改設計,我接著開實作。
