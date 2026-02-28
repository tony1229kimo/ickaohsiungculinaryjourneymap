import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameCharacterInfo } from "./CharacterSelect";

// Tile image imports
import tileStart from "@/assets/tile-start.png";
import tileLottery from "@/assets/tile-lottery.png";
import tileRewardCake from "@/assets/tile-reward-cake.png";
import tileRewardMoney from "@/assets/tile-reward-money.png";
import tileRewardGift from "@/assets/tile-reward-gift.png";
import tileRewardTrophy from "@/assets/tile-reward-trophy.png";

interface StampCardProps {
  totalPoints: number;
  maxPoints?: number;
  character?: GameCharacterInfo;
  isMoving?: boolean;
}

// Short display names for tiles
const REWARDS: Record<number, { name: string; shortName: string; isSpecial: boolean; icon: string; tileImage: string; type: "lottery" | "fixed" }> = {
  1:  { name: "機會/命運", shortName: "機會", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  2:  { name: "指定 Deli 甜點免費兌換", shortName: "甜點", isSpecial: true, icon: "🍰", tileImage: tileRewardCake, type: "fixed" },
  3:  { name: "機會/命運", shortName: "命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  4:  { name: "機會/命運", shortName: "機會", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  5:  { name: "機會/命運", shortName: "命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  6:  { name: "NT$ 500 折價券", shortName: "$500", isSpecial: true, icon: "💵", tileImage: tileRewardMoney, type: "fixed" },
  7:  { name: "機會/命運", shortName: "機會", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  8:  { name: "NT$ 800 折價券", shortName: "$800", isSpecial: true, icon: "💰", tileImage: tileRewardMoney, type: "fixed" },
  9:  { name: "機會/命運", shortName: "命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  10: { name: "機會/命運", shortName: "機會", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  11: { name: "餐飲買一送一", shortName: "買1送1", isSpecial: true, icon: "🎁", tileImage: tileRewardGift, type: "fixed" },
  12: { name: "機會/命運", shortName: "命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  13: { name: "機會/命運", shortName: "機會", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  14: { name: "機會/命運", shortName: "命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  15: { name: "招牌餐點免費兌換 (價值$3,880)", shortName: "大獎", isSpecial: true, icon: "🏆", tileImage: tileRewardTrophy, type: "fixed" },
};

const ROWS = [
  [1, 2, 3, 4, 5],
  [10, 9, 8, 7, 6],
  [11, 12, 13, 14, 15],
];

const StampCard = ({ totalPoints, maxPoints = 15, character }: StampCardProps) => {
  const [displayPosition, setDisplayPosition] = useState(totalPoints);
  const [animatingTile, setAnimatingTile] = useState<number | null>(null);
  const prevPointsRef = useRef(totalPoints);

  useEffect(() => {
    const prevPoints = prevPointsRef.current;
    if (prevPoints === totalPoints) return;

    const from = prevPoints;
    const to = totalPoints;
    const direction = to > from ? 1 : -1;
    const steps = Math.abs(to - from);
    let currentStep = 0;

    const moveNext = () => {
      currentStep++;
      const nextPos = from + currentStep * direction;
      setAnimatingTile(nextPos);
      setDisplayPosition(nextPos);

      if (currentStep < steps) {
        setTimeout(moveNext, 350);
      } else {
        setTimeout(() => setAnimatingTile(null), 400);
      }
    };

    setTimeout(moveNext, 200);
    prevPointsRef.current = totalPoints;
  }, [totalPoints]);

  const currentPosition = displayPosition;

  return (
    <div className="stamp-card overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className="shimmer-text">♔</span> 遊戲地圖
        </h3>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-accent/15 text-accent-foreground">
          第 {totalPoints} / 15 格
        </span>
      </div>

      {/* 3D Board */}
      <div className="flex justify-center" style={{ perspective: "900px" }}>
        <motion.div
          className="relative w-full max-w-[360px]"
          animate={{ rotateX: 40, rotateY: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="rounded-2xl p-3 border-2 border-accent/30"
            style={{
              background: "linear-gradient(135deg, hsl(40 20% 72%) 0%, hsl(30 18% 80%) 50%, hsl(20 12% 72%) 100%)",
              boxShadow: "0 20px 60px -15px hsl(20 7% 22% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.3)",
            }}
          >
            {/* Start tile */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <motion.div
                  className="relative w-[60px] h-[60px] rounded-xl flex flex-col items-center justify-center border-2"
                  style={{
                    overflow: "hidden",
                    borderColor: currentPosition === 0 ? "hsl(43 85% 55%)" : "hsl(20 15% 75%)",
                    boxShadow: currentPosition === 0
                      ? "0 4px 16px hsl(43 85% 55% / 0.4), inset 0 -3px 6px hsl(0 0% 0% / 0.15)"
                      : "0 3px 8px hsl(0 0% 0% / 0.12), inset 0 -3px 6px hsl(0 0% 0% / 0.1)",
                  }}
                  animate={currentPosition === 0 ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <img src={tileStart} alt="起點" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="relative z-10 flex flex-col items-center">
                    <span
                      className="text-[11px] font-black text-white px-1.5 py-0.5 rounded"
                      style={{ background: "hsl(0 0% 0% / 0.45)", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
                    >
                      起點
                    </span>
                  </div>
                </motion.div>
                {/* Character OUTSIDE the overflow-hidden tile */}
                {currentPosition === 0 && character && (
                  <CharacterToken image={character.image} isJumping={animatingTile === 0} />
                )}
              </div>
            </div>

            {/* Board rows */}
            <div className="space-y-1.5">
              {ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1.5 justify-center">
                  {row.map((num) => (
                    <BoardTile
                      key={num}
                      number={num}
                      reward={REWARDS[num]}
                      isCurrentPosition={currentPosition === num}
                      isPassed={currentPosition > num}
                      character={character}
                      isJumping={animatingTile === num}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Grand prize notice */}
            <AnimatePresence>
              {totalPoints >= maxPoints && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 p-3 rounded-xl text-center border border-accent/40"
                  style={{ background: "linear-gradient(135deg, hsl(40 20% 72% / 0.5), hsl(43 85% 55% / 0.3))" }}
                >
                  <span className="text-base font-bold reward-text">
                    🎉 恭喜抵達終點！獲得招牌餐點兌換券
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3D side */}
          <div
            className="absolute left-0 right-0 h-5 rounded-b-2xl -bottom-4"
            style={{
              background: "linear-gradient(180deg, hsl(20 12% 55% / 0.5), hsl(20 7% 22% / 0.3))",
              transform: "rotateX(-90deg)",
              transformOrigin: "top",
            }}
          />
        </motion.div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
        {character && (
          <span className="flex items-center gap-1">
            <img src={character.image} alt="角色" className="w-5 h-5 object-contain" />
            目前位置
          </span>
        )}
        <span className="flex items-center gap-1">
          <img src={tileLottery} alt="" className="w-4 h-4 rounded object-cover" />
          機會/命運
        </span>
        <span className="flex items-center gap-1">
          <span className="text-accent">★</span>
          特殊獎勵
        </span>
      </div>
    </div>
  );
};

// Character token - positioned OUTSIDE overflow-hidden container
const CharacterToken = ({ image, isJumping }: { image: string; isJumping?: boolean }) => (
  <motion.div
    className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
    initial={{ y: -20, opacity: 0 }}
    animate={{
      y: isJumping ? [-20, -30, 0, -8, 0] : [0, -6, 0],
      opacity: 1,
      scale: isJumping ? [1, 1.2, 0.9, 1.1, 1] : 1,
    }}
    transition={{
      y: { duration: isJumping ? 0.35 : 1.2, repeat: isJumping ? 0 : Infinity, ease: "easeInOut" },
      scale: { duration: 0.35 },
      opacity: { duration: 0.2 },
    }}
  >
    <motion.img
      src={image}
      alt="棋子"
      className="w-12 h-12 object-contain"
      style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.35))" }}
      animate={isJumping ? { rotate: [0, -15, 15, 0] } : { rotate: [-2, 2, -2] }}
      transition={{ duration: isJumping ? 0.35 : 2, repeat: isJumping ? 0 : Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-8 h-2 rounded-full"
      style={{ background: "radial-gradient(ellipse, hsl(0 0% 0% / 0.3), transparent)" }}
      animate={isJumping ? { scaleX: [1, 0.6, 1.2, 0.8, 1], opacity: [0.3, 0.15, 0.4, 0.25, 0.3] } : { scaleX: [1, 0.9, 1], opacity: [0.3, 0.2, 0.3] }}
      transition={{ duration: isJumping ? 0.35 : 1.2, repeat: isJumping ? 0 : Infinity }}
    />
  </motion.div>
);

// Board tile
interface BoardTileProps {
  number: number;
  reward: { name: string; shortName: string; isSpecial: boolean; icon: string; tileImage: string; type: "lottery" | "fixed" };
  isCurrentPosition: boolean;
  isPassed: boolean;
  character?: GameCharacterInfo;
  isJumping?: boolean;
}

const BoardTile = ({ number, reward, isCurrentPosition, isPassed, character, isJumping }: BoardTileProps) => {
  const getTileStyle = () => {
    const base = {
      boxShadow: "0 3px 8px hsl(0 0% 0% / 0.12), inset 0 -3px 6px hsl(0 0% 0% / 0.1)",
      borderColor: "hsl(20 15% 70% / 0.6)",
    };
    if (isCurrentPosition) {
      return { ...base, borderColor: "hsl(43 85% 55%)", boxShadow: "0 4px 20px hsl(43 85% 55% / 0.5), inset 0 -3px 6px hsl(0 0% 0% / 0.1)" };
    }
    if (isPassed) {
      return { ...base, filter: "brightness(0.7) saturate(0.5)" };
    }
    if (reward.isSpecial) {
      return { ...base, borderColor: "hsl(43 85% 55% / 0.7)", boxShadow: "0 3px 12px hsl(43 85% 55% / 0.2), inset 0 -3px 6px hsl(0 0% 0% / 0.1)" };
    }
    return base;
  };

  return (
    <div className="relative">
      <motion.div
        className="relative w-[60px] h-[60px] rounded-xl overflow-hidden border-2 cursor-default group"
        style={getTileStyle()}
        initial={false}
        animate={
          isCurrentPosition
            ? { boxShadow: ["0 4px 20px hsl(43 85% 55% / 0.5)", "0 4px 30px hsl(43 85% 55% / 0.8)", "0 4px 20px hsl(43 85% 55% / 0.5)"] }
            : {}
        }
        transition={{ duration: 1.5, repeat: Infinity }}
        whileHover={{ scale: 1.08, y: -2 }}
      >
        {/* Tile background image */}
        <img src={reward.tileImage} alt={reward.name} className="absolute inset-0 w-full h-full object-cover" />

        {/* Depth overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.1) 0%, transparent 30%, hsl(0 0% 0% / 0.25) 100%)" }} />

        {/* Number + short name label */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center pb-0.5">
          <span
            className="text-[10px] font-black text-white px-1.5 py-0.5 rounded-md leading-none"
            style={{
              background: reward.isSpecial ? "hsl(35 60% 45% / 0.85)" : "hsl(0 0% 0% / 0.55)",
              textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              letterSpacing: "0.02em",
            }}
          >
            {number}. {reward.shortName}
          </span>
        </div>

        {/* Special star */}
        {reward.isSpecial && (
          <motion.div
            className="absolute top-0.5 left-0.5 z-10"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <span className="text-xs" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}>⭐</span>
          </motion.div>
        )}

        {/* Passed overlay */}
        {isPassed && !isCurrentPosition && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center rounded-xl"
            style={{ background: "hsl(20 12% 50% / 0.5)" }}
          >
            <span className="text-white text-lg font-bold" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>✓</span>
          </motion.div>
        )}

        {/* Hover tooltip with full name */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-popover text-popover-foreground text-[11px] font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-40 pointer-events-none border">
          {reward.name}
        </div>
      </motion.div>

      {/* Character token OUTSIDE overflow-hidden */}
      {isCurrentPosition && character && <CharacterToken image={character.image} isJumping={isJumping} />}
    </div>
  );
};

export default StampCard;