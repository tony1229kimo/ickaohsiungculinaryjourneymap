import { useState } from "react";
import { motion } from "framer-motion";

/**
 * Share button — uses LIFF shareTargetPicker to send a brand-awareness flex
 * message linking to /about. The /about page is intentionally read-only:
 * receivers can read about the activity but cannot play (no QR scan flow).
 *
 * Outside LIFF (regular browser, dev mock) we fall back to copying the
 * /about URL to clipboard so this still does something useful.
 */
const ShareButton = () => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const aboutUrl = `${window.location.origin}/about`;

  const shareText =
    "我在高雄洲際味蕾旅遊地圖玩得超開心 🎲\n抵達終點還能兌換招牌主餐!\n邀你一起來體驗 → ";

  const handleShare = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const liff = (await import("@line/liff")).default;
      if (liff.isApiAvailable("shareTargetPicker")) {
        const result = await liff.shareTargetPicker(
          [
            {
              type: "text",
              text: `${shareText}${aboutUrl}`,
            },
          ],
          { isMultiple: true },
        );
        if (result) {
          setFeedback(`✅ 已分享給 ${result.status === "success" ? "好友" : "好友們"}!`);
        } else {
          setFeedback(null); // user cancelled the picker
        }
        return;
      }
      // Fallback — not running in LIFF (or share API unavailable)
      throw new Error("shareTargetPicker unavailable");
    } catch (err) {
      // Final fallback — copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}${aboutUrl}`);
        setFeedback("📋 連結已複製,可貼到任何聊天室分享");
      } catch {
        setFeedback("❌ 分享失敗,請手動複製網址: " + aboutUrl);
      }
    } finally {
      setBusy(false);
      if (feedback !== null) {
        setTimeout(() => setFeedback(null), 4000);
      }
    }
  };

  return (
    <div className="text-center space-y-2">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={handleShare}
        disabled={busy}
        className="w-full py-2.5 rounded-2xl font-medium text-sm transition-all disabled:opacity-50"
        style={{
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--accent) / 0.4)",
          color: "hsl(var(--foreground))",
        }}
      >
        💌 {busy ? "分享中..." : "分享給好友 · Share with friends"}
      </motion.button>
      {feedback && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground"
        >
          {feedback}
        </motion.p>
      )}
      <p className="text-[10px] text-muted-foreground/70">
        好友收到的連結只能查看活動介紹,需親臨 IC 高雄餐廳才能參與遊戲
      </p>
    </div>
  );
};

export default ShareButton;
