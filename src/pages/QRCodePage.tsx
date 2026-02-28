import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import GameQRCode from "@/components/game/GameQRCode";

const QRCodePage = () => {
  return (
    <div className="game-container">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full py-6 px-4 text-center">

        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">♔ 洲際味蕾旅遊地圖 ♔


          <span className="text-accent">♔</span>
          洲際大富翁
          <span className="text-accent">♔</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          店家專用 QR Code
        </p>
      </motion.header>

      <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-md px-4 space-y-6">

        <div className="stamp-card">
          <h2 className="text-lg font-bold text-foreground mb-6 text-center">
            🎲 遊戲驗證 QR Code
          </h2>
          
          <GameQRCode size={220} />
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">📋 使用說明</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>顧客消費滿 NT$2,000 後可參與遊戲</li>
              <li>請將此 QR Code 列印或展示給顧客掃描</li>
              <li>顧客掃描後即可擲骰前進</li>
              <li>每次消費滿額可掃描一次</li>
            </ol>
          </div>
        </div>

        <Link
          to="/"
          className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">

          ← 返回遊戲頁面
        </Link>

        <div className="text-center text-xs text-muted-foreground pb-4">
          <p>高雄洲際酒店 InterContinental Kaohsiung</p>
        </div>
      </motion.main>
    </div>);

};

export default QRCodePage;