import { motion } from "framer-motion";
import gameCharacter from "@/assets/game-character.png";

interface StampCardProps {
  totalPoints: number;
  maxPoints?: number;
}

// 獎項對照表 - 更新為洲際酒店主題
const REWARDS: Record<number, { name: string; isSpecial: boolean; icon: string; type: "lottery" | "fixed" }> = {
  1: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  2: { name: "指定 Deli 甜點免費兌換", isSpecial: true, icon: "🍰", type: "fixed" },
  3: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  4: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  5: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  6: { name: "NT$ 500 折價券", isSpecial: true, icon: "💵", type: "fixed" },
  7: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  8: { name: "NT$ 800 折價券", isSpecial: true, icon: "💰", type: "fixed" },
  9: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  10: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  11: { name: "餐飲買一送一", isSpecial: true, icon: "🎁", type: "fixed" },
  12: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  13: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  14: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  15: { name: "招牌餐點免費兌換 (價值$3,880)", isSpecial: true, icon: "🏆", type: "fixed" },
};

const StampCard = ({ totalPoints, maxPoints = 15 }: StampCardProps) => {
  const currentPosition = totalPoints;

  return (
    <div className="stamp-card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="text-accent">♔</span> 洲際大富翁
        </h3>
        <span className="text-sm font-medium text-muted-foreground">
          目前位置：第 {currentPosition} 格
        </span>
      </div>

      {/* 大富翁棋盤 - 洲際酒店主題 */}
      <div className="relative bg-gradient-to-br from-primary/10 to-secondary/30 rounded-2xl p-4 border-2 border-primary/20">
        {/* 起點 */}
        <div className="flex justify-center mb-3">
          <motion.div
            className={`relative w-16 h-16 rounded-xl flex flex-col items-center justify-center text-xs font-bold border-2 ${
              currentPosition === 0 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30' 
                : 'bg-secondary/50 text-foreground border-secondary'
            }`}
            animate={currentPosition === 0 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-xl">🏨</span>
            <span>起點</span>
            {currentPosition === 0 && <GameCharacter />}
          </motion.div>
        </div>

        {/* 棋盤格子 - 3行5列蛇形排列 */}
        <div className="space-y-2">
          {/* 第一行：1-5 (左到右) */}
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((num) => (
              <BoardTile
                key={num}
                number={num}
                reward={REWARDS[num]}
                isCurrentPosition={currentPosition === num}
                isPassed={currentPosition > num}
              />
            ))}
          </div>

          {/* 第二行：6-10 (右到左) */}
          <div className="flex gap-2 justify-center flex-row-reverse">
            {[6, 7, 8, 9, 10].map((num) => (
              <BoardTile
                key={num}
                number={num}
                reward={REWARDS[num]}
                isCurrentPosition={currentPosition === num}
                isPassed={currentPosition > num}
              />
            ))}
          </div>

          {/* 第三行：11-15 (左到右) */}
          <div className="flex gap-2 justify-center">
            {[11, 12, 13, 14, 15].map((num) => (
              <BoardTile
                key={num}
                number={num}
                reward={REWARDS[num]}
                isCurrentPosition={currentPosition === num}
                isPassed={currentPosition > num}
              />
            ))}
          </div>
        </div>

        {/* 終點獎勵提示 */}
        {totalPoints >= maxPoints && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 rounded-xl text-center bg-gradient-to-r from-accent/20 to-yellow-500/20 border border-accent/30"
          >
            <span className="text-lg font-bold reward-text">
              🎉 恭喜抵達終點！獲得招牌餐點兌換券
            </span>
          </motion.div>
        )}
      </div>

      {/* 圖例說明 */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <img src={gameCharacter} alt="角色" className="w-4 h-4 object-contain" />
          目前位置
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-secondary/50"></span>
          未達成
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-accent/60"></span>
          已通過
        </span>
        <span className="flex items-center gap-1">
          <span className="text-accent">★</span>
          特殊獎勵
        </span>
      </div>
    </div>
  );
};

// 金色西洋棋角色元件
const GameCharacter = () => {
  return (
    <motion.div
      className="absolute -top-6 left-1/2 -translate-x-1/2 z-20"
      initial={{ y: -20, opacity: 0 }}
      animate={{ 
        y: [0, -8, 0],
        opacity: 1,
      }}
      transition={{ 
        y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
        opacity: { duration: 0.3 }
      }}
    >
      <motion.img
        src={gameCharacter}
        alt="金色棋子"
        className="w-12 h-12 object-contain drop-shadow-lg"
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
};

// 棋盤格子元件
interface BoardTileProps {
  number: number;
  reward: { name: string; isSpecial: boolean; icon: string; type: "lottery" | "fixed" };
  isCurrentPosition: boolean;
  isPassed: boolean;
}

const BoardTile = ({ number, reward, isCurrentPosition, isPassed }: BoardTileProps) => {
  const isLottery = reward.type === "lottery";
  
  return (
    <motion.div
      className={`relative w-14 h-14 rounded-lg flex flex-col items-center justify-center text-xs font-medium border-2 transition-all cursor-default group ${
        isCurrentPosition
          ? 'bg-accent/20 text-foreground border-accent shadow-lg shadow-accent/40 scale-110 z-10'
          : isPassed
          ? 'bg-accent/60 text-accent-foreground border-accent/80'
          : reward.isSpecial
          ? 'bg-accent/10 text-foreground border-accent/40'
          : isLottery
          ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 text-foreground border-purple-400/30'
          : 'bg-card text-foreground border-border'
      }`}
      initial={false}
      animate={isCurrentPosition ? { 
        boxShadow: [
          "0 0 0 0 rgba(217, 170, 78, 0.4)",
          "0 0 0 8px rgba(217, 170, 78, 0)",
        ],
      } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
      whileHover={{ scale: isCurrentPosition ? 1.1 : 1.05 }}
    >
      {/* 格子編號 */}
      <span className="text-lg">{reward.icon}</span>
      <span className={`text-[10px] ${reward.isSpecial ? 'text-accent font-bold' : ''}`}>
        {number}
      </span>

      {/* 可愛角色 - 當前位置 */}
      {isCurrentPosition && <GameCharacter />}

      {/* 已通過標記 */}
      {isPassed && !isCurrentPosition && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-accent/20 rounded-lg"
        >
          <span className="text-accent-foreground text-lg">✓</span>
        </motion.div>
      )}

      {/* Hover 顯示獎項名稱 */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none border">
        {reward.name}
      </div>
    </motion.div>
  );
};

export default StampCard;