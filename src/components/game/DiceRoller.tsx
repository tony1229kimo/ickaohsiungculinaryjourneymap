import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DiceRollerProps {
  onRoll: (points: number, times: number) => void;
  disabled?: boolean;
}

const DiceRoller = ({ onRoll, disabled }: DiceRollerProps) => {
  const [amount, setAmount] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{ points: number; times: number } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleRoll = async () => {
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 2000) {
      alert("消費需滿 2,000 元才能擲骰！");
      return;
    }

    setIsRolling(true);
    setShowResult(false);

    // Calculate dice rolls
    const times = Math.floor(numAmount / 2000);
    let totalPoints = 0;
    
    // Simulate rolling animation delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    for (let i = 0; i < times; i++) {
      totalPoints += Math.floor(Math.random() * 3) + 1; // 1-3 points per roll
    }

    setRollResult({ points: totalPoints, times });
    setIsRolling(false);
    setShowResult(true);
    
    // Notify parent
    onRoll(totalPoints, times);
    
    // Reset amount
    setAmount("");
  };

  const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="輸入消費金額"
          className="input-game"
          disabled={disabled || isRolling}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          元
        </span>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        每滿 2,000 元可擲骰一次，獲得 1-3 點
      </p>

      <button
        onClick={handleRoll}
        disabled={disabled || isRolling || !amount}
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
        {showResult && rollResult && (
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
              {diceEmojis[Math.min(rollResult.points - 1, 5)]}
            </motion.div>
            <p className="text-xl font-bold text-foreground mb-1">
              擲了 {rollResult.times} 次骰子
            </p>
            <p className="text-2xl font-black reward-text">
              獲得 {rollResult.points} 點！
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiceRoller;
