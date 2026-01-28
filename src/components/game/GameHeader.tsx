import { motion } from "framer-motion";

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
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-5xl mb-3"
        >
          🎲
        </motion.div>
        
        <h1 className="text-2xl font-black mb-2 tracking-wide">
          會員集點遊戲
        </h1>
        
        <p className="text-sm opacity-90">
          消費滿額擲骰，累積點數換好禮
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 relative z-10"
      >
        {isLoading ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              ⏳
            </motion.span>
            <span className="text-sm">載入中...</span>
          </div>
        ) : userName ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm"
          >
            <span className="text-lg">👋</span>
            <span className="font-medium">你好，{userName}</span>
          </motion.div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
            <span>🔗</span>
            <span className="text-sm">請登入 LINE 帳號</span>
          </div>
        )}
      </motion.div>
    </header>
  );
};

export default GameHeader;
