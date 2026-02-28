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
        className="relative z-10">

        {/* 洲際酒店標誌 */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-4xl mb-2">

          ♔
        </motion.div>
        
        <h1 className="text-2xl font-black mb-1 tracking-wide">洲際味蕾旅遊地圖

        </h1>
        <p className="text-sm opacity-90 mb-3">
          InterContinental Kaohsiung
        </p>
        
        {isLoading ?
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm">

            載入中...
          </motion.div> :
        userName ?
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">

            <span className="text-lg">👑</span>
            <span className="font-medium">{userName}</span>
          </motion.div> :
        null}
      </motion.div>

      {/* 裝飾元素 */}
      <motion.div
        className="absolute top-4 left-4 text-2xl opacity-30"
        animate={{ y: [0, -5, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}>

        🎲
      </motion.div>
      <motion.div
        className="absolute top-4 right-4 text-2xl opacity-30"
        animate={{ y: [0, -5, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>

        🏆
      </motion.div>
      <motion.div
        className="absolute bottom-4 left-8 text-xl opacity-20"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}>

        ✨
      </motion.div>
      <motion.div
        className="absolute bottom-4 right-8 text-xl opacity-20"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>

        💫
      </motion.div>
    </header>);

};

export default GameHeader;