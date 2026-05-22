# Postmortem — 2026-05-22 Bug Hunt
> IC Kaohsiung Culinary Journey · LIFF webview · staff checkout QR flow
>
> Tony Chen, debug session 21:00 → 22:30 一氣呵成

---

## TL;DR(三句話總結)

1. **客人(Ivy)反應 LIFF 內掃描器閃爍打不到字** → 程式碼 bug,輸入框 mount/unmount 循環。修了。
2. **客人沒辦法在 LIFF 內掃結帳 QR** → 設計 bug,內建掃描器只認餐廳店家 QR。修了。
3. **結帳 QR 永遠 redeem 失敗顯示「QR 無效」** → DB schema 跟業務流程兜不上 + 例外被吞掉,看起來像「QR 無效」其實是 backend INSERT 違反 NOT NULL constraint。修了。

---

## 🐛 Bug #1:QRScanner 手動輸入欄位閃爍

| | |
|---|---|
| **回報人** | Ivy(乾清宮 group) |
| **症狀** | 進 LIFF「掃描店家 QR Code」,要手動打驗證碼時,「畫面會一直閃爍,我們無法正常 KEY 相關資料進去」 |
| **根因** | `QRScanner.tsx` 把整個 `<form>` 包在 `{error && (...)}`。但相機掃到無效 QR 會 setTimeout 3 秒清掉 error。相機 10fps 持續掃 → 每偵測一張 invalid QR 就重新 mount 輸入框 → focus 丟失、打到一半的字消失 |
| **修法** | 把 manual input 移出 `{error && ...}`,改用獨立的 `manualCode` state,**永遠顯示在相機下方** |
| **Commit** | `d5a88a4` · `fix(scanner): manual code input no longer flickers / loses focus` |
| **預防** | **不要把「3 秒會自動消失的 state」當成長壽 UI 元素(輸入框、表單)的 parent**。錯誤訊息可以自動消失,但跟它共生的輸入框會跟著陪葬 |

---

## 🐛 Bug #2:LIFF 內掃描器不認結帳 QR

| | |
|---|---|
| **回報人** | Tony(實際測完整流程時) |
| **症狀** | 客人從海報掃店家 QR 進 LIFF → 吃完飯 → 工作人員產結帳 QR → 客人**在 LIFF 內**點「掃描 QR Code」→ 跳「QR Code 不正確」 |
| **設計 bug** | 原本 `QRScanner.tsx` 只認兩種東西:(a) 餐廳驗證碼字串 (b) 含 `ickhh-culinary-map.zeabur.app` 的 URL(這還是 v1 舊網域)。**結帳 QR 是 `https://.../?ticket=xxx`,既不是驗證碼也不是舊網域** → 永遠 reject |
| **UX bug** | 我原本告訴 Tony「結帳 QR 要用 LINE 主程式相機掃,不要在 LIFF 裡掃」— **這個 hand-off 完全不合理**。客人已經在 LIFF 玩,要他關掉 LIFF 切到 LINE 主畫面再回來,荒謬 |
| **修法** | QRScanner 偵測掃到的內容,依優先順序:① 含 `?ticket=<token>` → 提取 token 走 redeem 流程 ② 等於餐廳驗證碼 → 綁定餐廳 ③ 含現在的網域(`game-v2`)→ 也綁餐廳 ④ 都不是 → 跳錯誤 |
| **Commit** | `cde1ba0` · `fix(scanner): LIFF in-app scanner now also handles checkout/room-charge QRs` |
| **預防** | **在 LIFF webview 提供的掃描功能,要認得客人會遇到的所有 QR 種類**。不只店家 QR,還包括結帳 / 掛房帳 / 自掃發票等。**遇到「請客人離開 LIFF 用 LINE 相機」這種建議,代表設計有問題,要改的是程式不是教導** |
| **延伸** | `externalDomain` default 從舊網域 `ickhh-culinary-map.zeabur.app` 更新到現行 `ickhh-culinary-game-v2.zeabur.app`。**部署網域變動時記得回頭檢查 hardcoded URL** |

---

## 🐛 Bug #3:結帳 QR redeem 永遠失敗(但顯示「QR 無效」)

這是最嚴重的一個 bug — **從來沒有客人成功透過結帳 QR 拿到骰子**,只是大家以為是 QR 過期或掃錯。

### 真實錯誤(被埋了很久才挖出來)

```
null value in column "restaurant_id" of relation "dice_pool"
violates not-null constraint
```

### 為什麼很難發現?

**catch block 吞掉了所有 exception,一律回 `reason: "not_found"`**:

```typescript
} catch (err) {
  await client.query("ROLLBACK");
  client.release();
  console.error("[redeemCheckoutTicket] failed:", err);
  return { ok: false, reason: "not_found" };  // ← 任何錯誤都變成這個
}
```

前端把 `not_found` 翻譯成「QR Code 無效,請確認是 IC 員工所發」。所以:
- 客人看到「QR 無效」→ 以為 QR 本身的問題
- 工作人員看到客人這樣反應 → 以為是過期 / 重產一張
- 重產的新 QR 也失敗 → 同樣訊息 → 大家以為這就是 LIFF 的限制
- **沒有人想到 backend 是炸的**

### 真實根因

`dice_pool` table 從 migration 001 開始就寫:
```sql
restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
```

但結帳 QR 是 Phase 8 後加的,**staff 在 /admin/checkout 產 QR 時沒指定餐廳**(staff 怎麼會知道客人剛剛綁了哪間?)。所以:
- `checkout_tickets.restaurant_id` = NULL ✓(這個是 nullable)
- redeem 時 `INSERT INTO dice_pool (..., restaurant_id, ...) VALUES (..., NULL, ...)` ❌

→ throw constraint violation → catch 包成 `not_found` → 前端顯示「QR 無效」。

### 修法分兩步

**Step 1:把例外吐出來** (`a1e5906` · `debug(redeem): surface real error from redeemCheckoutTicket catch`)
- catch 改回 `reason: "server_error"` + `detail: err.message`
- 前端把 detail 顯示在錯誤畫面下方 `[原文錯誤]`
- Tony 重測 → 終於看到真正的 constraint violation

**Step 2:解決 constraint 問題** (`2746c85` · `fix(redeem): drop NOT NULL on dice_pool.restaurant_id`)
- Migration `007_dice_pool_nullable_restaurant.sql`:`ALTER TABLE dice_pool ALTER COLUMN restaurant_id DROP NOT NULL`
- FK 保留(NULL 在 FK 是允許的),只是不再強迫填
- 同時這個 bug 修了之後,**之前所有測試過的 token 雖然 used_at 都還 NULL,但都已過期了 — 等於那段時間生過的 QR 都廢了**

### 預防

| 預防原則 | 怎麼做 |
|---|---|
| **不要 catch + 統一錯誤碼** | catch 要不就 re-throw,要不就回 reason + detail。一律歸成「not_found」這種誤導訊息 = 自掘墳墓 |
| **新功能落地前檢查 schema** | 加新 endpoint / 新流程時,問自己「這條路會 INSERT 哪些 table?那些 table 的 NOT NULL 我都有填嗎?」 |
| **DB 層的 NOT NULL 要跟 business invariant 一致** | `dice_pool.restaurant_id NOT NULL` 在「餐廳掃桌號」流程下合理(每筆消費都有桌號),但結帳 QR 不適用。**新功能加進來時,schema 也要跟著改** |
| **End-to-end 測試一次完整流程** | 工程跟業務都沒有實際跑「兩支手機完整測試」。如果在 staging 跑過一次「客人完整流程」就會抓到 |

---

## 🐛 Bug #4(附加):ADMIN_VIEW_KEY 環境變數沒設

| | |
|---|---|
| **症狀** | Tony 用 `?key=...` URL 進 `/admin/customers` 跳 401 |
| **根因** | 我之前推了 `URL token 後門` code,但 Zeabur 上 `ADMIN_VIEW_KEY` env var 沒設 → backend 比對失敗 → fall through 到 LIFF auth → 但 LiffContext 看到 `?key=` 就跳過 LIFF init → 沒 token → 401 |
| **修法** | 我幫 Tony 用 browser MCP 在 Zeabur backend service 加 env var `ADMIN_VIEW_KEY=e3a501bd702e51f17c98d071b06beb13` |
| **預防** | 推「需要新 env var 的 commit」時,**commit message / 跟使用者溝通要明確列出『接下來請去 Zeabur 加 XXX 環境變數,不然新功能不會動』**。或者把 env var setup 也透過某種自動化(infrastructure-as-code)避免人工漏設 |

---

## 🛠 這次 debug 用到的 SOP / 工具

實際上能撐到把 bug 挖出來,因為下面幾個工具好用:

1. **Postgres terminal** (Zeabur 直接給的)— 直接 SQL 查 token / column / migration 狀態
2. **Backend terminal** + `node -e` — 用 `pg` package 模擬 backend 的 query 角度,確認連 DB 沒問題
3. **Browser MCP** — 直接操作 Zeabur dashboard,加 env var、看 deployment 狀態
4. **Background sleep + 等部署** — `sleep 240 && echo wakeup` `run_in_background=true`,確認部署完才繼續

下次再 debug 類似問題,可以:
- 先 query DB 看資料對不對(token 在不在、過期沒、used 沒)
- 再 query backend terminal 確認連線
- 一定要把 catch 的真實錯誤吐出來
- 部署別猜,直接看 dashboard

---

## 📊 後續還可以做的(deferred,不急但記下來)

- [ ] 把 `redeemCheckoutTicket` 的 catch 永久性區分 reason(`db_error` / `business_error` / `not_found`),這次只是先讓 `server_error` 帶 detail
- [ ] AdminCheckoutQRPage 可以加「綁定餐廳」下拉選單,讓 staff 在收銀時主動指定 restaurant_id,這樣 dice_pool 的 restaurant_id 還是有意義(現在是 NULL)
- [ ] 寫一個 staging 環境的 end-to-end 自動化測試,跑一遍「兩支手機完整流程」
- [ ] 同樣的 catch-and-mask pattern 在哪些其他 endpoint 也有?要不要全 codebase 掃一遍?
  - 至少先看 `bind.ts` / `invoice.ts` / `webhook.ts` / `staffAdmin.ts`

---

## 📅 Timeline of commits today

| Commit | 內容 |
|---|---|
| `d5a88a4` | Bug #1 修:scanner manual input no longer flickers |
| `cde1ba0` | Bug #2 修:LIFF scanner now also handles checkout/room-charge QRs |
| `a1e5906` | Bug #3a 修:surface real error from redeemCheckoutTicket catch |
| `2746c85` | Bug #3b 修:drop NOT NULL on dice_pool.restaurant_id |
| `af58d50` | 本份 postmortem 建檔 |
| `6c7fc88` | Bug #5a 修:小白單日期格式正規化 + surface vision date in stale rejection |
| `d5fd8fd` | Bug #5b UX:拍照畫面加「鏡頭近拍」提示 |

---

## 🐛 Bug #5(隔天 13:00 補):小白單 OCR 拍太遠 → 假過期

| | |
|---|---|
| **症狀** | 今天 (2026-05-22 11:54) 開立的小白單,2 小時後 (13:55) 拍照上傳,顯示「單據日期過期,只能使用今天/昨天的小白單」 |
| **根因(Tony 自己抓到)** | OCR 在鏡頭離小白單遠 / 字小 / 光線一般時,讀 date 字串會錯位或漏字。Vision 回非預期日期字串 → backend 跟 today/yesterday 比對 false → 誤判 stale |
| **修法 A(後端防禦性)** | `normalizeDateIso()` 處理 vision 偶爾回 `2026/05/22`、民國 `115-05-22` 等變體 |
| **修法 B(可觀測性)** | `stale_invoice` 回傳的 `detail` 帶上 `vision_date / normalized / today / yesterday`,未來 debug 不用再猜 |
| **修法 C(UX,實際解掉問題的關鍵)** | ReceiptCapture 畫面在 file picker 上方加橘色 hint banner:「📸 鏡頭盡量靠近小白單,確認日期/總計/發票號碼看得清楚。離太遠 OCR 會讀不到日期,系統會誤判成過期」 |
| **教訓** | **OCR 不是萬能,UI 層的拍照指引比後端 fallback 更直接解決問題**。後端 fallback 處理沒拍清楚的圖,UI 提示避免一開始就拍不清楚。兩個都要,但 UI 提示是最低成本最高 ROI 的修法 |

---

*Tony 2026-05-22 22:30 → 隔天 13:00 · 從結帳 QR 全 redeem 失敗到完整流程跑通 🎉*

---

# Day 2 補記:2026-05-23 上線前最後拉鋸戰

當天加了 **P0 強制加好友 / P1 領獎 push LINE / P2 補發 QR** 三大新功能,
過程中又踩到 4 個微妙 bug。**全部記在這裡免得未來再採坑**。

---

## 🐛 Bug #6:`dedup ref` + `cancelled` flag 互鎖,UI 永遠卡在「正在驗證...」

| | |
|---|---|
| **症狀** | 補發 QR 客人掃完後,LINE 收得到優惠券、後端日誌顯示 redeem 成功,**但 LIFF 畫面停在「⏳ 正在驗證掃描的 QR Code...」死不更新** |
| **根因** | 我前一次為了修「StrictMode 雙呼叫導致 already_used」加了 `attemptedTokensRef` dedup,但**忘了拆掉舊的 `cancelled` flag**。StrictMode 雙 mount 時:Mount#1 加 ref + 啟動 async + `cancelled_1=false`;Cleanup#1 設 `cancelled_1=true`;Mount#2 看 ref 已有 → return(沒新 async);async-1 完成 → `if (cancelled_1) return;` → **永遠不 setStatusMessage** |
| **修法** | 拆掉 `cancelled` flag。dedup ref 已經保證每個 token 只啟動一個 async,`cancelled` 是多餘的。React 18 hooks 在 unmount 後 setState 是 no-op,不會 crash 也不會 warning,所以可以放心拆 |
| **Commit** | `73ae98b` |
| **教訓** | **多個防護機制(ref dedup + flag cancellation)如果各管各的,容易產生意料外的 deadlock**。defensive 寫法不是疊越多越好,要想清楚每一層的責任界線。當你加一層新防護,先確認舊防護是否還必要 |

---

## 🐛 Bug #7:`/v2/bot/friendship/{userId}/status` LINE API 根本不存在

| | |
|---|---|
| **症狀** | P0 加好友 gate 永遠把每個人都當「不是好友」並 fallback 成「假裝是好友」(degraded mode)→ 等於 gate 完全沒效果,**所有人都通過** |
| **根因** | 我憑印象寫了 `GET /v2/bot/friendship/{userId}/status` 期望回 `{ friendFlag: bool }` — **這個 endpoint 在 LINE Messaging API 文件中根本不存在**。LINE 對所有 userId 都回 404 "Not found"。我的程式碼收到 404 視為「API 失敗」→ 進入 degraded 路徑 → 直接 isFriend:true 通過 |
| **驗證** | 從 Zeabur backend terminal 用 node 打 LINE API,Tony 的 userId、Jessica 的 userId、隨機假 userId,**全部都回 404** → 確認 endpoint bogus |
| **修法** | 改用 `GET /v2/bot/profile/{userId}` 當 friendship proxy:200 = 加過好友(treat as friend),404 = 從未互動(NOT friend)。caveat:加好友後又封鎖的人 profile 仍回 200,gate 會放行,但 push 會 silently fail — acceptable tradeoff |
| **Commit** | `a5d1081` |
| **教訓** | **寫 API 整合時憑印象太危險**。**先用 curl / node fetch 驗證 endpoint 真的回什麼**,再寫程式碼。如果 endpoint 文件查不到,要懷疑自己記錯。LINE 對「特定 user 是否為好友」沒有直接 endpoint,只有 follower list + bot profile lookup |

---

## 🐛 Bug #8:`INSERT INTO game_state (..., display_name, ...) VALUES (..., NULL, ...)` 違反 NOT NULL

| | |
|---|---|
| **症狀** | 補發 QR 第一次掃,LIFF 顯示「❌後端錯誤,請截圖給 IT [null value in column "display_name" of relation "game_state" violates not-null constraint]」 |
| **根因** | `game_state.display_name` schema 是 `TEXT NOT NULL DEFAULT ''`,但我的補發 redeem branch 寫的 INSERT **明確傳 `NULL`** → 違反 NOT NULL。**明確傳 NULL 會 bypass DEFAULT**,不是 "DEFAULT 救你" |
| **修法** | INSERT 改成**省略 display_name 欄位**,讓 Postgres 自動套用 DEFAULT `''`。同時也省略 `total_points` / `claimed_tiles` — 它們的 DEFAULT 也合理。`ON CONFLICT DO UPDATE` 只動 `earned_rewards`,既有 row 的 display_name 不會被覆蓋 |
| **Commit** | `39ddeec` |
| **教訓** | **這就是 lessons_learned D05 的同一個 pattern**(新功能加進來時 schema 也要跟著改)。`NOT NULL DEFAULT ''` 看起來會自動填,**只有當你完全不寫該欄位時才會用 DEFAULT**。寫 `VALUES (..., NULL, ...)` 一定觸發 constraint。修法永遠是「不寫該欄位」或「明確傳合理值」,**不要傳 NULL** |

---

## 🐛 Bug #9:OmniChat 連結 stateless → 無限領券 + `GAME_BASE_URL` 環境變數 stale 指錯網域

| | |
|---|---|
| **症狀 A** | 客人 LINE 對話視窗收到的補發優惠券 Flex 卡片,「領取優惠券」按鈕點一次拿一張券、點 N 次拿 N 張券 |
| **症狀 B** | 修了症狀 A 加 wrapper token 後,客人點 wrapper 按鈕跳 404 HOSTNAME_NOT_FOUND |
| **根因 A** | OmniChat 的 coupon bind URL (`api.omnichat.ai/restapi/v1/omo/bind/<id>`) 是**完全 stateless** 的,**沒有 per-user-per-coupon dedup**,點幾次發幾次券。LINE Flex 訊息會永遠留在對話歷史中 → 客人能無限重點 |
| **根因 B** | 我寫 wrapper URL `${process.env.GAME_BASE_URL ?? 'https://ickhh-culinary-game-v2.zeabur.app'}/api/claim/{token}`。Tony 的 Zeabur 上 `GAME_BASE_URL` env var **還停在 v1 時期的 `ickhh-culinary-game.zeabur.app`**(沒 -v2)→ 那個網域早就停掉了 → 404。**而且就算網域對,/api/claim/* 是 backend 路由,frontend SPA 不會 proxy /api/* 給 backend**,所以指向 frontend 網域也是錯 |
| **修法 A** | Migration 009 新建 `claim_tokens` 表;`pushRewardCoupon` 改成生成 token + INSERT + 把 Flex 按鈕的 URL 換成 `/api/claim/{token}`;backend `GET /api/claim/:token` 用 `UPDATE ... WHERE token=$1 AND claimed_at IS NULL RETURNING coupon_link` 的 atomic update 保證單次性 |
| **修法 B** | wrapper URL 改寫死 `https://ickhh-culinary-api-v2.zeabur.app/api/claim/{token}` (api host, not game host),env override 仍可用 `CLAIM_BASE_URL`。已用過時 backend 直接 inline HTML 渲染「已領取」頁面,不跨網域 redirect |
| **Commits** | `a723fe4`(wrapper)+ `4edf490`(404 fix + inline HTML + CTA banner) |
| **教訓 #1** | **第三方 stateless URL 永遠假設它沒做你想要的 dedup**。要用自己的 token / nonce 包一層才能保證單次有效 |
| **教訓 #2** | **環境變數遷移時必須同步更新所有地方**。Tony 從 v1 → v2 時更新了大部分 URL,但 `GAME_BASE_URL` 漏改 → 任何用到這個 var 的新功能都會打到 dead host |
| **教訓 #3** | **Vite SPA 在 production build 不會自動把 /api/* proxy 到 backend**(只有 dev mode 的 vite.config.ts 會)。前端網域 + /api/* 路徑 = 404。要打 backend 一律用 backend 的公開網域 |

---

## ✨ 第 2 天新增的功能(順手記一下)

| Commit | 功能 |
|---|---|
| `0e1f7f6` | **P0 加好友 gate** — Bot Profile API 檢查 + 沒加好友的 gate 頁面 |
| `ceb30ff` | **P1 領獎自動推 LINE Flex** — saveGameState / claimTile 偵測 new earned_rewards 自動推送 |
| `3878b7a` | **P2 後台補發** — `/admin/customers` modal 加補發按鈕 |
| `a4959f0` → `dddb480` | **補發 mode 移到 `/admin/checkout`** — 跟 💳 / 🏨 並排同一頁,並改成「產 QR 給客人掃」流程(跟結帳 QR 同樣 UX) |
| `df5da7b` | **gate 加好友後自動跳轉**(免按按鈕)— `visibilitychange` + `touchstart` + 1.5 秒 aggressive polling |
| `4edf490` | **補發成功 CTA banner** — 大綠色「📨 打開 LINE 看我的優惠券」按鈕,點了 `liff.closeWindow()` |

---

## 📅 Day 2 commit timeline (重要的 9 個)

```
0e1f7f6  feat(P0): force-add LINE OA friend before entering game
ceb30ff  feat(P1): auto-push reward coupons to LINE chat
3878b7a  feat(P2): admin compensation grant in /admin/customers
a5d1081  fix(P0): use Bot Profile API as friendship proxy (the bogus URL fix)
a4959f0  feat(checkout): 補發 mode 進 /admin/checkout (PIN auth)
dddb480  feat(checkout): 補發改成 QR 流程 (no customer search)
39ddeec  fix(compensation): omit display_name on INSERT
ebba118  fix(redeem): client-side dedup ref
73ae98b  fix(redeem): remove cancelled flag (deadlock fix)
df5da7b  feat(gate): aggressive 1.5s polling + touch trigger
a723fe4  fix(coupons): single-use claim token wraps OmniChat link
4edf490  fix(claim): wrapper URL 404 fix + LINE-jump CTA
```

---

*Tony 2026-05-23 17:30 · 補發 QR 全流程上線就緒 ✅*
