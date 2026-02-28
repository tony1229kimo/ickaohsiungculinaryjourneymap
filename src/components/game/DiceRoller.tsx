import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

    await new Promise(resolve => setTimeout(resolve, 800));

    const points = Math.floor(Math.random() * 3) + 1; // 1-3 points

    setRollResult(points);
    setIsRolling(false);
    setShowResult(true);

    onRoll(points);
  };

  const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        每次掃描可擲骰一次，獲得 1-3 點
      </p>

      <button
        onClick={handleRoll}
        disabled={disabled || isRolling}
        className="dice-button"
      >
        <span className="flex items-center justify-center gap-2">
          <motion.span
            animate={isRolling ? { rotate: 360 } : {}}
            transition={{ duration: 0.3, repeat: isRolling ? Infinity : 0 }}
            className="text-2xl"
          >
            🎲
          </motion.span>
          {isRolling ? "擲骰中..." : "擲骰累積點數"}
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
            <motion.div
              className="text-4xl mb-3"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              {diceEmojis[Math.min(rollResult - 1, 5)]}
            </motion.div>
            <p className="text-2xl font-black reward-text">
              獲得 {rollResult} 點！
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiceRoller;
