# 正式啟動前資料重置 SOP
> Campaign Launch Data Reset · Standard Operating Procedure
>
> Tony 2026-05-22 預先寫好,**等他說「上線清掉」才執行**

---

## 🎯 目的

開放給真實客人之前,把測試階段累積的客戶/事件/骰子/兌換/Ticket 紀錄全部清掉,讓上線後的 dashboard 只反映**真正客人的行為**,Tony 才能準確判斷各餐廳表現。

> ✅ **Tony 已預先選定 模式 A(軟重置)** — 上線時不需再選,直接執行 Step 1 → 2A → 3。

---

## 📋 兩種重置模式 — 跟 Tony 確認後選一種

### 模式 A: 軟重置(推薦)
- **保留** `customer_profiles` 的 row(user_id, display_name, picture_url),但**所有 counter 歸零**
- **保留** `staff_whitelist`、`restaurants`、`tables`
- **清空** `customer_events`、`game_state`、`dice_pool`、`invoices`、`checkout_tickets`、`table_bindings`、`staff_actions`

**為什麼推薦**:
- 既有 LINE 用戶不用「重新加好友」,他們的 LIFF profile 還在
- 從用戶角度看就像「遊戲被重置,從第 0 格重新開始」
- 上線後第一次互動就會被當成新事件記錄

### 模式 B: 硬重置
- 連 `customer_profiles` 也清掉
- 等於「完全乾淨,沒人玩過」
- 既有用戶下次打開 LIFF 會被當新人(自動 INSERT 新 profile)

**通常不需要**這種,除非測試期間累積了 100+ 假帳號要全清掉。

---

## ⚠️ 執行前 SAFETY CHECKLIST

**必須一個一個打勾才執行:**

- [ ] Tony 在 chat 中**明確說了「執行重置」**或同等指令(我不會看到「等一下要重置」就動手)
- [ ] **備份**已完成(下方有 backup 步驟)
- [ ] 確認 Tony 知道**這個動作不可逆**
- [ ] 確認**模式 A vs B**已選定
- [ ] 確認執行**時間點**(建議:上線當天早上,或前一晚)

---

## 🛡️ Step 1: 備份(必做,5 分鐘)

進 Zeabur postgresql 服務 → 指令 (terminal),跑:

```bash
# 1) Dump 整個 DB schema + data
pg_dump -U root -d zeabur > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql
ls -lh /tmp/backup_*.sql   # 確認檔案存在

# 2) 把備份 base64 出來貼進 chat,讓 Tony 存到本機
base64 /tmp/backup_*.sql | head -200    # 看開頭一段確認沒空
wc -l /tmp/backup_*.sql                 # 看總行數
```

或者用 Zeabur dashboard 的「備份還原」分頁,點「立即備份」拿到 snapshot ID,記下來。

---

## 💉 Step 2: 執行重置 SQL

進 backend terminal(`/app` 目錄,有 `pg` package),跑這個 script。**先確認模式 A or B**。

### 模式 A 重置(軟重置 — 推薦)

```bash
cat > /app/reset_soft.cjs <<'EOF'
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Print before counts
    const before = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM customer_profiles) AS profiles,
        (SELECT COUNT(*) FROM customer_events)   AS events,
        (SELECT COUNT(*) FROM game_state)        AS states,
        (SELECT COUNT(*) FROM dice_pool)         AS dice,
        (SELECT COUNT(*) FROM invoices)          AS invoices,
        (SELECT COUNT(*) FROM checkout_tickets)  AS tickets,
        (SELECT COUNT(*) FROM table_bindings)    AS bindings,
        (SELECT COUNT(*) FROM staff_actions)     AS actions
    `);
    console.log('BEFORE:', before.rows[0]);

    // 1) Clear event log
    await client.query('TRUNCATE customer_events RESTART IDENTITY');

    // 2) Reset profile counters (保留 user_id / display_name / picture_url)
    await client.query(`
      UPDATE customer_profiles SET
        first_seen_at = NOW(),
        last_seen_at  = NOW(),
        total_visits  = 0,
        total_spend   = 0,
        total_dice_rolled    = 0,
        total_rewards_earned = 0,
        total_seasons        = 0
    `);

    // 3) Clear game state, dice pool, redemption history
    await client.query('TRUNCATE game_state');
    await client.query('TRUNCATE dice_pool RESTART IDENTITY');
    await client.query('TRUNCATE invoices CASCADE');
    await client.query('TRUNCATE checkout_tickets');
    await client.query('TRUNCATE table_bindings RESTART IDENTITY');
    await client.query('TRUNCATE staff_actions RESTART IDENTITY');

    // staff_whitelist / restaurants / tables 保留不動

    await client.query('COMMIT');

    const after = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM customer_profiles) AS profiles,
        (SELECT COUNT(*) FROM customer_events)   AS events,
        (SELECT COUNT(*) FROM game_state)        AS states,
        (SELECT COUNT(*) FROM dice_pool)         AS dice,
        (SELECT COUNT(*) FROM invoices)          AS invoices,
        (SELECT COUNT(*) FROM checkout_tickets)  AS tickets,
        (SELECT COUNT(*) FROM table_bindings)    AS bindings,
        (SELECT COUNT(*) FROM staff_actions)     AS actions
    `);
    console.log('AFTER: ', after.rows[0]);
    console.log('✅ Soft reset complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Reset failed (rolled back):', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
EOF
node /app/reset_soft.cjs
```

### 模式 B 重置(硬重置)

```bash
cat > /app/reset_hard.cjs <<'EOF'
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const before = await client.query(`SELECT COUNT(*) AS profiles FROM customer_profiles`);
    console.log('BEFORE profiles:', before.rows[0]);

    await client.query('TRUNCATE customer_events RESTART IDENTITY');
    await client.query('TRUNCATE game_state');
    await client.query('TRUNCATE dice_pool RESTART IDENTITY');
    await client.query('TRUNCATE invoices CASCADE');
    await client.query('TRUNCATE checkout_tickets');
    await client.query('TRUNCATE table_bindings RESTART IDENTITY');
    await client.query('TRUNCATE staff_actions RESTART IDENTITY');
    await client.query('TRUNCATE customer_profiles CASCADE');   // ← 模式 B 多這一行

    await client.query('COMMIT');
    console.log('AFTER profiles: 0');
    console.log('✅ Hard reset complete — 既有客人下次進 LIFF 會被當新用戶');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Reset failed (rolled back):', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
EOF
node /app/reset_hard.cjs
```

---

## ✔️ Step 3: 驗證

從 postgres terminal 跑:

```sql
psql -U root -d zeabur <<'SQL'
SELECT 'customer_profiles' AS tbl, COUNT(*) FROM customer_profiles
UNION ALL SELECT 'customer_events',   COUNT(*) FROM customer_events
UNION ALL SELECT 'game_state',        COUNT(*) FROM game_state
UNION ALL SELECT 'dice_pool',         COUNT(*) FROM dice_pool
UNION ALL SELECT 'invoices',          COUNT(*) FROM invoices
UNION ALL SELECT 'checkout_tickets',  COUNT(*) FROM checkout_tickets
UNION ALL SELECT 'table_bindings',    COUNT(*) FROM table_bindings
UNION ALL SELECT 'staff_actions',     COUNT(*) FROM staff_actions
UNION ALL SELECT 'staff_whitelist',   COUNT(*) FROM staff_whitelist
UNION ALL SELECT 'restaurants',       COUNT(*) FROM restaurants;
SQL
```

**預期結果**:
- 模式 A:`customer_profiles` 保留原數量,其他都 0;`staff_whitelist` 不變;`restaurants` 不變
- 模式 B:`customer_profiles` 也 = 0;其他同上

打開 `/admin/customers?key=...` 確認:
- 漏斗都是 0
- 各餐廳活動次數都是 0
- 客戶清單空白(模式 B)或 counter 全 0(模式 A)

---

## 🆘 Step 4: 如果出事(Oh-shit recovery)

```bash
# 還原 backup
psql -U root -d zeabur < /tmp/backup_xxxxxxxx.sql
```

或在 Zeabur dashboard 點該備份的「還原」。

---

## 📅 上線當天 Checklist

執行的時間建議:**上線前一晚 23:00 之後**,或當天早上開店前。

- [ ] 跟 Tony 在 chat 確認「執行重置」
- [ ] 確認模式 A vs B
- [ ] Backup 完成,Tony 知道備份檔在哪
- [ ] 跑重置 SQL,看 console.log 確認 BEFORE 跟 AFTER 數字合理
- [ ] 打開 dashboard 驗證
- [ ] 跟 Tony 報告完成,給他打開 dashboard 截圖
- [ ] Tony 確認後,刪掉 /tmp 裡的 reset script 跟 backup(可選)

---

## 🔁 重置之後別忘了

| 項目 | 動作 |
|---|---|
| Staff 還是員工 | `staff_whitelist` 保留 — 員工可以繼續用 /admin/checkout |
| 系統環境變數 | 不動 — `ADMIN_VIEW_KEY` `STAFF_NUMERIC_PASSWORD` 都還在 |
| LIFF / LINE OA | 不動 — 客人加好友狀態保留 |
| Schema migrations | 不動 — 已套用的 7 個 migration 保留 |
| 上線時間記錄 | **在 dashboard 截一張全 0 的圖**,當「Day Zero」基準線 |

---

*當你準備好的時候,跟我說「執行重置」+「模式 A」(或 B),我會走完上面 Step 1-3。*
