/**
 * Staff checkout-QR page — replaces the old /admin/tables activation flow.
 *
 * Flow (5 sec per table):
 *   1. Staff opens https://<game>/admin/checkout on their phone
 *   2. First load asks for the daily numeric PIN — cached in sessionStorage
 *      after success so subsequent issues are PIN-free for that browser
 *   3. Staff types the consumption amount → tap 產生 QR Code
 *   4. Big QR shown on screen pointing to https://<game>/?ticket=<token>
 *   5. Customer scans with LINE camera → lands in LIFF → dice appear
 *
 * Why no LIFF login here:
 *   Staff phones rotate between cashiers each shift; LINE-login-per-shift was
 *   too much friction (see staff_whitelist drama in earlier phases). Daily
 *   PIN rotated out-of-band is the security boundary instead.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  issueCheckoutTicket,
  issueCompensationTicket,
  listStaffRewards,
  type TicketSource,
  type StaffRewardEntry,
} from "@/api/checkoutTicket";

// Tony 2026-05-23: third mode 補發優惠券 lives on this same page so 可愛員工
// don't have to learn another URL. "compensation" is the unified mode key.
type PageMode = TicketSource | "compensation";

const PIN_CACHE_KEY = "ickhh.staff_pin";
// The customer scans QR with LINE camera → opens external browser → LIFF.
// We hardcode the public game URL so staff can issue from any browser, not
// just the LIFF webview. window.location.origin works on the LIFF host too.
const gameOrigin = () => window.location.origin;

const TICKET_TTL_MIN = 2; // sync with server CHECKOUT_TICKET_TTL_SEC=120

// Tony 2026-05-23: compact "10m ago" style for the customer picker dropdown
function fmtRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "剛剛";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const AdminCheckoutQRPage = () => {
  const [pin, setPin] = useState<string>(() => sessionStorage.getItem(PIN_CACHE_KEY) ?? "");
  const [pinLocked, setPinLocked] = useState<boolean>(!!sessionStorage.getItem(PIN_CACHE_KEY));
  // Tony 2026-05-21: "checkout" = 一般結帳 (需發票), "room_charge" = 掛房帳 (免發票)
  // Tony 2026-05-23: "compensation" = 補發優惠券 (產 QR 給客人掃,跟結帳 QR 同樣流程)
  const [mode, setMode] = useState<PageMode>("checkout");
  const [rewardCatalog, setRewardCatalog] = useState<StaffRewardEntry[]>([]);
  const [rewardCatalogLoaded, setRewardCatalogLoaded] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<string>("");
  const [compNote, setCompNote] = useState("");
  const [invoiceInput, setInvoiceInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [issuing, setIssuing] = useState(false);
  // Tony 2026-05-23: compensation tickets reuse this state but have no amount/dice;
  // instead rewardName for the QR-view body. source widens to PageMode.
  const [ticket, setTicket] = useState<{ token: string; amount?: number; dice?: number; expiresAt: number; source: PageMode; rewardName?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<NonNullable<Awaited<ReturnType<typeof issueCheckoutTicket>>["existing"]> | null>(null);
  const [now, setNow] = useState(Date.now());

  // Countdown ticker — only when a ticket exists
  useEffect(() => {
    if (!ticket) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [ticket]);

  // Tony 2026-05-23: lazy-load reward catalog when staff enters compensation mode
  useEffect(() => {
    if (mode !== "compensation" || !pinLocked || rewardCatalogLoaded) return;
    void (async () => {
      const rew = await listStaffRewards(pin);
      if (rew.ok && rew.rewards) setRewardCatalog(rew.rewards);
      setRewardCatalogLoaded(true);
    })();
  }, [mode, pinLocked, pin, rewardCatalogLoaded]);

  const handleIssueCompensation = async () => {
    setError(null);
    if (!selectedRewardId) {
      setError("請選擇要補發的優惠券");
      return;
    }
    setIssuing(true);
    const res = await issueCompensationTicket(pin, selectedRewardId, compNote.trim() || undefined);
    setIssuing(false);
    if (!res.ok || !res.token || !res.expires_at) {
      if (res.reason === "invalid_pin") {
        setError("PIN 錯誤,請重新輸入");
        sessionStorage.removeItem(PIN_CACHE_KEY);
        setPinLocked(false);
        setPin("");
        return;
      }
      setError(`產生失敗:${res.reason ?? "unknown"}`);
      return;
    }
    const reward = rewardCatalog.find((r) => r.id === selectedRewardId);
    setTicket({
      token: res.token,
      expiresAt: new Date(res.expires_at).getTime(),
      source: "compensation",
      rewardName: reward?.name ?? "(未知獎品)",
    });
  };

  const dicePreview = useMemo(() => {
    const n = parseInt(amountInput, 10);
    if (!Number.isFinite(n) || n < 2000) return 0;
    return Math.min(Math.floor(n / 2000), 5);
  }, [amountInput]);

  const secondsLeft = ticket ? Math.max(0, Math.ceil((ticket.expiresAt - now) / 1000)) : 0;
  const expired = ticket && secondsLeft <= 0;

  const ticketUrl = ticket ? `${gameOrigin()}/?ticket=${encodeURIComponent(ticket.token)}` : "";

  const normalizedInvoice = useMemo(
    () => invoiceInput.toUpperCase().replace(/-|\s/g, "").trim(),
    [invoiceInput],
  );
  const invoiceLooksValid = /^[A-Z]{2}\d{8}$/.test(normalizedInvoice);

  const handleIssue = async () => {
    setError(null);
    setDuplicateInfo(null);
    const amount = parseInt(amountInput, 10);
    if (!Number.isFinite(amount) || amount < 2000) {
      setError("金額需 ≥ NT$2,000 才有擲骰機會");
      return;
    }
    // Room-charge skips the invoice gate — hotel guest charges to room.
    if (mode === "checkout" && !invoiceLooksValid) {
      setError("發票編號格式錯誤,請輸入 2 字母 + 8 數字(如 BM36258896)");
      return;
    }
    setIssuing(true);
    const res = await issueCheckoutTicket(
      amount,
      pin,
      mode === "checkout" ? normalizedInvoice : null,
      null,
      mode,
    );
    setIssuing(false);
    if (!res.ok || !res.token || !res.expires_at) {
      if (res.reason === "invalid_pin") {
        setError("PIN 錯誤,請重新輸入");
        sessionStorage.removeItem(PIN_CACHE_KEY);
        setPinLocked(false);
        setPin("");
        return;
      }
      if (res.reason === "pin_not_configured") {
        setError("後台 STAFF_NUMERIC_PASSWORD 未設定,請通知 IT");
        return;
      }
      if (res.reason === "invoice_already_used" && res.existing) {
        setDuplicateInfo(res.existing);
        setError(null);
        return;
      }
      if (res.reason === "invoice_already_pending") {
        setError("這張發票剛剛已經產生過 QR Code,2 分鐘內請勿重複開單");
        return;
      }
      if (res.reason === "invoice_format_invalid") {
        setError("發票編號格式錯誤,請確認");
        return;
      }
      if (res.reason === "invoice_required") {
        setError("請填發票編號");
        return;
      }
      setError(`產生失敗:${res.reason ?? "unknown"}`);
      return;
    }
    setTicket({
      token: res.token,
      amount: res.amount ?? amount,
      dice: res.dice_to_issue ?? dicePreview,
      expiresAt: new Date(res.expires_at).getTime(),
      source: res.source ?? mode,
    });
  };

  const handlePinSubmit = () => {
    if (!/^\d{4,8}$/.test(pin)) {
      setError("PIN 為 4-8 位數字");
      return;
    }
    sessionStorage.setItem(PIN_CACHE_KEY, pin);
    setPinLocked(true);
    setError(null);
  };

  const handleReset = () => {
    setTicket(null);
    setAmountInput("");
    setInvoiceInput("");
    setError(null);
    setDuplicateInfo(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(PIN_CACHE_KEY);
    setPin("");
    setPinLocked(false);
    setTicket(null);
    setAmountInput("");
  };

  // PIN gate
  if (!pinLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl"
        >
          <h1 className="text-xl font-bold text-center mb-1">💳 結帳 QR · 服務人員入口</h1>
          <p className="text-center text-xs text-muted-foreground mb-5">IC Kaohsiung Culinary Journey</p>

          <label className="block text-sm font-medium mb-2">每日 PIN</label>
          <input
            type="password"
            inputMode="numeric"
            pattern="\d*"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
            placeholder="4-8 位數字"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-lg text-center tracking-widest"
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

          <button
            onClick={handlePinSubmit}
            className="mt-4 w-full rounded-lg bg-primary text-primary-foreground py-2 font-medium hover:opacity-90"
          >
            進入
          </button>
          <p className="mt-4 text-[11px] text-muted-foreground text-center leading-relaxed">
            PIN 由餐飲部主管當日提供。瀏覽器關閉後需重新輸入。
          </p>
        </motion.div>
      </div>
    );
  }

  const isRoomCharge = mode === "room_charge";
  const isCompensation = mode === "compensation";

  return (
    <div className={`min-h-screen p-4 ${
      isCompensation
        ? "bg-gradient-to-b from-emerald-50 to-teal-100"
        : isRoomCharge
        ? "bg-gradient-to-b from-sky-50 to-indigo-100"
        : "bg-gradient-to-b from-amber-50 to-orange-100"
    }`}>
      <div className="mx-auto max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">
            {isCompensation ? "📨 補發優惠券" : isRoomCharge ? "🏨 掛房帳 QR" : "💳 結帳 QR"}
          </h1>
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground underline"
          >
            登出
          </button>
        </div>

        {/* Tony 2026-05-21: mode toggle — 結帳 / 掛房帳 / 補發. Hidden in QR
            view to avoid mid-flow switching that would invalidate the token. */}
        {!ticket && (
          <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-xl bg-white/60 p-1 shadow-sm">
            <button
              onClick={() => { setMode("checkout"); setError(null); setDuplicateInfo(null); }}
              className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                mode === "checkout"
                  ? "bg-amber-500 text-white shadow"
                  : "text-amber-900 hover:bg-amber-100"
              }`}
            >
              💳 一般結帳
            </button>
            <button
              onClick={() => { setMode("room_charge"); setError(null); setDuplicateInfo(null); }}
              className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                mode === "room_charge"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-indigo-900 hover:bg-indigo-100"
              }`}
            >
              🏨 掛房帳
            </button>
            <button
              onClick={() => { setMode("compensation"); setError(null); setDuplicateInfo(null); setCompResult(null); }}
              className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                mode === "compensation"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-emerald-900 hover:bg-emerald-100"
              }`}
            >
              📨 補發
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isCompensation && !ticket ? (
            <motion.div
              key="compensation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-card p-5 shadow-lg space-y-3"
            >
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[12px] text-emerald-900 leading-relaxed">
                📨 <strong>補發優惠券</strong> — 給客人補一張電子優惠券。
                <strong>選好獎品後產生 QR Code,讓客人掃</strong> — 跟結帳 QR 一樣的流程,
                不會推進棋盤位置。
              </div>

              {/* Reward picker */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  要補發哪一張優惠券? <span className="text-destructive">*</span>
                </label>
                <select
                  value={selectedRewardId}
                  onChange={(e) => setSelectedRewardId(e.target.value)}
                  disabled={rewardCatalog.length === 0 || issuing}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">{rewardCatalog.length === 0 ? "載入中..." : "-- 請選擇優惠券 --"}</option>
                  {rewardCatalog.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.shortName}  ·  {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-1.5">備註原因(選填)</label>
                <input
                  type="text"
                  placeholder="例:服務瑕疵補償 / 客訴處理"
                  value={compNote}
                  onChange={(e) => setCompNote(e.target.value)}
                  disabled={issuing}
                  maxLength={200}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <button
                onClick={handleIssueCompensation}
                disabled={issuing || !selectedRewardId}
                className="w-full rounded-lg bg-emerald-600 text-white py-3 font-semibold disabled:opacity-50"
              >
                {issuing ? "產生中..." : "📨 產生補發 QR"}
              </button>

              {error && (
                <p className="text-xs text-destructive text-center">{error}</p>
              )}

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                QR 有 {TICKET_TTL_MIN} 分鐘有效期,**請客人現場掃**。
                客人掃 QR 後優惠券會送到他的 LINE 聊天視窗。
              </p>
            </motion.div>
          ) : !ticket ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-card p-5 shadow-lg"
            >
              {isRoomCharge ? (
                <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 text-[12px] text-indigo-900 leading-relaxed">
                  🏨 <strong>掛房帳模式</strong> — 房客把餐費掛到房號,退房時由櫃台一起結。
                  小白單上不會有統一發票號碼,因此<strong>不需填發票編號</strong>。
                </div>
              ) : (
                <>
                  <label className="block text-sm font-medium mb-2">
                    發票編號 <span className="text-destructive">*</span>
                    <span className="ml-2 text-[11px] text-muted-foreground font-normal">
                      小白單上「發票號碼」欄
                    </span>
                  </label>
                  <input
                    type="text"
                    value={invoiceInput}
                    onChange={(e) => setInvoiceInput(e.target.value.toUpperCase())}
                    placeholder="例:BM36258896 或 BM-36258896"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-lg text-center tracking-wider font-mono"
                    maxLength={12}
                  />
                  <div className="mt-1 text-center text-[11px]">
                    {invoiceInput.length === 0 ? (
                      <span className="text-muted-foreground">2 字母 + 8 數字(系統會自動忽略「-」)</span>
                    ) : invoiceLooksValid ? (
                      <span className="text-emerald-700">✓ 格式正確</span>
                    ) : (
                      <span className="text-amber-700">格式還沒完整 / 不符</span>
                    )}
                  </div>
                </>
              )}

              <label className={`block text-sm font-medium mb-2 ${isRoomCharge ? "" : "mt-4"}`}>消費金額 (NT$)</label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ""))}
                placeholder="例:5000"
                className="w-full rounded-lg border border-input bg-background px-3 py-3 text-2xl text-center font-semibold"
              />
              <div className="mt-3 text-center text-sm">
                {dicePreview > 0 ? (
                  <span className="text-emerald-700">
                    將給予 <strong>{dicePreview}</strong> 次擲骰機會
                  </span>
                ) : (
                  <span className="text-muted-foreground">金額需 ≥ NT$2,000</span>
                )}
              </div>

              {error && (
                <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              {duplicateInfo && (
                <div className="mt-3 rounded-md bg-amber-50 border border-amber-300 p-3 text-xs text-amber-900">
                  <p className="font-bold mb-1">⛔ 這張發票已被使用過</p>
                  <div className="space-y-0.5 leading-relaxed">
                    <p>• 使用時間:<span className="font-mono">{duplicateInfo.usedAt ? new Date(duplicateInfo.usedAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "—"}</span></p>
                    <p>• 使用者:<strong>{duplicateInfo.displayName ?? duplicateInfo.userId ?? "未知"}</strong></p>
                    {duplicateInfo.tableId && <p>• 桌號:{duplicateInfo.tableId}</p>}
                    {duplicateInfo.amountTotal != null && <p>• 當時金額:NT${duplicateInfo.amountTotal.toLocaleString()}</p>}
                    {duplicateInfo.diceIssued != null && <p>• 給予擲骰:{duplicateInfo.diceIssued} 次</p>}
                    {duplicateInfo.source && (
                      <p>• 兌換方式:{
                        duplicateInfo.source === "e_invoice" ? "客人自助掃發票" :
                        duplicateInfo.source === "pos_slip" ? "客人自助拍小白單" :
                        "服務人員結帳 QR"
                      }</p>
                    )}
                  </div>
                  <button onClick={() => setDuplicateInfo(null)} className="mt-2 text-[11px] underline">關閉</button>
                </div>
              )}

              <button
                onClick={handleIssue}
                disabled={issuing || dicePreview <= 0 || (mode === "checkout" && !invoiceLooksValid)}
                className={`mt-4 w-full rounded-lg py-3 font-semibold text-white disabled:opacity-50 ${
                  isRoomCharge ? "bg-indigo-600 hover:bg-indigo-700" : "bg-primary hover:opacity-90"
                }`}
              >
                {issuing ? "產生中..." : isRoomCharge ? "🏨 產生掛房帳 QR" : "✓ 產生結帳 QR"}
              </button>

              <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                規則:每 NT$2,000 = 1 次擲骰,上限 5 次。QR 將於 {TICKET_TTL_MIN} 分鐘後失效。<br />
                {isRoomCharge
                  ? <><strong>掛房帳模式</strong> — 無發票防雙領機制,請工作人員確認金額無誤後再產生。</>
                  : <><strong>同一張發票編號只能用一次</strong> — 防雙領機制。</>}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="qr"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-card p-5 shadow-lg text-center"
            >
              {/* Mode badge — staff knows which kind of QR they're showing */}
              <div className="mb-2">
                {ticket.source === "compensation" ? (
                  <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 px-3 py-0.5 text-[11px] font-semibold">
                    📨 補發優惠券
                  </span>
                ) : ticket.source === "room_charge" ? (
                  <span className="inline-block rounded-full bg-indigo-100 text-indigo-800 px-3 py-0.5 text-[11px] font-semibold">
                    🏨 掛房帳
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-amber-100 text-amber-800 px-3 py-0.5 text-[11px] font-semibold">
                    💳 一般結帳
                  </span>
                )}
              </div>

              {ticket.source === "compensation" ? (
                <>
                  <p className="text-sm text-muted-foreground mb-1">補發的優惠券</p>
                  <p className="text-xl font-bold leading-tight px-2">{ticket.rewardName}</p>
                  <p className="text-sm text-emerald-700 mt-2 mb-4">
                    客人掃描後優惠券會送到 LINE 聊天視窗
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-1">消費金額</p>
                  <p className="text-3xl font-bold">NT$ {(ticket.amount ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-emerald-700 mt-1 mb-4">
                    掃描後獲 <strong>{ticket.dice}</strong> 次擲骰機會
                  </p>
                </>
              )}

              <div className={`mx-auto inline-block rounded-xl bg-white p-3 ${expired ? "opacity-30" : ""}`}>
                <QRCodeSVG value={ticketUrl} size={220} level="M" />
              </div>

              {/* Tony 2026-05-21: prominent expiry banner so staff doesn't show a stale QR.
                  Amber bordered box during countdown → red box on expiry. */}
              {expired ? (
                <div className="mt-4 rounded-lg border-2 border-destructive bg-destructive/10 px-3 py-2.5">
                  <p className="text-destructive font-bold text-base">⏰ QR Code 已過期</p>
                  <p className="text-xs text-destructive/80 mt-0.5">請按下方「重新產生」</p>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-2.5">
                  <p className="text-sm text-amber-900">
                    ⏱ 此 QR Code 將於{" "}
                    <strong className="text-amber-800 text-base font-mono">
                      {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                    </strong>
                    {" "}後失效
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    請客人現場掃描,過期後需請工作人員重新產生
                  </p>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-2 break-all">{ticketUrl}</p>

              <button
                onClick={handleReset}
                className="mt-5 w-full rounded-lg border border-input bg-background py-2 font-medium hover:bg-muted"
              >
                {expired ? "重新產生" : "下一桌"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminCheckoutQRPage;
