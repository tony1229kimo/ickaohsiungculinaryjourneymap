/**
 * 客訴查詢工具 (Phase 8.3, Tony 2026-05-17).
 *
 * Use case:
 *   Customer: "我這張發票明明沒用過,為什麼系統擋我?"
 *   Service staff opens /admin/lookup, types the BM-XXXXXXXX,
 *   shows the customer who/when/where used it.
 *
 * Same PIN as /admin/checkout — staff already knows it.
 * The PIN is cached in sessionStorage shared with the checkout page,
 * so once a staff member enters PIN they don't have to re-enter when
 * switching between checkout and lookup.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { lookupInvoice, type InvoiceLookupResponse } from "@/api/staffLookup";

const PIN_CACHE_KEY = "ickhh.staff_pin";

const AdminLookupPage = () => {
  const [pin, setPin] = useState<string>(() => sessionStorage.getItem(PIN_CACHE_KEY) ?? "");
  const [pinLocked, setPinLocked] = useState<boolean>(!!sessionStorage.getItem(PIN_CACHE_KEY));
  const [invoiceInput, setInvoiceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(
    () => invoiceInput.toUpperCase().replace(/-|\s/g, "").trim(),
    [invoiceInput],
  );
  const invoiceLooksValid = /^[A-Z]{2}\d{8}$/.test(normalized);

  const handlePinSubmit = () => {
    if (!/^\d{4,8}$/.test(pin)) {
      setError("PIN 為 4-8 位數字");
      return;
    }
    sessionStorage.setItem(PIN_CACHE_KEY, pin);
    setPinLocked(true);
    setError(null);
  };

  const handleLookup = async () => {
    setError(null);
    setResult(null);
    if (!invoiceLooksValid) {
      setError("發票編號格式錯誤,請輸入 2 字母 + 8 數字");
      return;
    }
    setLoading(true);
    const res = await lookupInvoice(normalized, pin);
    setLoading(false);
    if (!res.ok) {
      if (res.reason === "invalid_pin") {
        setError("PIN 錯誤,請重新輸入");
        sessionStorage.removeItem(PIN_CACHE_KEY);
        setPinLocked(false);
        setPin("");
        return;
      }
      setError(`查詢失敗:${res.reason ?? "unknown"}`);
      return;
    }
    setResult(res);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(PIN_CACHE_KEY);
    setPin("");
    setPinLocked(false);
    setResult(null);
    setInvoiceInput("");
  };

  // PIN gate
  if (!pinLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-200 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl"
        >
          <h1 className="text-xl font-bold text-center mb-1">🔍 客訴查詢 · 服務人員入口</h1>
          <p className="text-center text-xs text-muted-foreground mb-5">IC Kaohsiung — Invoice Lookup</p>

          <label className="block text-sm font-medium mb-2">每日 PIN(同結帳 QR)</label>
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-200 p-4">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">🔍 客訴發票查詢</h1>
          <button onClick={handleLogout} className="text-xs text-muted-foreground underline">登出</button>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-lg">
          <label className="block text-sm font-medium mb-2">輸入發票編號</label>
          <input
            type="text"
            value={invoiceInput}
            onChange={(e) => setInvoiceInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="例:BM36258896 或 BM-36258896"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-lg text-center tracking-wider font-mono"
            maxLength={12}
            autoFocus
          />
          <div className="mt-1 text-center text-[11px]">
            {invoiceInput.length === 0 ? (
              <span className="text-muted-foreground">2 字母 + 8 數字</span>
            ) : invoiceLooksValid ? (
              <span className="text-emerald-700">✓ 格式正確</span>
            ) : (
              <span className="text-amber-700">格式還沒完整</span>
            )}
          </div>

          <button
            onClick={handleLookup}
            disabled={loading || !invoiceLooksValid}
            className="mt-4 w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50"
          >
            {loading ? "查詢中..." : "🔍 查詢"}
          </button>

          {error && (
            <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}

          {result && result.used && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg bg-red-50 border-2 border-red-300 p-4"
            >
              <p className="font-bold text-red-900 text-base mb-2">⛔ 此發票已被使用</p>
              <div className="space-y-1 text-sm text-red-900">
                <p><strong>發票編號:</strong><span className="font-mono">{result.invoiceNo}</span></p>
                <p><strong>使用時間:</strong>{result.usedAt ? new Date(result.usedAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "—"}</p>
                <p><strong>使用者:</strong>{result.displayName ?? <span className="text-muted-foreground">未提供姓名</span>}</p>
                {result.userId && (
                  <p className="text-[10px] text-muted-foreground">
                    LINE userId: <span className="font-mono">{result.userId}</span>
                  </p>
                )}
                {result.tableId && <p><strong>桌號:</strong>{result.tableId}</p>}
                {result.amountTotal != null && <p><strong>當時金額:</strong>NT${result.amountTotal.toLocaleString()}</p>}
                {result.diceIssued != null && <p><strong>給予擲骰:</strong>{result.diceIssued} 次</p>}
                {result.source && (
                  <p><strong>兌換方式:</strong>{
                    result.source === "e_invoice" ? "客人自助掃發票" :
                    result.source === "pos_slip" ? "客人自助拍小白單" :
                    "服務人員結帳 QR"
                  }</p>
                )}
              </div>
              <p className="mt-3 text-xs text-red-700 bg-red-100 rounded p-2 leading-relaxed">
                💡 給客人看這個畫面即可說明,系統紀錄不可竄改。
              </p>
            </motion.div>
          )}

          {result && !result.used && result.pendingTicket && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg bg-amber-50 border-2 border-amber-300 p-4"
            >
              <p className="font-bold text-amber-900 text-base mb-2">⚠️ 已產生 QR,客人尚未掃描</p>
              <div className="space-y-1 text-sm text-amber-900">
                <p><strong>發票編號:</strong><span className="font-mono">{result.invoiceNo}</span></p>
                <p><strong>QR 失效時間:</strong>{new Date(result.pendingTicket.expiresAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</p>
                <p><strong>當時金額:</strong>NT${result.pendingTicket.amount.toLocaleString()}</p>
              </div>
              <p className="mt-3 text-xs text-amber-700 bg-amber-100 rounded p-2 leading-relaxed">
                這張發票剛剛已開過 QR,過期後或客人掃完才能再用。請等待 2 分鐘或請客人立即掃。
              </p>
            </motion.div>
          )}

          {result && !result.used && !result.pendingTicket && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg bg-emerald-50 border-2 border-emerald-300 p-4"
            >
              <p className="font-bold text-emerald-900 text-base mb-2">✅ 此發票尚未使用</p>
              <div className="space-y-1 text-sm text-emerald-900">
                <p><strong>發票編號:</strong><span className="font-mono">{result.invoiceNo}</span></p>
                <p>客人可以正常使用,請引導他自助掃描,或為他開結帳 QR。</p>
              </div>
            </motion.div>
          )}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground text-center leading-relaxed">
          所有查詢都會記錄在系統日誌中。請勿用於非客訴目的。
        </p>
      </div>
    </div>
  );
};

export default AdminLookupPage;
