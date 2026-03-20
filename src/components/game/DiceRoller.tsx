import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DiceRollerProps {
  onRoll: (points: number) => void;
  disabled?: boolean;
}

const DICE_FACES: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const DiceDots = ({ value }: { value: number }) => (
  <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-20 h-20">
    {Array.from({ length: 9 }).map((_, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const hasDot = DICE_FACES[value]?.some(([r, c]) => r === row && c === col);
      return (
        <div key={i} className="flex items-center justify-center">
          <div
            className="rounded-full"
            style={{
              width: "18px",
              height: "18px",
              background: "radial-gradient(circle at 35% 35%, hsl(20 7% 32%), hsl(20 7% 18%))",
              boxShadow: "inset 0 2px 3px hsl(0 0% 0% / 0.35), 0 1px 2px hsl(0 0% 100% / 0.25)",
              opacity: hasDot ? 1 : 0,
              transform: hasDot ? "scale(1)" : "scale(0)",
              transition: "opacity 0.1s ease, transform 0.1s ease",
            }}
          />
        </div>
      );
    })}
  </div>
);

const DiceRoller = ({ onRoll, disabled }: DiceRollerProps) => {
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [previewFace, setPreviewFace] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Continuously randomize dice face when idle or rolling
  useEffect(() => {
    if (showResult && rollResult !== null) {
      // Stop when result is shown
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setPreviewFace(Math.floor(Math.random() * 6) + 1);
    }, isRolling ? 80 : 300);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRolling, showResult, rollResult]);

  const handleRoll = async () => {
    setIsRolling(true);
    setShowResult(false);

    await new Promise(resolve => setTimeout(resolve, 1400));

    const points = Math.floor(Math.random() * 3) + 1;

    setRollResult(points);
    setIsRolling(false);
    setShowResult(true);

    onRoll(points);
  };

  const displayFace = showResult && rollResult !== null ? rollResult : previewFace;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground text-center tracking-wide">
        每次掃描可擲骰一次，獲得 1-3 點
      </p>

      {/* Dice stage */}
      <div className="flex justify-center py-6">
        <div className="relative" style={{ perspective: "800px" }}>
          {/* Ambient glow */}
          <motion.div
            className="absolute -inset-6 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(0 0% 70% / 0.12), transparent 70%)",
            }}
            animate={isRolling ? { scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] } : { scale: 1, opacity: 0.3 }}
            transition={isRolling ? { duration: 0.4, repeat: Infinity } : {}}
          />

          {/* Dice body */}
          <motion.div
            className="relative flex items-center justify-center"
            style={{
              width: "140px",
              height: "140px",
              borderRadius: "24px",
              background: "linear-gradient(145deg, hsl(0 0% 100%) 0%, hsl(0 0% 96%) 50%, hsl(0 0% 92%) 100%)",
              border: "2.5px solid hsl(var(--border))",
              boxShadow: isRolling
                ? "0 4px 12px hsl(var(--dice-shadow) / 0.2)"
                : "0 12px 40px -8px hsl(var(--dice-shadow) / 0.25), 0 6px 16px -4px hsl(var(--dice-shadow) / 0.12), inset 0 2px 0 hsl(0 0% 100% / 0.9), inset 0 -2px 4px hsl(0 0% 0% / 0.04)",
              transformStyle: "preserve-3d",
            }}
            animate={
              isRolling
                ? {
                    rotateX: [0, 360, 720],
                    rotateZ: [0, -15, 15, -10, 5, 0],
                    scale: [1, 1.18, 0.92, 1.12, 0.96, 1.08, 1],
                    y: [0, -35, 8, -25, 4, -15, 0],
                  }
                : showResult
                ? { rotateX: 0, rotateZ: 0, scale: [1.08, 1], y: 0 }
                : {}
            }
            transition={
              isRolling
                ? { duration: 1.4, ease: [0.22, 1, 0.36, 1] }
                : { type: "spring", damping: 14, stiffness: 200 }
            }
          >
            {/* Inner bevel highlight */}
            <div
              className="absolute inset-[3px] rounded-[21px] pointer-events-none"
              style={{
                background: "linear-gradient(180deg, hsl(0 0% 100% / 0.5) 0%, transparent 40%, hsl(0 0% 0% / 0.02) 100%)",
              }}
            />

            {/* Dice dots - always shown with animated or result face */}
            {showResult && rollResult !== null ? (
              <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-20 h-20">
                {Array.from({ length: 9 }).map((_, i) => {
                  const row = Math.floor(i / 3);
                  const col = i % 3;
                  const hasDot = DICE_FACES[rollResult]?.some(([r, c]) => r === row && c === col);
                  return (
                    <div key={i} className="flex items-center justify-center">
                      {hasDot && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            damping: 8,
                            stiffness: 300,
                            delay: 0.05 * i,
                          }}
                          className="rounded-full"
                          style={{
                            width: "18px",
                            height: "18px",
                            background: "radial-gradient(circle at 35% 35%, hsl(20 7% 32%), hsl(20 7% 18%))",
                            boxShadow: "inset 0 2px 3px hsl(0 0% 0% / 0.35), 0 1px 2px hsl(0 0% 100% / 0.25)",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <DiceDots value={previewFace} />
            )}
          </motion.div>

          {/* Ground shadow */}
          <motion.div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: "100px",
              height: "14px",
              background: "radial-gradient(ellipse, hsl(var(--dice-shadow) / 0.18), transparent 70%)",
            }}
            animate={
              isRolling
                ? { scaleX: [1, 0.5, 1.3, 0.6, 1.1, 0.7, 1], opacity: [0.8, 0.3, 0.9, 0.4, 0.8] }
                : { scaleX: 1, opacity: 0.8 }
            }
            transition={isRolling ? { duration: 1.4 } : {}}
          />
        </div>
      </div>

      {/* Roll button */}
      <button
        onClick={handleRoll}
        disabled={disabled || isRolling}
        className="dice-button"
      >
        <span className="flex items-center justify-center gap-3">
          <span className="text-xl">🎲</span>
          <span>{isRolling ? "擲骰中..." : "擲骰累積點數"}</span>
        </span>
      </button>

      {/* Result */}
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
