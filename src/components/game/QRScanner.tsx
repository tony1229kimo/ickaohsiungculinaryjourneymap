import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";

interface QRScannerProps {
  expectedCode: string;
  externalDomain?: string;
  onSuccess: () => void;
  /**
   * Tony 2026-05-22: customers already inside LIFF should be able to scan a
   * staff-issued checkout / room-charge QR without leaving the app. Those QRs
   * encode `https://.../?ticket=<token>`. When the scanner detects that URL
   * pattern it calls onTicketScanned(token); the parent then sets ?ticket=
   * in the URL and the existing useEffect in Index.tsx redeems it.
   */
  onTicketScanned?: (token: string) => void;
  onClose: () => void;
}

const QRScanner = ({ expectedCode, externalDomain = "ickhh-culinary-game-v2.zeabur.app", onSuccess, onTicketScanned, onClose }: QRScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  // Tony 2026-05-22: keep this in state so it doesn't get cleared between renders.
  // Independent from `error` (which auto-clears) so the input never flickers.
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      if (!containerRef.current) return;

      try {
        scannerRef.current = new Html5Qrcode("qr-reader");
        setIsScanning(true);

        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Priority 1: checkout / room-charge ticket URL (?ticket=<token>).
            // Customer is already in LIFF and the staff just showed them a
            // dynamic QR — extract the token and let the parent redeem it.
            const ticketMatch = decodedText.match(/[?&]ticket=([A-Za-z0-9_-]+)/);
            if (ticketMatch && onTicketScanned) {
              stopScanner();
              onTicketScanned(ticketMatch[1]);
              return;
            }

            // Priority 2: restaurant QR — either the exact verification code
            // (printed on table cards) or a URL pointing back to our domain.
            const isValid = decodedText === expectedCode ||
              (externalDomain && decodedText.includes(externalDomain));
            if (isValid) {
              stopScanner();
              onSuccess();
              return;
            }

            setError("QR Code 不正確，請對準店家 QR 或結帳 QR");
            // Debounce: clear any pending timer before scheduling a new one,
            // otherwise overlapping scans queue multiple re-renders that flash the UI.
            if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
            errorTimerRef.current = setTimeout(() => setError(null), 3000);
          },
          () => {
            // Ignore scan failures (no QR in frame)
          },
        );
      } catch (err) {
        console.error("Camera error:", err);
        setError("無法開啟相機，請確認已授權相機權限");
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      stopScanner();
    };
  }, [expectedCode, onSuccess]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (!trimmed) {
      setManualError("請輸入驗證碼");
      return;
    }
    if (trimmed === expectedCode) {
      stopScanner();
      onSuccess();
    } else {
      setManualError("驗證碼不正確，請確認後重試");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
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
          <h3 className="text-lg font-bold text-foreground">掃描 QR Code</h3>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 overflow-hidden rounded-xl bg-black" ref={containerRef}>
          <div id="qr-reader" className="w-full" />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-muted-foreground mb-3">
          {isScanning ? "📷 請對準店家 QR 或結帳 QR" : "正在啟動相機..."}
        </p>

        {/* Manual code input — ALWAYS visible (Tony 2026-05-22).
            Previously was {error && (...)} which made the input flicker every time
            the auto-clearing error toggled, causing focus loss and staff couldn't
            type. Now controlled by manualCode state, decoupled from scan errors. */}
        <div className="mt-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground text-center mb-2">或手動輸入驗證碼</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              autoComplete="off"
              inputMode="text"
              placeholder="輸入驗證碼"
              value={manualCode}
              onChange={(e) => { setManualCode(e.target.value); setManualError(null); }}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              驗證
            </button>
          </form>
          {manualError && (
            <p className="mt-2 text-xs text-destructive text-center">{manualError}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QRScanner;
