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

---

*Tony 2026-05-22 22:30 · 終於成功兌換第一張結帳 QR 🎉*
