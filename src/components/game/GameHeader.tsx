import { motion } from "framer-motion";
import headerBanner from "@/assets/header-banner.png";

interface GameHeaderProps {
  userName?: string;
  isLoading?: boolean;
}

const GameHeader = ({ userName, isLoading }: GameHeaderProps) => {
  return (
    <header className="game-header relative overflow-hidden">
      <motion.img
        src={headerBanner}
        alt="洲遊味蕾旅遊地圖"
        className="w-full h-auto object-cover"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      />
      {(isLoading || userName) && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          {isLoading ? (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm opacity-80 text-white drop-shadow">
              載入中...
            </motion.div>
          ) : userName ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20"
              style={{ background: "hsl(0 0% 100% / 0.1)", backdropFilter: "blur(10px)" }}>
              <span className="text-sm">👑</span>
              <span className="font-medium text-sm tracking-wide text-white drop-shadow">{userName}</span>
            </motion.div>
          ) : null}
        </div>
      )}
    </header>
  );
};

export default GameHeader;