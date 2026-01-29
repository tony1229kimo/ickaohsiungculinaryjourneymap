import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 機會獎項 (6選1)
const CHANCE_REWARDS = [
  { id: 1, name: "指定 Deli 甜點免費兌換", icon: "🍰" },
  { id: 2, name: "指定飲品免費兌換", icon: "🥤" },
  { id: 3, name: "贈送氣泡茶乙瓶", icon: "🧋" },
  { id: 4, name: "招牌前菜免費兌換", icon: "🥗" },
  { id: 5, name: "NT$ 200 餐飲折價券", icon: "💵" },
  { id: 6, name: "NT$ 300 餐飲折價券", icon: "💰" },
];

// 命運獎項 (固定)
const FATE_REWARD = { id: 1, name: "NT$ 100 餐飲折價券", icon: "🎫" };

export interface LotteryResult {
  type: "chance" | "fate";
  reward: { id: number; name: string; icon: string };
}

interface LotteryCardProps {
  type: "chance" | "fate";
  onClose: () => void;
  onRewardClaimed: (result: LotteryResult) => void;
}

const LotteryCard = ({ type, onClose, onRewardClaimed }: LotteryCardProps) => {
  const [isFlipping, setIsFlipping] = useState(true);
  const [reward, setReward] = useState<{ id: number; name: string; icon: string } | null>(null);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    // 模擬抽獎動畫
    const flipTimer = setTimeout(() => {
      if (type === "chance") {
        // 隨機抽取機會獎項
        const randomIndex = Math.floor(Math.random() * CHANCE_REWARDS.length);
        setReward(CHANCE_REWARDS[randomIndex]);
      } else {
        // 命運為固定獎項
        setReward(FATE_REWARD);
      }
      setIsFlipping(false);
      
      setTimeout(() => {
        setShowReward(true);
      }, 300);
    }, 1500);

    return () => clearTimeout(flipTimer);
  }, [type]);

  const handleClaim = () => {
    if (reward) {
      onRewardClaimed({ type, reward });
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && !isFlipping && onClose()}
    >
      <motion.div
        initial={{ scale: 0.5, rotateY: 180 }}
        animate={{ 
          scale: 1, 
          rotateY: isFlipping ? [0, 180, 360, 540, 720] : 0 
        }}
        transition={{ 
          scale: { duration: 0.3 },
          rotateY: { duration: 1.5, ease: "easeInOut" }
        }}
        className={`lottery-card w-72 ${type === "chance" ? "chance" : "fate"}`}
      >
        {/* 卡片背面（翻轉中） */}
        {isFlipping && (
          <div className="relative z-10 py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="text-6xl mb-4"
            >
              {type === "chance" ? "🎲" : "🔮"}
            </motion.div>
            <p className="text-xl font-bold">
              {type === "chance" ? "抽取機會卡..." : "抽取命運卡..."}
            </p>
          </div>
        )}

        {/* 卡片正面（顯示獎項） */}
        <AnimatePresence>
          {showReward && reward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 py-4"
            >
              <div className="mb-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                  type === "chance" 
                    ? "bg-white/20" 
                    : "bg-white/20"
                }`}>
                  {type === "chance" ? "🎯 機會" : "🔮 命運"}
                </span>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-7xl mb-4"
              >
                {reward.icon}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-bold mb-6 px-2"
              >
                {reward.name}
              </motion.p>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={handleClaim}
                className="px-8 py-3 bg-white/90 text-foreground rounded-full font-bold text-lg shadow-lg hover:bg-white transition-colors"
              >
                領取獎勵 🎉
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs mt-4 opacity-80"
              >
                獎券將發送至您的帳戶
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default LotteryCard;

// 輔助函數：判斷位置是否為機會/命運格
export const isLotteryTile = (position: number): boolean => {
  const lotteryPositions = [1, 3, 4, 5, 7, 9, 10, 12, 13, 14];
  return lotteryPositions.includes(position);
};

// 輔助函數：隨機決定是機會還是命運
export const getRandomLotteryType = (): "chance" | "fate" => {
  return Math.random() > 0.5 ? "chance" : "fate";
};