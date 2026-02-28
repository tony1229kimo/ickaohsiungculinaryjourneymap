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

    await new Promise(resolve => setTimeout(resolve, 800));

    const points = Math.floor(Math.random() * 3) + 1;

    setRollResult(points);
    setIsRolling(false);
    setShowResult(true);

    onRoll(points);
  };

  const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground text-center">
        每次掃描可擲骰一次，獲得 1-3 點
      </p>

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
            <motion.div
              className="text-5xl mb-3"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6 }}
            >
              {diceEmojis[Math.min(rollResult - 1, 5)]}
            </motion.div>
            <p className="text-2xl font-black shimmer-text">
              獲得 {rollResult} 點！
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiceRoller;