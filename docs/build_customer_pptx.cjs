/**
 * IC 高雄洲際 · 大富翁遊戲 · 客人版教學 PPT
 *
 * 第三份 PPT — 給客人看的最簡版本(印在餐廳裡 / 推送 / 服務人員講解時播放)。
 * 跟 build_pptx.cjs (介紹用) 跟 build_manual_pptx.cjs (服務人員培訓) 都不同。
 *
 * Run: NODE_PATH="$(npm root -g)" node build_customer_pptx.cjs
 * Output: IC_Kaohsiung_Game_Customer.pptx
 */

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaHotel, FaQrcode, FaReceipt, FaCamera, FaCheckCircle, FaDice, FaGift,
  FaMobileAlt, FaPlayCircle, FaUtensils, FaTrophy, FaSmile, FaBell,
} = require("react-icons/fa");

const NAVY = "0A2540";
const GOLD = "C9A961";
const CREAM = "F5F0E8";
const WHITE = "FFFFFF";
const TEXT_DARK = "1A1A1A";
const TEXT_MUTED = "6B7280";
const SUCCESS = "065F46";
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
  pres.title = "IC 高雄 · 大富翁遊戲 · 客人教學";

  const ic = {
    hotel:    await icon(FaHotel, GOLD),
    qr:       await icon(FaQrcode, GOLD),
    qrW:      await icon(FaQrcode, WHITE),
    qrN:      await icon(FaQrcode, NAVY),
    receipt:  await icon(FaReceipt, GOLD),
    camera:   await icon(FaCamera, GOLD),
    check:    await icon(FaCheckCircle, SUCCESS),
    dice:     await icon(FaDice, GOLD),
    diceW:    await icon(FaDice, WHITE),
    gift:     await icon(FaGift, GOLD),
    mobile:   await icon(FaMobileAlt, GOLD),
    play:     await icon(FaPlayCircle, GOLD),
    utensils: await icon(FaUtensils, GOLD),
    trophy:   await icon(FaTrophy, GOLD),
    smile:    await icon(FaSmile, GOLD),
    bell:     await icon(FaBell, GOLD),
  };

  // ─────────────────────────────────────────────────────────
  // 1. Title (cover)
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };
    s.addImage({ data: ic.hotel, x: 0.8, y: 0.7, w: 0.7, h: 0.7 });
    s.addText("IC Kaohsiung", { x: 1.7, y: 0.7, w: 6, h: 0.55,
      fontSize: 16, color: GOLD, fontFace: "Georgia", bold: true, charSpacing: 4, margin: 0 });
    s.addText("InterContinental 高雄洲際酒店", { x: 1.7, y: 1.2, w: 8, h: 0.4,
      fontSize: 12, color: "CADCFC", margin: 0 });

    s.addText("味蕾旅程", { x: 0.8, y: 2.4, w: 12, h: 1.0,
      fontSize: 72, color: WHITE, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("Culinary Journey", { x: 0.8, y: 3.4, w: 12, h: 0.6,
      fontSize: 30, color: GOLD, fontFace: "Georgia", italic: true, margin: 0 });

    s.addText("大富翁遊戲 · 怎麼玩?", { x: 0.8, y: 4.4, w: 12, h: 0.6,
      fontSize: 28, color: WHITE, margin: 0 });

    s.addText("4 步驟 · 30 秒上手 · 拿大獎", { x: 0.8, y: 5.2, w: 12, h: 0.5,
      fontSize: 18, color: "CADCFC", italic: true, margin: 0 });

    // Three quick KPIs
    const kpis = [
      { v: "2,000", l: "NT$ = 1 次擲骰" },
      { v: "5", l: "次/餐 上限" },
      { v: "15", l: "點抽大獎" },
    ];
    kpis.forEach((k, i) => {
      const x = 0.8 + i * 4.1;
      s.addText(k.v, { x, y: 5.9, w: 4, h: 0.7, fontSize: 44,
        color: GOLD, fontFace: "Georgia", bold: true, align: "center", margin: 0 });
      s.addText(k.l, { x, y: 6.6, w: 4, h: 0.3, fontSize: 13,
        color: WHITE, align: "center", margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 2. 怎麼玩? 4 步驟總覽
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("怎麼玩?", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 44, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("4 個步驟,30 秒搞定", { x: 0.6, y: 1.25, w: 12, h: 0.4,
      fontSize: 16, color: TEXT_MUTED, italic: true, margin: 0 });

    const steps = [
      { n: "1", icon: ic.qrN, t: "掃 QR", d: "用 LINE 相機掃桌邊的 QR Code", color: NAVY },
      { n: "2", icon: ic.dice, t: "結帳", d: "結帳後系統自動算擲骰機會", color: NAVY },
      { n: "3", icon: ic.play, t: "擲骰子", d: "走大富翁地圖、抽獎", color: NAVY },
      { n: "4", icon: ic.gift, t: "拿獎品", d: "餐券、酒水折抵、住宿券...", color: NAVY },
    ];
    steps.forEach((st, i) => {
      const x = 0.6 + i * 3.15;
      const card = pres.shapes.RECTANGLE;
      // Big circle with number
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 3.0, h: 4.6,
        fill: { color: WHITE }, line: { color: GOLD, width: 2 }, shadow: SHADOW() });
      s.addShape(pres.shapes.OVAL, { x: x + 1.0, y: 2.3, w: 1.0, h: 1.0, fill: { color: NAVY } });
      s.addText(st.n, { x: x + 1.0, y: 2.3, w: 1.0, h: 1.0, fontSize: 40,
        color: GOLD, fontFace: "Georgia", bold: true, align: "center", valign: "middle", margin: 0 });

      s.addImage({ data: st.icon, x: x + 1.1, y: 3.7, w: 0.8, h: 0.8 });
      s.addText(st.t, { x: x + 0.1, y: 4.7, w: 2.8, h: 0.5,
        fontSize: 24, color: NAVY, bold: true, align: "center", margin: 0 });
      s.addText(st.d, { x: x + 0.1, y: 5.3, w: 2.8, h: 1.2,
        fontSize: 14, color: TEXT_DARK, align: "center", valign: "top", margin: 0 });

      // Arrow between cards
      if (i < steps.length - 1) {
        s.addText("→", { x: x + 2.9, y: 4.0, w: 0.4, h: 0.6,
          fontSize: 28, color: GOLD, bold: true, align: "center", valign: "middle", margin: 0 });
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // 3. Step 1 详解 — 掃 QR
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("第 1 步 · 掃桌邊 QR Code", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("一掃就進遊戲 — 不用記桌號、不用打字", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    // Left — phone illustration with QR
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.9, w: 4.5, h: 5.0,
      fill: { color: BG_SOFT }, line: { color: GOLD, width: 1.5 }, shadow: SHADOW() });
    s.addText("您手機要做的事", { x: 0.6, y: 2.05, w: 4.5, h: 0.4,
      fontSize: 14, color: GOLD, bold: true, align: "center", charSpacing: 3, margin: 0 });

    s.addShape(pres.shapes.OVAL, { x: 1.85, y: 2.6, w: 2.0, h: 2.0, fill: { color: "06C755" }, line: { color: "06C755" } });
    s.addText("LINE", { x: 1.85, y: 2.6, w: 2.0, h: 2.0,
      fontSize: 40, color: WHITE, fontFace: "Arial Black", bold: true, align: "center", valign: "middle", margin: 0 });

    s.addText("打開 LINE", { x: 0.7, y: 4.85, w: 4.3, h: 0.4,
      fontSize: 18, color: NAVY, bold: true, align: "center", margin: 0 });
    s.addText("→ 主畫面上方搜尋列 → 掃 QR\n(或對話畫面右上角 QR 圖示)", {
      x: 0.7, y: 5.3, w: 4.3, h: 1.0,
      fontSize: 12, color: TEXT_DARK, align: "center", margin: 0 });

    // Right — what happens after
    s.addShape(pres.shapes.RECTANGLE, { x: 5.4, y: 1.9, w: 7.5, h: 5.0,
      fill: { color: WHITE }, line: { color: "E5E7EB", width: 1 }, shadow: SHADOW() });
    s.addText("掃完會發生什麼?", { x: 5.4, y: 2.05, w: 7.5, h: 0.4,
      fontSize: 14, color: GOLD, bold: true, align: "center", charSpacing: 3, margin: 0 });

    const things = [
      { n: "1", t: "LINE 跳出加好友提示", d: "點「加入」加 IC 高雄洲際酒店 LINE 好友" },
      { n: "2", t: "自動進入遊戲", d: "LINE 內建瀏覽器自動開啟「味蕾旅程」遊戲頁面" },
      { n: "3", t: "選一個角色", d: "從熊熊、兔兔等卡通角色選一個當您的代表" },
      { n: "4", t: "等結帳", d: "系統已知道您在哪家餐廳,結帳後自動給擲骰機會" },
    ];
    things.forEach((th, i) => {
      const y = 2.6 + i * 1.05;
      s.addShape(pres.shapes.OVAL, { x: 5.65, y, w: 0.55, h: 0.55, fill: { color: NAVY } });
      s.addText(th.n, { x: 5.65, y, w: 0.55, h: 0.55, fontSize: 18,
        color: GOLD, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(th.t, { x: 6.35, y, w: 6.3, h: 0.4,
        fontSize: 15, color: NAVY, bold: true, margin: 0 });
      s.addText(th.d, { x: 6.35, y: y + 0.4, w: 6.3, h: 0.6,
        fontSize: 12, color: TEXT_DARK, margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4. Step 2 详解 — 結帳拿擲骰
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("第 2 步 · 結帳拿擲骰機會", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("您結帳後,3 種方式擇一兌換 — 全部自助、不用找服務人員", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    const paths = [
      { emoji: "📄", t: "掃發票", who: "拿到電子發票證明聯",
        action: "對準發票左側 QR Code", time: "~2 秒" },
      { emoji: "📸", t: "拍小白單", who: "用載具(沒實體發票)",
        action: "拍小白單 → AI 自動辨識", time: "~5 秒" },
      { emoji: "📷", t: "掃結帳 QR", who: "找服務人員協助",
        action: "服務人員出 QR → 您掃", time: "~10 秒" },
    ];
    paths.forEach((p, i) => {
      const x = 0.6 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 4.0, h: 4.6,
        fill: { color: WHITE }, line: { color: GOLD, width: 1.5 }, shadow: SHADOW() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 4.0, h: 0.95, fill: { color: NAVY } });
      s.addText(p.emoji, { x: x + 0.2, y: 2.1, w: 0.8, h: 0.7, fontSize: 32, margin: 0 });
      s.addText(p.t, { x: x + 1.1, y: 2.15, w: 2.8, h: 0.6,
        fontSize: 22, color: GOLD, bold: true, margin: 0 });

      s.addText("您是這種人", { x: x + 0.25, y: 3.1, w: 3.5, h: 0.3,
        fontSize: 11, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
      s.addText(p.who, { x: x + 0.25, y: 3.4, w: 3.5, h: 0.6,
        fontSize: 14, color: TEXT_DARK, margin: 0 });

      s.addText("您動作", { x: x + 0.25, y: 4.1, w: 3.5, h: 0.3,
        fontSize: 11, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
      s.addText(p.action, { x: x + 0.25, y: 4.4, w: 3.5, h: 0.7,
        fontSize: 14, color: TEXT_DARK, margin: 0 });

      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.25, y: 5.7, w: 3.5, h: 0.7, fill: { color: BG_SOFT } });
      s.addText("耗時 " + p.time, { x: x + 0.25, y: 5.7, w: 3.5, h: 0.7,
        fontSize: 18, color: NAVY, bold: true, align: "center", valign: "middle", margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 5. 規則計算範例
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("擲骰機會怎麼算?", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("公式 = 每 NT$2,000 = 1 次,最多 5 次", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 16, color: TEXT_MUTED, italic: true, margin: 0 });

    // Big examples
    const examples = [
      { amt: "NT$ 1,500", dice: "0", desc: "不到 NT$2,000 門檻" },
      { amt: "NT$ 2,398", dice: "1", desc: "" },
      { amt: "NT$ 5,000", dice: "2", desc: "" },
      { amt: "NT$ 10,999", dice: "5", desc: "上限封頂" },
    ];

    // Build vertical column showing examples
    examples.forEach((e, i) => {
      const y = 2.0 + i * 1.15;
      // Row card
      s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 1.05,
        fill: { color: i === examples.length - 1 ? CREAM : BG_SOFT }, line: { color: "E5E7EB", width: 1 } });

      // Amount on left
      s.addText("消費", { x: 0.85, y: y + 0.1, w: 1.5, h: 0.3,
        fontSize: 11, color: TEXT_MUTED, margin: 0 });
      s.addText(e.amt, { x: 0.85, y: y + 0.4, w: 3.0, h: 0.6,
        fontSize: 30, color: NAVY, bold: true, fontFace: "Georgia", margin: 0 });

      // Arrow center
      s.addText("→", { x: 4.5, y: y + 0.3, w: 1.5, h: 0.6,
        fontSize: 40, color: GOLD, bold: true, align: "center", margin: 0 });

      // Dice right
      s.addText("擲骰機會", { x: 6.5, y: y + 0.1, w: 2.5, h: 0.3,
        fontSize: 11, color: TEXT_MUTED, margin: 0 });
      s.addText(`${e.dice} 次`, { x: 6.5, y: y + 0.4, w: 3.0, h: 0.6,
        fontSize: 30, color: e.dice === "0" ? "991B1B" : SUCCESS, bold: true, fontFace: "Georgia", margin: 0 });

      // Note
      if (e.desc) {
        s.addText(e.desc, { x: 10.0, y: y + 0.4, w: 2.6, h: 0.5,
          fontSize: 13, color: TEXT_MUTED, italic: true, margin: 0 });
      }
    });

    // Footer hint
    s.addText("提示:同一桌每次用餐只能兌換一張發票(防止重複領取)", {
      x: 0.6, y: 6.9, w: 12.1, h: 0.4, fontSize: 12, color: TEXT_MUTED,
      align: "center", italic: true, margin: 0 });
  }

  // ─────────────────────────────────────────────────────────
  // 6. 獎品介紹
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("有什麼獎品?", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 40, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("走大富翁地圖 → 落在格子上拿獎品", { x: 0.6, y: 1.25, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    const rewards = [
      { icon: ic.utensils, t: "餐券折抵", d: "下次用餐時使用,5 餐廳通用" },
      { icon: ic.gift,     t: "酒水折抵", d: "下次點酒水時使用" },
      { icon: ic.trophy,   t: "住宿券",   d: "走到第 15 點抽到的大獎之一" },
      { icon: ic.smile,    t: "甜點 / 飲料", d: "現場直接兌換" },
    ];
    rewards.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.6 + col * 6.2, y = 2.0 + row * 2.4;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 6.0, h: 2.2,
        fill: { color: CREAM }, line: { color: GOLD, width: 1.5 }, shadow: SHADOW() });
      s.addImage({ data: r.icon, x: x + 0.4, y: y + 0.6, w: 1.0, h: 1.0 });
      s.addText(r.t, { x: x + 1.7, y: y + 0.55, w: 4.0, h: 0.6,
        fontSize: 26, color: NAVY, bold: true, margin: 0 });
      s.addText(r.d, { x: x + 1.7, y: y + 1.2, w: 4.0, h: 0.8,
        fontSize: 14, color: TEXT_DARK, margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 7. 常見問題
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("常見問題", { x: 0.6, y: 0.5, w: 12, h: 0.7,
      fontSize: 36, color: NAVY, fontFace: "Georgia", bold: true, margin: 0 });
    s.addText("Frequently Asked Questions", { x: 0.6, y: 1.15, w: 12, h: 0.4,
      fontSize: 14, color: TEXT_MUTED, italic: true, margin: 0 });

    const faqs = [
      { q: "我消費 NT$3,500 是幾次擲骰?", a: "1 次。公式 floor(3,500 / 2,000) = 1" },
      { q: "兩個人各拿一張發票,可以分別掃嗎?", a: "不行,同桌只能兌換一張。請合併結帳。" },
      { q: "我下次來,還要再加 LINE 好友嗎?", a: "不用,加過一次永久保留。再來只要重新掃桌邊 QR。" },
      { q: "用 IHG 餐券折抵的金額算嗎?", a: "算。發票總計多少就給多少擲骰。" },
      { q: "走到 15 點抽到大獎後呢?", a: "進入下一季,點數歸零,但已領獎品永久保留。" },
      { q: "卡關了找誰?", a: "找現場服務人員,他們有備援可幫您快速完成。" },
    ];
    faqs.forEach((f, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.6 + col * 6.2, y = 1.95 + row * 1.7;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 6.0, h: 1.55,
        fill: { color: BG_SOFT }, line: { color: "E5E7EB", width: 1 } });
      s.addText([
        { text: "Q  ", options: { color: GOLD, bold: true, fontSize: 14 } },
        { text: f.q, options: { color: NAVY, bold: true, fontSize: 13 } },
      ], { x: x + 0.2, y: y + 0.15, w: 5.7, h: 0.5, valign: "top", margin: 0 });
      s.addText([
        { text: "A  ", options: { color: SUCCESS, bold: true, fontSize: 14 } },
        { text: f.a, options: { color: TEXT_DARK, fontSize: 12 } },
      ], { x: x + 0.2, y: y + 0.75, w: 5.7, h: 0.8, valign: "top", margin: 0 });
    });
  }

  // ─────────────────────────────────────────────────────────
  // 8. 結尾 — 開始玩吧
  // ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };

    s.addText("現在就開始玩!", { x: 0.6, y: 0.8, w: 12, h: 1.0,
      fontSize: 56, color: GOLD, fontFace: "Georgia", bold: true, align: "center", margin: 0 });
    s.addText("Start Playing Now", { x: 0.6, y: 1.85, w: 12, h: 0.5,
      fontSize: 22, color: "CADCFC", italic: true, align: "center", margin: 0 });

    // Big QR placeholder
    s.addShape(pres.shapes.RECTANGLE, { x: 4.5, y: 2.8, w: 4.3, h: 4.0,
      fill: { color: WHITE }, line: { color: GOLD, width: 2 } });
    s.addImage({ data: ic.qrN, x: 5.65, y: 3.5, w: 2.0, h: 2.0 });
    s.addText("QR 在桌邊立牌", { x: 4.5, y: 5.7, w: 4.3, h: 0.5,
      fontSize: 16, color: NAVY, bold: true, align: "center", margin: 0 });
    s.addText("用 LINE 相機掃一下", { x: 4.5, y: 6.2, w: 4.3, h: 0.4,
      fontSize: 13, color: TEXT_MUTED, align: "center", margin: 0 });

    s.addText("祝您 用餐愉快 · 中大獎!", { x: 0.6, y: 6.95, w: 12, h: 0.4,
      fontSize: 14, color: GOLD, align: "center", italic: true, margin: 0 });
  }

  // Output
  await pres.writeFile({
    fileName: "C:/Users/ChenVivi/OneDrive - Six Continents Hotels, Inc/Desktop/Claude/ickaohsiungculinaryjourneymap/docs/IC_Kaohsiung_Game_Customer.pptx",
  });
  console.log("[OK] Generated IC_Kaohsiung_Game_Customer.pptx (8 slides)");
}

build().catch((e) => { console.error(e); process.exit(1); });
