import { useState, useEffect, useRef, useCallback } from "react";
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

// Reward data with tile images
const REWARDS: Record<number, { name: string; isSpecial: boolean; icon: string; tileImage: string; type: "lottery" | "fixed" }> = {
  1:  { name: "機會/命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  2:  { name: "指定 Deli 甜點免費兌換", isSpecial: true, icon: "🍰", tileImage: tileRewardCake, type: "fixed" },
  3:  { name: "機會/命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  4:  { name: "機會/命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  5:  { name: "機會/命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  6:  { name: "NT$ 500 折價券", isSpecial: true, icon: "💵", tileImage: tileRewardMoney, type: "fixed" },
  7:  { name: "機會/命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  8:  { name: "NT$ 800 折價券", isSpecial: true, icon: "💰", tileImage: tileRewardMoney, type: "fixed" },
  9:  { name: "機會/命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  10: { name: "機會/命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  11: { name: "餐飲買一送一", isSpecial: true, icon: "🎁", tileImage: tileRewardGift, type: "fixed" },
  12: { name: "機會/命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  13: { name: "機會/命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  14: { name: "機會/命運", isSpecial: false, icon: "❓", tileImage: tileLottery, type: "lottery" },
  15: { name: "招牌餐點免費兌換 (價值$3,880)", isSpecial: true, icon: "🏆", tileImage: tileRewardTrophy, type: "fixed" },
};

// Snake layout
const ROWS = [
  [1, 2, 3, 4, 5],
  [10, 9, 8, 7, 6],
  [11, 12, 13, 14, 15],
];

// Tile order for movement path
const TILE_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const StampCard = ({ totalPoints, maxPoints = 15, character, isMoving }: StampCardProps) => {
  const [displayPosition, setDisplayPosition] = useState(totalPoints);
  const [animatingTile, setAnimatingTile] = useState<number | null>(null);
  const prevPointsRef = useRef(totalPoints);

  // Animate character movement tile-by-tile
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
          {/* Board base */}
          <div
            className="rounded-2xl p-3 border-2 border-accent/30"
            style={{
              background: "linear-gradient(135deg, hsl(40 20% 72%) 0%, hsl(30 18% 80%) 50%, hsl(20 12% 72%) 100%)",
              boxShadow: "0 20px 60px -15px hsl(20 7% 22% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.3)",
            }}
          >
            {/* Start tile */}
            <div className="flex justify-center mb-2">
              <motion.div
                className="relative w-[60px] h-[60px] rounded-xl flex flex-col items-center justify-center overflow-hidden border-2"
                style={{
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
                  <span className="text-[10px] font-black text-white drop-shadow-md">起點</span>
                </div>
                {currentPosition === 0 && character && (
                  <CharacterToken image={character.image} isJumping={animatingTile === 0} />
                )}
              </motion.div>
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

          {/* 3D side effect */}
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

// 3D Character token
const CharacterToken = ({ image, isJumping }: { image: string; isJumping?: boolean }) => (
  <motion.div
    className="absolute -top-8 left-1/2 -translate-x-1/2 z-20"
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
      style={{
        filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.35))",
      }}
      animate={isJumping ? { rotate: [0, -15, 15, 0] } : { rotate: [-2, 2, -2] }}
      transition={{ duration: isJumping ? 0.35 : 2, repeat: isJumping ? 0 : Infinity, ease: "easeInOut" }}
    />
    {/* Shadow underneath character */}
    <motion.div
      className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-8 h-2 rounded-full"
      style={{ background: "radial-gradient(ellipse, hsl(0 0% 0% / 0.3), transparent)" }}
      animate={isJumping ? { scaleX: [1, 0.6, 1.2, 0.8, 1], opacity: [0.3, 0.15, 0.4, 0.25, 0.3] } : { scaleX: [1, 0.9, 1], opacity: [0.3, 0.2, 0.3] }}
      transition={{ duration: isJumping ? 0.35 : 1.2, repeat: isJumping ? 0 : Infinity }}
    />
  </motion.div>
);

// 3D Board tile
interface BoardTileProps {
  number: number;
  reward: { name: string; isSpecial: boolean; icon: string; tileImage: string; type: "lottery" | "fixed" };
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
      return {
        ...base,
        borderColor: "hsl(43 85% 55%)",
        boxShadow: "0 4px 20px hsl(43 85% 55% / 0.5), inset 0 -3px 6px hsl(0 0% 0% / 0.1)",
      };
    }
    if (isPassed) {
      return { ...base, filter: "brightness(0.7) saturate(0.5)" };
    }
    if (reward.isSpecial) {
      return {
        ...base,
        borderColor: "hsl(43 85% 55% / 0.7)",
        boxShadow: "0 3px 12px hsl(43 85% 55% / 0.2), inset 0 -3px 6px hsl(0 0% 0% / 0.1)",
      };
    }
    return base;
  };

  return (
    <motion.div
      className="relative w-[60px] h-[60px] rounded-xl overflow-hidden border-2 cursor-default group"
      style={getTileStyle()}
      initial={false}
      animate={
        isCurrentPosition
          ? {
              boxShadow: [
                "0 4px 20px hsl(43 85% 55% / 0.5)",
                "0 4px 30px hsl(43 85% 55% / 0.8)",
                "0 4px 20px hsl(43 85% 55% / 0.5)",
              ],
            }
          : {}
      }
      transition={{ duration: 1.5, repeat: Infinity }}
      whileHover={{ scale: 1.08, y: -2 }}
    >
      {/* Tile background image */}
      <img
        src={reward.tileImage}
        alt={reward.name}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 3D overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, hsl(0 0% 100% / 0.15) 0%, transparent 40%, hsl(0 0% 0% / 0.15) 100%)",
        }}
      />

      {/* Number badge */}
      <div className="absolute bottom-0.5 right-0.5 z-10">
        <span
          className={`text-[9px] font-black px-1 rounded ${
            reward.isSpecial
              ? "bg-accent/80 text-white"
              : "bg-black/40 text-white"
          }`}
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
        >
          {number}
        </span>
      </div>

      {/* Special star indicator */}
      {reward.isSpecial && (
        <motion.div
          className="absolute top-0.5 left-0.5 z-10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <span className="text-[10px]" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>⭐</span>
        </motion.div>
      )}

      {/* Character on current tile */}
      {isCurrentPosition && character && <CharacterToken image={character.image} isJumping={isJumping} />}

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

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none border">
        {reward.name}
      </div>
    </motion.div>
  );
};

export default StampCard;