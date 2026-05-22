/**
 * /coupon-used — redirect target when a customer taps the "領取優惠券" Flex
 * button after it's already been claimed once.
 *
 * Tony 2026-05-23: backend's /api/claim/:token atomic UPDATE only succeeds
 * for the first hit; subsequent hits redirect here. We just need to show a
 * friendly explanation so the customer doesn't think the system is broken.
 */

const CouponUsedPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-2xl border-2 border-amber-300 shadow-lg p-6 text-center">
        <p className="text-4xl mb-3">🎫</p>
        <h1 className="text-xl font-bold text-foreground mb-2">優惠券已領取過</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          這張優惠券您已經領取過了 — 請到 LINE 跟「<strong>高雄洲際酒店</strong>」
          官方帳號的聊天視窗,往上滑找到您先前領取的優惠券即可使用。
        </p>
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-900 text-left leading-relaxed">
          💡 <strong>找不到優惠券?</strong> 在 LINE 聊天視窗點右上角搜尋
          🔍 → 輸入「優惠券」即可找到所有已領取的券。
        </div>
        <a
          href="https://line.me/R/oaMessage/@gaohsiungic/"
          className="block mt-4 w-full px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
        >
          打開 LINE 聊天視窗
        </a>
      </div>
    </div>
  );
};

export default CouponUsedPage;
