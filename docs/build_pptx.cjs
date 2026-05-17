/**
 * IC 高雄洲際 · 大富翁遊戲 介紹簡報
 *
 * 給 Tony 跟同事 / 主管說明系統運作的 PPT 檔。
 * Run: node build_pptx.js
 * Output: IC_Kaohsiung_Game_Presentation.pptx
 */

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaHotel, FaUtensils, FaQrcode, FaReceipt, FaCamera, FaCheckCircle,
  FaTimesCircle, FaShieldAlt, FaDice, FaUsers, FaUserTie, FaUserCog,
  FaBell, FaLine, FaCog, FaExclamationTriangle, FaLock, FaChartLine,
  FaGift, FaMobileAlt, FaClipboardCheck, FaPlayCircle,
} = require("react-icons/fa");

const NAVY = "0A2540";
const GOLD = "C9A961";
const CREAM = "F5F0E8";
const WHITE = "FFFFFF";
const TEXT_DARK = "1A1A1A";
const TEXT_MUTED = "6B7280";
const SUCCESS = "065F46";
const DANGER = "991B1B";
const WARN = "B45309";
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

const SHADOW_CARD = () => ({ type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.08 });

async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
  pres.author = "Tony Chen";
  pres.title = "IC 高雄 · 大富翁遊戲";

  // Pre-render icons
  const ic = {
    hotel:    await icon(FaHotel, GOLD),
    utensils: await icon(FaUtensils, GOLD),
    qr:       await icon(FaQrcode, GOLD),
    receipt:  await icon(FaReceipt, GOLD),
    camera:   await icon(FaCamera, GOLD),
    check:    await icon(FaCheckCircle, SUCCESS),
    cross:    await icon(FaTimesCircle, DANGER),
    shield:   await icon(FaShieldAlt, GOLD),
    dice:     await icon(FaDice, GOLD),
    users:    await icon(FaUsers, GOLD),
    tie:      await icon(FaUserTie, GOLD),
    cog:      await icon(FaUserCog, GOLD),
    bell:     await icon(FaBell, GOLD),
    line:     await icon(FaLine, "06C755"),
    settings: await icon(FaCog, GOLD),
    warn:     await icon(FaExclamationTriangle, WARN),
    lock:     await icon(FaLock, GOLD),
    chart:    await icon(FaChartLine, GOLD),
    gift:     await icon(FaGift, GOLD),
    mobile:   await icon(FaMobileAlt, GOLD),
    clipboard:await icon(FaClipboardCheck, GOLD),
    play:     await icon(FaPlayCircle, GOLD),
    bellW:    await icon(FaBell, WHITE),
    shieldW:  await icon(FaShieldAlt, WHITE),
    diceW:    await icon(FaDice, WHITE),
  };

  // ─────────────────────────────────────────────────────────────
  // Slide 1 — Title
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };
    s.addImage({ data: ic.hotel, x: 0.8, y: 0.7, w: 0.7, h: 0.7 });
    s.addText("IC Kaohsiung", {
      x: 1.7, y: 0.7, w: 6, h: 0.55,
      fontSize: 16, color: GOLD, fontFace: "Georgia", bold: true, charSpacing: 4, margin: 0,
    });
    s.addText("InterContinental 高雄洲際酒店", {
      x: 1.7, y: 1.2, w: 8, h: 0.4,
      fontSize: 12, color: "CADCFC", margin: 0,
    });

    s.addText("大富翁餐飲忠誠度遊戲", {
      x: 0.8, y: 2.6, w: 12, h: 0.9,
      fontSize: 48, color: WHITE, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("Culinary Journey Game", {
      x: 0.8, y: 3.5, w: 12, h: 0.6,
      fontSize: 24, color: GOLD, fontFace: "Georgia", italic: true, margin: 0,
    });

    s.addText("系統介紹 · 操作流程 · 測試入門", {
      x: 0.8, y: 5.2, w: 12, h: 0.4,
      fontSize: 16, color: "CADCFC", margin: 0,
    });
    s.addText("Tony Chen · Cluster Director of Digital Marketing · 2026-05-17", {
      x: 0.8, y: 5.8, w: 12, h: 0.4,
      fontSize: 12, color: TEXT_MUTED, margin: 0,
    });
    s.addText("Demo 日:2026-05-31", {
      x: 0.8, y: 6.3, w: 12, h: 0.4,
      fontSize: 13, color: GOLD, bold: true, margin: 0,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 2 — What is this?
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("這是什麼?", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("What is this game?", {
      x: 0.6, y: 1.15, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    // Big takeaway
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 1.9, w: 12.1, h: 1.4, fill: { color: NAVY },
    });
    s.addText([
      { text: "IC 高雄 5 間餐廳", options: { bold: true, color: GOLD } },
      { text: " 的會員忠誠度遊戲。客人結帳後拿擲骰機會、走大富翁地圖、",
        options: { color: WHITE } },
      { text: "抽獎或拿固定獎品", options: { bold: true, color: GOLD } },
      { text: "。", options: { color: WHITE } },
    ], { x: 0.9, y: 2.05, w: 11.5, h: 1.1, fontSize: 18, valign: "middle", margin: 0 });

    // 3 KPI cards
    const cards = [
      { icon: ic.utensils, kpi: "5", label: "餐廳", desc: "湛露 · Seeds · WA-RA · Hawker · BLT33" },
      { icon: ic.dice,     kpi: "2000", label: "NT$/擲骰", desc: "每滿 NT$2,000 換 1 次擲骰機會,上限 5 次" },
      { icon: ic.gift,     kpi: "15", label: "點", desc: "走到 15 點抽大獎 → 自動下一季開始" },
    ];
    cards.forEach((c, i) => {
      const x = 0.6 + i * 4.05;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 3.7, w: 3.85, h: 3.2,
        fill: { color: BG_SOFT }, line: { color: "E5E7EB", width: 1 },
        shadow: SHADOW_CARD(),
      });
      s.addImage({ data: c.icon, x: x + 0.3, y: 3.95, w: 0.7, h: 0.7 });
      s.addText(c.kpi, {
        x: x + 0.3, y: 4.8, w: 3.4, h: 0.9,
        fontSize: 54, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
      });
      s.addText(c.label, {
        x: x + 0.3, y: 5.7, w: 3.4, h: 0.4,
        fontSize: 14, color: GOLD, bold: true, margin: 0,
      });
      s.addText(c.desc, {
        x: x + 0.3, y: 6.1, w: 3.4, h: 0.7,
        fontSize: 12, color: TEXT_MUTED, margin: 0,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 3 — Three customer paths
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("三種拿擲骰機會的方式", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("Three ways to earn dice — all in customer's hand, staff intervention minimal", {
      x: 0.6, y: 1.15, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    const paths = [
      {
        icon: ic.qr, title: "📄 掃發票", subtitle: "Scan e-invoice QR",
        scenario: "客人有電子發票證明聯紙本", action: "自助掃發票左側 QR Code",
        time: "~2 秒", who: "客人自己操作"
      },
      {
        icon: ic.camera, title: "📸 拍小白單", subtitle: "Photo of POS slip",
        scenario: "客人用載具(沒拿到實體發票)", action: "自助拍小白單 → AI 辨識",
        time: "~5 秒", who: "客人自己操作"
      },
      {
        icon: ic.qr, title: "📷 結帳 QR", subtitle: "Staff-issued QR",
        scenario: "緊急備援 / 上述都失敗", action: "服務人員開 QR → 客人 LINE 掃",
        time: "~10 秒", who: "服務人員主動發"
      },
    ];

    paths.forEach((p, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 2.0, w: 4.0, h: 4.8,
        fill: { color: WHITE }, line: { color: GOLD, width: 1.5 },
        shadow: SHADOW_CARD(),
      });
      // Top band
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 2.0, w: 4.0, h: 0.9, fill: { color: NAVY }, line: { color: NAVY },
      });
      s.addText(p.title, {
        x: x + 0.25, y: 2.05, w: 3.5, h: 0.4,
        fontSize: 17, color: WHITE, bold: true, margin: 0,
      });
      s.addText(p.subtitle, {
        x: x + 0.25, y: 2.45, w: 3.5, h: 0.35,
        fontSize: 10, color: GOLD, italic: true, margin: 0,
      });

      // Body
      s.addText("適用情境", {
        x: x + 0.25, y: 3.15, w: 3.5, h: 0.3,
        fontSize: 11, color: GOLD, bold: true, charSpacing: 2, margin: 0,
      });
      s.addText(p.scenario, {
        x: x + 0.25, y: 3.45, w: 3.5, h: 0.6,
        fontSize: 13, color: TEXT_DARK, margin: 0,
      });

      s.addText("客人動作", {
        x: x + 0.25, y: 4.15, w: 3.5, h: 0.3,
        fontSize: 11, color: GOLD, bold: true, charSpacing: 2, margin: 0,
      });
      s.addText(p.action, {
        x: x + 0.25, y: 4.45, w: 3.5, h: 0.6,
        fontSize: 13, color: TEXT_DARK, margin: 0,
      });

      s.addText("耗時", {
        x: x + 0.25, y: 5.15, w: 3.5, h: 0.3,
        fontSize: 11, color: GOLD, bold: true, charSpacing: 2, margin: 0,
      });
      s.addText(p.time, {
        x: x + 0.25, y: 5.45, w: 3.5, h: 0.4,
        fontSize: 16, color: NAVY, bold: true, margin: 0,
      });

      s.addText(p.who, {
        x: x + 0.25, y: 6.1, w: 3.5, h: 0.5,
        fontSize: 11, color: TEXT_MUTED, italic: true, margin: 0,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 4 — Customer journey (first visit)
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("客人完整流程 · 首次來店", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("Customer journey — first visit", {
      x: 0.6, y: 1.15, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    const steps = [
      { n: "1", icon: ic.line, title: "加 LINE 好友", desc: "用手機 LINE 掃桌邊立牌 QR Code → 加 IC 高雄洲際酒店 LINE 官方帳號" },
      { n: "2", icon: ic.utensils, title: "綁定桌號", desc: "LINE 對話框輸入「table:ZL05」(您的桌號代碼)→ 收到綁定成功訊息" },
      { n: "3", icon: ic.dice, title: "選角色", desc: "點訊息按鈕進 LIFF 遊戲 → 選擇熊熊 / 兔兔等角色" },
      { n: "4", icon: ic.receipt, title: "結帳拿擲骰", desc: "3 種方式擇一:📄 掃發票 / 📸 拍小白單 / 📷 掃服務人員的結帳 QR" },
      { n: "5", icon: ic.gift, title: "走格子玩遊戲", desc: "擲骰子走 1-3 點 → 落在抽獎格抽獎 / 固定獎品格直接領 → 過 15 點抽大獎下一季" },
    ];
    steps.forEach((st, i) => {
      const y = 2.0 + i * 1.0;
      // Number circle
      s.addShape(pres.shapes.OVAL, {
        x: 0.7, y: y, w: 0.75, h: 0.75, fill: { color: NAVY },
      });
      s.addText(st.n, {
        x: 0.7, y: y, w: 0.75, h: 0.75,
        fontSize: 24, color: GOLD, fontFace: "Georgia", bold: true,
        align: "center", valign: "middle", margin: 0,
      });

      // Icon
      s.addImage({ data: st.icon, x: 1.75, y: y + 0.1, w: 0.55, h: 0.55 });

      // Title + desc
      s.addText(st.title, {
        x: 2.5, y: y, w: 10, h: 0.4, fontSize: 17, color: NAVY, bold: true, margin: 0,
      });
      s.addText(st.desc, {
        x: 2.5, y: y + 0.4, w: 10.3, h: 0.5, fontSize: 13, color: TEXT_DARK, margin: 0,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 5 — Customer repeat visit + escalation
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("客人重複來店 + 卡關處理", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 32, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("Repeat visit + escalation when something fails", {
      x: 0.6, y: 1.1, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    // Left card: repeat visit
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 1.8, w: 6.0, h: 5.1,
      fill: { color: WHITE }, line: { color: "E5E7EB", width: 1 }, shadow: SHADOW_CARD(),
    });
    s.addImage({ data: ic.users, x: 0.85, y: 2.0, w: 0.5, h: 0.5 });
    s.addText("重複來店", {
      x: 1.5, y: 2.0, w: 4.5, h: 0.5, fontSize: 20, color: NAVY, bold: true, margin: 0,
    });
    s.addText("Returning Customer", {
      x: 1.5, y: 2.45, w: 4.5, h: 0.3, fontSize: 11, color: GOLD, italic: true, margin: 0,
    });
    s.addText([
      { text: "✓ ", options: { color: SUCCESS, bold: true } },
      { text: "不用再加 LINE 好友", options: { color: TEXT_DARK, bold: true, breakLine: true } },
      { text: "    (好友身份永久保留)", options: { color: TEXT_MUTED, fontSize: 12, breakLine: true } },
      { text: " ", options: { breakLine: true } },
      { text: "✓ ", options: { color: SUCCESS, bold: true } },
      { text: "重新打 ", options: { color: TEXT_DARK } },
      { text: "table:XX", options: { color: NAVY, bold: true, fontFace: "Consolas" } },
      { text: " 綁桌", options: { color: TEXT_DARK, bold: true, breakLine: true } },
      { text: "    (binding TTL 20 分鐘)", options: { color: TEXT_MUTED, fontSize: 12, breakLine: true } },
      { text: " ", options: { breakLine: true } },
      { text: "✓ ", options: { color: SUCCESS, bold: true } },
      { text: "結帳後同首次的步驟 4", options: { color: TEXT_DARK, bold: true, breakLine: true } },
      { text: "    (掃發票 / 拍小白單 / 服務人員結帳 QR)", options: { color: TEXT_MUTED, fontSize: 12, breakLine: true } },
      { text: " ", options: { breakLine: true } },
      { text: "✓ ", options: { color: SUCCESS, bold: true } },
      { text: "獎品列表永久保留", options: { color: TEXT_DARK, bold: true, breakLine: true } },
      { text: "    (跨季也不會消失)", options: { color: TEXT_MUTED, fontSize: 12 } },
    ], {
      x: 0.85, y: 3.0, w: 5.5, h: 3.8, fontSize: 14, valign: "top", margin: 0,
    });

    // Right card: escalation
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.85, y: 1.8, w: 6.0, h: 5.1,
      fill: { color: "FEF3C7" }, line: { color: WARN, width: 1.5 }, shadow: SHADOW_CARD(),
    });
    s.addImage({ data: ic.warn, x: 7.1, y: 2.0, w: 0.5, h: 0.5 });
    s.addText("兩次失敗 → 自動 escalation", {
      x: 7.75, y: 2.0, w: 5, h: 0.5, fontSize: 18, color: NAVY, bold: true, margin: 0,
    });
    s.addText("2-failure auto-escalation", {
      x: 7.75, y: 2.45, w: 5, h: 0.3, fontSize: 11, color: WARN, italic: true, margin: 0,
    });

    s.addText("第 1 次失敗:", {
      x: 7.1, y: 3.0, w: 5.5, h: 0.35, fontSize: 13, color: NAVY, bold: true, margin: 0,
    });
    s.addText("紅色錯誤訊息 + 重試按鈕", {
      x: 7.1, y: 3.35, w: 5.5, h: 0.35, fontSize: 13, color: TEXT_DARK, margin: 0,
    });

    s.addText("第 2 次失敗:", {
      x: 7.1, y: 3.85, w: 5.5, h: 0.35, fontSize: 13, color: NAVY, bold: true, margin: 0,
    });
    s.addText("紅色訊息 + 大黃色 banner「請洽服務人員」", {
      x: 7.1, y: 4.2, w: 5.5, h: 0.35, fontSize: 13, color: TEXT_DARK, margin: 0,
    });

    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.1, y: 4.85, w: 5.5, h: 1.8,
      fill: { color: WHITE }, line: { color: WARN, width: 1 },
    });
    s.addImage({ data: ic.bell, x: 7.3, y: 5.0, w: 0.4, h: 0.4 });
    s.addText("已嘗試 2 次仍無法兌換", {
      x: 7.8, y: 4.95, w: 4.7, h: 0.4, fontSize: 13, color: NAVY, bold: true, margin: 0,
    });
    s.addText("請洽現場服務人員協助,服務人員會為您「補發結帳 QR」,您只需用 LINE 相機掃一次即可開始遊戲。", {
      x: 7.3, y: 5.5, w: 5.1, h: 1.1, fontSize: 12, color: TEXT_DARK, margin: 0,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 6 — Three roles
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("三個角色 · 各做什麼?", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("Three roles in the system", {
      x: 0.6, y: 1.15, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    const roles = [
      {
        icon: ic.users, title: "客人", en: "Customer",
        primary: "全程自助",
        bullets: [
          "加 LINE 好友 + 綁桌",
          "結帳後自助掃發票/拍小白單",
          "走大富翁地圖、抽獎、領獎",
          "跨季時自動下一季"
        ],
      },
      {
        icon: ic.bell, title: "服務人員", en: "Service Staff",
        primary: "90% 不用做事",
        bullets: [
          "客人問怎麼玩 → 帶到桌邊立牌",
          "客人卡關 → 看螢幕對照處理",
          "緊急備援:開 /admin/checkout",
          "PIN: 91097496(主管告知)"
        ],
      },
      {
        icon: ic.tie, title: "管理員", en: "Admin",
        primary: "後台監控",
        bullets: [
          "/admin/customers 看數據",
          "換 PIN(懷疑外洩)",
          "換 OpenAI 模型",
          "看 Zeabur 日誌 debug"
        ],
      },
    ];
    roles.forEach((r, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.9, w: 4.0, h: 5.0,
        fill: { color: WHITE }, line: { color: "E5E7EB", width: 1 }, shadow: SHADOW_CARD(),
      });

      s.addImage({ data: r.icon, x: x + 0.3, y: 2.1, w: 0.65, h: 0.65 });
      s.addText(r.title, {
        x: x + 1.05, y: 2.1, w: 2.7, h: 0.4, fontSize: 20, color: NAVY, bold: true, margin: 0,
      });
      s.addText(r.en, {
        x: x + 1.05, y: 2.5, w: 2.7, h: 0.3, fontSize: 11, color: GOLD, italic: true, margin: 0,
      });

      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.3, y: 3.05, w: 3.4, h: 0.55, fill: { color: CREAM },
      });
      s.addText(r.primary, {
        x: x + 0.3, y: 3.05, w: 3.4, h: 0.55, fontSize: 14, color: NAVY, bold: true,
        align: "center", valign: "middle", margin: 0,
      });

      const bulletItems = r.bullets.map((b, idx) => ({
        text: b, options: { bullet: { code: "25CF" }, color: GOLD, breakLine: idx < r.bullets.length - 1 },
      }));
      const richItems = r.bullets.flatMap((b, idx) => [
        { text: "• ", options: { color: GOLD, bold: true } },
        { text: b, options: { color: TEXT_DARK, breakLine: idx < r.bullets.length - 1 } },
      ]);
      s.addText(richItems, {
        x: x + 0.3, y: 3.8, w: 3.4, h: 3.0, fontSize: 12.5, valign: "top",
        paraSpaceAfter: 8, margin: 0,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 7 — Staff emergency: 5-step SOP
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("服務人員緊急備援 · 結帳 QR", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 32, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("Checkout QR — staff backup workflow (under 30 seconds)", {
      x: 0.6, y: 1.1, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    // 5 horizontal step cards
    const steps = [
      { n: "1", t: "開連結", d: "/admin/checkout", note: "(可加進桌面 / LINE Keep)" },
      { n: "2", t: "輸入 PIN", d: "91097496", note: "(主管告知,session 記住)" },
      { n: "3", t: "輸入金額", d: "如 NT$5,000", note: "(系統自動算擲骰數)" },
      { n: "4", t: "出 QR", d: "倒數 2 分鐘", note: "(過期重新產)" },
      { n: "5", t: "客人掃 QR", d: "LINE 相機", note: "(自動兌換完成)" },
    ];

    const cardW = 2.4, gap = 0.15, startX = 0.6;
    steps.forEach((s_, i) => {
      const x = startX + i * (cardW + gap);
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 2.0, w: cardW, h: 3.5,
        fill: { color: WHITE }, line: { color: NAVY, width: 1.5 }, shadow: SHADOW_CARD(),
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + cardW / 2 - 0.4, y: 2.2, w: 0.8, h: 0.8, fill: { color: NAVY },
      });
      s.addText(s_.n, {
        x: x + cardW / 2 - 0.4, y: 2.2, w: 0.8, h: 0.8,
        fontSize: 28, color: GOLD, fontFace: "Georgia", bold: true,
        align: "center", valign: "middle", margin: 0,
      });
      s.addText(s_.t, {
        x: x + 0.2, y: 3.15, w: cardW - 0.4, h: 0.4,
        fontSize: 15, color: NAVY, bold: true, align: "center", margin: 0,
      });
      s.addText(s_.d, {
        x: x + 0.2, y: 3.65, w: cardW - 0.4, h: 0.8,
        fontSize: 13, color: GOLD, bold: true, fontFace: "Consolas",
        align: "center", margin: 0,
      });
      s.addText(s_.note, {
        x: x + 0.2, y: 4.7, w: cardW - 0.4, h: 0.6,
        fontSize: 10, color: TEXT_MUTED, align: "center", margin: 0,
      });
    });

    // Bottom rule box
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 5.85, w: 12.1, h: 1.2,
      fill: { color: CREAM }, line: { color: GOLD, width: 1 },
    });
    s.addText([
      { text: "規則:", options: { bold: true, color: NAVY } },
      { text: " NT$2,000 = 1 次擲骰,上限 5 次  ·  QR 2 分鐘失效  ·  第一個掃的人拿到", options: { color: TEXT_DARK } },
      { text: "", options: { breakLine: true } },
      { text: "金額 < NT$2,000 系統會擋(無擲骰機會)  ·  小卡可放服務站抽屜",
        options: { color: TEXT_MUTED, fontSize: 12 } },
    ], { x: 0.85, y: 5.95, w: 11.6, h: 1.0, fontSize: 14, valign: "middle", margin: 0 });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 8 — Anti-fraud rules
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("反作弊四道鎖", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("Four anti-fraud locks — runs automatically, no staff effort", {
      x: 0.6, y: 1.15, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    const locks = [
      { n: "1", icon: ic.lock, title: "賣方統編必須是 91097496",
        desc: "防客人用其他餐廳(7-11、星巴克)發票",
        miss: "「這張發票不是 IC 高雄洲際開的」"
      },
      { n: "2", icon: ic.lock, title: "日期必須是今天或昨天",
        desc: "防客人翻出舊發票 replay",
        miss: "「發票日期過期,只能使用今天/昨天開立的發票」"
      },
      { n: "3", icon: ic.lock, title: "同一桌 20 分鐘內限一張",
        desc: "防同人雙領(發票 + 小白單 同筆消費)",
        miss: "「您這一桌已經兌換過一張了」"
      },
      { n: "4", icon: ic.lock, title: "同一發票全世界只能用一次",
        desc: "invoice_no PRIMARY KEY 全域 dedup",
        miss: "「此發票已被使用過,無法重複領取」"
      },
    ];
    locks.forEach((l, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.6 + col * 6.2, y = 1.95 + row * 2.45;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 6.0, h: 2.2,
        fill: { color: WHITE }, line: { color: GOLD, width: 1.5 }, shadow: SHADOW_CARD(),
      });
      // Left rail accent (RECTANGLE to keep clean corners)
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.12, h: 2.2, fill: { color: NAVY } });

      s.addText("LOCK " + l.n, {
        x: x + 0.35, y: y + 0.15, w: 1.4, h: 0.3, fontSize: 10, color: GOLD, bold: true,
        charSpacing: 3, margin: 0,
      });
      s.addText(l.title, {
        x: x + 0.35, y: y + 0.4, w: 5.5, h: 0.5, fontSize: 17, color: NAVY, bold: true, margin: 0,
      });
      s.addText(l.desc, {
        x: x + 0.35, y: y + 0.9, w: 5.5, h: 0.5, fontSize: 13, color: TEXT_DARK, margin: 0,
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.35, y: y + 1.5, w: 5.5, h: 0.55, fill: { color: BG_SOFT },
      });
      s.addText([
        { text: "失敗訊息: ", options: { color: TEXT_MUTED, fontSize: 11 } },
        { text: l.miss, options: { color: DANGER, fontSize: 11, italic: true } },
      ], { x: x + 0.45, y: y + 1.5, w: 5.3, h: 0.55, valign: "middle", margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 9 — System architecture (simple)
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("系統架構 · 一張圖看懂", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("System architecture — high level", {
      x: 0.6, y: 1.15, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    // Customer column
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.0, w: 3.6, h: 4.8, fill: { color: BG_SOFT }, line: { color: "E5E7EB" } });
    s.addText("👤 客人 / 服務人員", { x: 0.7, y: 2.1, w: 3.4, h: 0.4, fontSize: 16, color: NAVY, bold: true, margin: 0 });
    s.addText("FRONT-END", { x: 0.7, y: 2.5, w: 3.4, h: 0.3, fontSize: 10, color: GOLD, charSpacing: 3, bold: true, margin: 0 });

    const frontItems = [
      "LINE LIFF 遊戲頁",
      "LINE 內建相機掃 QR",
      "/admin/checkout (服務)",
      "/admin/customers (主管)",
    ];
    frontItems.forEach((f, i) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.85, y: 3.05 + i * 0.85, w: 3.15, h: 0.7, fill: { color: WHITE }, line: { color: NAVY, width: 1 }, shadow: SHADOW_CARD(),
      });
      s.addText(f, {
        x: 0.85, y: 3.05 + i * 0.85, w: 3.15, h: 0.7,
        fontSize: 13, color: TEXT_DARK, align: "center", valign: "middle", margin: 0,
      });
    });

    // Arrow
    s.addShape(pres.shapes.RIGHT_TRIANGLE, {
      x: 4.4, y: 4.0, w: 0.6, h: 0.6, fill: { color: GOLD }, rotate: 90,
    });

    // Backend column
    s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 2.0, w: 3.6, h: 4.8, fill: { color: NAVY } });
    s.addText("⚙️ Backend API", { x: 5.2, y: 2.1, w: 3.4, h: 0.4, fontSize: 16, color: WHITE, bold: true, margin: 0 });
    s.addText("LIFF AUTH · TRIPLE LOCK", { x: 5.2, y: 2.5, w: 3.4, h: 0.3, fontSize: 10, color: GOLD, charSpacing: 3, bold: true, margin: 0 });

    const backItems = [
      "/api/invoice/redeem",
      "/api/invoice/redeem-receipt",
      "/api/checkout-ticket/issue",
      "OpenAI gpt-4o vision",
    ];
    backItems.forEach((b, i) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 5.35, y: 3.05 + i * 0.85, w: 3.15, h: 0.7, fill: { color: WHITE }, line: { color: GOLD, width: 1 }, shadow: SHADOW_CARD(),
      });
      s.addText(b, {
        x: 5.35, y: 3.05 + i * 0.85, w: 3.15, h: 0.7,
        fontSize: 12, color: TEXT_DARK, align: "center", valign: "middle", fontFace: "Consolas", margin: 0,
      });
    });

    // Arrow
    s.addShape(pres.shapes.RIGHT_TRIANGLE, {
      x: 8.9, y: 4.0, w: 0.6, h: 0.6, fill: { color: GOLD }, rotate: 90,
    });

    // Database column
    s.addShape(pres.shapes.RECTANGLE, { x: 9.6, y: 2.0, w: 3.6, h: 4.8, fill: { color: BG_SOFT }, line: { color: "E5E7EB" } });
    s.addText("💾 PostgreSQL", { x: 9.7, y: 2.1, w: 3.4, h: 0.4, fontSize: 16, color: NAVY, bold: true, margin: 0 });
    s.addText("ZEABUR · PERSISTENT", { x: 9.7, y: 2.5, w: 3.4, h: 0.3, fontSize: 10, color: GOLD, charSpacing: 3, bold: true, margin: 0 });

    const dbItems = [
      "game_state",
      "invoices",
      "checkout_tickets",
      "customer_events",
    ];
    dbItems.forEach((d, i) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 9.85, y: 3.05 + i * 0.85, w: 3.15, h: 0.7, fill: { color: WHITE }, line: { color: NAVY, width: 1 }, shadow: SHADOW_CARD(),
      });
      s.addText(d, {
        x: 9.85, y: 3.05 + i * 0.85, w: 3.15, h: 0.7,
        fontSize: 13, color: TEXT_DARK, align: "center", valign: "middle", fontFace: "Consolas", margin: 0,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 10 — Cost + Contingency
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("月成本 + 應變措施", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("Monthly cost + contingency plan", {
      x: 0.6, y: 1.15, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    // Left — cost
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 1.9, w: 5.5, h: 5.0,
      fill: { color: NAVY },
    });
    s.addText("月成本估算", {
      x: 0.85, y: 2.1, w: 5, h: 0.5, fontSize: 22, color: WHITE, bold: true, margin: 0,
    });
    s.addText("Monthly Cost", {
      x: 0.85, y: 2.55, w: 5, h: 0.3, fontSize: 11, color: GOLD, italic: true, margin: 0,
    });

    s.addText("NT$ 800", {
      x: 0.85, y: 3.1, w: 5, h: 1.5, fontSize: 72, color: GOLD, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("/ 月 (5 餐廳合計)", {
      x: 0.85, y: 4.5, w: 5, h: 0.4, fontSize: 14, color: WHITE, margin: 0,
    });

    const costItems = [
      { label: "Zeabur (backend + frontend + DB)", val: "~NT$500" },
      { label: "OpenAI gpt-4o vision (~200 客/日)", val: "~NT$300" },
      { label: "LINE Messaging API", val: "免費" },
    ];
    costItems.forEach((c, i) => {
      s.addText(c.label, {
        x: 0.85, y: 5.2 + i * 0.45, w: 3.5, h: 0.35, fontSize: 12, color: WHITE, margin: 0,
      });
      s.addText(c.val, {
        x: 4.5, y: 5.2 + i * 0.45, w: 1.5, h: 0.35, fontSize: 12, color: GOLD, bold: true,
        align: "right", margin: 0,
      });
    });

    // Right — contingency cards
    s.addText("應變措施 / Contingency", {
      x: 6.4, y: 1.95, w: 6.5, h: 0.4, fontSize: 16, color: GOLD, bold: true, charSpacing: 3, margin: 0,
    });

    const continge = [
      { icon: ic.warn, t: "Backend 全掛", d: "客人保留發票 → IT 重啟服務 → 5 分鐘修不好進「全人工模式」(紙本兌換券)" },
      { icon: ic.warn, t: "OpenAI 帳號超額", d: "客人會看到「拍照辨識暫時無法使用」→ 服務人員開結帳 QR 補" },
      { icon: ic.warn, t: "PIN 外洩", d: "IT 立刻在 Zeabur 改 STAFF_NUMERIC_PASSWORD → 通知餐飲部新 PIN" },
      { icon: ic.warn, t: "服務人員不會操作", d: "事前訓練 + 服務站抽屜放 5 步小卡 + LINE 群組隨時問" },
    ];
    continge.forEach((c, i) => {
      const y = 2.45 + i * 1.1;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 6.4, y, w: 6.5, h: 1.0,
        fill: { color: WHITE }, line: { color: WARN, width: 1 },
      });
      s.addImage({ data: c.icon, x: 6.55, y: y + 0.2, w: 0.5, h: 0.5 });
      s.addText(c.t, {
        x: 7.2, y: y + 0.1, w: 5.7, h: 0.4, fontSize: 14, color: NAVY, bold: true, margin: 0,
      });
      s.addText(c.d, {
        x: 7.2, y: y + 0.5, w: 5.6, h: 0.5, fontSize: 11.5, color: TEXT_DARK, margin: 0,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 11 — How to start testing (3 quick paths)
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("如何開始測試 · 5 分鐘上手", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 32, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("How to start testing — 5 minutes to verify it works", {
      x: 0.6, y: 1.1, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    // Three test paths
    const tests = [
      {
        emoji: "🛎️",
        title: "測試 1:結帳 QR(最快)",
        en: "Test #1: Checkout QR — fastest",
        steps: [
          "1. 手機開 /admin/checkout",
          "2. 輸 PIN: 91097496",
          "3. 輸金額 5000",
          "4. 另一手機 LINE 掃 QR",
          "5. ✅ 應該拿到 2 次擲骰",
        ],
      },
      {
        emoji: "📄",
        title: "測試 2:掃今天發票",
        en: "Test #2: Scan today's e-invoice",
        steps: [
          "1. LINE 加好友 + table:ZL05",
          "2. 點「📄 掃發票拿擲骰機會」",
          "3. 對準發票左側 QR Code",
          "4. ~2 秒後驗證",
          "5. ✅ 顯示 N 次擲骰機會",
        ],
      },
      {
        emoji: "📸",
        title: "測試 3:拍小白單",
        en: "Test #3: Photograph POS slip",
        steps: [
          "1. LINE 加好友 + 綁桌",
          "2. 點「📸 我用載具(拍小白單)」",
          "3. 拍今天的 IC 小白單",
          "4. AI 辨識 ~3-5 秒",
          "5. ✅ 顯示 N 次擲骰機會",
        ],
      },
    ];
    tests.forEach((t, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.8, w: 4.0, h: 5.2,
        fill: { color: WHITE }, line: { color: GOLD, width: 1.5 }, shadow: SHADOW_CARD(),
      });
      s.addText(t.emoji, {
        x: x + 0.2, y: 2.0, w: 1.0, h: 0.8, fontSize: 40, margin: 0,
      });
      s.addText(t.title, {
        x: x + 1.2, y: 2.05, w: 2.7, h: 0.4, fontSize: 15, color: NAVY, bold: true, margin: 0,
      });
      s.addText(t.en, {
        x: x + 1.2, y: 2.45, w: 2.7, h: 0.3, fontSize: 10, color: GOLD, italic: true, margin: 0,
      });

      const richSteps = t.steps.flatMap((st, idx) => [
        { text: st, options: { color: TEXT_DARK, breakLine: idx < t.steps.length - 1 } },
      ]);
      s.addText(richSteps, {
        x: x + 0.25, y: 3.0, w: 3.6, h: 3.5, fontSize: 13, valign: "top",
        paraSpaceAfter: 8, margin: 0,
      });

      // Bottom outcome bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.25, y: 6.4, w: 3.5, h: 0.5, fill: { color: CREAM },
      });
      s.addText("預期:拿到擲骰機會 → 主畫面顯示", {
        x: x + 0.25, y: 6.4, w: 3.5, h: 0.5, fontSize: 10.5, color: NAVY,
        align: "center", valign: "middle", margin: 0,
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 12 — Test plan / failure modes
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("完整測試清單 + 反作弊驗證", {
      x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 32, color: NAVY, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("Full test plan — see docs/TEST_PLAN.md for printable version", {
      x: 0.6, y: 1.1, w: 12, h: 0.4, fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0,
    });

    // Big table-like structure
    const groups = [
      {
        color: SUCCESS, name: "Group A · 快樂路徑(5 案例)",
        items: [
          "A1 首次加好友 + 綁桌 + 選角色",
          "A2 掃今天電子發票",
          "A3 拍今天小白單",
          "A4 服務人員結帳 QR",
          "A5 擲骰 → 抽獎 → 領獎",
        ],
      },
      {
        color: WARN, name: "Group B · 反作弊驗證(9 案例)",
        items: [
          "B1 掃舊發票 → ❌ 過期",
          "B2 掃昨天發票 → ✅ 邊界 valid",
          "B3 別家發票 → ❌ 不是 IC",
          "B4 同張發票掃兩次 → ❌ 已用過",
          "B5 ⭐ 先掃發票後拍小白單 → ❌ 同桌限一張",
          "B6 ⭐ 反向:先小白單後發票 → ❌ 同上",
          "B7 金額 < 2000 → ❌ 不足門檻",
          "B8 沒綁桌 → ❌ 請先綁桌",
          "B9 結帳 QR 過期 / 重複掃 → ❌",
        ],
      },
      {
        color: NAVY, name: "Group C · UX 邊角(3 案例)",
        items: [
          "C1 連續 2 次失敗 → escalation banner",
          "C2 拍模糊 2 次 → escalation banner",
          "C3 PIN 輸錯 + 登出流程",
        ],
      },
    ];

    groups.forEach((g, i) => {
      const y = 2.0 + i * 1.65;
      // Color band on left
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.6, y, w: 0.15, h: 1.5, fill: { color: g.color },
      });
      // White card
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.75, y, w: 12.05, h: 1.5,
        fill: { color: BG_SOFT }, line: { color: "E5E7EB", width: 1 },
      });
      s.addText(g.name, {
        x: 1.0, y: y + 0.1, w: 11.5, h: 0.4, fontSize: 15, color: g.color, bold: true, margin: 0,
      });

      // Items in 3 columns
      const col1 = g.items.slice(0, Math.ceil(g.items.length / 3));
      const col2 = g.items.slice(Math.ceil(g.items.length / 3), Math.ceil(g.items.length * 2 / 3));
      const col3 = g.items.slice(Math.ceil(g.items.length * 2 / 3));
      [col1, col2, col3].forEach((col, ci) => {
        const cx = 1.0 + ci * 3.95;
        const richCol = col.flatMap((item, idx) => [
          { text: "☐ ", options: { color: TEXT_MUTED } },
          { text: item, options: { color: TEXT_DARK, breakLine: idx < col.length - 1 } },
        ]);
        s.addText(richCol, {
          x: cx, y: y + 0.55, w: 3.85, h: 0.95, fontSize: 11, valign: "top", margin: 0, paraSpaceAfter: 2,
        });
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Slide 13 — Timeline + closing
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };

    s.addText("時程 + 聯絡", {
      x: 0.6, y: 0.6, w: 12, h: 0.7, fontSize: 36, color: GOLD, fontFace: "Georgia", bold: true, margin: 0,
    });
    s.addText("Timeline & Contacts", {
      x: 0.6, y: 1.25, w: 12, h: 0.4, fontSize: 14, color: "CADCFC", italic: true, margin: 0,
    });

    // Timeline horizontal
    const milestones = [
      { date: "5/15", t: "Phase 8.2", d: "結帳 QR + 三重鎖 + AI 視覺", done: true },
      { date: "5/16-17", t: "Tony 測試", d: "實際發票 + 小白單", done: true },
      { date: "5/18-30", t: "微調 + 訓練", d: "服務人員 SOP 演練", done: false },
      { date: "5/31", t: "🎯 Demo Day", d: "主管驗收 + 上線", done: false },
      { date: "6/1+", t: "Production", d: "5 餐廳全面運作", done: false },
    ];
    milestones.forEach((m, i) => {
      const x = 0.6 + i * 2.5;
      const color = m.done ? GOLD : WHITE;
      const fillColor = m.done ? GOLD : "1E2761";

      s.addShape(pres.shapes.OVAL, {
        x: x + 1.1, y: 2.4, w: 0.4, h: 0.4, fill: { color: fillColor }, line: { color: GOLD, width: 2 },
      });
      // Connector
      if (i < milestones.length - 1) {
        s.addShape(pres.shapes.LINE, {
          x: x + 1.5, y: 2.6, w: 2.1, h: 0, line: { color: GOLD, width: 2, dashType: m.done ? "solid" : "dash" },
        });
      }
      s.addText(m.date, {
        x, y: 3.0, w: 2.4, h: 0.4, fontSize: 14, color: GOLD, bold: true, align: "center", margin: 0,
      });
      s.addText(m.t, {
        x, y: 3.4, w: 2.4, h: 0.4, fontSize: 13, color: WHITE, bold: true, align: "center", margin: 0,
      });
      s.addText(m.d, {
        x, y: 3.8, w: 2.4, h: 0.7, fontSize: 11, color: "CADCFC", align: "center", margin: 0,
      });
    });

    // Contact box
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 5.0, w: 12.1, h: 2.0, fill: { color: "1E2761" }, line: { color: GOLD, width: 1 },
    });
    s.addText("緊急聯絡  /  Emergency Contacts", {
      x: 0.85, y: 5.2, w: 12, h: 0.5, fontSize: 16, color: GOLD, bold: true, charSpacing: 2, margin: 0,
    });

    const contacts = [
      { role: "產品 / 行銷主導", name: "Tony Chen", contact: "tony.chen6@ihg.com" },
      { role: "餐飲部主管", name: "[現場填]", contact: "—" },
      { role: "IT 部門", name: "[現場填]", contact: "—" },
    ];
    contacts.forEach((c, i) => {
      const x = 0.85 + i * 4.05;
      s.addText(c.role, {
        x, y: 5.85, w: 3.9, h: 0.35, fontSize: 11, color: "CADCFC", margin: 0,
      });
      s.addText(c.name, {
        x, y: 6.15, w: 3.9, h: 0.35, fontSize: 14, color: WHITE, bold: true, margin: 0,
      });
      s.addText(c.contact, {
        x, y: 6.5, w: 3.9, h: 0.35, fontSize: 11, color: GOLD, fontFace: "Consolas", margin: 0,
      });
    });
  }

  // Output
  await pres.writeFile({
    fileName: "C:/Users/ChenVivi/OneDrive - Six Continents Hotels, Inc/Desktop/Claude/ickaohsiungculinaryjourneymap/docs/IC_Kaohsiung_Game_Presentation.pptx",
  });
  console.log("✅ Generated IC_Kaohsiung_Game_Presentation.pptx");
}

build().catch((e) => { console.error(e); process.exit(1); });
