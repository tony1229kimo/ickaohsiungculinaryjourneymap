import { motion } from "framer-motion";

interface StampCardProps {
  totalPoints: number;
  maxPoints?: number;
}

// 獎項對照表
const REWARDS: Record<number, { name: string; isSpecial: boolean }> = {
  1: { name: "機會/命運", isSpecial: false },
  2: { name: "指定 Deli 甜點免費兌換", isSpecial: true },
  3: { name: "機會/命運", isSpecial: false },
  4: { name: "機會/命運", isSpecial: false },
  5: { name: "機會/命運", isSpecial: false },
  6: { name: "NT$ 500 Voucher", isSpecial: true },
  7: { name: "機會/命運", isSpecial: false },
  8: { name: "NT$ 800 Voucher", isSpecial: true },
  9: { name: "機會/命運", isSpecial: false },
  10: { name: "機會/命運", isSpecial: false },
  11: { name: "好運 1+1 指定餐飲買一送一", isSpecial: true },
  12: { name: "機會/命運", isSpecial: false },
  13: { name: "機會/命運", isSpecial: false },
  14: { name: "機會/命運", isSpecial: false },
  15: { name: "招牌餐點免費兌換（最高價值 3880元）", isSpecial: true },
};

const StampCard = ({ totalPoints, maxPoints = 15 }: StampCardProps) => {
  return (
    <div className="stamp-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">集點卡</h3>
        <span className="text-sm font-medium text-muted-foreground">
          {totalPoints} / {maxPoints} 點
        </span>
      </div>
      
      <div className="space-y-2">
        {Array.from({ length: maxPoints }, (_, i) => {
          const stampNumber = i + 1;
          const isActive = stampNumber <= totalPoints;
          const reward = REWARDS[stampNumber];
          
          return (
            <motion.div
              key={stampNumber}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isActive ? 'bg-primary/10' : 'bg-muted/30'
              }`}
              initial={false}
              animate={isActive ? {
                scale: [0.98, 1.02, 1],
                opacity: [0.8, 1, 1],
              } : {}}
              transition={{
                duration: 0.3,
                delay: isActive ? (stampNumber - 1) * 0.03 : 0,
              }}
            >
              {/* 點數編號 */}
              <div
                className={`stamp-slot flex-shrink-0 w-10 h-10 ${isActive ? 'active' : ''}`}
              >
                {isActive ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-lg"
                  >
                    ✓
                  </motion.span>
                ) : (
                  <span className="text-sm">{stampNumber}</span>
                )}
              </div>
              
              {/* 獎項名稱 */}
              <span
                className={`text-sm flex-1 ${
                  reward.isSpecial
                    ? 'text-destructive font-bold'
                    : 'text-muted-foreground'
                } ${isActive ? 'line-through opacity-60' : ''}`}
              >
                {reward.name}
              </span>
            </motion.div>
          );
        })}
      </div>

      {totalPoints >= maxPoints && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl text-center"
          style={{
            background: 'linear-gradient(135deg, hsl(43 96% 56% / 0.2) 0%, hsl(35 100% 50% / 0.2) 100%)',
          }}
        >
          <span className="text-lg font-bold reward-text">🎉 恭喜集滿！可兌換獎勵</span>
        </motion.div>
      )}
    </div>
  );
};

export default StampCard;
