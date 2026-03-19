import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";

interface QRScannerProps {
  expectedCode: string;
  externalDomain?: string;
  onSuccess: () => void;
  onClose: () => void;
}

const QRScanner = ({ expectedCode, onSuccess, onClose }: QRScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
            // Check if scanned code matches expected
            if (decodedText === expectedCode) {
              stopScanner();
              onSuccess();
            } else {
              setError("QR Code 不正確，請掃描店家指定的 QR Code");
              setTimeout(() => setError(null), 3000);
            }
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
      stopScanner();
    };
  }, [expectedCode, onSuccess]);

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
          <h3 className="text-lg font-bold text-foreground">掃描店家 QR Code</h3>
          <h3 className="text-lg font-bold text-foreground">掃描店家 QR Code</h3>
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
          {isScanning ? "📷 請將相機對準店家提供的 QR Code" : "正在啟動相機..."}
        </p>

        {/* Manual code input fallback */}
        {error && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground text-center mb-2">或手動輸入驗證碼</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem("code") as HTMLInputElement)?.value;
                if (input === expectedCode) {
                  stopScanner();
                  onSuccess();
                } else {
                  setError("驗證碼不正確，請確認後重試");
                }
              }}
              className="flex gap-2"
            >
              <input
                name="code"
                type="text"
                placeholder="輸入驗證碼"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                驗證
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QRScanner;
