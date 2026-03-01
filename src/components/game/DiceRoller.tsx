import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import iconDice from "@/assets/icon-dice.png";

interface DiceRollerProps {
  onRoll: (points: number) => void;
  disabled?: boolean;
}

const DiceRoller = ({ onRoll, disabled }: DiceRollerProps) => {
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleRoll = async () => {
    setIsRolling(true);
    setShowResult(false);

    await new Promise(resolve => setTimeout(resolve, 1200));

    const points = Math.floor(Math.random() * 3) + 1;

    setRollResult(points);
    setIsRolling(false);
    setShowResult(true);

    onRoll(points);
  };

  const diceFaces: Record<number, number[][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        每次掃描可擲骰一次，獲得 1-3 點
      </p>

      {/* Dice display area */}
      <div className="flex justify-center py-4">
        <motion.div
          className="relative"
          style={{
            width: "120px",
            height: "120px",
            perspective: "600px",
          }}
        >
          {/* Dice body */}
          <motion.div
            className="w-full h-full rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, hsl(0 0% 100%) 0%, hsl(20 10% 94%) 100%)",
              border: "2px solid hsl(var(--border))",
              boxShadow: isRolling
                ? "0 2px 8px hsl(var(--dice-shadow) / 0.15)"
                : "0 8px 30px -6px hsl(var(--dice-shadow) / 0.2), 0 4px 12px hsl(var(--dice-shadow) / 0.1), inset 0 1px 0 hsl(0 0% 100% / 0.8)",
            }}
            animate={
              isRolling
                ? {
                    rotate: [0, 90, 180, 270, 360, 450, 540, 630, 720],
                    scale: [1, 1.15, 0.95, 1.1, 1, 1.12, 0.97, 1.05, 1],
                    y: [0, -25, 5, -18, 2, -12, 3, -5, 0],
                  }
                : showResult
                ? { rotate: 0, scale: 1, y: 0 }
                : {}
            }
            transition={
              isRolling
                ? { duration: 1.2, ease: "easeInOut" }
                : { type: "spring", damping: 12, stiffness: 200 }
            }
          >
            {/* Dice dots */}
            {showResult && rollResult !== null ? (
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-16 h-16">
                {Array.from({ length: 9 }).map((_, i) => {
                  const row = Math.floor(i / 3);
                  const col = i % 3;
                  const hasDot = diceFaces[rollResult]?.some(
                    ([r, c]) => r === row && c === col
                  );
                  return (
                    <div key={i} className="flex items-center justify-center">
                      {hasDot && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 10, stiffness: 300, delay: 0.1 }}
                          className="w-4 h-4 rounded-full"
                          style={{
                            background: "linear-gradient(135deg, hsl(20 7% 22%), hsl(20 7% 30%))",
                            boxShadow: "inset 0 1px 2px hsl(0 0% 0% / 0.3), 0 1px 1px hsl(0 0% 100% / 0.2)",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <motion.img
                src={iconDice}
                alt="骰子"
                className="w-14 h-14 object-contain"
                animate={
                  isRolling
                    ? { opacity: [1, 0.6, 1, 0.6, 1] }
                    : { opacity: 0.5 }
                }
                transition={isRolling ? { duration: 1.2 } : {}}
              />
            )}
          </motion.div>

          {/* Shadow under dice */}
          <motion.div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: "80px",
              height: "12px",
              background: "radial-gradient(ellipse, hsl(var(--dice-shadow) / 0.15), transparent 70%)",
            }}
            animate={
              isRolling
                ? { scaleX: [1, 0.6, 1.2, 0.7, 1], opacity: [0.8, 0.4, 0.9, 0.5, 0.8] }
                : { scaleX: 1, opacity: 0.8 }
            }
            transition={isRolling ? { duration: 1.2 } : {}}
          />
        </motion.div>
      </div>

      <button
        onClick={handleRoll}
        disabled={disabled || isRolling}
        className="dice-button"
      >
        <span className="flex items-center justify-center gap-3">
          <motion.img
            src={iconDice}
            alt="骰子"
            className="w-7 h-7 object-contain"
            animate={isRolling ? { rotate: 360 } : {}}
            transition={{ duration: 0.4, repeat: isRolling ? Infinity : 0 }}
          />
          <span>{isRolling ? "擲骰中..." : "擲骰累積點數"}</span>
        </span>
      </button>

      <AnimatePresence>
        {showResult && rollResult !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="result-card"
          >
            <p className="text-2xl font-black shimmer-text">
              🎲 獲得 {rollResult} 點！
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiceRoller;
