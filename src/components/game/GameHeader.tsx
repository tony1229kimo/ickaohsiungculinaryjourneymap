import { motion } from "framer-motion";
import headerLogo from "@/assets/header-logo.png";

// 遊戲頁面頭部的屬性介面
interface GameHeaderProps {
  userName?: string;  // 用戶名稱
  isLoading?: boolean;  // 是否正在載入
}

// 遊戲頁面頭部組件 - 顯示酒店品牌和用戶資訊
const GameHeader = ({ userName, isLoading }: GameHeaderProps) => {
  return (
    <header className="game-header">
      {/* 主要內容容器 - 從上往下淡入動畫 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10">
        
        {/* 酒店LOGO - 彈簧動畫效果進入 */}
        <motion.img
          src={headerLogo}
          alt="InterContinental Kaohsiung"
          className="w-16 h-16 mx-auto mb-3 object-contain drop-shadow-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", damping: 15 }} />
        

        {/* 遊戲標題 */}
        <h1 className="text-2xl font-black mb-1 tracking-widest">洲遊味蕾旅遊地圖

        </h1>
        {/* 金色分隔線 */}
        <div className="gold-divider mx-auto max-w-[200px] my-2" style={{ background: "linear-gradient(90deg, transparent, hsl(43 85% 65% / 0.6), transparent)" }} />
        {/* 酒店名稱 */}
        <p className="text-xs tracking-[0.3em] uppercase opacity-70 mb-4">
          InterContinental Kaohsiung
        </p>

        {/* 條件渲染：顯示載入狀態、用戶名稱或空 */}
        {isLoading ?
        // 載入中動畫 - 淡入淡出循環效果
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm opacity-80">
          
            載入中...
          </motion.div> :
        // 顯示用戶名稱和皇冠圖標
        userName ?
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20"
          style={{ background: "hsl(0 0% 100% / 0.1)", backdropFilter: "blur(10px)" }}>
          
            <span className="text-sm">👑</span>
            <span className="font-medium text-sm tracking-wide">{userName}</span>
          </motion.div> :
        null}
      </motion.div>

      {/* 裝飾點綴 - 四個位置的小圓點 */}
      <div className="absolute top-6 left-6 w-1.5 h-1.5 rounded-full bg-white/20" />
      <div className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-white/20" />
      <div className="absolute bottom-10 left-10 w-1 h-1 rounded-full bg-white/10" />
      <div className="absolute bottom-10 right-10 w-1 h-1 rounded-full bg-white/10" />
    </header>);

};

export default GameHeader;