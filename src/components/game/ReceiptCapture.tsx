/**
 * 拍小白單兌換擲骰 (Phase 8.1, Tony 2026-05-15).
 *
 * For 載具客 who don't get a 電子發票證明聯, only the POS small white slip.
 * Slip has no QR / barcode so the html5-qrcode path can't work. Here we:
 *   1. Open phone camera via <input type="file" capture="environment">
 *   2. Show preview + downscale to 1024px longest side (≈ 200KB JPEG)
 *   3. POST base64 to /api/invoice/redeem-receipt
 *   4. Backend runs OpenAI gpt-4o-mini vision + triple-lock + insert
 *
 * Why downscale: gpt-4o-mini vision charges per image input token, and an
 * unscaled iPhone shot (4K) burns ~4x the tokens of a 1024px crop without
 * improving OCR accuracy. 1024px keeps all small-print legible.
 */

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { redeemReceiptImage, type InvoiceRedeemResponse } from "@/api/invoice";

interface Props {
  onSuccess: (result: InvoiceRedeemResponse) => void;
  onClose: () => void;
}

const MAX_DIMENSION_PX = 1024;
const JPEG_QUALITY = 0.85;

const REASON_TEXT: Record<string, string> = {
  not_a_receipt: "照片看不出是收據,請對準小白單再拍一次",
  not_ic_kaohsiung: "這張不像是 IC 高雄洲際的單據,請確認是本飯店的小白單",
  low_confidence: "圖片不夠清楚,請在光線充足處重拍,並對準總計與發票號碼欄位",
  vision_unavailable: "拍照辨識暫時無法使用,請洽詢服務人員",
  vision_error: "辨識服務出錯,請稍後再試或洽詢服務人員",
  image_too_large: "照片太大,請用較低解析度重拍",
  image_required: "未取得照片",
  already_redeemed: "此小白單已被使用過,無法重複領取",
  binding_already_used: "您這一桌已經兌換過一張了,每桌每次用餐只能兌換一張",
  no_active_binding: "請先掃描桌邊立牌 QR Code 加入 LINE 並綁定桌號,20 分鐘內再來",
  amount_below_threshold: "金額需滿 NT$2,000 才能換擲骰機會",
  stale_invoice: "單據日期過期,只能使用今天 / 昨天的小白單",
  no_user: "請重新登入 LINE",
  server_error: "後端發生錯誤",
};

async function fileToDownscaledDataUrl(file: File): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("image load failed"));
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  const longest = Math.max(img.width, img.height);
  const scale = longest > MAX_DIMENSION_PX ? MAX_DIMENSION_PX / longest : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

const ReceiptCapture = ({ onSuccess, onClose }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tony 2026-05-15: 2 failures → push to staff fallback (mirrors InvoiceScanner)
  const [failureCount, setFailureCount] = useState(0);

  const handleFileChosen = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      setPreviewUrl(dataUrl);
    } catch (err) {
      console.error("[ReceiptCapture] downscale failed:", err);
      setError("照片處理失敗,請換一張試試");
    }
  };

  const handleSubmit = async () => {
    if (!previewUrl) return;
    setIsProcessing(true);
    setError(null);
    const result = await redeemReceiptImage(previewUrl);
    setIsProcessing(false);
    if (result.ok) {
      onSuccess(result);
      return;
    }
    const baseMsg = REASON_TEXT[result.reason ?? ""] ?? `兌換失敗:${result.reason ?? "未知"}`;
    setError(baseMsg + (result.error ? ` (${result.error})` : ""));
    setFailureCount((c) => c + 1);
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    setError(null);
    inputRef.current?.click();
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
          <h3 className="text-lg font-bold text-foreground">拍小白單兌換擲骰</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          適用情境:您用 <strong>載具</strong>(手機條碼 / 信用卡 / 悠遊卡)存發票,
          只拿到一張白色明細單。請對著小白單拍一張清楚的照片。
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChosen}
        />

        {!previewUrl ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-input bg-muted/30 px-4 py-10 text-center text-muted-foreground hover:bg-muted/50"
          >
            <div className="text-4xl mb-2">📷</div>
            <p className="font-medium">點此開啟相機拍照</p>
            <p className="text-[11px] mt-1">建議:光線充足、單據平整、總計欄位清楚</p>
          </button>
        ) : (
          <div className="space-y-3">
            <img src={previewUrl} alt="小白單預覽" className="w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRetake}
                disabled={isProcessing}
                className="rounded-lg border border-input bg-background py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                重拍
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isProcessing ? "🔄 辨識中..." : "✓ 確認送出"}
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              <p className="font-bold mb-1">⚠️ 兌換結果</p>
              <p className="text-xs leading-relaxed">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-[11px] underline"
              >
                關閉訊息再試
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Escalation banner — same logic as InvoiceScanner.
            After 2 failed OCR attempts, direct customer to staff for manual
            "結帳 QR" backup so they're never stuck retrying a bad photo. */}
        <AnimatePresence>
          {failureCount >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-lg bg-amber-100 border border-amber-300 p-3 text-sm text-amber-900"
            >
              <p className="font-bold mb-1">🛎️ 已嘗試 {failureCount} 次仍無法兌換</p>
              <p className="text-xs leading-relaxed">
                請洽現場服務人員協助,服務人員會為您「補發結帳 QR」,
                您只需用 LINE 相機掃一次即可開始遊戲。
              </p>
              <button
                onClick={onClose}
                className="mt-2 w-full rounded-md bg-amber-200 hover:bg-amber-300 py-1.5 text-xs font-semibold"
              >
                關閉,我去找服務人員
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/80 leading-relaxed">
          AI 自動辨識「IC 高雄抬頭 + 發票號碼 + 總計 + 日期」,
          只能用當日小白單,每桌每次用餐限一張。
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ReceiptCapture;
