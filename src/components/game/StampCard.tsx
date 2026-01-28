import { motion } from "framer-motion";

interface StampCardProps {
  totalPoints: number;
  maxPoints?: number;
}

const StampCard = ({ totalPoints, maxPoints = 15 }: StampCardProps) => {
  return (
    <div className="stamp-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">集點卡</h3>
        <span className="text-sm font-medium text-muted-foreground">
          {totalPoints} / {maxPoints} 點
        </span>
      </div>
      
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: maxPoints }, (_, i) => {
          const stampNumber = i + 1;
          const isActive = stampNumber <= totalPoints;
          
          return (
            <motion.div
              key={stampNumber}
              className={`stamp-slot ${isActive ? 'active' : ''}`}
              initial={false}
              animate={isActive ? {
                scale: [0.5, 1.2, 1],
                opacity: [0, 1, 1],
              } : {}}
              transition={{
                duration: 0.4,
                delay: isActive ? (stampNumber - 1) * 0.05 : 0,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              {isActive ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xl"
                >
                  ✓
                </motion.span>
              ) : (
                stampNumber
              )}
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
