import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { redeemInvoice, type InvoiceRedeemResponse } from "@/api/invoice";

/**
 * 掃台灣電子發票左側 QR → POST 後端 redeem → 拿擲骰機會
 *
 * Frontend job:
 *   1. 開相機
 *   2. 掃任何 QR
 *   3. 簡單驗:長度 ≥ 77 且前 10 字 = 2 alpha + 8 digit(發票字軌格式)
 *   4. POST 給後端 — 後端負責 deep parse + dedup + binding check
 *
 * 故意不在前端 parse 太多 — 避免兩邊 parser 對不齊。後端是唯一真相。
 */

interface Props {
  onSuccess: (result: InvoiceRedeemResponse) => void;
  onClose: () => void;
}

const INVOICE_NO_PREFIX = /^[A-Z]{2}\d{8}/i;

const REASON_TEXT: Record<string, string> = {
  already_redeemed: "此發票已被使用過,無法重複領取",
  no_active_binding: "請先掃描桌邊立牌 QR Code 加入 LINE 並綁定桌號,然後 20 分鐘內再來掃發票",
  amount_below_threshold: "發票金額需滿 NT$2,000 才能換擲骰機會",
  parse_failed: "QR 解析失敗,請確認您掃的是電子發票左側的 QR Code",
  qr_required: "未取得 QR 資料",
  no_user: "請重新登入 LINE",
  server_error: "後端發生錯誤",
  wrong_seller: "這張發票不是 IC 高雄洲際開的,請確認您掃的是本飯店的電子發票",
  stale_invoice: "發票日期過期,只能使用今天 / 昨天開立的發票",
  binding_already_used: "您這一桌已經兌換過一張發票了,每桌每次用餐只能兌換一張",
};

const InvoiceScanner = ({ onSuccess, onClose }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanFeedback, setLastScanFeedback] = useState<string | null>(null);
  // Tony 2026-05-15: after 2 failed scans escalate to staff fallback so
  // the customer isn't stuck retrying the same broken invoice indefinitely.
  const [failureCount, setFailureCount] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false); // prevent double-submit on rapid double-scan

  useEffect(() => {
    const start = async () => {
      try {
        scannerRef.current = new Html5Qrcode("invoice-qr-reader");
        setIsScanning(true);

        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (handledRef.current) return;

            // Immediate visual confirmation that the camera DID see *something*.
            // Tony 2026-05-14 feedback: 「不知道是否成功掃過」 — UX gap fixed.
            setLastScanFeedback(`📷 偵測到 QR (${decodedText.length} 字)`);

            // Quick sanity check — does this look like a 台灣電子發票?
            if (!INVOICE_NO_PREFIX.test(decodedText) || decodedText.length < 77) {
              setError(`這 QR 不是電子發票格式(掃到內容:${decodedText.slice(0, 30)}...)。請對準發票左側的 QR Code 再試`);
              setFailureCount((c) => c + 1);
              return;
            }

            handledRef.current = true;
            setIsProcessing(true);
            await stopScanner();

            const result = await redeemInvoice(decodedText);
            setIsProcessing(false);
            if (result.ok) {
              onSuccess(result);
            } else {
              const baseMsg = REASON_TEXT[result.reason ?? ""] ?? `兌換失敗:${result.reason ?? "未知"}`;
              // Append server-side error detail when reason === server_error
              const detail = result.error ? ` (${result.error})` : "";
              setError(baseMsg + detail);
              setFailureCount((c) => c + 1);
              handledRef.current = false; // allow retry
              // restart scanner so user can rescan a different invoice
              setTimeout(() => start(), 800);
            }
          },
          () => {
            // ignore individual scan failures
          },
        );
      } catch (err) {
        console.error("[InvoiceScanner] camera error:", err);
        setError("無法開啟相機,請允許相機權限後再試");
      }
    };
    start();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // best-effort
      }
    }
    setIsScanning(false);
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">掃描發票 QR Code</h3>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 overflow-hidden rounded-xl bg-black">
          <div id="invoice-qr-reader" className="w-full" />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              <p className="font-bold mb-1">⚠️ 掃描結果</p>
              <p className="text-xs leading-relaxed">{error}</p>
              <button
                onClick={() => { setError(null); setLastScanFeedback(null); }}
                className="mt-2 text-[11px] underline"
              >
                關閉訊息再試
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Escalation banner — after 2 failures, push the customer to ask staff
            for the manual "結帳 QR" backup. Tony 2026-05-15. */}
        <AnimatePresence>
          {failureCount >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-lg bg-amber-100 border border-amber-300 p-3 text-sm text-amber-900"
            >
              <p className="font-bold mb-1">🛎️ 已嘗試 {failureCount} 次仍無法兌換</p>
              <p className="text-xs leading-relaxed">
                請洽現場服務人員協助,服務人員會為您「補發結帳 QR」,
                您只需用 LINE 相機掃一次即可開始遊戲。
              </p>
              <button
                onClick={handleClose}
                className="mt-2 w-full rounded-md bg-amber-200 hover:bg-amber-300 py-1.5 text-xs font-semibold"
              >
                關閉,我去找服務人員
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-muted-foreground mb-1">
          {isProcessing
            ? "🔄 正在驗證發票..."
            : isScanning
              ? "📷 請對準發票左側的 QR Code"
              : "正在啟動相機..."}
        </p>
        {lastScanFeedback && !error && !isProcessing && (
          <p className="text-center text-[11px] text-accent-foreground bg-accent/20 rounded-md py-1 px-2 mb-1">
            {lastScanFeedback}
          </p>
        )}
        <p className="text-center text-[11px] text-muted-foreground/80">
          發票需在 20 分鐘內掃過桌邊 LINE QR 後使用,且每張只能用一次
        </p>
      </motion.div>
    </motion.div>
  );
};

export default InvoiceScanner;
