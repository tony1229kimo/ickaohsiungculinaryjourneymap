import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import bgMain from "@/assets/bg-main.png";
import bearCelebration from "@/assets/bear-celebration.png";

/**
 * Shared via LIFF shareTargetPicker — friends who receive the share link land
 * here. Intentionally read-only: NO LIFF login, NO ticket flow, NO dice. The
 * goal is brand awareness only ("there is a fun game at IC Kaohsiung, dine
 * with us to play"). Visitors who want to actually play must dine at an IC
 * Kaohsiung restaurant and have staff present them the dynamic QR.
 */
const AboutPage = () => {
  return (
    <div
      className="game-container"
      style={{
        backgroundImage: `url(${bgMain})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-4 py-8 space-y-6"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <img
            src={bearCelebration}
            alt=""
            className="w-32 h-32 mx-auto object-contain drop-shadow-lg"
          />
        </motion.div>

        <div className="stamp-card p-6 space-y-5 text-center">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-wide">
              洲際味蕾旅遊地圖
            </h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-wider">
              InterContinental Kaohsiung Culinary Journey Map
            </p>
          </div>

          <div className="gold-divider rounded-none bg-accent/40" />

          <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
            <p>
              在 <strong>高雄洲際酒店</strong> 享用佳餚,即可參與我們專屬的味蕾大富翁集點遊戲!
              <br />
              擲骰前進、收集獎勵、抵達終點即可兌換 <strong>NT$3,880 招牌主餐</strong>。
            </p>
            <p className="text-xs text-muted-foreground border-t pt-3">
              Dine at InterContinental Kaohsiung to join our culinary Monopoly game.
              Roll the dice, collect rewards, and reach the finish line to redeem
              our signature main course (valued at NT$3,880).
            </p>
          </div>

          <div className="space-y-2 bg-accent/10 rounded-2xl p-4 text-sm">
            <p className="font-bold text-foreground">🎲 如何參加</p>
            <ol className="text-left text-xs text-foreground/80 space-y-1.5 list-decimal list-inside">
              <li>蒞臨 IC 高雄餐廳,單筆消費滿 NT$2,000</li>
              <li>向餐飲部人員索取活動 QR Code</li>
              <li>使用 LINE 掃描,進入遊戲擲骰前進</li>
              <li>抵達終點兌換招牌主餐!</li>
            </ol>
          </div>

          <a
            href="https://www.ihg.com/intercontinental/hotels/us/en/kaohsiung/khhha/hoteldetail/dining"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, hsl(43 85% 55%), hsl(40 70% 45%))",
              color: "white",
              boxShadow: "0 4px 12px hsl(43 85% 55% / 0.4)",
            }}
          >
            🍽 預約 IC 高雄餐廳 · Reserve a Table
          </a>

          <Link
            to="/"
            className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            已有 QR Code? 點此進入遊戲 →
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-4">
          高雄洲際酒店 · InterContinental Kaohsiung
        </p>
      </motion.main>
    </div>
  );
};

export default AboutPage;
