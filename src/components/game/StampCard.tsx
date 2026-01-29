import { motion } from "framer-motion";

interface StampCardProps {
  totalPoints: number;
  maxPoints?: number;
}

// 獎項對照表
const REWARDS: Record<number, { name: string; isSpecial: boolean; icon: string }> = {
  1: { name: "機會/命運", isSpecial: false, icon: "❓" },
  2: { name: "指定 Deli 甜點免費兌換", isSpecial: true, icon: "🍰" },
  3: { name: "機會/命運", isSpecial: false, icon: "❓" },
  4: { name: "機會/命運", isSpecial: false, icon: "❓" },
  5: { name: "機會/命運", isSpecial: false, icon: "❓" },
  6: { name: "NT$ 500 Voucher", isSpecial: true, icon: "💵" },
  7: { name: "機會/命運", isSpecial: false, icon: "❓" },
  8: { name: "NT$ 800 Voucher", isSpecial: true, icon: "💰" },
  9: { name: "機會/命運", isSpecial: false, icon: "❓" },
  10: { name: "機會/命運", isSpecial: false, icon: "❓" },
  11: { name: "好運 1+1 買一送一", isSpecial: true, icon: "🎁" },
  12: { name: "機會/命運", isSpecial: false, icon: "❓" },
  13: { name: "機會/命運", isSpecial: false, icon: "❓" },
  14: { name: "機會/命運", isSpecial: false, icon: "❓" },
  15: { name: "招牌餐點免費兌換", isSpecial: true, icon: "🏆" },
};

const StampCard = ({ totalPoints, maxPoints = 15 }: StampCardProps) => {
  // 當前位置（0 = 起點，1-15 為格子位置）
  const currentPosition = totalPoints;

  return (
    <div className="stamp-card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          🎲 大富翁集點
        </h3>
        <span className="text-sm font-medium text-muted-foreground">
          目前位置：第 {currentPosition} 格
        </span>
      </div>

      {/* 大富翁棋盤 - 蛇形路徑 */}
      <div className="relative bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-2xl p-4 border-2 border-primary/30">
        {/* 起點 */}
        <div className="flex justify-center mb-3">
          <motion.div
            className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center text-xs font-bold border-2 ${
              currentPosition === 0 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30' 
                : 'bg-muted/50 text-muted-foreground border-muted'
            }`}
            animate={currentPosition === 0 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-xl">🚀</span>
            <span>起點</span>
            {currentPosition === 0 && (
              <motion.div
                className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                👤
              </motion.div>
            )}
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
            className="mt-4 p-3 rounded-xl text-center bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
          >
            <span className="text-lg font-bold reward-text">🎉 恭喜抵達終點！可兌換大獎</span>
          </motion.div>
        )}
      </div>

      {/* 圖例說明 */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-primary/20 border border-primary/50"></span>
          目前位置
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-muted/50"></span>
          未達成
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-primary/60"></span>
          已通過
        </span>
        <span className="flex items-center gap-1">
          <span className="text-destructive">★</span>
          特殊獎勵
        </span>
      </div>
    </div>
  );
};

// 棋盤格子元件
interface BoardTileProps {
  number: number;
  reward: { name: string; isSpecial: boolean; icon: string };
  isCurrentPosition: boolean;
  isPassed: boolean;
}

const BoardTile = ({ number, reward, isCurrentPosition, isPassed }: BoardTileProps) => {
  return (
    <motion.div
      className={`relative w-14 h-14 rounded-lg flex flex-col items-center justify-center text-xs font-medium border-2 transition-all cursor-default group ${
        isCurrentPosition
          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/40 scale-110 z-10'
          : isPassed
          ? 'bg-primary/60 text-primary-foreground border-primary/80'
          : reward.isSpecial
          ? 'bg-destructive/10 text-foreground border-destructive/40'
          : 'bg-card text-foreground border-border'
      }`}
      initial={false}
      animate={isCurrentPosition ? { 
        y: [0, -3, 0],
      } : {}}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: isCurrentPosition ? 1.1 : 1.05 }}
    >
      {/* 格子編號 */}
      <span className="text-lg">{reward.icon}</span>
      <span className={`text-[10px] ${reward.isSpecial ? 'text-destructive font-bold' : ''}`}>
        {number}
      </span>

      {/* 玩家標記 */}
      {isCurrentPosition && (
        <motion.div
          className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-md"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="text-xs">👤</span>
        </motion.div>
      )}

      {/* 已通過標記 */}
      {isPassed && !isCurrentPosition && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-lg"
        >
          <span className="text-white text-lg">✓</span>
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
