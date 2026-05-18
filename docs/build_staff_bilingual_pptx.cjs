/**
 * IC 高雄洲際 · 員工操作手冊 · 雙語版
 * Staff Operations Guide · Bilingual (CN + EN)
 *
 * 第四份 PPT — 用 IC 官方品牌色,16 頁,各餐廳專屬頁.
 * 給每家餐廳全體員工(服務生、領班、主管)看的詳細操作手冊.
 *
 * Run: NODE_PATH="$(npm root -g)" node build_staff_bilingual_pptx.cjs
 * Output: IC_Kaohsiung_Game_Staff_Bilingual.pptx
 */

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const {
  FaHotel, FaQrcode, FaReceipt, FaCamera, FaCheckCircle, FaDice, FaGift,
  FaMobileAlt, FaPlayCircle, FaUtensils, FaTrophy, FaSmile, FaBell, FaUsers,
  FaUserTie, FaUserCog, FaSearch, FaTimesCircle, FaShieldAlt, FaLock,
  FaExclamationTriangle, FaBan, FaPhone, FaMapMarkerAlt, FaClock,
  FaBuilding, FaConciergeBell, FaWineGlassAlt, FaFish, FaPepperHot,
  FaUtensilSpoon, FaCocktail, FaArrowRight,
} = require("react-icons/fa");

// ─── IC 高雄洲際 官方品牌色 ────────────────────────────────────
const BLACK     = "3D3935";   // 洲際黑 (Pantone Black 7 C)
const PINK      = "CEB4A9";   // 粉色 (Pantone 4745 U)
const LIGHTGREY = "DAD9D6";   // 浅灰 (Pantone Cool Grey 1 U)
const DARKGREY  = "686869";   // 深灰 (Pantone 426 U)
const WHITE     = "FFFFFF";
// Derived shades for subtle backgrounds
const PINK_TINT  = "F4ECE7";  // 粉色 lightened ~60%
const SOFT_BG    = "FAF8F6";
const ALMOST_BLACK = "26211E";

// ─── react-icons → base64 PNG ──────────────────────────────────
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

const SHADOW = () => ({ type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.06 });

// ─── Restaurant QR PNG → base64 ────────────────────────────────
function qrBase64(code) {
  // map code → filename in docs/qr-codes/
  const mapping = {
    ZL: "qr_ZL_Zhan_Lu.png",
    WR: "qr_WR_WA-RA.png",
    SD: "qr_SD_SEEDS.png",
    HW: "qr_HW_HAWKER.png",
    BL: "qr_BL_BLT33.png",
  };
  // running from /tmp/pptx-build so use absolute path
  const filePath = "C:/Users/ChenVivi/OneDrive - Six Continents Hotels, Inc/Desktop/Claude/ickaohsiungculinaryjourneymap/docs/qr-codes/" + mapping[code];
  const data = fs.readFileSync(filePath);
  return "image/png;base64," + data.toString("base64");
}

async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
  pres.author = "Tony Chen · IC Kaohsiung";
  pres.title = "IC Kaohsiung · Staff Operations Guide";

  // Pre-render icons in IC black + pink
  const ic = {
    hotel:    await icon(FaHotel, PINK),
    hotelB:   await icon(FaHotel, BLACK),
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
    lock:     await icon(FaLock, PINK),
    warn:     await icon(FaExclamationTriangle, BLACK),
    gift:     await icon(FaGift, PINK),
    phone:    await icon(FaPhone, PINK),
    pin:      await icon(FaMapMarkerAlt, PINK),
    clock:    await icon(FaClock, PINK),
    building: await icon(FaBuilding, PINK),
    concierge: await icon(FaConciergeBell, PINK),
    wine:     await icon(FaWineGlassAlt, PINK),
    fish:     await icon(FaFish, PINK),
    pepper:   await icon(FaPepperHot, PINK),
    spoon:    await icon(FaUtensilSpoon, PINK),
    cocktail: await icon(FaCocktail, PINK),
    arrow:    await icon(FaArrowRight, BLACK),
    arrowP:   await icon(FaArrowRight, PINK),
    play:     await icon(FaPlayCircle, PINK),
    mobile:   await icon(FaMobileAlt, PINK),
    utensils: await icon(FaUtensils, PINK),
  };

  // Helper: header band with bilingual title
  function addBilingualHeader(s, cnTitle, enTitle) {
    s.addText(cnTitle, { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 36, color: BLACK, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText(enTitle, { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: DARKGREY, italic: true, charSpacing: 2, margin: 0 });
    // Thin pink rule under title
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.65, w: 1.2, h: 0.04, fill: { color: PINK }, line: { color: PINK } });
  }

  function addPageNumber(s, n, total) {
    s.addText(`${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
      x: 12.3, y: 7.05, w: 0.9, h: 0.3,
      fontSize: 10, color: DARKGREY, align: "right", margin: 0, fontFace: "Consolas",
    });
    s.addText("IC Kaohsiung · Staff Guide v2026-05-18", {
      x: 0.6, y: 7.05, w: 6, h: 0.3,
      fontSize: 9, color: DARKGREY, margin: 0,
    });
  }

  const TOTAL_SLIDES = 16;
  let pageN = 0;

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 1 — Cover
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };

    // Top: IC brand mark area
    s.addImage({ data: ic.hotel, x: 0.8, y: 0.7, w: 0.65, h: 0.65 });
    s.addText("InterContinental", { x: 1.6, y: 0.7, w: 8, h: 0.4,
      fontSize: 14, color: PINK, fontFace: "Georgia", italic: true, charSpacing: 3, margin: 0 });
    s.addText("KAOHSIUNG · 高雄洲際酒店", { x: 1.6, y: 1.1, w: 8, h: 0.35,
      fontSize: 11, color: LIGHTGREY, charSpacing: 2, margin: 0 });

    // Thin pink line decoration
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.4, w: 1.5, h: 0.04, fill: { color: PINK }, line: { color: PINK } });

    s.addText("員工操作手冊", { x: 0.8, y: 2.7, w: 12, h: 1.0,
      fontSize: 64, color: WHITE, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("Staff Operations Guide", { x: 0.8, y: 3.7, w: 12, h: 0.5,
      fontSize: 24, color: PINK, fontFace: "Georgia", italic: true, charSpacing: 2, margin: 0 });

    s.addText("餐飲味蕾旅程 · 大富翁遊戲", { x: 0.8, y: 4.55, w: 12, h: 0.5,
      fontSize: 22, color: LIGHTGREY, margin: 0 });
    s.addText("F&B Culinary Journey · Monopoly Game", { x: 0.8, y: 5.05, w: 12, h: 0.4,
      fontSize: 14, color: LIGHTGREY, italic: true, margin: 0 });

    // Footer
    s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 6.4, w: 11.6, h: 0.04, fill: { color: PINK }, line: { color: PINK } });
    s.addText("Tony Chen  ·  Cluster Director of Digital Marketing  ·  tony.chen6@ihg.com", {
      x: 0.8, y: 6.55, w: 12, h: 0.3, fontSize: 11, color: LIGHTGREY, margin: 0 });
    s.addText("v2026-05-18  ·  Demo 2026-05-31  ·  All 5 F&B outlets", {
      x: 0.8, y: 6.85, w: 12, h: 0.3, fontSize: 10, color: DARKGREY, italic: true, margin: 0 });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 2 — About the Game (Bilingual)
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    addBilingualHeader(s, "關於這個遊戲", "About the Game");

    // Big intro statement
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.0, w: 12.1, h: 1.5, fill: { color: BLACK } });
    s.addText([
      { text: "客人在 IC 餐廳消費 ", options: { color: WHITE } },
      { text: "→ ", options: { color: PINK } },
      { text: "拿擲骰機會 ", options: { color: PINK, bold: true } },
      { text: "→ ", options: { color: PINK } },
      { text: "走大富翁 ", options: { color: WHITE } },
      { text: "→ ", options: { color: PINK } },
      { text: "抽獎拿餐券", options: { color: PINK, bold: true, breakLine: true } },
      { text: "Customer dines → earns dice → plays Monopoly map → wins F&B credit / room nights", options: { color: LIGHTGREY, italic: true, fontSize: 14 } },
    ], { x: 0.9, y: 2.1, w: 11.5, h: 1.3, fontSize: 22, valign: "middle", margin: 0 });

    // 3 KPI cards
    const kpis = [
      { num: "5", label_cn: "餐廳",          label_en: "F&B Outlets" },
      { num: "NT$2,000", label_cn: "= 1 次擲骰",  label_en: "per dice roll" },
      { num: "15 點", label_cn: "抽大獎",      label_en: "to grand prize" },
    ];
    kpis.forEach((k, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 3.85, w: 4.0, h: 3.0,
        fill: { color: SOFT_BG }, line: { color: LIGHTGREY, width: 1 }, shadow: SHADOW() });
      // Top pink accent line on each card
      s.addShape(pres.shapes.RECTANGLE, { x, y: 3.85, w: 4.0, h: 0.08, fill: { color: PINK }, line: { color: PINK } });

      s.addText(k.num, { x: x + 0.2, y: 4.2, w: 3.6, h: 1.1,
        fontSize: 48, color: BLACK, fontFace: "Georgia", bold: true, align: "center", margin: 0 });
      s.addText(k.label_cn, { x: x + 0.2, y: 5.35, w: 3.6, h: 0.45,
        fontSize: 17, color: BLACK, bold: true, align: "center", margin: 0 });
      s.addText(k.label_en, { x: x + 0.2, y: 5.85, w: 3.6, h: 0.4,
        fontSize: 12, color: DARKGREY, italic: true, align: "center", margin: 0 });
    });

    addPageNumber(s, pageN, TOTAL_SLIDES);
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 3 — Three Roles (bilingual)
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    addBilingualHeader(s, "三個角色 · 各做什麼?", "Three Roles · Who Does What");

    const roles = [
      {
        icon: ic.users, cn: "客人", en: "Customer",
        primary_cn: "全程自助",
        primary_en: "Fully self-service",
        bullets: [
          { cn: "加 LINE 好友 + 自動綁餐廳", en: "Add LINE + auto-bind to outlet" },
          { cn: "結帳後掃發票 / 拍小白單", en: "Scan invoice / photograph slip" },
          { cn: "玩大富翁、抽獎、領獎", en: "Roll dice, draw prize, redeem" },
        ],
      },
      {
        icon: ic.bell, cn: "服務人員", en: "Service Staff",
        primary_cn: "90% 不用做事",
        primary_en: "90% no-op",
        bullets: [
          { cn: "客人問怎麼玩 → 教掃 QR", en: "Explain QR if asked" },
          { cn: "客人卡關 → 開「結帳 QR」", en: "Issue Checkout QR if stuck" },
          { cn: "客人吵發票 → 用「客訴查詢」", en: "Use Lookup for disputes" },
        ],
      },
      {
        icon: ic.tie, cn: "主管 / IT", en: "Manager / IT",
        primary_cn: "後台監控",
        primary_en: "Backend monitoring",
        bullets: [
          { cn: "查客戶數據,評估行銷效益", en: "Customer analytics dashboard" },
          { cn: "換 PIN,維護白名單", en: "PIN rotation, whitelist mgmt" },
          { cn: "處理系統異常", en: "Handle system anomalies" },
        ],
      },
    ];

    roles.forEach((r, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 4.0, h: 4.95,
        fill: { color: WHITE }, line: { color: LIGHTGREY, width: 1 }, shadow: SHADOW() });

      // Header strip
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 4.0, h: 1.1, fill: { color: BLACK } });
      s.addImage({ data: r.icon, x: x + 0.3, y: 2.25, w: 0.6, h: 0.6 });
      s.addText(r.cn, { x: x + 1.0, y: 2.2, w: 2.9, h: 0.45,
        fontSize: 22, color: PINK, bold: true, margin: 0 });
      s.addText(r.en, { x: x + 1.0, y: 2.65, w: 2.9, h: 0.4,
        fontSize: 12, color: LIGHTGREY, italic: true, margin: 0 });

      // Primary tag
      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.25, y: 3.3, w: 3.5, h: 0.7,
        fill: { color: PINK_TINT }, line: { color: PINK, width: 1 } });
      s.addText(r.primary_cn, { x: x + 0.25, y: 3.3, w: 3.5, h: 0.4,
        fontSize: 15, color: BLACK, bold: true, align: "center", valign: "middle", margin: 0 });
      s.addText(r.primary_en, { x: x + 0.25, y: 3.65, w: 3.5, h: 0.3,
        fontSize: 10, color: DARKGREY, italic: true, align: "center", margin: 0 });

      // Bullets
      r.bullets.forEach((b, bi) => {
        const by = 4.25 + bi * 0.85;
        s.addText("·", { x: x + 0.3, y: by, w: 0.2, h: 0.35,
          fontSize: 24, color: PINK, bold: true, margin: 0 });
        s.addText(b.cn, { x: x + 0.5, y: by, w: 3.3, h: 0.35,
          fontSize: 13, color: BLACK, margin: 0 });
        s.addText(b.en, { x: x + 0.5, y: by + 0.35, w: 3.3, h: 0.3,
          fontSize: 10, color: DARKGREY, italic: true, margin: 0 });
      });
    });

    addPageNumber(s, pageN, TOTAL_SLIDES);
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 4 — Staff role detail (90% no-op + 3 triggers)
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    addBilingualHeader(s, "服務人員 · 90% 不用做事", "Service Staff · 90% no-op required");

    // Left — what customers do alone
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.0, w: 5.8, h: 4.95,
      fill: { color: SOFT_BG }, line: { color: LIGHTGREY, width: 1 }, shadow: SHADOW() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.0, w: 0.12, h: 4.95, fill: { color: BLACK }, line: { color: BLACK } });

    s.addText("客人自己會做 8 件事", { x: 0.9, y: 2.15, w: 5.4, h: 0.45,
      fontSize: 20, color: BLACK, bold: true, margin: 0 });
    s.addText("8 things customers handle alone", { x: 0.9, y: 2.6, w: 5.4, h: 0.35,
      fontSize: 12, color: DARKGREY, italic: true, margin: 0 });

    const customerActs = [
      { cn: "用 LINE 相機掃餐廳 QR Code", en: "Scan outlet QR via LINE camera" },
      { cn: "加 IC 高雄 LINE 好友",         en: "Add IC LINE friend" },
      { cn: "自動進入遊戲、自動綁餐廳",   en: "Auto-enter game, auto-bind outlet" },
      { cn: "選一個卡通角色",             en: "Pick a character" },
      { cn: "結帳後掃發票 / 拍小白單",     en: "Scan invoice / photo slip after checkout" },
      { cn: "擲骰子、走大富翁地圖",       en: "Roll dice, walk Monopoly map" },
      { cn: "抽獎、拿固定獎品",           en: "Draw lottery, claim fixed reward" },
      { cn: "15 點抽到大獎 → 自動下一季", en: "Win grand prize at 15pt → next season" },
    ];
    customerActs.forEach((a, i) => {
      const y = 3.15 + i * 0.45;
      s.addText("✓", { x: 0.9, y, w: 0.3, h: 0.35,
        fontSize: 16, color: BLACK, bold: true, margin: 0 });
      s.addText(a.cn, { x: 1.2, y, w: 5.0, h: 0.22,
        fontSize: 12, color: BLACK, margin: 0 });
      s.addText(a.en, { x: 1.2, y: y + 0.22, w: 5.0, h: 0.2,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
    });

    // Right — when you DO intervene
    s.addShape(pres.shapes.RECTANGLE, { x: 6.7, y: 2.0, w: 6.2, h: 4.95,
      fill: { color: PINK_TINT }, line: { color: PINK, width: 1.5 }, shadow: SHADOW() });
    s.addShape(pres.shapes.RECTANGLE, { x: 6.7, y: 2.0, w: 0.12, h: 4.95, fill: { color: PINK }, line: { color: PINK } });

    s.addText("您要介入的 3 種狀況", { x: 7.0, y: 2.15, w: 5.8, h: 0.45,
      fontSize: 20, color: BLACK, bold: true, margin: 0 });
    s.addText("3 scenarios that require your action", { x: 7.0, y: 2.6, w: 5.8, h: 0.35,
      fontSize: 12, color: DARKGREY, italic: true, margin: 0 });

    const triggers = [
      { n: "1", t_cn: "客人問「怎麼玩?」", t_en: "Customer asks how to play",
        d_cn: "帶到餐廳入口的 QR Code 立牌前,口頭教他用 LINE 相機掃",
        d_en: "Walk customer to the standee, demo LINE camera scan" },
      { n: "2", t_cn: "客人看到「請洽服務人員」", t_en: "Customer shows escalation banner",
        d_cn: "走「結帳 QR」流程補發(下頁詳解)",
        d_en: "Issue Checkout QR (next slide for details)" },
      { n: "3", t_cn: "客人爭執「我這張沒用過」", t_en: "Customer disputes a 'used' invoice",
        d_cn: "用「客訴查詢」工具看系統紀錄,給客人看",
        d_en: "Use Lookup tool to show system records" },
    ];
    triggers.forEach((t, i) => {
      const y = 3.3 + i * 1.2;
      s.addShape(pres.shapes.OVAL, { x: 7.0, y, w: 0.55, h: 0.55, fill: { color: BLACK } });
      s.addText(t.n, { x: 7.0, y, w: 0.55, h: 0.55,
        fontSize: 18, color: PINK, bold: true, fontFace: "Georgia",
        align: "center", valign: "middle", margin: 0 });
      s.addText(t.t_cn, { x: 7.7, y: y - 0.05, w: 5.1, h: 0.35,
        fontSize: 14, color: BLACK, bold: true, margin: 0 });
      s.addText(t.t_en, { x: 7.7, y: y + 0.27, w: 5.1, h: 0.28,
        fontSize: 10, color: DARKGREY, italic: true, margin: 0 });
      s.addText(t.d_cn, { x: 7.7, y: y + 0.58, w: 5.1, h: 0.35,
        fontSize: 11, color: BLACK, margin: 0 });
      s.addText(t.d_en, { x: 7.7, y: y + 0.85, w: 5.1, h: 0.28,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
    });

    addPageNumber(s, pageN, TOTAL_SLIDES);
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 5 — Three Customer Redemption Paths
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    addBilingualHeader(s, "客人三條兌換路徑", "Three Customer Redemption Paths");

    const paths = [
      {
        icon: ic.receipt, cn: "掃發票", en: "Scan e-invoice",
        scenario_cn: "客人有電子發票證明聯紙本",
        scenario_en: "Customer has a printed e-invoice with QR",
        action_cn: "客人對準發票左側 QR 自助掃",
        action_en: "Aim at left QR, self-scan",
        time: "~2 秒"
      },
      {
        icon: ic.camera, cn: "拍小白單", en: "Photo of POS slip",
        scenario_cn: "客人用載具(沒實體發票)",
        scenario_en: "Carrier customer (no printed invoice)",
        action_cn: "客人拍小白單 → AI 自動辨識",
        action_en: "Photo of slip → AI vision OCR",
        time: "~5 秒"
      },
      {
        icon: ic.qr, cn: "結帳 QR", en: "Checkout QR (staff)",
        scenario_cn: "緊急備援 / 上述都失敗",
        scenario_en: "Backup / when above paths fail",
        action_cn: "服務人員開 QR → 客人用 LINE 掃",
        action_en: "Staff issues QR → customer scans",
        time: "~10 秒"
      },
    ];

    paths.forEach((p, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 4.0, h: 4.95,
        fill: { color: WHITE }, line: { color: LIGHTGREY, width: 1 }, shadow: SHADOW() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 4.0, h: 1.2, fill: { color: BLACK } });

      s.addImage({ data: p.icon, x: x + 0.3, y: 2.25, w: 0.7, h: 0.7 });
      s.addText(p.cn, { x: x + 1.1, y: 2.2, w: 2.8, h: 0.45,
        fontSize: 22, color: PINK, bold: true, margin: 0 });
      s.addText(p.en, { x: x + 1.1, y: 2.65, w: 2.8, h: 0.4,
        fontSize: 11, color: LIGHTGREY, italic: true, margin: 0 });

      s.addText("適用情境 · WHEN", { x: x + 0.25, y: 3.35, w: 3.5, h: 0.3,
        fontSize: 10, color: PINK, bold: true, charSpacing: 2, margin: 0 });
      s.addText(p.scenario_cn, { x: x + 0.25, y: 3.65, w: 3.5, h: 0.4,
        fontSize: 13, color: BLACK, margin: 0 });
      s.addText(p.scenario_en, { x: x + 0.25, y: 4.0, w: 3.5, h: 0.3,
        fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

      s.addText("動作 · ACTION", { x: x + 0.25, y: 4.4, w: 3.5, h: 0.3,
        fontSize: 10, color: PINK, bold: true, charSpacing: 2, margin: 0 });
      s.addText(p.action_cn, { x: x + 0.25, y: 4.7, w: 3.5, h: 0.4,
        fontSize: 13, color: BLACK, margin: 0 });
      s.addText(p.action_en, { x: x + 0.25, y: 5.05, w: 3.5, h: 0.3,
        fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.25, y: 5.85, w: 3.5, h: 0.85, fill: { color: PINK_TINT } });
      s.addText("耗時 · TIME", { x: x + 0.25, y: 5.85, w: 3.5, h: 0.3,
        fontSize: 9, color: BLACK, charSpacing: 2, align: "center", margin: 0 });
      s.addText(p.time, { x: x + 0.25, y: 6.15, w: 3.5, h: 0.5,
        fontSize: 22, color: BLACK, bold: true, fontFace: "Georgia", align: "center", margin: 0 });
    });

    addPageNumber(s, pageN, TOTAL_SLIDES);
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 6 — Checkout QR 6-Step SOP (MAIN STAFF SLIDE)
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    addBilingualHeader(s, "結帳 QR · 6 步驟 SOP", "Checkout QR · 6-Step Workflow");

    s.addText("您最常用的工具 — 練到 30 秒內完成 / Your most-used tool — practice to under 30 seconds", {
      x: 0.6, y: 1.75, w: 12.1, h: 0.3, fontSize: 11, color: DARKGREY, italic: true, margin: 0 });

    const steps = [
      { n: "1", t_cn: "開連結", t_en: "Open URL", v: "/admin/checkout",
        note_cn: "建議存桌面 / LINE Keep", note_en: "Save to home screen" },
      { n: "2", t_cn: "輸入 PIN", t_en: "Enter PIN", v: "91097496",
        note_cn: "主管口頭告知", note_en: "Given by manager" },
      { n: "3", t_cn: "輸發票編號", t_en: "Invoice no.", v: "BM-XXXXXXXX",
        note_cn: "小白單抄,必填", note_en: "Required (anti-dup)" },
      { n: "4", t_cn: "輸入金額", t_en: "Amount", v: "如 5000",
        note_cn: "系統自動算擲骰", note_en: "Auto-calc dice" },
      { n: "5", t_cn: "出 QR", t_en: "Generate QR", v: "倒數 2:00",
        note_cn: "過期重新產", note_en: "Regenerate if expired" },
      { n: "6", t_cn: "客人掃", t_en: "Customer scans", v: "LINE 相機",
        note_cn: "兌換完成", note_en: "Done" },
    ];

    const cardW = 1.95, gap = 0.12, startX = 0.5;
    steps.forEach((st, i) => {
      const x = startX + i * (cardW + gap);
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.2, w: cardW, h: 3.8,
        fill: { color: WHITE }, line: { color: BLACK, width: 1.5 }, shadow: SHADOW() });
      s.addShape(pres.shapes.OVAL, { x: x + cardW / 2 - 0.35, y: 2.35, w: 0.7, h: 0.7, fill: { color: BLACK } });
      s.addText(st.n, { x: x + cardW / 2 - 0.35, y: 2.35, w: 0.7, h: 0.7,
        fontSize: 24, color: PINK, bold: true, fontFace: "Georgia",
        align: "center", valign: "middle", margin: 0 });

      s.addText(st.t_cn, { x: x + 0.1, y: 3.2, w: cardW - 0.2, h: 0.35,
        fontSize: 14, color: BLACK, bold: true, align: "center", margin: 0 });
      s.addText(st.t_en, { x: x + 0.1, y: 3.55, w: cardW - 0.2, h: 0.3,
        fontSize: 9, color: DARKGREY, italic: true, align: "center", margin: 0 });

      s.addText(st.v, { x: x + 0.05, y: 4.0, w: cardW - 0.1, h: 1.0,
        fontSize: 12, color: BLACK, bold: true, fontFace: "Consolas",
        align: "center", valign: "top", margin: 0 });

      s.addText(st.note_cn, { x: x + 0.1, y: 5.0, w: cardW - 0.2, h: 0.35,
        fontSize: 9, color: BLACK, align: "center", margin: 0 });
      s.addText(st.note_en, { x: x + 0.1, y: 5.35, w: cardW - 0.2, h: 0.5,
        fontSize: 8.5, color: DARKGREY, italic: true, align: "center", margin: 0 });
    });

    // Bottom rules
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 6.2, w: 12.3, h: 0.65,
      fill: { color: PINK_TINT }, line: { color: PINK, width: 1 } });
    s.addText([
      { text: "規則 / Rules: ", options: { bold: true, color: BLACK } },
      { text: "NT$2,000 = 1 擲骰 · 上限 5 · QR 2分鐘失效 · ", options: { color: BLACK } },
      { text: "發票編號必填(防雙領)", options: { bold: true, color: BLACK, breakLine: true } },
      { text: "Required: invoice_no prevents same invoice being redeemed twice", options: { color: DARKGREY, italic: true, fontSize: 10 } },
    ], { x: 0.8, y: 6.25, w: 11.8, h: 0.55, fontSize: 12, valign: "middle", margin: 0 });

    addPageNumber(s, pageN, TOTAL_SLIDES);
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 7 — Customer Lookup Tool (Disputes)
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    addBilingualHeader(s, "客訴查詢工具 · /admin/lookup", "Customer Dispute Lookup Tool");

    s.addText("客人吵「我這張沒用過!」→ 用系統紀錄說話", { x: 0.6, y: 1.75, w: 12, h: 0.3,
      fontSize: 12, color: BLACK, margin: 0 });
    s.addText("'I didn't use this invoice!' → Show system records, don't argue verbally", {
      x: 0.6, y: 2.05, w: 12, h: 0.3, fontSize: 11, color: DARKGREY, italic: true, margin: 0 });

    // Usage instruction strip
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.55, w: 12.1, h: 0.7, fill: { color: BLACK } });
    s.addText([
      { text: "1.", options: { color: PINK, bold: true } },
      { text: " 開 /admin/lookup    ", options: { color: WHITE } },
      { text: "2.", options: { color: PINK, bold: true } },
      { text: " 輸 PIN 91097496    ", options: { color: WHITE } },
      { text: "3.", options: { color: PINK, bold: true } },
      { text: " 輸發票編號 → 查詢", options: { color: WHITE } },
    ], { x: 0.85, y: 2.55, w: 11.6, h: 0.7, fontSize: 16, valign: "middle", margin: 0 });

    // 3 colored results
    const results = [
      {
        bg: "ECFDF5", border: "065F46", emoji: "✓",
        t_cn: "未使用",  t_en: "Not used yet",
        d_cn: "客人沒說謊,引導他自助掃發票或開結帳 QR",
        d_en: "Customer is honest. Guide self-redeem or issue Checkout QR.",
      },
      {
        bg: "FEF2F2", border: "991B1B", emoji: "✗",
        t_cn: "已被使用",  t_en: "Already used",
        d_cn: "畫面顯示時間 / 使用者 / 桌號 / 金額 — 給客人看,系統紀錄不可竄改",
        d_en: "Screen shows when / who / table / amount. Show customer — records are immutable.",
      },
      {
        bg: "FEF3C7", border: "B45309", emoji: "⏱",
        t_cn: "已開 QR 但未掃",  t_en: "Pending QR (not yet scanned)",
        d_cn: "2 分鐘內剛開過 QR 但客人沒掃 — 請客人立刻掃或等過期",
        d_en: "QR issued in last 2 min but unused. Ask customer to scan now or wait.",
      },
    ];
    results.forEach((r, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 3.55, w: 4.0, h: 3.5,
        fill: { color: r.bg }, line: { color: r.border, width: 2 }, shadow: SHADOW() });

      s.addText(r.emoji, { x: x + 0.15, y: 3.7, w: 0.7, h: 0.6,
        fontSize: 36, color: r.border, bold: true, margin: 0 });
      s.addText(r.t_cn, { x: x + 1.0, y: 3.7, w: 2.9, h: 0.4,
        fontSize: 18, color: r.border, bold: true, margin: 0 });
      s.addText(r.t_en, { x: x + 1.0, y: 4.1, w: 2.9, h: 0.3,
        fontSize: 11, color: r.border, italic: true, margin: 0 });

      s.addText(r.d_cn, { x: x + 0.25, y: 4.7, w: 3.5, h: 1.5,
        fontSize: 12, color: BLACK, margin: 0 });
      s.addText(r.d_en, { x: x + 0.25, y: 6.15, w: 3.5, h: 0.8,
        fontSize: 10, color: DARKGREY, italic: true, margin: 0 });
    });

    addPageNumber(s, pageN, TOTAL_SLIDES);
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 8 — Error Message Decoder (bilingual table)
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    addBilingualHeader(s, "客人手機錯誤訊息 · 對照處理", "Error Message Decoder");

    s.addText("客人指著螢幕說「掃不過」時,對照下表 / When customer points at error message, look up below", {
      x: 0.6, y: 1.75, w: 12, h: 0.3, fontSize: 11, color: DARKGREY, italic: true, margin: 0 });

    const rows = [
      ["請先綁定桌號",    "Bind a table first",       "走 餐廳 QR 流程 / Use restaurant QR"],
      ["不是電子發票格式","Not an e-invoice QR",      "對準發票左側 QR / Aim at left side"],
      ["不是 IC 開的",   "Not from IC Kaohsiung",     "別家發票,無法兌換 / Other vendor"],
      ["發票日期過期",   "Invoice date expired",      "走 結帳 QR / Issue Checkout QR"],
      ["此發票已被使用過","Already used",             "走 客訴查詢 確認 / Use Lookup"],
      ["這一桌已兌換過一張","One per binding",        "走 客訴查詢 / 用結帳 QR / Lookup or Checkout QR"],
      ["金額需滿 NT$2,000","Below 2k threshold",      "告知無法參加 / Inform: below threshold"],
      ["圖片不夠清楚",   "Photo unclear",             "重拍 / 用結帳 QR / Retake or Checkout QR"],
      ["不像 IC 的單據", "Not an IC slip",            "確認單據完整 / 結帳 QR / Verify slip / Checkout QR"],
      ["黃色 請洽服務人員","Yellow staff banner",      "直接 走 結帳 QR / Issue Checkout QR"],
    ];

    // Header row
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.2, w: 12.1, h: 0.5, fill: { color: BLACK } });
    s.addText("客人看到 · Error message", { x: 0.75, y: 2.2, w: 4.2, h: 0.5,
      fontSize: 12, color: PINK, bold: true, valign: "middle", charSpacing: 2, margin: 0 });
    s.addText("EN translation", { x: 5.0, y: 2.2, w: 3.6, h: 0.5,
      fontSize: 11, color: LIGHTGREY, italic: true, valign: "middle", margin: 0 });
    s.addText("您怎麼做 · Your action", { x: 8.7, y: 2.2, w: 4.0, h: 0.5,
      fontSize: 12, color: PINK, bold: true, valign: "middle", charSpacing: 2, margin: 0 });

    rows.forEach((row, i) => {
      const y = 2.7 + i * 0.42;
      const bg = i % 2 === 0 ? SOFT_BG : WHITE;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.42, fill: { color: bg } });
      s.addText(row[0], { x: 0.75, y, w: 4.2, h: 0.42,
        fontSize: 11.5, color: BLACK, valign: "middle", margin: 0 });
      s.addText(row[1], { x: 5.0, y, w: 3.6, h: 0.42,
        fontSize: 10.5, color: DARKGREY, italic: true, valign: "middle", margin: 0 });
      s.addText(row[2], { x: 8.7, y, w: 4.0, h: 0.42,
        fontSize: 11, color: BLACK, bold: true, valign: "middle", margin: 0 });
    });

    // Footer
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 7.0, w: 12.1, h: 0.05, fill: { color: PINK }, line: { color: PINK } });
    s.addText("結論 · Bottom line:  幾乎所有狀況的最終答案 = 走「結帳 QR」流程補發 / Almost every case ends with: Issue Checkout QR", {
      x: 0.6, y: 7.1, w: 12.1, h: 0.3, fontSize: 10, color: BLACK, italic: true, align: "center", margin: 0 });

    addPageNumber(s, pageN, TOTAL_SLIDES);
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 9 — Anti-Fraud Rules (4 locks)
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    addBilingualHeader(s, "反作弊四道鎖 · 系統自動運作", "Anti-Fraud · Four Locks · Automatic");

    s.addText("您不用記,但理解 = 跟客人解釋時更有底氣 / You don't need to memorize, but understanding helps when explaining", {
      x: 0.6, y: 1.75, w: 12, h: 0.3, fontSize: 11, color: DARKGREY, italic: true, margin: 0 });

    const locks = [
      { n: "1", t_cn: "賣方統編 = 91097496", t_en: "Seller VAT must = 91097496",
        why_cn: "防別家(7-11、星巴克)發票",
        why_en: "Blocks other vendors' invoices" },
      { n: "2", t_cn: "日期必須是今天或昨天", t_en: "Date must be today / yesterday",
        why_cn: "防客人翻出舊發票 replay",
        why_en: "Prevents replay of old invoices" },
      { n: "3", t_cn: "同一桌 20 分鐘限一張", t_en: "1 invoice / table / 20 min",
        why_cn: "防同人雙領(發票+小白單 同筆消費)",
        why_en: "Prevents same-meal double-claim" },
      { n: "4", t_cn: "同張發票全世界唯一", t_en: "invoice_no globally unique",
        why_cn: "invoice_no 是資料庫 PRIMARY KEY",
        why_en: "invoice_no is the database PK" },
    ];
    locks.forEach((l, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.6 + col * 6.2, y = 2.25 + row * 2.4;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 6.0, h: 2.2,
        fill: { color: WHITE }, line: { color: PINK, width: 1.5 }, shadow: SHADOW() });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.14, h: 2.2, fill: { color: BLACK }, line: { color: BLACK } });

      s.addImage({ data: ic.lock, x: x + 0.4, y: y + 0.25, w: 0.5, h: 0.5 });
      s.addText("LOCK " + l.n, { x: x + 1.05, y: y + 0.2, w: 4.7, h: 0.3,
        fontSize: 11, color: PINK, bold: true, charSpacing: 3, margin: 0 });
      s.addText(l.t_cn, { x: x + 1.05, y: y + 0.5, w: 4.7, h: 0.4,
        fontSize: 17, color: BLACK, bold: true, margin: 0 });
      s.addText(l.t_en, { x: x + 1.05, y: y + 0.9, w: 4.7, h: 0.35,
        fontSize: 11, color: DARKGREY, italic: true, margin: 0 });

      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.4, y: y + 1.45, w: 5.4, h: 0.65, fill: { color: PINK_TINT } });
      s.addText([
        { text: "為什麼: ", options: { color: BLACK, fontSize: 10, bold: true } },
        { text: l.why_cn, options: { color: BLACK, fontSize: 11, breakLine: true } },
        { text: l.why_en, options: { color: DARKGREY, fontSize: 9.5, italic: true } },
      ], { x: x + 0.55, y: y + 1.5, w: 5.25, h: 0.6, valign: "middle", margin: 0 });
    });

    addPageNumber(s, pageN, TOTAL_SLIDES);
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 10 — Never Do (5 prohibitions)
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    addBilingualHeader(s, "絕對不要做的事", "Five Hard Prohibitions");

    s.addText("這些事情會破壞系統設計或讓客人資料外洩 / These actions break the system or leak customer data", {
      x: 0.6, y: 1.75, w: 12, h: 0.3, fontSize: 11, color: DARKGREY, italic: true, margin: 0 });

    const dont = [
      {
        t_cn: "PIN 寫在牆上紙條",         t_en: "Write the PIN on a wall note",
        why_cn: "客人可能偷看,口頭傳達就好", why_en: "Customers could see it. Verbal only." },
      {
        t_cn: "QR 截圖傳給多個客人",       t_en: "Share Checkout QR screenshot with multiple",
        why_cn: "只第一個掃的人拿得到,其他人會看「已使用」",
        why_en: "Only the first scanner gets it; others see 'used'." },
      {
        t_cn: "為了討好客人破壞規則",     t_en: "Bend rules to please a customer",
        why_cn: "同桌一張、同編號全域唯一是反作弊設計,主動破壞會被審計",
        why_en: "Anti-fraud rules are audited. Don't override." },
      {
        t_cn: "替客人輸 LINE 帳號密碼",   t_en: "Type customer's LINE credentials",
        why_cn: "個資不該由您經手,客人自己掃就好",
        why_en: "Privacy: customer handles their own LINE login." },
      {
        t_cn: "輕信「朋友剛剛幫我領了」", t_en: "Trust 'My friend just redeemed for me'",
        why_cn: "用客訴查詢工具驗證,不要憑感覺放行",
        why_en: "Always verify via Lookup tool before granting." },
    ];
    dont.forEach((d, i) => {
      const y = 2.25 + i * 0.95;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.85,
        fill: { color: SOFT_BG }, line: { color: BLACK, width: 1 } });
      s.addImage({ data: ic.ban, x: 0.85, y: y + 0.18, w: 0.5, h: 0.5 });
      s.addText(d.t_cn, { x: 1.55, y: y + 0.08, w: 5.8, h: 0.4,
        fontSize: 15, color: BLACK, bold: true, margin: 0 });
      s.addText(d.t_en, { x: 1.55, y: y + 0.48, w: 5.8, h: 0.35,
        fontSize: 10, color: DARKGREY, italic: true, margin: 0 });
      s.addText("→ " + d.why_cn, { x: 7.6, y: y + 0.13, w: 5.0, h: 0.35,
        fontSize: 11, color: BLACK, margin: 0 });
      s.addText(d.why_en, { x: 7.8, y: y + 0.48, w: 4.9, h: 0.35,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
    });

    addPageNumber(s, pageN, TOTAL_SLIDES);
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDES 11-15 — Per-Restaurant Pages
  // ═══════════════════════════════════════════════════════════════
  const RESTAURANTS = [
    {
      code: "ZL", icon: ic.spoon,
      cn: "湛露中餐廳", en: "Zhan Lu",
      tagline_cn: "粵式經典 · 二樓",
      tagline_en: "Cantonese fine dining · 2nd floor",
      address: "高雄市前鎮區新光路 33 號 2F  ·  No. 33 Xinguang Rd, 2F",
      phone: "+886-7-3391888",
      typical_cn: "客單高(NT$3,000–15,000),IHG 會員多用 85 折",
      typical_en: "High ticket size NT$3-15k, IHG 85% discount common",
      notes: [
        { cn: "多客人會用「載具 + 統編」報帳 → 拍小白單路徑常用", en: "Many use carrier + tax ID → photograph slip is common" },
        { cn: "餐券抵用情境多 — 以發票「總計」為準,不扣餐券", en: "Often use F&B vouchers — count 總計 incl. voucher" },
        { cn: "結帳容易花 5+ 分鐘 → 客人可能先離開,事後在大廳掃發票", en: "Long checkout → invoice may be scanned in lobby later" },
      ],
    },
    {
      code: "WR", icon: ic.fish,
      cn: "WA-RA 日式餐廳", en: "WA-RA Japanese",
      tagline_cn: "日式割烹 · 二樓",
      tagline_en: "Japanese kappo · 2nd floor",
      address: "高雄市前鎮區新光路 33 號 2F  ·  No. 33 Xinguang Rd, 2F",
      phone: "+886-7-3391888",
      typical_cn: "客單 NT$2,000–8,000,套餐居多",
      typical_en: "Ticket NT$2-8k, set menus dominate",
      notes: [
        { cn: "客人多為商務 / 親子,介意流程順暢 → 引導用結帳 QR 最快", en: "Business / family customers — Checkout QR is fastest path" },
        { cn: "高比例會員客 → 「85 折」常見,影響總計但不影響擲骰計算", en: "High loyalty member ratio — discounts apply but dice math unchanged" },
        { cn: "建議放兩張立牌:大門 + 收銀台旁邊", en: "Place 2 QR standees: entrance + cashier counter" },
      ],
    },
    {
      code: "SD", icon: ic.utensils,
      cn: "SEEDS 大地全日餐廳", en: "SEEDS All-Day Dining",
      tagline_cn: "全日 buffet · 一樓",
      tagline_en: "All-day buffet · 1st floor",
      address: "高雄市前鎮區新光路 33 號  ·  No. 33 Xinguang Rd",
      phone: "+886-7-3391888",
      typical_cn: "高流量 · 客單 NT$1,500–5,000(成人 buffet × 人數)",
      typical_en: "High volume · NT$1.5-5k (adult buffet × pax)",
      notes: [
        { cn: "buffet 結帳快 → 客人很可能還沒下載 LINE 就走了", en: "Quick checkout — many leave before installing LINE" },
        { cn: "建議在「請客留座」桌上立牌提早曝光", en: "Place QR on tables so customers see it during meal" },
        { cn: "高比例載具客 → 拍小白單路徑要練熟", en: "High carrier ratio — train photo path well" },
      ],
    },
    {
      code: "HW", icon: ic.pepper,
      cn: "HAWKER 南洋料理", en: "HAWKER Southeast Asian",
      tagline_cn: "南洋風味 · 一樓",
      tagline_en: "Southeast Asian · 1st floor",
      address: "高雄市前鎮區新光路 33 號  ·  No. 33 Xinguang Rd",
      phone: "+886-7-3391888",
      typical_cn: "客單 NT$1,500–4,500,單身/雙人客居多",
      typical_en: "Ticket NT$1.5-4.5k, solo / duo diners",
      notes: [
        { cn: "客單接近 NT$2,000 門檻 → 留意「金額不足」訊息,告知客人「下次再來」", en: "Many tickets near threshold — train phrase 'Below 2k, come back!'" },
        { cn: "多客人為飯店住客 → 已是 LINE 好友比例高,跳過加好友步驟", en: "Many in-house guests — likely already LINE friends" },
        { cn: "BLT33 共用立牌空間 → 留意 QR 不要拿錯", en: "Shared signage area with BLT33 — don't mix QRs" },
      ],
    },
    {
      code: "BL", icon: ic.cocktail,
      cn: "BLT33 大廳酒吧", en: "BLT33 Lobby Bar",
      tagline_cn: "大廳酒吧 · 一樓",
      tagline_en: "Lobby bar · 1st floor",
      address: "高雄市前鎮區新光路 33 號  ·  No. 33 Xinguang Rd",
      phone: "+886-7-3391888",
      typical_cn: "客單 NT$2,000–4,000,酒水 + 小點居多",
      typical_en: "Ticket NT$2-4k, drinks + small plates",
      notes: [
        { cn: "晚間客人多 + 飲酒 → 操作要簡單,結帳 QR 最快", en: "Evening + alcohol — keep flow simple, Checkout QR preferred" },
        { cn: "獨自客人多 → 不易引導,QR 立牌放吧台明顯處", en: "Solo customers — place QR prominently at bar counter" },
        { cn: "「Hotel Specific other」品項常見,不影響總計,vision 已會忽略", en: "'Hotel Specific other' line common; vision already ignores" },
      ],
    },
  ];

  RESTAURANTS.forEach((r) => {
    pageN++;
    const s = pres.addSlide();
    s.background = { color: WHITE };

    // Header strip with restaurant name
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.3, h: 1.7, fill: { color: BLACK } });
    s.addImage({ data: r.icon, x: 0.8, y: 0.4, w: 0.85, h: 0.85 });
    s.addText(r.cn, { x: 1.85, y: 0.35, w: 9, h: 0.65,
      fontSize: 36, color: PINK, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText(r.en, { x: 1.85, y: 0.95, w: 9, h: 0.4,
      fontSize: 16, color: LIGHTGREY, italic: true, margin: 0 });
    s.addText(r.tagline_cn + "  ·  " + r.tagline_en, { x: 1.85, y: 1.3, w: 9, h: 0.3,
      fontSize: 11, color: LIGHTGREY, italic: true, margin: 0 });
    s.addText(`#${r.code}`, { x: 11.5, y: 0.5, w: 1.6, h: 0.6,
      fontSize: 40, color: PINK, bold: true, fontFace: "Georgia", align: "right", margin: 0 });
    s.addText("Outlet code", { x: 11.5, y: 1.15, w: 1.6, h: 0.3,
      fontSize: 9, color: LIGHTGREY, italic: true, align: "right", charSpacing: 2, margin: 0 });

    // Left column: info
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.0, w: 7.5, h: 5.0,
      fill: { color: SOFT_BG }, line: { color: LIGHTGREY, width: 1 }, shadow: SHADOW() });

    s.addImage({ data: ic.pin, x: 0.85, y: 2.2, w: 0.4, h: 0.4 });
    s.addText("位址 · Address", { x: 1.35, y: 2.2, w: 6.5, h: 0.3,
      fontSize: 10, color: PINK, charSpacing: 2, margin: 0 });
    s.addText(r.address, { x: 1.35, y: 2.5, w: 6.5, h: 0.4,
      fontSize: 12, color: BLACK, margin: 0 });

    s.addImage({ data: ic.phone, x: 0.85, y: 3.05, w: 0.4, h: 0.4 });
    s.addText("電話 · Phone", { x: 1.35, y: 3.05, w: 6.5, h: 0.3,
      fontSize: 10, color: PINK, charSpacing: 2, margin: 0 });
    s.addText(r.phone, { x: 1.35, y: 3.35, w: 6.5, h: 0.4,
      fontSize: 13, color: BLACK, fontFace: "Consolas", bold: true, margin: 0 });

    s.addImage({ data: ic.dice, x: 0.85, y: 3.9, w: 0.4, h: 0.4 });
    s.addText("客單常見值 · Typical ticket", { x: 1.35, y: 3.9, w: 6.5, h: 0.3,
      fontSize: 10, color: PINK, charSpacing: 2, margin: 0 });
    s.addText(r.typical_cn, { x: 1.35, y: 4.2, w: 6.5, h: 0.35,
      fontSize: 12, color: BLACK, margin: 0 });
    s.addText(r.typical_en, { x: 1.35, y: 4.55, w: 6.5, h: 0.3,
      fontSize: 10, color: DARKGREY, italic: true, margin: 0 });

    // Notes section
    s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 5.0, w: 7.0, h: 0.04, fill: { color: PINK }, line: { color: PINK } });
    s.addText("本店重點 · Outlet notes", { x: 0.85, y: 5.1, w: 7.0, h: 0.3,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, margin: 0 });

    r.notes.forEach((n, i) => {
      const y = 5.45 + i * 0.55;
      s.addText("·", { x: 0.85, y, w: 0.2, h: 0.4,
        fontSize: 20, color: BLACK, bold: true, margin: 0 });
      s.addText(n.cn, { x: 1.05, y, w: 6.8, h: 0.28,
        fontSize: 11, color: BLACK, margin: 0 });
      s.addText(n.en, { x: 1.05, y: y + 0.27, w: 6.8, h: 0.28,
        fontSize: 9.5, color: DARKGREY, italic: true, margin: 0 });
    });

    // Right column: QR Code
    s.addShape(pres.shapes.RECTANGLE, { x: 8.3, y: 2.0, w: 4.4, h: 5.0,
      fill: { color: WHITE }, line: { color: BLACK, width: 1.5 }, shadow: SHADOW() });
    s.addShape(pres.shapes.RECTANGLE, { x: 8.3, y: 2.0, w: 4.4, h: 0.45, fill: { color: BLACK } });
    s.addText("專屬 QR Code · Outlet QR", { x: 8.3, y: 2.0, w: 4.4, h: 0.45,
      fontSize: 11, color: PINK, bold: true, charSpacing: 2, align: "center", valign: "middle", margin: 0 });

    s.addImage({ data: qrBase64(r.code), x: 8.5, y: 2.6, w: 4.0, h: 3.6 });

    s.addShape(pres.shapes.RECTANGLE, { x: 8.5, y: 6.3, w: 4.0, h: 0.04, fill: { color: PINK }, line: { color: PINK } });
    s.addText("立牌位置建議 · Standee placement", { x: 8.5, y: 6.4, w: 4.0, h: 0.3,
      fontSize: 9, color: PINK, charSpacing: 2, align: "center", margin: 0 });
    s.addText("入口 + 各桌 + 收銀台", { x: 8.5, y: 6.65, w: 4.0, h: 0.3,
      fontSize: 11, color: BLACK, bold: true, align: "center", margin: 0 });
    s.addText("Entrance + tables + cashier counter", { x: 8.5, y: 6.95, w: 4.0, h: 0.25,
      fontSize: 9, color: DARKGREY, italic: true, align: "center", margin: 0 });

    addPageNumber(s, pageN, TOTAL_SLIDES);
  });

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 16 — Closing: Contacts + Thank you
  // ═══════════════════════════════════════════════════════════════
  pageN++;
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };

    s.addImage({ data: ic.hotel, x: 0.8, y: 0.7, w: 0.65, h: 0.65 });
    s.addText("InterContinental KAOHSIUNG  ·  高雄洲際酒店", { x: 1.6, y: 0.8, w: 11, h: 0.45,
      fontSize: 14, color: PINK, fontFace: "Georgia", italic: true, charSpacing: 2, margin: 0 });

    s.addText("感謝您 ·  Thank You", { x: 0.6, y: 1.7, w: 12, h: 0.8,
      fontSize: 52, color: WHITE, fontFace: "Georgia", bold: true, align: "center", margin: 0 });

    s.addShape(pres.shapes.RECTANGLE, { x: 5.65, y: 2.6, w: 2.0, h: 0.05, fill: { color: PINK }, line: { color: PINK } });

    s.addText("您的細心是這個遊戲成功的關鍵", { x: 0.6, y: 2.85, w: 12, h: 0.45,
      fontSize: 20, color: LIGHTGREY, align: "center", margin: 0 });
    s.addText("Your attention to detail is what makes this work.", { x: 0.6, y: 3.35, w: 12, h: 0.4,
      fontSize: 14, color: DARKGREY, italic: true, align: "center", margin: 0 });

    // Contacts box
    s.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: 4.3, w: 10.3, h: 2.4,
      fill: { color: ALMOST_BLACK }, line: { color: PINK, width: 1 } });

    s.addText("緊急聯絡 · Emergency Contacts", { x: 1.5, y: 4.45, w: 10.3, h: 0.4,
      fontSize: 14, color: PINK, bold: true, charSpacing: 3, align: "center", margin: 0 });

    const contacts = [
      { role_cn: "產品 / 行銷主導", role_en: "Product / Marketing Lead",
        name: "Tony Chen", contact: "tony.chen6@ihg.com" },
      { role_cn: "餐飲部主管",     role_en: "F&B Department Lead",
        name: "[ 現場填 ]", contact: "—" },
      { role_cn: "IT 部門",         role_en: "IT Department",
        name: "[ 現場填 ]", contact: "—" },
    ];
    contacts.forEach((c, i) => {
      const x = 1.85 + i * 3.3;
      s.addText(c.role_cn, { x, y: 5.0, w: 3.1, h: 0.3,
        fontSize: 10, color: LIGHTGREY, charSpacing: 2, margin: 0 });
      s.addText(c.role_en, { x, y: 5.3, w: 3.1, h: 0.25,
        fontSize: 8, color: DARKGREY, italic: true, margin: 0 });
      s.addText(c.name, { x, y: 5.65, w: 3.1, h: 0.35,
        fontSize: 14, color: WHITE, bold: true, margin: 0 });
      s.addText(c.contact, { x, y: 6.05, w: 3.1, h: 0.3,
        fontSize: 10, color: PINK, fontFace: "Consolas", margin: 0 });
    });

    // Footer
    s.addText("v2026-05-18  ·  Demo Day 2026-05-31  ·  All 5 F&B outlets ready", {
      x: 0.6, y: 7.1, w: 12, h: 0.3,
      fontSize: 10, color: DARKGREY, italic: true, align: "center", margin: 0 });
  }

  // Output
  await pres.writeFile({
    fileName: "C:/Users/ChenVivi/OneDrive - Six Continents Hotels, Inc/Desktop/Claude/ickaohsiungculinaryjourneymap/docs/IC_Kaohsiung_Game_Staff_Bilingual.pptx",
  });
  console.log("[OK] Generated IC_Kaohsiung_Game_Staff_Bilingual.pptx (16 slides)");
}

build().catch((e) => { console.error(e); process.exit(1); });
