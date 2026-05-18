/**
 * IC 高雄洲際 · 員工操作手冊 v2 · 雙語版 (重做)
 * Staff Operations Guide v2 · Bilingual (Redo)
 *
 * Tony 2026-05-18 要求重做:網址要寫得很清楚和明瞭、怎麼查詢要詳細.
 * 改動重點:
 *   - 每個關鍵網址放大,monospace, 配 QR Code(掃了直接開)
 *   - 三大任務各有專屬「逐步教學」頁面(含模擬畫面)
 *   - 加「如何把網址存到手機桌面」教學頁
 *   - 加「練習情境」頁讓主管演練
 *
 * Run: NODE_PATH="$(npm root -g)" node build_staff_bilingual_pptx.cjs
 * Output: IC_Kaohsiung_Game_Staff_Bilingual.pptx (20 slides)
 */

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const QRCode = require("qrcode");
const fs = require("fs");
const {
  FaHotel, FaQrcode, FaReceipt, FaCamera, FaCheckCircle, FaDice, FaGift,
  FaMobileAlt, FaPlayCircle, FaUtensils, FaTrophy, FaSmile, FaBell, FaUsers,
  FaUserTie, FaUserCog, FaSearch, FaTimesCircle, FaShieldAlt, FaLock,
  FaExclamationTriangle, FaBan, FaPhone, FaMapMarkerAlt, FaClock,
  FaBuilding, FaConciergeBell, FaWineGlassAlt, FaFish, FaPepperHot,
  FaUtensilSpoon, FaCocktail, FaArrowRight, FaApple, FaAndroid, FaLink,
  FaHandPointer, FaBookmark, FaKeyboard, FaCircle,
} = require("react-icons/fa");

// ─── IC 高雄洲際 官方品牌色 ────────────────────────────────────
const BLACK     = "3D3935";
const PINK      = "CEB4A9";
const LIGHTGREY = "DAD9D6";
const DARKGREY  = "686869";
const WHITE     = "FFFFFF";
const PINK_TINT = "F4ECE7";
const SOFT_BG   = "FAF8F6";
const CODE_BG   = "F2EDE9";
const ALMOST_BLACK = "26211E";
const SUCCESS_GREEN = "065F46";
const SUCCESS_BG    = "ECFDF5";
const DANGER_RED    = "991B1B";
const DANGER_BG     = "FEF2F2";
const WARN_AMBER    = "B45309";
const WARN_BG       = "FEF3C7";

// ─── React Icon → base64 PNG ───────────────────────────────────
function renderSvg(IconComp, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color: "#" + color, size: String(size) })
  );
}
async function icon(IconComp, color, size = 256) {
  const svg = renderSvg(IconComp, color, size);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ─── URL → QR base64 PNG ───────────────────────────────────────
async function urlToQR(url, size = 400) {
  return await QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    width: size,
    margin: 1,
    color: { dark: "#" + BLACK, light: "#" + WHITE },
  });
}

// ─── Restaurant QR PNG → base64 ────────────────────────────────
function qrBase64(code) {
  const mapping = { ZL: "qr_ZL_Zhan_Lu.png", WR: "qr_WR_WA-RA.png",
    SD: "qr_SD_SEEDS.png", HW: "qr_HW_HAWKER.png", BL: "qr_BL_BLT33.png" };
  const filePath = "C:/Users/ChenVivi/OneDrive - Six Continents Hotels, Inc/Desktop/Claude/ickaohsiungculinaryjourneymap/docs/qr-codes/" + mapping[code];
  return "image/png;base64," + fs.readFileSync(filePath).toString("base64");
}

const SHADOW = () => ({ type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.06 });

// ─── Main URLs ─────────────────────────────────────────────────
const URL_CHECKOUT  = "https://ickhh-culinary-game-v2.zeabur.app/admin/checkout";
const URL_LOOKUP    = "https://ickhh-culinary-game-v2.zeabur.app/admin/lookup";
const URL_CUSTOMERS = "https://ickhh-culinary-game-v2.zeabur.app/admin/customers";
const PIN = "91097496";

async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
  pres.author = "Tony Chen · IC Kaohsiung";
  pres.title = "IC Kaohsiung · Staff Operations Guide v2";

  // Pre-render icons
  const ic = {
    hotel:    await icon(FaHotel, PINK),
    qr:       await icon(FaQrcode, PINK),
    qrB:      await icon(FaQrcode, BLACK),
    qrW:      await icon(FaQrcode, WHITE),
    receipt:  await icon(FaReceipt, PINK),
    camera:   await icon(FaCamera, PINK),
    check:    await icon(FaCheckCircle, BLACK),
    cross:    await icon(FaTimesCircle, BLACK),
    ban:      await icon(FaBan, BLACK),
    shield:   await icon(FaShieldAlt, PINK),
    dice:     await icon(FaDice, PINK),
    users:    await icon(FaUsers, PINK),
    tie:      await icon(FaUserTie, PINK),
    cog:      await icon(FaUserCog, PINK),
    bell:     await icon(FaBell, PINK),
    bellB:    await icon(FaBell, BLACK),
    search:   await icon(FaSearch, PINK),
    searchB:  await icon(FaSearch, BLACK),
    lock:     await icon(FaLock, PINK),
    warn:     await icon(FaExclamationTriangle, BLACK),
    gift:     await icon(FaGift, PINK),
    phone:    await icon(FaPhone, PINK),
    pin:      await icon(FaMapMarkerAlt, PINK),
    clock:    await icon(FaClock, PINK),
    building: await icon(FaBuilding, PINK),
    fish:     await icon(FaFish, PINK),
    pepper:   await icon(FaPepperHot, PINK),
    spoon:    await icon(FaUtensilSpoon, PINK),
    cocktail: await icon(FaCocktail, PINK),
    utensils: await icon(FaUtensils, PINK),
    arrow:    await icon(FaArrowRight, BLACK),
    arrowP:   await icon(FaArrowRight, PINK),
    play:     await icon(FaPlayCircle, PINK),
    mobile:   await icon(FaMobileAlt, PINK),
    apple:    await icon(FaApple, BLACK),
    android:  await icon(FaAndroid, BLACK),
    link:     await icon(FaLink, PINK),
    pointer:  await icon(FaHandPointer, PINK),
    bookmark: await icon(FaBookmark, PINK),
    keyboard: await icon(FaKeyboard, PINK),
    circle:   await icon(FaCircle, PINK),
  };

  // Pre-generate URL QRs
  const qrCheckout  = await urlToQR(URL_CHECKOUT);
  const qrLookup    = await urlToQR(URL_LOOKUP);
  const qrCustomers = await urlToQR(URL_CUSTOMERS);

  // Helper: header band with bilingual title
  function header(s, cnTitle, enTitle) {
    s.addText(cnTitle, { x: 0.6, y: 0.4, w: 12, h: 0.7,
      fontSize: 32, color: BLACK, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText(enTitle, { x: 0.6, y: 1.05, w: 12, h: 0.35,
      fontSize: 13, color: DARKGREY, italic: true, charSpacing: 2, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.5, w: 1.0, h: 0.04, fill: { color: PINK }, line: { color: PINK } });
  }
  function footer(s, n, total) {
    s.addText(`${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
      x: 12.3, y: 7.15, w: 0.9, h: 0.3,
      fontSize: 9, color: DARKGREY, align: "right", margin: 0, fontFace: "Consolas",
    });
    s.addText("IC Kaohsiung · Staff Guide v2026-05-18", {
      x: 0.6, y: 7.15, w: 6, h: 0.3,
      fontSize: 9, color: DARKGREY, margin: 0,
    });
  }

  // Helper: render a "URL card" with monospace text + QR
  function urlCard(s, x, y, w, label_cn, label_en, url, qrData, options = {}) {
    const h = options.h ?? 2.0;
    const tagColor = options.color ?? BLACK;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: WHITE },
      line: { color: tagColor, width: 1.5 }, shadow: SHADOW() });
    // Left accent
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.15, h, fill: { color: tagColor }, line: { color: tagColor } });

    // Right: QR
    const qrSize = h - 0.4;
    s.addImage({ data: qrData, x: x + w - qrSize - 0.2, y: y + 0.2, w: qrSize, h: qrSize });

    // Center: labels + URL
    s.addText(label_cn, { x: x + 0.4, y: y + 0.15, w: w - qrSize - 0.7, h: 0.35,
      fontSize: 14, color: BLACK, bold: true, margin: 0 });
    s.addText(label_en, { x: x + 0.4, y: y + 0.5, w: w - qrSize - 0.7, h: 0.3,
      fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    // URL box (monospace, prominent)
    const urlY = y + 0.9;
    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.4, y: urlY, w: w - qrSize - 0.7, h: 0.55,
      fill: { color: CODE_BG }, line: { color: tagColor, width: 0.5 } });
    s.addText(url, { x: x + 0.45, y: urlY, w: w - qrSize - 0.8, h: 0.55,
      fontSize: 12, color: BLACK, fontFace: "Consolas", bold: true, valign: "middle", margin: 0 });

    if (options.hint) {
      s.addText(options.hint, { x: x + 0.4, y: urlY + 0.6, w: w - qrSize - 0.7, h: 0.3,
        fontSize: 10, color: DARKGREY, italic: true, margin: 0 });
    }
  }

  const TOTAL = 20;
  let n = 0;

  // ═══════════════════════════════════════════════════════════════
  // 1. Cover
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    s.addImage({ data: ic.hotel, x: 0.8, y: 0.7, w: 0.65, h: 0.65 });
    s.addText("InterContinental", { x: 1.6, y: 0.7, w: 8, h: 0.4,
      fontSize: 14, color: PINK, fontFace: "Georgia", italic: true, charSpacing: 3, margin: 0 });
    s.addText("KAOHSIUNG · 高雄洲際酒店", { x: 1.6, y: 1.1, w: 8, h: 0.35,
      fontSize: 11, color: LIGHTGREY, charSpacing: 2, margin: 0 });

    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.4, w: 1.5, h: 0.04, fill: { color: PINK }, line: { color: PINK } });

    s.addText("員工操作手冊", { x: 0.8, y: 2.7, w: 12, h: 1.0,
      fontSize: 64, color: WHITE, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("Staff Operations Guide", { x: 0.8, y: 3.7, w: 12, h: 0.5,
      fontSize: 24, color: PINK, fontFace: "Georgia", italic: true, charSpacing: 2, margin: 0 });

    s.addText("詳盡網址清單 · 逐步教學 · 各餐廳專屬", { x: 0.8, y: 4.65, w: 12, h: 0.45,
      fontSize: 18, color: LIGHTGREY, margin: 0 });
    s.addText("Detailed URLs · Step-by-step Tutorials · Per-Outlet Guide", { x: 0.8, y: 5.1, w: 12, h: 0.4,
      fontSize: 13, color: DARKGREY, italic: true, margin: 0 });

    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 6.4, w: 11.6, h: 0.04, fill: { color: PINK }, line: { color: PINK } });
    s.addText("Tony Chen  ·  tony.chen6@ihg.com  ·  v2026-05-18", {
      x: 0.8, y: 6.55, w: 12, h: 0.3, fontSize: 11, color: LIGHTGREY, margin: 0 });
    s.addText("This guide will teach you EVERY URL, PIN, and action you need.", {
      x: 0.8, y: 6.9, w: 12, h: 0.3, fontSize: 10, color: DARKGREY, italic: true, margin: 0 });
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. 三個關鍵網址 + PIN
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "您要記的三個網址 + 一組 PIN", "Three URLs + One PIN You Must Remember");

    s.addText("用 LINE 相機掃下面的 QR 直接開,或長按網址加進手機桌面", {
      x: 0.6, y: 1.7, w: 12, h: 0.3, fontSize: 11, color: BLACK, margin: 0 });
    s.addText("Scan the QR with LINE camera to open instantly, or long-press URL to save to home screen.", {
      x: 0.6, y: 2.0, w: 12, h: 0.3, fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    urlCard(s, 0.6, 2.45, 12.1, "1. 結帳 QR 工具 / Checkout QR Tool", "服務人員幫客人補發擲骰機會 · For staff to issue QR to stuck customer",
      URL_CHECKOUT, qrCheckout, { color: BLACK, h: 1.4 });

    urlCard(s, 0.6, 3.95, 12.1, "2. 客訴查詢工具 / Customer Lookup Tool", "查發票是否被用過 + 誰用的 · Verify if invoice used / by whom",
      URL_LOOKUP, qrLookup, { color: BLACK, h: 1.4 });

    // PIN big display
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 5.45, w: 12.1, h: 1.4,
      fill: { color: PINK_TINT }, line: { color: PINK, width: 2 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 5.45, w: 0.15, h: 1.4, fill: { color: PINK }, line: { color: PINK } });
    s.addImage({ data: ic.lock, x: 0.95, y: 5.85, w: 0.7, h: 0.7 });
    s.addText("3. PIN 密碼 / PIN Password", { x: 1.85, y: 5.55, w: 7, h: 0.4,
      fontSize: 14, color: BLACK, bold: true, margin: 0 });
    s.addText("以上兩個網址都用這組 PIN / Same PIN for both URLs above", { x: 1.85, y: 5.95, w: 7, h: 0.3,
      fontSize: 10, color: DARKGREY, italic: true, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 1.85, y: 6.3, w: 4.0, h: 0.5, fill: { color: WHITE }, line: { color: PINK, width: 1 } });
    s.addText(PIN, { x: 1.85, y: 6.3, w: 4.0, h: 0.5,
      fontSize: 32, color: BLACK, bold: true, fontFace: "Consolas", align: "center", valign: "middle", charSpacing: 6, margin: 0 });

    s.addText("⚠️ 只能口頭傳達 · 千萬不要寫在紙條貼牆上", { x: 6.5, y: 6.05, w: 6.0, h: 0.35,
      fontSize: 12, color: DANGER_RED, bold: true, margin: 0 });
    s.addText("Verbal only — never post the PIN on a wall note.", { x: 6.5, y: 6.4, w: 6.0, h: 0.3,
      fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. 把網址存到手機桌面 (iOS + Android)
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "把網址存進手機桌面 · 一秒打開", "Save URLs to Home Screen · One-tap Access");

    s.addText("加進桌面後就跟 App 一樣 — 一個圖示直接開,不用每次輸網址", {
      x: 0.6, y: 1.7, w: 12, h: 0.3, fontSize: 11, color: BLACK, margin: 0 });
    s.addText("Once added, opens like an app — no typing the URL each time.", {
      x: 0.6, y: 2.0, w: 12, h: 0.3, fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    // iOS column
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.55, w: 6.0, h: 4.45,
      fill: { color: SOFT_BG }, line: { color: BLACK, width: 1 }, shadow: SHADOW() });
    s.addImage({ data: ic.apple, x: 0.85, y: 2.75, w: 0.6, h: 0.6 });
    s.addText("iOS (iPhone / Safari)", { x: 1.6, y: 2.8, w: 5, h: 0.5,
      fontSize: 18, color: BLACK, bold: true, margin: 0 });

    const iosSteps = [
      { cn: "在 Safari 開啟網址(掃 QR 或手動輸入)", en: "Open URL in Safari (scan QR or type)" },
      { cn: "點底部分享圖示  ⎯  ➞", en: "Tap the share icon at bottom" },
      { cn: "向下捲找到「加入主畫面」", en: "Scroll down → 'Add to Home Screen'" },
      { cn: "取名稱(例:結帳 QR)→ 加入", en: "Name it (e.g., '結帳 QR') → Add" },
    ];
    iosSteps.forEach((stp, i) => {
      const y = 3.5 + i * 0.85;
      s.addShape(pres.shapes.OVAL, { x: 0.85, y, w: 0.42, h: 0.42, fill: { color: BLACK } });
      s.addText(String(i + 1), { x: 0.85, y, w: 0.42, h: 0.42, fontSize: 16,
        color: PINK, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(stp.cn, { x: 1.4, y: y - 0.05, w: 5.0, h: 0.3,
        fontSize: 12, color: BLACK, margin: 0 });
      s.addText(stp.en, { x: 1.4, y: y + 0.25, w: 5.0, h: 0.3,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
    });

    // Android column
    s.addShape(pres.shapes.RECTANGLE, { x: 6.85, y: 2.55, w: 5.85, h: 4.45,
      fill: { color: SOFT_BG }, line: { color: BLACK, width: 1 }, shadow: SHADOW() });
    s.addImage({ data: ic.android, x: 7.1, y: 2.75, w: 0.6, h: 0.6 });
    s.addText("Android (Chrome)", { x: 7.85, y: 2.8, w: 5, h: 0.5,
      fontSize: 18, color: BLACK, bold: true, margin: 0 });

    const andSteps = [
      { cn: "在 Chrome 開啟網址(掃 QR 或手動輸入)", en: "Open URL in Chrome (scan QR or type)" },
      { cn: "點右上角  ⋮  選單", en: "Tap the ⋮ menu (top right)" },
      { cn: "找到「加到主畫面」", en: "Tap 'Add to Home screen'" },
      { cn: "取名稱 → 加入", en: "Name it → Add" },
    ];
    andSteps.forEach((stp, i) => {
      const y = 3.5 + i * 0.85;
      s.addShape(pres.shapes.OVAL, { x: 7.1, y, w: 0.42, h: 0.42, fill: { color: BLACK } });
      s.addText(String(i + 1), { x: 7.1, y, w: 0.42, h: 0.42, fontSize: 16,
        color: PINK, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(stp.cn, { x: 7.65, y: y - 0.05, w: 4.9, h: 0.3,
        fontSize: 12, color: BLACK, margin: 0 });
      s.addText(stp.en, { x: 7.65, y: y + 0.25, w: 4.9, h: 0.3,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. 三大任務一覽
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "您一天會做的三件事", "Your Three Daily Tasks");

    s.addText("90% 時間什麼都不用做。客人自己玩 → 您只在這三種狀況介入。", {
      x: 0.6, y: 1.7, w: 12, h: 0.3, fontSize: 12, color: BLACK, margin: 0 });
    s.addText("90% no-op. Intervene only in these three scenarios.", {
      x: 0.6, y: 2.0, w: 12, h: 0.3, fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    const tasks = [
      { letter: "A", icon: ic.pointer,
        cn: "客人問怎麼玩",  en: "Customer asks how to play",
        action_cn: "帶到 QR 立牌前,口頭教",
        action_en: "Walk to standee, demo verbally",
        url: "(不用網址)", url_label: "No URL needed",
        time_cn: "5 秒", time_en: "5 sec" },
      { letter: "B", icon: ic.qrB,
        cn: "客人卡關 / 用載具", en: "Customer stuck / uses carrier",
        action_cn: "開「結帳 QR」幫他補發",
        action_en: "Issue Checkout QR for them",
        url: "/admin/checkout", url_label: "Checkout QR URL",
        time_cn: "30 秒", time_en: "30 sec" },
      { letter: "C", icon: ic.searchB,
        cn: "客人吵發票沒用過", en: "Customer disputes invoice",
        action_cn: "用「客訴查詢」查紀錄",
        action_en: "Use Lookup to verify",
        url: "/admin/lookup", url_label: "Lookup URL",
        time_cn: "15 秒", time_en: "15 sec" },
    ];
    tasks.forEach((t, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.55, w: 4.0, h: 4.45,
        fill: { color: WHITE }, line: { color: BLACK, width: 1.5 }, shadow: SHADOW() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.55, w: 4.0, h: 0.9, fill: { color: BLACK } });

      s.addText("TASK", { x: x + 0.2, y: 2.65, w: 1.0, h: 0.25,
        fontSize: 9, color: LIGHTGREY, charSpacing: 3, margin: 0 });
      s.addText(t.letter, { x: x + 0.2, y: 2.85, w: 1.0, h: 0.5,
        fontSize: 36, color: PINK, bold: true, fontFace: "Georgia", margin: 0 });
      s.addImage({ data: t.icon, x: x + 3.1, y: 2.85, w: 0.7, h: 0.7 });

      s.addText(t.cn, { x: x + 0.25, y: 3.6, w: 3.5, h: 0.4,
        fontSize: 18, color: BLACK, bold: true, margin: 0 });
      s.addText(t.en, { x: x + 0.25, y: 4.0, w: 3.5, h: 0.3,
        fontSize: 11, color: DARKGREY, italic: true, margin: 0 });

      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.25, y: 4.45, w: 3.5, h: 0.04, fill: { color: PINK }, line: { color: PINK } });

      s.addText("您要做 / Your action", { x: x + 0.25, y: 4.55, w: 3.5, h: 0.25,
        fontSize: 9, color: PINK, charSpacing: 2, margin: 0 });
      s.addText(t.action_cn, { x: x + 0.25, y: 4.8, w: 3.5, h: 0.35,
        fontSize: 12, color: BLACK, margin: 0 });
      s.addText(t.action_en, { x: x + 0.25, y: 5.15, w: 3.5, h: 0.3,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });

      s.addText("網址 / URL", { x: x + 0.25, y: 5.55, w: 3.5, h: 0.25,
        fontSize: 9, color: PINK, charSpacing: 2, margin: 0 });
      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.25, y: 5.8, w: 3.5, h: 0.4,
        fill: { color: CODE_BG }, line: { color: LIGHTGREY, width: 0.5 } });
      s.addText(t.url, { x: x + 0.25, y: 5.8, w: 3.5, h: 0.4,
        fontSize: 11, color: BLACK, fontFace: "Consolas", bold: true, align: "center", valign: "middle", margin: 0 });

      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.25, y: 6.35, w: 3.5, h: 0.5, fill: { color: PINK_TINT } });
      s.addText(t.time_cn + "  ·  " + t.time_en, { x: x + 0.25, y: 6.35, w: 3.5, h: 0.5,
        fontSize: 16, color: BLACK, bold: true, align: "center", valign: "middle", margin: 0 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. Task A walkthrough — 客人問怎麼玩
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "TASK A · 客人問「這遊戲怎麼玩?」", "TASK A · When Customer Asks How to Play");

    // Script box left
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.8, w: 7.0, h: 5.2,
      fill: { color: SOFT_BG }, line: { color: BLACK, width: 1 }, shadow: SHADOW() });

    s.addText("您可以這樣說 / What to say", { x: 0.85, y: 1.95, w: 6.5, h: 0.35,
      fontSize: 12, color: PINK, bold: true, charSpacing: 2, margin: 0 });

    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 2.4, w: 6.5, h: 2.0, fill: { color: WHITE }, line: { color: PINK, width: 1 } });
    s.addText("「請您用 LINE 主畫面右上角的「掃描」功能,掃這個 QR Code(指立牌)。\nLINE 會自動加我們好友,然後直接進遊戲畫面。\n結帳後消費滿 NT$2,000 就能玩擲骰子大富翁。」", {
      x: 1.0, y: 2.5, w: 6.2, h: 1.8, fontSize: 12, color: BLACK, margin: 0,
      lineSpacing: 18 });

    s.addText("In English (for international guests):", { x: 0.85, y: 4.55, w: 6.5, h: 0.35,
      fontSize: 11, color: PINK, italic: true, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 4.9, w: 6.5, h: 2.0, fill: { color: WHITE }, line: { color: PINK, width: 1 } });
    s.addText("\"Please open LINE app, tap the scan icon (top-right of the main screen), and scan this QR code on the table card.\nLINE will add IC Kaohsiung as a friend and the game opens automatically.\nSpend NT$2,000+ at checkout to start rolling dice.\"", {
      x: 1.0, y: 5.0, w: 6.2, h: 1.85, fontSize: 11, color: BLACK, italic: true, margin: 0,
      lineSpacing: 16 });

    // Right side: things to know
    s.addShape(pres.shapes.RECTANGLE, { x: 7.8, y: 1.8, w: 4.9, h: 5.2,
      fill: { color: PINK_TINT }, line: { color: PINK, width: 1 }, shadow: SHADOW() });
    s.addText("提醒 / Key Points", { x: 8.0, y: 1.95, w: 4.5, h: 0.35,
      fontSize: 12, color: PINK, bold: true, charSpacing: 2, margin: 0 });

    const points = [
      { cn: "用 LINE 內建相機,不是 Safari", en: "LINE camera, not Safari" },
      { cn: "QR 在每張桌子的立牌上", en: "QR on every table standee" },
      { cn: "客人需要先加好友才能進遊戲", en: "Must add LINE friend first" },
      { cn: "進遊戲後選一個角色,然後等結帳", en: "Pick character, then dine" },
      { cn: "結帳後系統自動識別餐廳", en: "Outlet auto-identified after scan" },
    ];
    points.forEach((p, i) => {
      const y = 2.45 + i * 0.85;
      s.addText("✓", { x: 8.0, y, w: 0.3, h: 0.3,
        fontSize: 16, color: BLACK, bold: true, margin: 0 });
      s.addText(p.cn, { x: 8.35, y: y - 0.03, w: 4.3, h: 0.3,
        fontSize: 11.5, color: BLACK, margin: 0 });
      s.addText(p.en, { x: 8.35, y: y + 0.27, w: 4.3, h: 0.3,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. Task B — Checkout QR Walkthrough Part 1 (URL + Form)
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "TASK B · 結帳 QR · 怎麼開、怎麼用 (1/2)", "TASK B · Issue Checkout QR (Part 1 of 2)");

    // URL card top
    urlCard(s, 0.6, 1.85, 12.1, "您要打開的網址 / URL to open", "Bookmark this — you'll use it daily",
      URL_CHECKOUT, qrCheckout, { color: BLACK, h: 1.4 });

    // Below: walkthrough with mock UI
    s.addText("打開後依序填以下 4 個欄位 → 出 QR 給客人掃", { x: 0.6, y: 3.45, w: 12, h: 0.35,
      fontSize: 13, color: BLACK, bold: true, margin: 0 });
    s.addText("After opening, fill these 4 fields in order → QR generates for customer to scan", {
      x: 0.6, y: 3.8, w: 12, h: 0.3, fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    // Mock form panel
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 4.2, w: 5.8, h: 2.85,
      fill: { color: SOFT_BG }, line: { color: BLACK, width: 1 } });
    s.addText("您手機看到的畫面 / What you see on phone", { x: 0.85, y: 4.3, w: 5.3, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });

    // Step 1: PIN
    s.addText("PIN", { x: 0.85, y: 4.7, w: 5.3, h: 0.25,
      fontSize: 10, color: DARKGREY, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 4.95, w: 5.3, h: 0.4, fill: { color: WHITE }, line: { color: LIGHTGREY, width: 1 } });
    s.addText(PIN, { x: 0.85, y: 4.95, w: 5.3, h: 0.4,
      fontSize: 14, color: BLACK, fontFace: "Consolas", bold: true, align: "center", valign: "middle", charSpacing: 4, margin: 0 });

    // Step 2: invoice no
    s.addText("發票編號(從小白單抄)/ Invoice No. (from slip)", { x: 0.85, y: 5.45, w: 5.3, h: 0.25,
      fontSize: 10, color: DARKGREY, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 5.7, w: 5.3, h: 0.4, fill: { color: WHITE }, line: { color: LIGHTGREY, width: 1 } });
    s.addText("BM36258896", { x: 0.85, y: 5.7, w: 5.3, h: 0.4,
      fontSize: 14, color: BLACK, fontFace: "Consolas", bold: true, align: "center", valign: "middle", margin: 0 });

    // Step 3: amount
    s.addText("消費金額 / Amount (NT$)", { x: 0.85, y: 6.2, w: 5.3, h: 0.25,
      fontSize: 10, color: DARKGREY, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 6.45, w: 5.3, h: 0.4, fill: { color: WHITE }, line: { color: LIGHTGREY, width: 1 } });
    s.addText("5000", { x: 0.85, y: 6.45, w: 5.3, h: 0.4,
      fontSize: 14, color: BLACK, fontFace: "Consolas", bold: true, align: "center", valign: "middle", margin: 0 });

    // Right: numbered steps walkthrough
    s.addShape(pres.shapes.RECTANGLE, { x: 6.7, y: 4.2, w: 6.0, h: 2.85,
      fill: { color: WHITE }, line: { color: PINK, width: 1 } });
    s.addText("逐步說明 / Step-by-step", { x: 6.95, y: 4.3, w: 5.5, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });

    const formSteps = [
      { n: "1", cn: "輸入 PIN: " + PIN, en: "Enter PIN" },
      { n: "2", cn: "輸入發票編號(小白單上「發票號碼」欄)", en: "Type invoice no. from POS slip" },
      { n: "3", cn: "輸入消費金額", en: "Type amount" },
      { n: "4", cn: "點 [產生 QR Code] → 進下一頁", en: "Tap [Generate QR] → see next slide" },
    ];
    formSteps.forEach((stp, i) => {
      const y = 4.7 + i * 0.55;
      s.addShape(pres.shapes.OVAL, { x: 6.95, y, w: 0.4, h: 0.4, fill: { color: BLACK } });
      s.addText(stp.n, { x: 6.95, y, w: 0.4, h: 0.4, fontSize: 14,
        color: PINK, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(stp.cn, { x: 7.45, y: y - 0.02, w: 5.1, h: 0.25,
        fontSize: 11, color: BLACK, margin: 0 });
      s.addText(stp.en, { x: 7.45, y: y + 0.22, w: 5.1, h: 0.25,
        fontSize: 9, color: DARKGREY, italic: true, margin: 0 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. Task B — Checkout QR Walkthrough Part 2 (Result + customer scan)
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "TASK B · 結帳 QR (2/2) · 出 QR + 客人掃描", "TASK B · QR Generated + Customer Scans");

    // Mock QR display panel
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.85, w: 5.5, h: 5.15,
      fill: { color: SOFT_BG }, line: { color: BLACK, width: 1 } });
    s.addText("您手機螢幕 / Your phone screen", { x: 0.85, y: 1.95, w: 5.0, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });

    // Mock content
    s.addText("消費金額 / Amount", { x: 0.85, y: 2.35, w: 5.0, h: 0.3,
      fontSize: 10, color: DARKGREY, align: "center", margin: 0 });
    s.addText("NT$ 5,000", { x: 0.85, y: 2.6, w: 5.0, h: 0.45,
      fontSize: 24, color: BLACK, bold: true, fontFace: "Georgia", align: "center", margin: 0 });
    s.addText("給予 2 次擲骰機會 / 2 dice rolls", { x: 0.85, y: 3.05, w: 5.0, h: 0.3,
      fontSize: 11, color: SUCCESS_GREEN, bold: true, align: "center", margin: 0 });

    // QR placeholder
    s.addShape(pres.shapes.RECTANGLE, { x: 1.85, y: 3.5, w: 3.0, h: 3.0, fill: { color: WHITE }, line: { color: BLACK, width: 1.5 } });
    s.addImage({ data: ic.qrB, x: 2.85, y: 4.5, w: 1.0, h: 1.0 });
    s.addText("[ 動態 QR Code ]", { x: 1.85, y: 5.7, w: 3.0, h: 0.3,
      fontSize: 11, color: DARKGREY, italic: true, align: "center", margin: 0 });

    s.addText("⏱ 倒數 2:00 / 2-min countdown", { x: 0.85, y: 6.65, w: 5.0, h: 0.3,
      fontSize: 11, color: WARN_AMBER, bold: true, align: "center", margin: 0 });

    // Right: instructions
    s.addShape(pres.shapes.RECTANGLE, { x: 6.4, y: 1.85, w: 6.3, h: 5.15,
      fill: { color: WHITE }, line: { color: PINK, width: 1 } });
    s.addText("接下來怎麼做 / What's next", { x: 6.65, y: 1.95, w: 5.8, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });

    const afterSteps = [
      { n: "5", cn: "把這個 QR 拿給客人看", en: "Show the QR to the customer",
        det_cn: "螢幕橫向拿,確保客人能對準",
        det_en: "Hold horizontally, easy alignment" },
      { n: "6", cn: "客人用 LINE 內建相機掃", en: "Customer scans with LINE camera",
        det_cn: "不是 Safari 也不是其他 app",
        det_en: "LINE camera only — not Safari" },
      { n: "7", cn: "完成 → 按「下一桌」清空", en: "Done → tap [Next Table] to reset",
        det_cn: "QR 不要拿給第二人,只第一個掃的人有用",
        det_en: "QR is one-shot — first scanner wins" },
    ];
    afterSteps.forEach((stp, i) => {
      const y = 2.4 + i * 1.5;
      s.addShape(pres.shapes.OVAL, { x: 6.7, y, w: 0.55, h: 0.55, fill: { color: BLACK } });
      s.addText(stp.n, { x: 6.7, y, w: 0.55, h: 0.55, fontSize: 18,
        color: PINK, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(stp.cn, { x: 7.4, y, w: 5.3, h: 0.35,
        fontSize: 14, color: BLACK, bold: true, margin: 0 });
      s.addText(stp.en, { x: 7.4, y: y + 0.35, w: 5.3, h: 0.3,
        fontSize: 11, color: DARKGREY, italic: true, margin: 0 });
      s.addText(stp.det_cn, { x: 7.4, y: y + 0.7, w: 5.3, h: 0.3,
        fontSize: 11, color: BLACK, margin: 0 });
      s.addText(stp.det_en, { x: 7.4, y: y + 1.0, w: 5.3, h: 0.3,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. Task C — Customer Lookup Walkthrough Part 1 (URL + form)
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "TASK C · 客訴查詢 · 怎麼查 (1/2)", "TASK C · Customer Dispute Lookup (Part 1 of 2)");

    s.addText("客人吵「我這張發票沒用過!」→ 用系統紀錄說話", { x: 0.6, y: 1.7, w: 12, h: 0.3,
      fontSize: 12, color: BLACK, margin: 0 });
    s.addText("Customer disputes 'I didn't use this!' → Let the system show the truth", {
      x: 0.6, y: 2.0, w: 12, h: 0.3, fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    // URL card
    urlCard(s, 0.6, 2.4, 12.1, "您要打開的網址 / URL to open", "Same PIN as Checkout QR · " + PIN,
      URL_LOOKUP, qrLookup, { color: BLACK, h: 1.4 });

    // 3 steps walkthrough
    s.addText("打開後依序做 / After opening, do these:", { x: 0.6, y: 4.05, w: 12, h: 0.35,
      fontSize: 13, color: BLACK, bold: true, margin: 0 });

    // Mock form panel
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 4.5, w: 5.8, h: 2.5,
      fill: { color: SOFT_BG }, line: { color: BLACK, width: 1 } });

    s.addText("PIN", { x: 0.85, y: 4.6, w: 5.3, h: 0.25,
      fontSize: 10, color: DARKGREY, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 4.85, w: 5.3, h: 0.4, fill: { color: WHITE }, line: { color: LIGHTGREY, width: 1 } });
    s.addText(PIN, { x: 0.85, y: 4.85, w: 5.3, h: 0.4,
      fontSize: 14, color: BLACK, fontFace: "Consolas", bold: true, align: "center", valign: "middle", charSpacing: 4, margin: 0 });

    s.addText("輸入客人發票編號 / Enter customer's invoice no.", { x: 0.85, y: 5.35, w: 5.3, h: 0.25,
      fontSize: 10, color: DARKGREY, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 5.6, w: 5.3, h: 0.4, fill: { color: WHITE }, line: { color: LIGHTGREY, width: 1 } });
    s.addText("BM36258896", { x: 0.85, y: 5.6, w: 5.3, h: 0.4,
      fontSize: 14, color: BLACK, fontFace: "Consolas", bold: true, align: "center", valign: "middle", margin: 0 });

    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 6.15, w: 5.3, h: 0.55, fill: { color: BLACK } });
    s.addImage({ data: ic.searchB, x: 2.9, y: 6.27, w: 0.3, h: 0.3 });
    s.addText("查詢 / Search", { x: 3.3, y: 6.15, w: 2.5, h: 0.55,
      fontSize: 14, color: PINK, bold: true, valign: "middle", margin: 0 });

    // Right: steps
    s.addShape(pres.shapes.RECTANGLE, { x: 6.7, y: 4.5, w: 6.0, h: 2.5,
      fill: { color: WHITE }, line: { color: PINK, width: 1 } });
    s.addText("逐步說明 / Step-by-step", { x: 6.95, y: 4.6, w: 5.5, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });

    const lookupSteps = [
      { n: "1", cn: "輸入 PIN " + PIN + "(同結帳 QR)", en: "Same PIN as Checkout QR" },
      { n: "2", cn: "輸入客人手上發票編號(BM-XXXXXXXX)", en: "Type customer's invoice no." },
      { n: "3", cn: "點 [ 查詢 ] → 看下一頁三色結果", en: "Tap Search → see 3-color result on next slide" },
    ];
    lookupSteps.forEach((stp, i) => {
      const y = 4.95 + i * 0.7;
      s.addShape(pres.shapes.OVAL, { x: 6.95, y, w: 0.45, h: 0.45, fill: { color: BLACK } });
      s.addText(stp.n, { x: 6.95, y, w: 0.45, h: 0.45, fontSize: 16,
        color: PINK, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(stp.cn, { x: 7.55, y: y - 0.02, w: 5.1, h: 0.3,
        fontSize: 12, color: BLACK, margin: 0 });
      s.addText(stp.en, { x: 7.55, y: y + 0.28, w: 5.1, h: 0.3,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. Task C — Lookup Part 2 (3 color results)
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "TASK C · 三色結果代表什麼 (2/2)", "TASK C · Three Result Colors Explained");

    const results = [
      {
        bg: SUCCESS_BG, border: SUCCESS_GREEN, emoji: "✓",
        title_cn: "綠 · 未使用過",       title_en: "GREEN · Not used",
        meaning_cn: "客人沒說謊,這張發票真的還沒被人領過",
        meaning_en: "Customer is honest; invoice is still fresh",
        action_cn: "1. 引導他自助掃發票 / 拍小白單\n2. 或直接幫他開結帳 QR",
        action_en: "1. Guide them to self-redeem\n2. Or issue Checkout QR for them",
      },
      {
        bg: DANGER_BG, border: DANGER_RED, emoji: "✗",
        title_cn: "紅 · 已被使用過",     title_en: "RED · Already used",
        meaning_cn: "畫面會顯示:幾時用的、誰用的(LINE 暱稱)、在哪桌、領了幾次擲骰",
        meaning_en: "Screen shows: when, who (LINE name), which table, how many dice",
        action_cn: "1. 把畫面給客人看(紀錄不可改)\n2. 客人通常會記起來「啊,我同事幫我領了」",
        action_en: "1. Show screen to customer\n2. They usually remember after seeing details",
      },
      {
        bg: WARN_BG, border: WARN_AMBER, emoji: "⏱",
        title_cn: "黃 · 已開 QR 未掃",    title_en: "AMBER · QR pending",
        meaning_cn: "2 分鐘內已開過 QR 但客人還沒掃",
        meaning_en: "QR issued in past 2 min, not scanned yet",
        action_cn: "1. 請客人立刻掃那張 QR\n2. 或等過期再重新產一張",
        action_en: "1. Ask customer to scan now\n2. Or wait expiry, then re-issue",
      },
    ];

    results.forEach((r, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.85, w: 4.0, h: 5.15,
        fill: { color: r.bg }, line: { color: r.border, width: 2 }, shadow: SHADOW() });

      s.addText(r.emoji, { x: x + 0.2, y: 1.95, w: 0.7, h: 0.6,
        fontSize: 36, color: r.border, bold: true, margin: 0 });
      s.addText(r.title_cn, { x: x + 1.05, y: 1.95, w: 2.85, h: 0.4,
        fontSize: 17, color: r.border, bold: true, margin: 0 });
      s.addText(r.title_en, { x: x + 1.05, y: 2.35, w: 2.85, h: 0.3,
        fontSize: 11, color: r.border, italic: true, margin: 0 });

      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.25, y: 2.95, w: 3.5, h: 0.04, fill: { color: r.border }, line: { color: r.border } });

      s.addText("代表 / Means", { x: x + 0.25, y: 3.05, w: 3.5, h: 0.3,
        fontSize: 10, color: r.border, charSpacing: 2, margin: 0 });
      s.addText(r.meaning_cn, { x: x + 0.25, y: 3.35, w: 3.5, h: 0.8,
        fontSize: 12, color: BLACK, valign: "top", margin: 0 });
      s.addText(r.meaning_en, { x: x + 0.25, y: 4.15, w: 3.5, h: 0.6,
        fontSize: 10, color: DARKGREY, italic: true, valign: "top", margin: 0 });

      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.25, y: 4.85, w: 3.5, h: 0.04, fill: { color: r.border }, line: { color: r.border } });

      s.addText("您要做 / Action", { x: x + 0.25, y: 4.95, w: 3.5, h: 0.3,
        fontSize: 10, color: r.border, charSpacing: 2, margin: 0 });
      s.addText(r.action_cn, { x: x + 0.25, y: 5.25, w: 3.5, h: 0.9,
        fontSize: 12, color: BLACK, bold: true, valign: "top", margin: 0, lineSpacing: 16 });
      s.addText(r.action_en, { x: x + 0.25, y: 6.15, w: 3.5, h: 0.8,
        fontSize: 9.5, color: DARKGREY, italic: true, valign: "top", margin: 0, lineSpacing: 12 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. 5 Restaurant QR codes — all in one slide
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "五家餐廳的 QR Code 一覽", "All Five Outlet QR Codes at a Glance");

    s.addText("每家餐廳一張專屬 QR · 印成立牌放餐廳入口、各桌、收銀台", {
      x: 0.6, y: 1.7, w: 12, h: 0.3, fontSize: 11, color: BLACK, margin: 0 });
    s.addText("One dedicated QR per outlet · Print standees for entrance, tables, cashier", {
      x: 0.6, y: 2.0, w: 12, h: 0.3, fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    const outlets = [
      { code: "ZL", cn: "湛露中餐廳",   en: "Zhan Lu" },
      { code: "WR", cn: "WA-RA 日式",  en: "WA-RA" },
      { code: "SD", cn: "SEEDS 大地",  en: "SEEDS" },
      { code: "HW", cn: "HAWKER",      en: "HAWKER" },
      { code: "BL", cn: "BLT33 酒吧",  en: "BLT33" },
    ];
    outlets.forEach((o, i) => {
      const x = 0.6 + i * 2.5;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.5, w: 2.4, h: 4.4,
        fill: { color: WHITE }, line: { color: BLACK, width: 1.5 }, shadow: SHADOW() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.5, w: 2.4, h: 0.55, fill: { color: BLACK } });
      s.addText(`#${o.code}`, { x, y: 2.5, w: 2.4, h: 0.55,
        fontSize: 16, color: PINK, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });

      s.addImage({ data: qrBase64(o.code), x: x + 0.2, y: 3.15, w: 2.0, h: 2.0 });

      s.addText(o.cn, { x, y: 5.3, w: 2.4, h: 0.35,
        fontSize: 13, color: BLACK, bold: true, align: "center", margin: 0 });
      s.addText(o.en, { x, y: 5.65, w: 2.4, h: 0.3,
        fontSize: 10, color: DARKGREY, italic: true, align: "center", margin: 0 });

      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.15, y: 6.05, w: 2.1, h: 0.04, fill: { color: PINK }, line: { color: PINK } });
      s.addText("?r=" + o.code, { x, y: 6.15, w: 2.4, h: 0.3,
        fontSize: 10, color: PINK, fontFace: "Consolas", align: "center", margin: 0 });
      s.addText("掃了直接進遊戲", { x, y: 6.45, w: 2.4, h: 0.3,
        fontSize: 9, color: DARKGREY, align: "center", margin: 0 });
      s.addText("scan → enter game", { x, y: 6.7, w: 2.4, h: 0.25,
        fontSize: 8, color: DARKGREY, italic: true, align: "center", margin: 0 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 11-15. Per-Restaurant detail pages
  // ═══════════════════════════════════════════════════════════════
  const RESTAURANTS = [
    {
      code: "ZL", icon: ic.spoon,
      cn: "湛露中餐廳", en: "Zhan Lu",
      tagline_cn: "粵式經典 · 二樓",
      tagline_en: "Cantonese fine dining · 2F",
      address: "高雄市前鎮區新光路 33 號 2F  ·  No. 33 Xinguang Rd, 2F",
      phone: "+886-7-3391888",
      typical_cn: "客單高(NT$3,000–15,000),IHG 會員 85 折常見",
      typical_en: "High ticket NT$3-15k, IHG 85% discount common",
      notes: [
        { cn: "多客人用「載具 + 統編」報帳 → 拍小白單路徑常用", en: "Many use carrier + tax ID → photo path common" },
        { cn: "餐券抵用情境多 — 系統以發票「總計」為準,不扣餐券", en: "F&B vouchers count toward 總計, no deduction" },
        { cn: "結帳容易花 5+ 分鐘 → 客人可能離開後在大廳掃發票", en: "Long checkout — invoice may be scanned in lobby later" },
      ],
    },
    {
      code: "WR", icon: ic.fish,
      cn: "WA-RA 日式餐廳", en: "WA-RA Japanese",
      tagline_cn: "日式割烹 · 二樓",
      tagline_en: "Japanese kappo · 2F",
      address: "高雄市前鎮區新光路 33 號 2F  ·  No. 33 Xinguang Rd, 2F",
      phone: "+886-7-3391888",
      typical_cn: "客單 NT$2,000–8,000,套餐為主",
      typical_en: "Ticket NT$2-8k, set menus dominate",
      notes: [
        { cn: "客人多為商務 / 親子 → 引導用結帳 QR 最快", en: "Business/family customers — Checkout QR fastest" },
        { cn: "高比例會員客 → 「85 折」常見,擲骰計算不變", en: "High loyalty ratio — dice math unchanged by discount" },
        { cn: "建議放兩張立牌:大門 + 收銀台旁", en: "Place 2 QR standees: entrance + cashier" },
      ],
    },
    {
      code: "SD", icon: ic.utensils,
      cn: "SEEDS 大地全日餐廳", en: "SEEDS All-Day Dining",
      tagline_cn: "全日 buffet · 一樓",
      tagline_en: "All-day buffet · 1F",
      address: "高雄市前鎮區新光路 33 號  ·  No. 33 Xinguang Rd",
      phone: "+886-7-3391888",
      typical_cn: "高流量 · 客單 NT$1,500–5,000(成人 buffet × 人數)",
      typical_en: "High volume · NT$1.5-5k (adult buffet × pax)",
      notes: [
        { cn: "buffet 結帳快 → 客人很可能還沒下載 LINE 就走了", en: "Quick checkout — many leave before installing LINE" },
        { cn: "建議桌上立牌提早曝光", en: "Place QR on tables for early visibility" },
        { cn: "高比例載具客 → 拍小白單路徑要練熟", en: "High carrier ratio — train photo path well" },
      ],
    },
    {
      code: "HW", icon: ic.pepper,
      cn: "HAWKER 南洋料理", en: "HAWKER Southeast Asian",
      tagline_cn: "南洋風味 · 一樓",
      tagline_en: "Southeast Asian · 1F",
      address: "高雄市前鎮區新光路 33 號  ·  No. 33 Xinguang Rd",
      phone: "+886-7-3391888",
      typical_cn: "客單 NT$1,500–4,500,單身/雙人客居多",
      typical_en: "Ticket NT$1.5-4.5k, solo/duo diners",
      notes: [
        { cn: "客單接近 NT$2,000 門檻 → 練「下次再來」話術", en: "Many near threshold — train 'come back next time'" },
        { cn: "多飯店住客 → 已是 LINE 好友比例高,跳過加好友", en: "Many hotel guests — likely already LINE friends" },
        { cn: "BLT33 共用立牌空間 → 留意 QR 不要拿錯", en: "Shared signage area with BLT33 — don't mix QRs" },
      ],
    },
    {
      code: "BL", icon: ic.cocktail,
      cn: "BLT33 大廳酒吧", en: "BLT33 Lobby Bar",
      tagline_cn: "大廳酒吧 · 一樓",
      tagline_en: "Lobby bar · 1F",
      address: "高雄市前鎮區新光路 33 號  ·  No. 33 Xinguang Rd",
      phone: "+886-7-3391888",
      typical_cn: "客單 NT$2,000–4,000,酒水 + 小點居多",
      typical_en: "Ticket NT$2-4k, drinks + small plates",
      notes: [
        { cn: "晚間客人多 + 飲酒 → 操作要簡單,結帳 QR 最快", en: "Evening + alcohol — keep flow simple, Checkout QR" },
        { cn: "獨自客人多 → QR 立牌放吧台明顯處", en: "Solo customers — prominent placement at bar counter" },
        { cn: "「Hotel Specific other」品項常見,不影響總計", en: "'Hotel Specific other' line common; vision ignores" },
      ],
    },
  ];

  RESTAURANTS.forEach((r) => {
    n++;
    const s = pres.addSlide();
    s.background = { color: WHITE };

    // Black header strip
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.3, h: 1.6, fill: { color: BLACK } });
    s.addImage({ data: r.icon, x: 0.8, y: 0.4, w: 0.8, h: 0.8 });
    s.addText(r.cn, { x: 1.8, y: 0.3, w: 9, h: 0.6,
      fontSize: 34, color: PINK, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText(r.en, { x: 1.8, y: 0.85, w: 9, h: 0.35,
      fontSize: 15, color: LIGHTGREY, italic: true, margin: 0 });
    s.addText(r.tagline_cn + "  ·  " + r.tagline_en, { x: 1.8, y: 1.2, w: 9, h: 0.3,
      fontSize: 11, color: LIGHTGREY, italic: true, margin: 0 });
    s.addText(`#${r.code}`, { x: 11.3, y: 0.4, w: 1.8, h: 0.55,
      fontSize: 36, color: PINK, bold: true, fontFace: "Georgia", align: "right", margin: 0 });

    // Left: info
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.95, w: 7.5, h: 5.05,
      fill: { color: SOFT_BG }, line: { color: LIGHTGREY, width: 1 }, shadow: SHADOW() });

    s.addImage({ data: ic.pin, x: 0.85, y: 2.15, w: 0.4, h: 0.4 });
    s.addText("位址 · Address", { x: 1.35, y: 2.15, w: 6.5, h: 0.3,
      fontSize: 10, color: PINK, charSpacing: 2, margin: 0 });
    s.addText(r.address, { x: 1.35, y: 2.45, w: 6.5, h: 0.4,
      fontSize: 12, color: BLACK, margin: 0 });

    s.addImage({ data: ic.phone, x: 0.85, y: 3.0, w: 0.4, h: 0.4 });
    s.addText("電話 · Phone", { x: 1.35, y: 3.0, w: 6.5, h: 0.3,
      fontSize: 10, color: PINK, charSpacing: 2, margin: 0 });
    s.addText(r.phone, { x: 1.35, y: 3.3, w: 6.5, h: 0.4,
      fontSize: 14, color: BLACK, fontFace: "Consolas", bold: true, margin: 0 });

    s.addImage({ data: ic.dice, x: 0.85, y: 3.85, w: 0.4, h: 0.4 });
    s.addText("客單常見值 · Typical ticket", { x: 1.35, y: 3.85, w: 6.5, h: 0.3,
      fontSize: 10, color: PINK, charSpacing: 2, margin: 0 });
    s.addText(r.typical_cn, { x: 1.35, y: 4.15, w: 6.5, h: 0.35,
      fontSize: 12, color: BLACK, margin: 0 });
    s.addText(r.typical_en, { x: 1.35, y: 4.5, w: 6.5, h: 0.3,
      fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 4.95, w: 7.0, h: 0.04, fill: { color: PINK }, line: { color: PINK } });
    s.addText("本店重點 · Outlet notes", { x: 0.85, y: 5.05, w: 7.0, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });

    r.notes.forEach((nt, i) => {
      const y = 5.4 + i * 0.5;
      s.addText("·", { x: 0.85, y, w: 0.2, h: 0.35,
        fontSize: 18, color: BLACK, bold: true, margin: 0 });
      s.addText(nt.cn, { x: 1.05, y, w: 6.8, h: 0.25,
        fontSize: 11, color: BLACK, margin: 0 });
      s.addText(nt.en, { x: 1.05, y: y + 0.23, w: 6.8, h: 0.25,
        fontSize: 9, color: DARKGREY, italic: true, margin: 0 });
    });

    // Right: QR
    s.addShape(pres.shapes.RECTANGLE, { x: 8.3, y: 1.95, w: 4.4, h: 5.05,
      fill: { color: WHITE }, line: { color: BLACK, width: 1.5 }, shadow: SHADOW() });
    s.addShape(pres.shapes.RECTANGLE, { x: 8.3, y: 1.95, w: 4.4, h: 0.45, fill: { color: BLACK } });
    s.addText("專屬 QR Code · Outlet QR", { x: 8.3, y: 1.95, w: 4.4, h: 0.45,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, align: "center", valign: "middle", margin: 0 });

    s.addImage({ data: qrBase64(r.code), x: 8.5, y: 2.55, w: 4.0, h: 3.6 });

    s.addShape(pres.shapes.RECTANGLE, { x: 8.5, y: 6.25, w: 4.0, h: 0.04, fill: { color: PINK }, line: { color: PINK } });
    s.addText("立牌位置建議 · Standee placement", { x: 8.5, y: 6.35, w: 4.0, h: 0.3,
      fontSize: 9, color: PINK, charSpacing: 2, align: "center", margin: 0 });
    s.addText("入口 + 各桌 + 收銀台", { x: 8.5, y: 6.6, w: 4.0, h: 0.3,
      fontSize: 11, color: BLACK, bold: true, align: "center", margin: 0 });

    footer(s, n, TOTAL);
  });

  // ═══════════════════════════════════════════════════════════════
  // 16. Error decoder
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "客人手機錯誤訊息 · 對照處理", "Error Message Decoder");

    s.addText("客人指著螢幕說「掃不過」時對照下表 · 結論:幾乎所有狀況都走「結帳 QR」", {
      x: 0.6, y: 1.7, w: 12, h: 0.3, fontSize: 11, color: BLACK, margin: 0 });
    s.addText("Bottom line: most issues are resolved by issuing Checkout QR.", {
      x: 0.6, y: 2.0, w: 12, h: 0.3, fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    const rows = [
      ["請先綁定桌號",   "Bind a table first",    "走 餐廳 QR / Use restaurant QR"],
      ["不是電子發票格式","Not an e-invoice QR",   "對準發票左側 QR / Aim at left side"],
      ["不是 IC 開的",  "Not from IC Kaohsiung", "別家發票無法兌換 / Other vendor"],
      ["發票日期過期",  "Invoice date expired",  "走 結帳 QR / Issue Checkout QR"],
      ["此發票已被使用過","Already used",         "走 客訴查詢 / Use Lookup"],
      ["這一桌已兌換過一張","One per binding",    "客訴查詢 / 結帳 QR"],
      ["金額需滿 NT$2,000","Below 2k threshold", "告知無法參加 / Inform: below threshold"],
      ["圖片不夠清楚",  "Photo unclear",         "重拍 / 結帳 QR"],
      ["不像 IC 的單據","Not an IC slip",        "確認單據完整 / 結帳 QR"],
      ["黃色 請洽服務人員","Yellow staff banner", "直接走 結帳 QR"],
    ];

    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.4, w: 12.1, h: 0.45, fill: { color: BLACK } });
    s.addText("客人看到 · Customer sees", { x: 0.75, y: 2.4, w: 4.2, h: 0.45,
      fontSize: 11, color: PINK, bold: true, valign: "middle", charSpacing: 2, margin: 0 });
    s.addText("EN translation", { x: 5.0, y: 2.4, w: 3.6, h: 0.45,
      fontSize: 10, color: LIGHTGREY, italic: true, valign: "middle", margin: 0 });
    s.addText("您怎麼做 · Your action", { x: 8.7, y: 2.4, w: 4.0, h: 0.45,
      fontSize: 11, color: PINK, bold: true, valign: "middle", charSpacing: 2, margin: 0 });

    rows.forEach((row, i) => {
      const y = 2.85 + i * 0.42;
      const bg = i % 2 === 0 ? SOFT_BG : WHITE;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.42, fill: { color: bg } });
      s.addText(row[0], { x: 0.75, y, w: 4.2, h: 0.42,
        fontSize: 11, color: BLACK, valign: "middle", margin: 0 });
      s.addText(row[1], { x: 5.0, y, w: 3.6, h: 0.42,
        fontSize: 10, color: DARKGREY, italic: true, valign: "middle", margin: 0 });
      s.addText(row[2], { x: 8.7, y, w: 4.0, h: 0.42,
        fontSize: 10.5, color: BLACK, bold: true, valign: "middle", margin: 0 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 17. 反作弊四道鎖 + 五項禁忌 (combined slide)
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "反作弊規則 + 絕對不要", "Anti-Fraud Rules + Hard Prohibitions");

    // Left: Anti-fraud
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.85, w: 6.0, h: 5.15,
      fill: { color: SOFT_BG }, line: { color: BLACK, width: 1 }, shadow: SHADOW() });
    s.addImage({ data: ic.shield, x: 0.85, y: 1.95, w: 0.55, h: 0.55 });
    s.addText("反作弊 4 道鎖 / 4 Anti-Fraud Locks", { x: 1.55, y: 1.95, w: 5, h: 0.45,
      fontSize: 16, color: BLACK, bold: true, margin: 0 });
    s.addText("系統自動運作,您不用記 / Automatic; no memorization needed", { x: 1.55, y: 2.4, w: 5, h: 0.3,
      fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });

    const locks = [
      { cn: "賣方統編 = 91097496", en: "Seller VAT = 91097496" },
      { cn: "日期是今天或昨天",     en: "Date = today / yesterday" },
      { cn: "同一桌 20 分鐘限一張", en: "One per binding / 20 min" },
      { cn: "同張發票全世界唯一",   en: "invoice_no unique globally" },
    ];
    locks.forEach((l, i) => {
      const y = 2.95 + i * 0.95;
      s.addShape(pres.shapes.OVAL, { x: 0.85, y, w: 0.45, h: 0.45, fill: { color: BLACK } });
      s.addText(String(i + 1), { x: 0.85, y, w: 0.45, h: 0.45,
        fontSize: 16, color: PINK, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(l.cn, { x: 1.45, y: y - 0.05, w: 5.0, h: 0.35,
        fontSize: 13, color: BLACK, bold: true, margin: 0 });
      s.addText(l.en, { x: 1.45, y: y + 0.3, w: 5.0, h: 0.3,
        fontSize: 10, color: DARKGREY, italic: true, margin: 0 });
    });

    // Right: Don'ts
    s.addShape(pres.shapes.RECTANGLE, { x: 6.85, y: 1.85, w: 5.85, h: 5.15,
      fill: { color: PINK_TINT }, line: { color: BLACK, width: 1 }, shadow: SHADOW() });
    s.addImage({ data: ic.ban, x: 7.1, y: 1.95, w: 0.55, h: 0.55 });
    s.addText("絕對不要 / Hard Prohibitions", { x: 7.8, y: 1.95, w: 5, h: 0.45,
      fontSize: 16, color: BLACK, bold: true, margin: 0 });
    s.addText("會被審計記錄,違反有紀律處分 / Audited; violations are disciplinary", { x: 7.8, y: 2.4, w: 5, h: 0.3,
      fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });

    const donts = [
      { cn: "PIN 寫在牆上紙條",          en: "Write PIN on a wall note" },
      { cn: "QR 截圖傳給多人",            en: "Share QR screenshot widely" },
      { cn: "為了討好客人破壞規則",      en: "Bend rules for customers" },
      { cn: "替客人輸 LINE 帳號密碼",    en: "Type customer LINE login" },
      { cn: "輕信「朋友幫我領了」",      en: "Trust 'friend redeemed' claims" },
    ];
    donts.forEach((d, i) => {
      const y = 2.95 + i * 0.8;
      s.addText("✗", { x: 7.1, y, w: 0.45, h: 0.4,
        fontSize: 22, color: DANGER_RED, bold: true, align: "center", margin: 0 });
      s.addText(d.cn, { x: 7.65, y: y - 0.02, w: 5.0, h: 0.3,
        fontSize: 12, color: BLACK, bold: true, margin: 0 });
      s.addText(d.en, { x: 7.65, y: y + 0.28, w: 5.0, h: 0.25,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 18. 練習情境 / Role-play scenarios
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "練習情境 · 主管帶大家演練", "Role-Play Scenarios · For Manager-led Training");

    s.addText("讀情境 → 想您會怎麼處理 → 對答案 / Read scenario → Plan your response → Check answer", {
      x: 0.6, y: 1.7, w: 12, h: 0.3, fontSize: 11, color: BLACK, margin: 0 });

    const scenarios = [
      {
        cn: "客人結帳後說:「我用載具,沒拿到發票,但我同事說可以拿擲骰?」",
        en: "Customer: 'I used a carrier, no printed invoice. My colleague said I can get dice?'",
        ans_cn: "→ 教他點 LIFF 主畫面「📸 我用載具(拍小白單)」自助,或您幫他開「結帳 QR」",
        ans_en: "→ Guide to 'Photo POS Slip' option, OR issue Checkout QR for them",
      },
      {
        cn: "客人激動地說:「我這張 BM-12345678 明明沒用過,為什麼系統說已使用?」",
        en: "Customer angrily: 'My BM-12345678 was never used, why does it say it has been?'",
        ans_cn: "→ 開 /admin/lookup 輸入發票編號 → 給客人看紅色畫面(使用時間 / 暱稱 / 桌號)",
        ans_en: "→ Open /admin/lookup → Enter invoice → Show red result screen with details",
      },
      {
        cn: "客人說:「我朋友剛剛幫我領了,我自己又掃,但系統說已用?」",
        en: "Customer: 'My friend just redeemed for me, now I'm trying and it says used?'",
        ans_cn: "→ 用 /admin/lookup 確認確實是他朋友(LINE 暱稱)領的;若客人堅持,看是否需要主管介入",
        ans_en: "→ Use /admin/lookup to verify it was indeed the friend (by LINE name); escalate if needed",
      },
      {
        cn: "客人消費 NT$1,800,問為什麼沒擲骰?",
        en: "Customer asks why no dice for NT$1,800 spend?",
        ans_cn: "→ 告知「最低門檻 NT$2,000」,鼓勵下次再來;系統規則,不能破例",
        ans_en: "→ Explain NT$2,000 minimum threshold; encourage next visit. No exceptions.",
      },
    ];
    scenarios.forEach((sc, i) => {
      const y = 2.15 + i * 1.25;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 1.15,
        fill: { color: SOFT_BG }, line: { color: LIGHTGREY, width: 1 } });
      s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 0.12, h: 1.15, fill: { color: PINK }, line: { color: PINK } });

      s.addText("情境 " + (i + 1) + " / Scenario " + (i + 1), { x: 0.85, y: y + 0.05, w: 4, h: 0.25,
        fontSize: 9, color: PINK, bold: true, charSpacing: 3, margin: 0 });
      s.addText(sc.cn, { x: 0.85, y: y + 0.3, w: 11.7, h: 0.3,
        fontSize: 12, color: BLACK, bold: true, margin: 0 });
      s.addText(sc.en, { x: 0.85, y: y + 0.58, w: 11.7, h: 0.25,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
      s.addText(sc.ans_cn, { x: 0.85, y: y + 0.83, w: 11.7, h: 0.3,
        fontSize: 11, color: SUCCESS_GREEN, bold: true, margin: 0 });
    });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 19. 快速參考卡 / Quick Reference Card
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    header(s, "快速參考卡 · 列印貼在服務站抽屜", "Quick Reference Card · Print and Pin");

    // The "card" container
    s.addShape(pres.shapes.RECTANGLE, { x: 1.0, y: 1.85, w: 11.3, h: 5.1,
      fill: { color: WHITE }, line: { color: BLACK, width: 2 }, shadow: SHADOW() });
    // Title bar
    s.addShape(pres.shapes.RECTANGLE, { x: 1.0, y: 1.85, w: 11.3, h: 0.7, fill: { color: BLACK } });
    s.addImage({ data: ic.hotel, x: 1.2, y: 1.95, w: 0.5, h: 0.5 });
    s.addText("IC Kaohsiung · Staff Quick Reference", { x: 1.85, y: 1.95, w: 9.5, h: 0.5,
      fontSize: 16, color: PINK, bold: true, valign: "middle", margin: 0 });

    // 4-grid: URL Checkout / URL Lookup / PIN / Contacts
    // Top-left: Checkout URL
    s.addText("結帳 QR · Checkout QR", { x: 1.3, y: 2.75, w: 5.3, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 1.3, y: 3.05, w: 5.3, h: 0.45,
      fill: { color: CODE_BG }, line: { color: BLACK, width: 1 } });
    s.addText("/admin/checkout", { x: 1.3, y: 3.05, w: 5.3, h: 0.45,
      fontSize: 14, color: BLACK, fontFace: "Consolas", bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText("→ 開 QR 幫卡關的客人補擲骰", { x: 1.3, y: 3.55, w: 5.3, h: 0.3,
      fontSize: 10, color: BLACK, margin: 0 });
    s.addText("→ Issue QR for stuck customers", { x: 1.3, y: 3.82, w: 5.3, h: 0.25,
      fontSize: 9, color: DARKGREY, italic: true, margin: 0 });

    // Top-right: Lookup URL
    s.addText("客訴查詢 · Customer Lookup", { x: 6.8, y: 2.75, w: 5.3, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 6.8, y: 3.05, w: 5.3, h: 0.45,
      fill: { color: CODE_BG }, line: { color: BLACK, width: 1 } });
    s.addText("/admin/lookup", { x: 6.8, y: 3.05, w: 5.3, h: 0.45,
      fontSize: 14, color: BLACK, fontFace: "Consolas", bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText("→ 查發票誰用過、何時用過", { x: 6.8, y: 3.55, w: 5.3, h: 0.3,
      fontSize: 10, color: BLACK, margin: 0 });
    s.addText("→ Lookup who/when used invoice", { x: 6.8, y: 3.82, w: 5.3, h: 0.25,
      fontSize: 9, color: DARKGREY, italic: true, margin: 0 });

    // Bottom-left: PIN
    s.addText("PIN", { x: 1.3, y: 4.4, w: 5.3, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 1.3, y: 4.7, w: 5.3, h: 0.6,
      fill: { color: WHITE }, line: { color: BLACK, width: 1.5 } });
    s.addText(PIN, { x: 1.3, y: 4.7, w: 5.3, h: 0.6,
      fontSize: 28, color: BLACK, bold: true, fontFace: "Consolas", align: "center", valign: "middle", charSpacing: 6, margin: 0 });
    s.addText("(同時用於上面兩個網址)", { x: 1.3, y: 5.35, w: 5.3, h: 0.25,
      fontSize: 10, color: DARKGREY, italic: true, margin: 0 });
    s.addText("Used for BOTH URLs above", { x: 1.3, y: 5.6, w: 5.3, h: 0.25,
      fontSize: 9, color: DARKGREY, italic: true, margin: 0 });

    // Bottom-right: 5 outlet QR base URLs
    s.addText("五家餐廳 QR 對應代碼 · Outlet codes", { x: 6.8, y: 4.4, w: 5.3, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });
    const codeRows = [
      ["ZL", "湛露 / Zhan Lu"],
      ["WR", "WA-RA"],
      ["SD", "SEEDS"],
      ["HW", "HAWKER"],
      ["BL", "BLT33"],
    ];
    codeRows.forEach((row, i) => {
      const y = 4.7 + i * 0.36;
      s.addShape(pres.shapes.RECTANGLE, { x: 6.8, y, w: 0.85, h: 0.32, fill: { color: BLACK } });
      s.addText("#" + row[0], { x: 6.8, y, w: 0.85, h: 0.32,
        fontSize: 12, color: PINK, bold: true, fontFace: "Consolas", align: "center", valign: "middle", margin: 0 });
      s.addText(row[1], { x: 7.8, y, w: 4.3, h: 0.32,
        fontSize: 11, color: BLACK, valign: "middle", margin: 0 });
    });

    // Footer band
    s.addShape(pres.shapes.RECTANGLE, { x: 1.0, y: 6.6, w: 11.3, h: 0.35, fill: { color: PINK_TINT } });
    s.addText("規則 · NT$2,000 = 1 擲骰  ·  上限 5 次  ·  15 點抽大獎  ·  Tony Chen tony.chen6@ihg.com", {
      x: 1.0, y: 6.6, w: 11.3, h: 0.35,
      fontSize: 10, color: BLACK, align: "center", valign: "middle", margin: 0 });

    footer(s, n, TOTAL);
  }

  // ═══════════════════════════════════════════════════════════════
  // 20. Closing
  // ═══════════════════════════════════════════════════════════════
  n++;
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };

    s.addImage({ data: ic.hotel, x: 0.8, y: 0.7, w: 0.65, h: 0.65 });
    s.addText("InterContinental KAOHSIUNG", { x: 1.6, y: 0.8, w: 11, h: 0.45,
      fontSize: 14, color: PINK, fontFace: "Georgia", italic: true, charSpacing: 2, margin: 0 });

    s.addText("感謝您  ·  Thank You", { x: 0.6, y: 1.8, w: 12, h: 0.8,
      fontSize: 52, color: WHITE, fontFace: "Georgia", bold: true, align: "center", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.65, y: 2.7, w: 2.0, h: 0.05, fill: { color: PINK }, line: { color: PINK } });

    s.addText("您的細心是這個遊戲成功的關鍵", { x: 0.6, y: 2.95, w: 12, h: 0.45,
      fontSize: 20, color: LIGHTGREY, align: "center", margin: 0 });
    s.addText("Your attention to detail is what makes this work.", { x: 0.6, y: 3.45, w: 12, h: 0.4,
      fontSize: 14, color: DARKGREY, italic: true, align: "center", margin: 0 });

    // Contacts
    s.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: 4.4, w: 10.3, h: 2.4,
      fill: { color: ALMOST_BLACK }, line: { color: PINK, width: 1 } });
    s.addText("緊急聯絡 · Emergency Contacts", { x: 1.5, y: 4.55, w: 10.3, h: 0.4,
      fontSize: 14, color: PINK, bold: true, charSpacing: 3, align: "center", margin: 0 });

    const contacts = [
      { role_cn: "產品 / 行銷主導", role_en: "Product / Marketing", name: "Tony Chen", contact: "tony.chen6@ihg.com" },
      { role_cn: "餐飲部主管",       role_en: "F&B Department",       name: "[ 現場填 ]", contact: "—" },
      { role_cn: "IT 部門",          role_en: "IT Department",         name: "[ 現場填 ]", contact: "—" },
    ];
    contacts.forEach((c, i) => {
      const x = 1.85 + i * 3.3;
      s.addText(c.role_cn, { x, y: 5.1, w: 3.1, h: 0.3,
        fontSize: 10, color: LIGHTGREY, charSpacing: 2, margin: 0 });
      s.addText(c.role_en, { x, y: 5.4, w: 3.1, h: 0.25,
        fontSize: 8, color: DARKGREY, italic: true, margin: 0 });
      s.addText(c.name, { x, y: 5.75, w: 3.1, h: 0.35,
        fontSize: 14, color: WHITE, bold: true, margin: 0 });
      s.addText(c.contact, { x, y: 6.15, w: 3.1, h: 0.3,
        fontSize: 10, color: PINK, fontFace: "Consolas", margin: 0 });
    });

    s.addText("v2026-05-18  ·  Demo 2026-05-31  ·  All 5 F&B outlets ready", {
      x: 0.6, y: 7.15, w: 12, h: 0.3,
      fontSize: 10, color: DARKGREY, italic: true, align: "center", margin: 0 });
  }

  // Output
  await pres.writeFile({
    fileName: "C:/Users/ChenVivi/OneDrive - Six Continents Hotels, Inc/Desktop/Claude/ickaohsiungculinaryjourneymap/docs/IC_Kaohsiung_Game_Staff_Bilingual.pptx",
  });
  console.log("[OK] Generated IC_Kaohsiung_Game_Staff_Bilingual.pptx (20 slides)");
}

build().catch((e) => { console.error(e); process.exit(1); });
