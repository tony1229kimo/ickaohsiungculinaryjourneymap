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
import { issueCheckoutTicket } from "@/api/checkoutTicket";

const PIN_CACHE_KEY = "ickhh.staff_pin";
// The customer scans QR with LINE camera → opens external browser → LIFF.
// We hardcode the public game URL so staff can issue from any browser, not
// just the LIFF webview. window.location.origin works on the LIFF host too.
const gameOrigin = () => window.location.origin;

const AdminCheckoutQRPage = () => {
  const [pin, setPin] = useState<string>(() => sessionStorage.getItem(PIN_CACHE_KEY) ?? "");
  const [pinLocked, setPinLocked] = useState<boolean>(!!sessionStorage.getItem(PIN_CACHE_KEY));
  const [amountInput, setAmountInput] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [ticket, setTicket] = useState<{ token: string; amount: number; dice: number; expiresAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Countdown ticker — only when a ticket exists
  useEffect(() => {
    if (!ticket) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [ticket]);

  const dicePreview = useMemo(() => {
    const n = parseInt(amountInput, 10);
    if (!Number.isFinite(n) || n < 2000) return 0;
    return Math.min(Math.floor(n / 2000), 5);
  }, [amountInput]);

  const secondsLeft = ticket ? Math.max(0, Math.ceil((ticket.expiresAt - now) / 1000)) : 0;
  const expired = ticket && secondsLeft <= 0;

  const ticketUrl = ticket ? `${gameOrigin()}/?ticket=${encodeURIComponent(ticket.token)}` : "";

  const handleIssue = async () => {
    setError(null);
    const amount = parseInt(amountInput, 10);
    if (!Number.isFinite(amount) || amount < 2000) {
      setError("金額需 ≥ NT$2,000 才有擲骰機會");
      return;
    }
    setIssuing(true);
    const res = await issueCheckoutTicket(amount, pin);
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
      setError(`產生失敗:${res.reason ?? "unknown"}`);
      return;
    }
    setTicket({
      token: res.token,
      amount: res.amount ?? amount,
      dice: res.dice_to_issue ?? dicePreview,
      expiresAt: new Date(res.expires_at).getTime(),
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
    setError(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-4">
      <div className="mx-auto max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">💳 結帳 QR</h1>
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground underline"
          >
            登出
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!ticket ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-card p-5 shadow-lg"
            >
              <label className="block text-sm font-medium mb-2">消費金額 (NT$)</label>
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

              <button
                onClick={handleIssue}
                disabled={issuing || dicePreview <= 0}
                className="mt-4 w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50"
              >
                {issuing ? "產生中..." : "✓ 產生 QR Code"}
              </button>

              <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                規則:每 NT$2,000 = 1 次擲骰,上限 5 次。QR 將於 2 分鐘後失效。
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
              <p className="text-sm text-muted-foreground mb-1">消費金額</p>
              <p className="text-3xl font-bold">NT$ {ticket.amount.toLocaleString()}</p>
              <p className="text-sm text-emerald-700 mt-1 mb-4">
                掃描後獲 <strong>{ticket.dice}</strong> 次擲骰機會
              </p>

              <div className={`mx-auto inline-block rounded-xl bg-white p-3 ${expired ? "opacity-30" : ""}`}>
                <QRCodeSVG value={ticketUrl} size={220} level="M" />
              </div>

              <div className="mt-4">
                {expired ? (
                  <p className="text-destructive font-semibold">⏰ 已過期,請重新產生</p>
                ) : (
                  <p className="text-sm">
                    ⏱ 此 QR 將於 <strong className="text-amber-700">{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</strong> 後失效
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1 break-all">{ticketUrl}</p>
              </div>

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
