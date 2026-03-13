import { motion } from "framer-motion";
import headerTitle from "@/assets/header-title.png";

interface GameHeaderProps {
  userName?: string;
  isLoading?: boolean;
}

const GameHeader = ({ userName, isLoading }: GameHeaderProps) => {
  return (
    <header className="game-header bg-[#962222]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10">
        
        <motion.img
          src={headerTitle}
          alt="洲遊味蕾旅遊地圖"
          className="w-full max-w-[320px] mx-auto mb-4 object-contain drop-shadow-lg"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", damping: 15 }} />

        {isLoading ?
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm opacity-80">
          
            載入中...
          </motion.div> :
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

      {/* Subtle decorative dots */}
      <div className="absolute top-6 left-6 w-1.5 h-1.5 rounded-full bg-white/20" />
      <div className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-white/20" />
      <div className="absolute bottom-10 left-10 w-1 h-1 rounded-full bg-white/10" />
      <div className="absolute bottom-10 right-10 w-1 h-1 rounded-full bg-white/10" />
    </header>);

};

export default GameHeader;