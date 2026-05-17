/**
 * IC 高雄洲際 · 大富翁遊戲 · 使用手冊培訓 PPT
 *
 * 跟 build_pptx.cjs(介紹用)分開 — 這份聚焦操作 SOP,給服務人員培訓。
 * Run: NODE_PATH="$(npm root -g)" node build_manual_pptx.cjs
 * Output: IC_Kaohsiung_Game_Manual.pptx
 */

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaHotel, FaUtensils, FaQrcode, FaReceipt, FaCamera, FaCheckCircle,
  FaTimesCircle, FaShieldAlt, FaDice, FaUsers, FaUserTie, FaUserCog,
  FaBell, FaLine, FaCog, FaExclamationTriangle, FaLock, FaChartLine,
  FaGift, FaMobileAlt, FaClipboardCheck, FaPlayCircle, FaSearch,
  FaPhoneAlt, FaBan, FaQuestionCircle,
} = require("react-icons/fa");

const NAVY = "0A2540";
const GOLD = "C9A961";
const CREAM = "F5F0E8";
const WHITE = "FFFFFF";
const TEXT_DARK = "1A1A1A";
const TEXT_MUTED = "6B7280";
const SUCCESS = "065F46";
const SUCCESS_BG = "ECFDF5";
const DANGER = "991B1B";
const DANGER_BG = "FEF2F2";
const WARN = "B45309";
const WARN_BG = "FEF3C7";
const BG_SOFT = "FAFAF9";

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

const SHADOW = () => ({ type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.08 });

async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
  pres.author = "Tony Chen";
  pres.title = "IC 高雄 · 大富翁遊戲 使用手冊";

  const ic = {
    hotel:    await icon(FaHotel, GOLD),
    utensils: await icon(FaUtensils, GOLD),
    qr:       await icon(FaQrcode, GOLD),
    qrW:      await icon(FaQrcode, WHITE),
    receipt:  await icon(FaReceipt, GOLD),
    camera:   await icon(FaCamera, GOLD),
    check:    await icon(FaCheckCircle, SUCCESS),
    cross:    await icon(FaTimesCircle, DANGER),
    ban:      await icon(FaBan, DANGER),
    shield:   await icon(FaShieldAlt, GOLD),
    dice:     await icon(FaDice, GOLD),
    users:    await icon(FaUsers, GOLD),
    tie:      await icon(FaUserTie, GOLD),
    cog:      await icon(FaUserCog, GOLD),
    bell:     await icon(FaBell, GOLD),
    bellW:    await icon(FaBell, WHITE),
    line:     await icon(FaLine, "06C755"),
    settings: await icon(FaCog, GOLD),
    warn:     await icon(FaExclamationTriangle, WARN),
    warnW:    await icon(FaExclamationTriangle, WHITE),
    lock:     await icon(FaLock, GOLD),
    chart:    await icon(FaChartLine, GOLD),
    gift:     await icon(FaGift, GOLD),
    mobile:   await icon(FaMobileAlt, GOLD),
    clipboard:await icon(FaClipboardCheck, GOLD),
    play:     await icon(FaPlayCircle, GOLD),
    search:   await icon(FaSearch, GOLD),
    phone:    await icon(FaPhoneAlt, GOLD),
    q:        await icon(FaQuestionCircle, GOLD),
  };

  // ─────────────────────────────────────────────────────────
  // 1. Title
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };
    s.addImage({ data: ic.hotel, x: 0.8, y: 0.7, w: 0.7, h: 0.7 });
    s.addText("IC Kaohsiung", { x: 1.7, y: 0.7, w: 6, h: 0.55,
      fontSize: 16, color: GOLD, fontFace: "Georgia", bold: true, charSpacing: 4, margin: 0 });
    s.addText("InterContinental 高雄洲際酒店", { x: 1.7, y: 1.2, w: 8, h: 0.4,
      fontSize: 12, color: "CADCFC", margin: 0 });

    s.addText("使用手冊培訓", { x: 0.8, y: 2.4, w: 12, h: 0.9,
      fontSize: 56, color: WHITE, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("大富翁餐飲忠誠度遊戲", { x: 0.8, y: 3.3, w: 12, h: 0.6,
      fontSize: 24, color: GOLD, fontFace: "Georgia", italic: true, margin: 0 });

    s.addText("給同事看的版本 · 服務人員培訓必備", { x: 0.8, y: 4.5, w: 12, h: 0.4,
      fontSize: 16, color: "CADCFC", margin: 0 });

    // Bottom strip with 3 KPIs
    const kpis = [
      { v: "5", l: "餐廳" },
      { v: "3", l: "兌換路徑" },
      { v: "30 秒", l: "結帳 QR 操作完成" },
    ];
    kpis.forEach((k, i) => {
      const x = 0.8 + i * 4.1;
      s.addText(k.v, { x, y: 5.4, w: 4, h: 0.7, fontSize: 40,
        color: GOLD, fontFace: "Georgia", bold: true, align: "center", margin: 0 });
      s.addText(k.l, { x, y: 6.1, w: 4, h: 0.3, fontSize: 13,
        color: WHITE, align: "center", margin: 0 });
    });

    s.addText("Tony Chen · 2026-05-17 · Demo 5/31", { x: 0.8, y: 6.9, w: 12, h: 0.3,
      fontSize: 11, color: TEXT_MUTED, align: "center", margin: 0 });
  }

  // ─────────────────────────────────────────────────────────
  // 2. 30 秒看完版 (TL;DR)
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("30 秒看完版", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 40, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("給沒空的人 — 看這一頁就懂", { x: 0.6, y: 1.2, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    // Big takeaway
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.9, w: 12.1, h: 1.6, fill: { color: NAVY } });
    s.addText([
      { text: "客人", options: { bold: true, color: GOLD } },
      { text: " 在 IC 餐廳消費 → ", options: { color: WHITE } },
      { text: "拿擲骰機會", options: { bold: true, color: GOLD } },
      { text: " → 走大富翁 → ", options: { color: WHITE } },
      { text: "抽獎拿餐券", options: { bold: true, color: GOLD } },
      { text: "。", options: { color: WHITE, breakLine: true } },
      { text: "規則:每 NT$2,000 = 1 次擲骰,上限 5 次。15 點抽大獎進下一季。", options: { color: WHITE, fontSize: 16 } },
    ], { x: 0.9, y: 2.05, w: 11.5, h: 1.4, fontSize: 22, valign: "middle", margin: 0 });

    // Three roles
    const roles = [
      { icon: ic.users, color: SUCCESS, title: "客人", primary: "全部自助",
        sub: "加 LINE → 綁桌 → 掃發票 / 拍小白單 / 掃結帳 QR" },
      { icon: ic.bell, color: NAVY, title: "服務人員", primary: "90% 不用做",
        sub: "卡關時補開「結帳 QR」, 客訴時用「客訴查詢」" },
      { icon: ic.tie, color: WARN, title: "主管", primary: "後台監控",
        sub: "看數據 / 換 PIN / 訓練服務人員" },
    ];
    roles.forEach((r, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 3.9, w: 4.0, h: 3.0,
        fill: { color: BG_SOFT }, line: { color: r.color, width: 1.5 }, shadow: SHADOW() });
      s.addImage({ data: r.icon, x: x + 0.3, y: 4.05, w: 0.6, h: 0.6 });
      s.addText(r.title, { x: x + 1.0, y: 4.05, w: 2.9, h: 0.5,
        fontSize: 22, color: r.color, bold: true, margin: 0 });
      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.3, y: 4.85, w: 3.4, h: 0.5,
        fill: { color: r.color } });
      s.addText(r.primary, { x: x + 0.3, y: 4.85, w: 3.4, h: 0.5,
        fontSize: 16, color: WHITE, bold: true, align: "center", valign: "middle", margin: 0 });
      s.addText(r.sub, { x: x + 0.3, y: 5.5, w: 3.4, h: 1.3,
        fontSize: 12, color: TEXT_DARK, valign: "top", margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 3. 客人三條路徑
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("客人怎麼拿擲骰機會?", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("結帳後三選一 — 都在客人手上,服務人員 90% 不用介入", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    const paths = [
      { emoji: "📄", title: "掃發票", who: "正常客", scenario: "有電子發票證明聯紙本",
        action: "自助掃發票左側 QR Code", time: "~2 秒" },
      { emoji: "📸", title: "拍小白單", who: "載具客", scenario: "用載具,沒實體發票,只有小白單",
        action: "自助拍小白單 → AI 辨識", time: "~5 秒" },
      { emoji: "📷", title: "結帳 QR", who: "緊急備援", scenario: "上述都失敗 / 客人卡關",
        action: "服務人員開 QR → 客人 LINE 掃", time: "~10 秒" },
    ];
    paths.forEach((p, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 4.0, h: 4.8,
        fill: { color: WHITE }, line: { color: GOLD, width: 1.5 }, shadow: SHADOW() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 4.0, h: 1.0, fill: { color: NAVY } });
      s.addText(p.emoji, { x: x + 0.2, y: 2.1, w: 0.8, h: 0.8, fontSize: 36, margin: 0 });
      s.addText(p.title, { x: x + 1.1, y: 2.1, w: 2.7, h: 0.5,
        fontSize: 22, color: GOLD, bold: true, margin: 0 });
      s.addText(p.who, { x: x + 1.1, y: 2.55, w: 2.7, h: 0.35,
        fontSize: 12, color: WHITE, italic: true, margin: 0 });

      s.addText("適用情境", { x: x + 0.25, y: 3.2, w: 3.5, h: 0.3,
        fontSize: 11, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
      s.addText(p.scenario, { x: x + 0.25, y: 3.5, w: 3.5, h: 0.8,
        fontSize: 13, color: TEXT_DARK, margin: 0 });

      s.addText("動作", { x: x + 0.25, y: 4.4, w: 3.5, h: 0.3,
        fontSize: 11, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
      s.addText(p.action, { x: x + 0.25, y: 4.7, w: 3.5, h: 0.8,
        fontSize: 13, color: TEXT_DARK, margin: 0 });

      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.25, y: 5.9, w: 3.5, h: 0.7, fill: { color: BG_SOFT } });
      s.addText("耗時 " + p.time, { x: x + 0.25, y: 5.9, w: 3.5, h: 0.7,
        fontSize: 17, color: NAVY, bold: true, align: "center", valign: "middle", margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4. 服務人員 — 您 90% 不用做事
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("服務人員 · 90% 時間什麼都不用做", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 34, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("客人會自己做這些事,您不用介入", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    // Left — what customers do alone
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.9, w: 6.0, h: 5.0,
      fill: { color: SUCCESS_BG }, line: { color: SUCCESS, width: 1.5 }, shadow: SHADOW() });
    s.addImage({ data: ic.check, x: 0.85, y: 2.05, w: 0.55, h: 0.55 });
    s.addText("✓ 客人自己會做", { x: 1.55, y: 2.05, w: 5, h: 0.5,
      fontSize: 22, color: SUCCESS, bold: true, margin: 0 });
    const customerActs = [
      "加 LINE 好友(自己掃桌邊 QR)",
      "綁桌號(自己打 table:XX)",
      "選角色",
      "掃發票拿擲骰",
      "拍小白單拿擲骰",
      "擲骰子、走大富翁",
      "抽獎、拿固定獎品",
      "跨季時自動下一季",
    ];
    const customerRich = customerActs.flatMap((a, i) => [
      { text: "• ", options: { color: SUCCESS, bold: true } },
      { text: a, options: { color: TEXT_DARK, breakLine: i < customerActs.length - 1 } },
    ]);
    s.addText(customerRich, { x: 0.85, y: 2.85, w: 5.5, h: 4.0,
      fontSize: 14, valign: "top", paraSpaceAfter: 8, margin: 0 });

    // Right — when you DO intervene
    s.addShape(pres.shapes.RECTANGLE, { x: 6.85, y: 1.9, w: 6.0, h: 5.0,
      fill: { color: WARN_BG }, line: { color: WARN, width: 1.5 }, shadow: SHADOW() });
    s.addImage({ data: ic.bell, x: 7.1, y: 2.05, w: 0.55, h: 0.55 });
    s.addText("🛎 您只在這 3 種狀況介入", { x: 7.8, y: 2.05, w: 5, h: 0.5,
      fontSize: 22, color: WARN, bold: true, margin: 0 });

    const interventions = [
      { n: "1", t: "客人問「怎麼玩?」", d: "帶到桌邊立牌,口頭教他掃 + 打 table:XX" },
      { n: "2", t: "客人卡關(黃色 banner)", d: "走「結帳 QR」6 步流程補發" },
      { n: "3", t: "客人吵發票沒用過", d: "走「客訴查詢」3 色結果,證據說話" },
    ];
    interventions.forEach((iv, i) => {
      const y = 2.85 + i * 1.35;
      s.addShape(pres.shapes.OVAL, { x: 7.1, y, w: 0.55, h: 0.55, fill: { color: WARN } });
      s.addText(iv.n, { x: 7.1, y, w: 0.55, h: 0.55, fontSize: 20,
        color: WHITE, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(iv.t, { x: 7.8, y, w: 5.0, h: 0.45,
        fontSize: 15, color: NAVY, bold: true, margin: 0 });
      s.addText(iv.d, { x: 7.8, y: y + 0.45, w: 5.0, h: 0.7,
        fontSize: 12, color: TEXT_DARK, margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 5. 結帳 QR · 6 步 SOP(大字練習版)
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("結帳 QR · 6 步驟 SOP", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("練到 30 秒以內完成 — 這是您最常用的工具", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    const steps = [
      { n: "1", t: "開連結", d: "/admin/checkout", note: "(存桌面 / LINE Keep)" },
      { n: "2", t: "輸 PIN", d: "91097496", note: "(主管告知)" },
      { n: "3", t: "輸發票編號", d: "BM36258896", note: "(小白單上 抄)" },
      { n: "4", t: "輸金額", d: "如 5000", note: "(系統自動算擲骰)" },
      { n: "5", t: "出 QR", d: "倒數 2:00", note: "(過期重產)" },
      { n: "6", t: "客人掃", d: "LINE 相機", note: "(完成)" },
    ];

    const cardW = 1.95, gap = 0.12, startX = 0.5;
    steps.forEach((st, i) => {
      const x = startX + i * (cardW + gap);
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: cardW, h: 3.7,
        fill: { color: WHITE }, line: { color: NAVY, width: 1.5 }, shadow: SHADOW() });
      s.addShape(pres.shapes.OVAL, { x: x + cardW / 2 - 0.35, y: 2.2, w: 0.7, h: 0.7, fill: { color: NAVY } });
      s.addText(st.n, { x: x + cardW / 2 - 0.35, y: 2.2, w: 0.7, h: 0.7,
        fontSize: 24, color: GOLD, fontFace: "Georgia", bold: true,
        align: "center", valign: "middle", margin: 0 });
      s.addText(st.t, { x: x + 0.1, y: 3.05, w: cardW - 0.2, h: 0.4,
        fontSize: 14, color: NAVY, bold: true, align: "center", margin: 0 });
      s.addText(st.d, { x: x + 0.1, y: 3.55, w: cardW - 0.2, h: 1.0,
        fontSize: 12, color: GOLD, bold: true, fontFace: "Consolas",
        align: "center", valign: "top", margin: 0 });
      s.addText(st.note, { x: x + 0.1, y: 4.95, w: cardW - 0.2, h: 0.65,
        fontSize: 9, color: TEXT_MUTED, align: "center", margin: 0 });
    });

    // Bottom rules
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 6.0, w: 12.3, h: 1.1,
      fill: { color: CREAM }, line: { color: GOLD, width: 1 } });
    s.addText([
      { text: "規則:", options: { bold: true, color: NAVY } },
      { text: " NT$2,000 = 1 次擲骰,上限 5 次  ·  ", options: { color: TEXT_DARK } },
      { text: "發票編號必填", options: { bold: true, color: DANGER } },
      { text: "(防雙領)  ·  QR 2 分鐘失效  ·  只第一人掃到", options: { color: TEXT_DARK, breakLine: true } },
      { text: "若同一張發票編號 已被使用過 → 系統會擋,並顯示之前誰用的紀錄", options: { color: TEXT_MUTED, fontSize: 12 } },
    ], { x: 0.8, y: 6.1, w: 11.8, h: 0.9, fontSize: 14, valign: "middle", margin: 0 });
  }

  // ─────────────────────────────────────────────────────────
  // 6. 客訴查詢工具 · 3 色結果
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("客訴查詢工具 · /admin/lookup", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("客人吵「我這張發票明明沒用過!」→ 用系統紀錄說話,不要用嘴跟客人爭", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    // Top: 3 step usage
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.85, w: 12.1, h: 0.9, fill: { color: NAVY } });
    s.addText([
      { text: "1. ", options: { color: GOLD, bold: true } },
      { text: "開 /admin/lookup    ", options: { color: WHITE } },
      { text: "2. ", options: { color: GOLD, bold: true } },
      { text: "輸 PIN(同結帳 QR)    ", options: { color: WHITE } },
      { text: "3. ", options: { color: GOLD, bold: true } },
      { text: "輸發票編號 → 點查詢", options: { color: WHITE } },
    ], { x: 0.85, y: 1.95, w: 11.6, h: 0.7, fontSize: 18, valign: "middle", margin: 0 });

    // Three colored result cards
    const results = [
      {
        color: SUCCESS, bg: SUCCESS_BG, emoji: "🟢", t: "綠 = 未使用",
        d: "客人沒說謊", action: "引導他自助掃發票, 或為他開結帳 QR",
      },
      {
        color: DANGER, bg: DANGER_BG, emoji: "🔴", t: "紅 = 已被使用",
        d: "顯示時間 / 使用者 / 桌號 / 金額 / 擲骰數 / 兌換方式",
        action: "把畫面給客人看, 紀錄不可竄改",
      },
      {
        color: WARN, bg: WARN_BG, emoji: "🟡", t: "黃 = 已開 QR 沒掃",
        d: "2 分鐘內已開過 QR,客人還沒掃", action: "請客人立刻掃, 或等過期再重開",
      },
    ];
    results.forEach((r, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.95, w: 4.0, h: 4.05,
        fill: { color: r.bg }, line: { color: r.color, width: 2 }, shadow: SHADOW() });
      s.addText(r.emoji, { x: x + 0.2, y: 3.1, w: 0.8, h: 0.8, fontSize: 40, margin: 0 });
      s.addText(r.t, { x: x + 1.1, y: 3.15, w: 2.8, h: 0.7,
        fontSize: 19, color: r.color, bold: true, margin: 0 });

      s.addText("狀態", { x: x + 0.25, y: 4.05, w: 3.5, h: 0.3,
        fontSize: 11, color: r.color, bold: true, charSpacing: 2, margin: 0 });
      s.addText(r.d, { x: x + 0.25, y: 4.35, w: 3.5, h: 1.2,
        fontSize: 13, color: TEXT_DARK, margin: 0 });

      s.addText("怎麼做", { x: x + 0.25, y: 5.65, w: 3.5, h: 0.3,
        fontSize: 11, color: r.color, bold: true, charSpacing: 2, margin: 0 });
      s.addText(r.action, { x: x + 0.25, y: 5.95, w: 3.5, h: 0.9,
        fontSize: 13, color: TEXT_DARK, bold: true, margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 7. 錯誤訊息對照表(11 種)
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("客人手機錯誤訊息 · 對照處理", { x: 0.6, y: 0.4, w: 12, h: 0.6,
      fontSize: 30, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("客人指著螢幕說「掃不過」時,對照下表給對應處理方式", { x: 0.6, y: 1.0, w: 12, h: 0.35,
      fontSize: 12, color: TEXT_MUTED, italic: true, margin: 0 });

    const rows = [
      ["請先掃描桌邊立牌 QR", "還沒綁桌", "帶他綁桌 table:XX"],
      ["不是電子發票格式", "掃到菜單 / 別的 QR", "對準發票左側 QR"],
      ["不是 IC 高雄洲際開的", "別家發票", "沒辦法給(規則)"],
      ["發票日期過期", "翻出舊發票", "走 結帳 QR 補發"],
      ["此發票已被使用過", "已領 / 同行幫領", "走 客訴查詢 確認"],
      ["這一桌已兌換過一張", "同桌已用一張", "走 客訴查詢"],
      ["金額需滿 NT$2,000", "消費沒到門檻", "告知無法參加"],
      ["圖片不夠清楚", "拍小白單模糊", "光線好處重拍 / 結帳 QR"],
      ["不像 IC 的單據", "AI 看不出抬頭", "確認小白單完整 / 結帳 QR"],
      ["黃色 請洽服務人員", "連續 2 次失敗", "直接走 結帳 QR"],
    ];

    // Header
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.5, w: 12.1, h: 0.45, fill: { color: NAVY } });
    s.addText("客人看到", { x: 0.7, y: 1.5, w: 4.5, h: 0.45,
      fontSize: 13, color: GOLD, bold: true, valign: "middle", margin: 0 });
    s.addText("真實原因", { x: 5.3, y: 1.5, w: 3.5, h: 0.45,
      fontSize: 13, color: GOLD, bold: true, valign: "middle", margin: 0 });
    s.addText("您怎麼做", { x: 8.9, y: 1.5, w: 3.7, h: 0.45,
      fontSize: 13, color: GOLD, bold: true, valign: "middle", margin: 0 });

    rows.forEach((row, i) => {
      const y = 1.95 + i * 0.49;
      const bg = i % 2 === 0 ? BG_SOFT : WHITE;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.49, fill: { color: bg } });
      s.addText(row[0], { x: 0.7, y, w: 4.5, h: 0.49,
        fontSize: 12, color: TEXT_DARK, valign: "middle", margin: 0 });
      s.addText(row[1], { x: 5.3, y, w: 3.5, h: 0.49,
        fontSize: 11.5, color: TEXT_MUTED, valign: "middle", margin: 0 });
      s.addText(row[2], { x: 8.9, y, w: 3.7, h: 0.49,
        fontSize: 12, color: SUCCESS, bold: true, valign: "middle", margin: 0 });
    });

    // Footer
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 6.95, w: 12.1, h: 0.4, fill: { color: GOLD } });
    s.addText("結論:幾乎所有狀況最終答案 = 走「結帳 QR」流程補發", {
      x: 0.6, y: 6.95, w: 12.1, h: 0.4,
      fontSize: 14, color: NAVY, bold: true, align: "center", valign: "middle", margin: 0 });
  }

  // ─────────────────────────────────────────────────────────
  // 8. 反作弊規則(白話版)
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("反作弊規則 · 您不用記但要理解", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 32, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("理解為什麼系統會擋人,跟客人解釋時比較有底氣", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    const locks = [
      { t: "賣方必須是 IC 高雄", how: "檢查賣方統編 91097496",
        why: "防 7-11 / 星巴克 / 別家發票", customerSees: "不是 IC 高雄洲際開的" },
      { t: "日期必須是今天或昨天", how: "比對發票日期",
        why: "防客人翻出舊發票", customerSees: "發票日期過期" },
      { t: "同一桌限一張", how: "同 user + 同 table 20 分鐘",
        why: "防同筆消費同人雙領(發票+小白單)", customerSees: "這一桌已兌換過一張" },
      { t: "同一張全世界唯一", how: "invoice_no 全域唯一",
        why: "防同張發票多次掃", customerSees: "此發票已被使用過" },
    ];
    locks.forEach((l, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.6 + col * 6.2, y = 1.95 + row * 2.45;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 6.0, h: 2.2,
        fill: { color: WHITE }, line: { color: GOLD, width: 1.5 }, shadow: SHADOW() });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.12, h: 2.2, fill: { color: NAVY } });

      s.addText("規則 " + (i + 1), { x: x + 0.35, y: y + 0.15, w: 2.5, h: 0.3,
        fontSize: 10, color: GOLD, bold: true, charSpacing: 3, margin: 0 });
      s.addText(l.t, { x: x + 0.35, y: y + 0.4, w: 5.5, h: 0.45,
        fontSize: 17, color: NAVY, bold: true, margin: 0 });

      s.addText([
        { text: "怎麼擋: ", options: { color: TEXT_MUTED, fontSize: 11, bold: true } },
        { text: l.how, options: { color: TEXT_DARK, fontSize: 12, breakLine: true } },
        { text: "為什麼: ", options: { color: TEXT_MUTED, fontSize: 11, bold: true } },
        { text: l.why, options: { color: TEXT_DARK, fontSize: 12, breakLine: true } },
        { text: "客人會看到: ", options: { color: TEXT_MUTED, fontSize: 11, bold: true } },
        { text: l.customerSees, options: { color: DANGER, fontSize: 12, italic: true } },
      ], { x: x + 0.35, y: y + 0.9, w: 5.5, h: 1.2, valign: "top", paraSpaceAfter: 2, margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 9. 絕對不要做的事
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("絕對不要做的事", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 36, color: DANGER, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("這些事情會破壞系統設計或讓客人資料外洩", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    const dont = [
      { t: "PIN 寫在紙上貼牆上", why: "客人可能偷看,只用口頭傳達" },
      { t: "QR Code 截圖傳給多人", why: "只第一個掃的人拿得到,其他人會看不到" },
      { t: "為了討好客人破壞規則", why: "「同桌一張」是反作弊設計,主動破壞會被審計記錄" },
      { t: "替客人輸 LINE 帳號 / 密碼", why: "客人個資不該由您經手,他自己掃就好" },
      { t: "相信「我朋友剛剛幫我領了」這種說法", why: "用客訴查詢工具驗證,不要憑信任放行" },
    ];
    dont.forEach((d, i) => {
      const y = 1.95 + i * 0.95;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.85,
        fill: { color: DANGER_BG }, line: { color: DANGER, width: 1 } });
      s.addImage({ data: ic.ban, x: 0.85, y: y + 0.15, w: 0.55, h: 0.55 });
      s.addText(d.t, { x: 1.55, y: y + 0.05, w: 11, h: 0.4,
        fontSize: 16, color: DANGER, bold: true, margin: 0 });
      s.addText("→ " + d.why, { x: 1.55, y: y + 0.45, w: 11, h: 0.35,
        fontSize: 12, color: TEXT_DARK, margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 10. 應變措施 11 種(壓縮成 grid)
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("應變措施 · 11 種異常", { x: 0.6, y: 0.4, w: 12, h: 0.6,
      fontSize: 30, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("出事時翻這頁 — 每種異常都有對應處理", { x: 0.6, y: 1.0, w: 12, h: 0.35,
      fontSize: 12, color: TEXT_MUTED, italic: true, margin: 0 });

    const cases = [
      { n: "1", t: "Backend 全掛", a: "餐廳保留發票,IT 重啟,5 分鐘修不好走全人工(異常 8)" },
      { n: "2", t: "Frontend 掛", a: "用備用 URL -v2 或 rollback" },
      { n: "3", t: "OpenAI 掛", a: "客人會被引導找服務人員,走結帳 QR" },
      { n: "4", t: "資料庫掛", a: "Zeabur 重啟 postgresql,不要 drop table" },
      { n: "5", t: "PIN 外洩", a: "IT 立刻在 Zeabur 改 PIN,主管告知新 PIN" },
      { n: "6", t: "同行人也想領", a: "告知同桌限一張,設計上就是這樣" },
      { n: "7", t: "客人手機 / LINE 問題", a: "連 WiFi,真不行走結帳 QR(他有 LINE 帳號即可)" },
      { n: "8", t: "全人工模式(系統掛 30 分+)", a: "發紙本兌換券,下次來補發" },
      { n: "9", t: "Demo / VIP 在場", a: "多備 5 部手機,IT 雙重 on-call,1 分鐘介入" },
      { n: "10", t: "服務人員不會操作", a: "找主管 / LINE 群組,不要當場試錯" },
      { n: "11", t: "客人作弊 / 假發票", a: "系統會自動擋,重大事件走法務" },
    ];

    cases.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.6 + col * 6.2, y = 1.55 + row * 0.95;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 6.0, h: 0.85,
        fill: { color: BG_SOFT }, line: { color: "E5E7EB", width: 1 } });
      s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: y + 0.2, w: 0.45, h: 0.45, fill: { color: NAVY } });
      s.addText(c.n, { x: x + 0.15, y: y + 0.2, w: 0.45, h: 0.45,
        fontSize: 13, color: GOLD, fontFace: "Georgia", bold: true,
        align: "center", valign: "middle", margin: 0 });
      s.addText(c.t, { x: x + 0.75, y: y + 0.1, w: 5.1, h: 0.35,
        fontSize: 13, color: NAVY, bold: true, margin: 0 });
      s.addText(c.a, { x: x + 0.75, y: y + 0.45, w: 5.1, h: 0.4,
        fontSize: 10.5, color: TEXT_DARK, margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 11. FAQ
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("常見問答 FAQ", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("您可能會被客人或同事問到的問題", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    const qa = [
      { q: "消費 NT$3,500 幾次擲骰?", a: "1 次。公式 floor(3500/2000) = 1" },
      { q: "消費 NT$15,000?", a: "5 次(上限),即使 7.5 也只給 5" },
      { q: "兩張發票分別掃?", a: "不行。同桌 20 分鐘限一張,請合併結帳" },
      { q: "同行兩人各自 LINE 各拿一份?", a: "不行,同桌限一張。要兩人都玩得分桌" },
      { q: "加好友沒玩過幾天回來還算嗎?", a: "算。好友身份永久,綁桌重打 table:XX 即可" },
      { q: "過 15 點抽大獎,獎品紀錄會消失?", a: "不會。永久保留,下季從 0 點開始" },
      { q: "結帳 QR 過期再產,前一張還能用?", a: "不能。每 token 有獨立 TTL,過期或被掃即廢" },
      { q: "客人說「服務人員昨天答應我可以領」?", a: "用客訴查詢驗證系統紀錄。系統紀錄為準" },
    ];

    qa.forEach((item, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.6 + col * 6.2, y = 1.95 + row * 1.3;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 6.0, h: 1.2,
        fill: { color: BG_SOFT }, line: { color: "E5E7EB", width: 1 } });
      s.addText([
        { text: "Q  ", options: { color: GOLD, bold: true, fontSize: 14 } },
        { text: item.q, options: { color: NAVY, bold: true, fontSize: 13 } },
      ], { x: x + 0.2, y: y + 0.1, w: 5.7, h: 0.45, valign: "top", margin: 0 });
      s.addText([
        { text: "A  ", options: { color: SUCCESS, bold: true, fontSize: 14 } },
        { text: item.a, options: { color: TEXT_DARK, fontSize: 12 } },
      ], { x: x + 0.2, y: y + 0.55, w: 5.7, h: 0.6, valign: "top", margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 12. 緊急聯絡 + 系統連結 + 結尾
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };
    s.addText("緊急聯絡 + 系統連結", { x: 0.6, y: 0.6, w: 12, h: 0.7,
      fontSize: 36, color: GOLD, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("Emergency Contacts & System URLs", { x: 0.6, y: 1.25, w: 12, h: 0.4,
      fontSize: 14, color: "CADCFC", italic: true, margin: 0 });

    // Left — emergency contacts
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.9, w: 6.0, h: 5.0,
      fill: { color: "1E2761" }, line: { color: GOLD, width: 1 } });
    s.addImage({ data: ic.phone, x: 0.85, y: 2.1, w: 0.5, h: 0.5 });
    s.addText("緊急聯絡", { x: 1.5, y: 2.1, w: 5, h: 0.5,
      fontSize: 20, color: GOLD, bold: true, margin: 0 });

    const contacts = [
      { sit: "客人多次卡關", who: "餐飲部主管", t: "< 5 分鐘" },
      { sit: "Backend 整個掛", who: "IT 部門", t: "< 15 分鐘" },
      { sit: "OpenAI 帳號超額", who: "行銷主管 → IT", t: "< 30 分鐘" },
      { sit: "PIN 外洩", who: "IT 立刻改", t: "< 10 分鐘" },
      { sit: "Demo 5/31 異常", who: "Tony + IT", t: "立即" },
      { sit: "客人投訴", who: "餐飲 + 行銷主管", t: "< 1 小時" },
    ];
    contacts.forEach((c, i) => {
      const y = 2.85 + i * 0.65;
      s.addText(c.sit, { x: 0.85, y, w: 2.8, h: 0.35,
        fontSize: 12, color: WHITE, margin: 0 });
      s.addText(c.who, { x: 3.65, y, w: 1.8, h: 0.35,
        fontSize: 12, color: GOLD, bold: true, margin: 0 });
      s.addText(c.t, { x: 5.45, y, w: 1.1, h: 0.35,
        fontSize: 11, color: "CADCFC", italic: true, margin: 0 });
    });

    // Right — system URLs
    s.addShape(pres.shapes.RECTANGLE, { x: 6.85, y: 1.9, w: 6.0, h: 5.0,
      fill: { color: "1E2761" }, line: { color: GOLD, width: 1 } });
    s.addImage({ data: ic.qrW, x: 7.1, y: 2.1, w: 0.5, h: 0.5 });
    s.addText("系統連結", { x: 7.75, y: 2.1, w: 5, h: 0.5,
      fontSize: 20, color: GOLD, bold: true, margin: 0 });

    const urls = [
      { use: "客人遊戲", url: ".../ (根路徑)" },
      { use: "結帳 QR(服務)", url: ".../admin/checkout" },
      { use: "客訴查詢(服務)", url: ".../admin/lookup" },
      { use: "行銷後台", url: ".../admin/customers" },
      { use: "公開介紹頁", url: ".../about" },
    ];
    s.addText("Base URL:", { x: 7.1, y: 2.85, w: 5.5, h: 0.3,
      fontSize: 11, color: "CADCFC", margin: 0 });
    s.addText("ickhh-culinary-game-v2.zeabur.app", { x: 7.1, y: 3.15, w: 5.5, h: 0.35,
      fontSize: 14, color: GOLD, fontFace: "Consolas", bold: true, margin: 0 });

    urls.forEach((u, i) => {
      const y = 3.7 + i * 0.55;
      s.addText(u.use, { x: 7.1, y, w: 2.4, h: 0.35,
        fontSize: 12, color: WHITE, margin: 0 });
      s.addText(u.url, { x: 9.55, y, w: 3.2, h: 0.35,
        fontSize: 11, color: GOLD, fontFace: "Consolas", margin: 0 });
    });

    // Footer
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 7.0, w: 12.1, h: 0.4, fill: { color: GOLD } });
    s.addText("Tony Chen · tony.chen6@ihg.com · 2026-05-17 · Demo 2026-05-31", {
      x: 0.6, y: 7.0, w: 12.1, h: 0.4,
      fontSize: 12, color: NAVY, bold: true, align: "center", valign: "middle", margin: 0 });
  }

  // Output
  await pres.writeFile({
    fileName: "C:/Users/ChenVivi/OneDrive - Six Continents Hotels, Inc/Desktop/Claude/ickaohsiungculinaryjourneymap/docs/IC_Kaohsiung_Game_Manual.pptx",
  });
  console.log("✅ Generated IC_Kaohsiung_Game_Manual.pptx (12 slides)");
}

build().catch((e) => { console.error(e); process.exit(1); });
