import { motion } from "framer-motion";
import headerLogo from "@/assets/header-logo.png";

interface GameHeaderProps {
  userName?: string;
  isLoading?: boolean;
}

const GameHeader = ({ userName, isLoading }: GameHeaderProps) => {
  return (
    <header className="game-header">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10">
        
        {/* Hotel logo */}
        <motion.img
          src={headerLogo}
          alt="InterContinental Kaohsiung"
          className="w-16 h-16 mx-auto mb-3 object-contain drop-shadow-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", damping: 15 }} />
        

        <h1 className="text-2xl font-black mb-1 tracking-widest">洲遊味蕾旅遊地圖

        </h1>
        <div className="gold-divider mx-auto max-w-[200px] my-2" style={{ background: "linear-gradient(90deg, transparent, hsl(43 85% 65% / 0.6), transparent)" }} />
        <p className="text-xs tracking-[0.3em] uppercase opacity-70 mb-4">
          InterContinental Kaohsiung
        </p>

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