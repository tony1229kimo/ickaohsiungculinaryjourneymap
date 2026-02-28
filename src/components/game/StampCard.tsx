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
import boardCenterDeco from "@/assets/board-center-deco.png";

interface StampCardProps {
  totalPoints: number;
  maxPoints?: number;
  character?: GameCharacterInfo;
  isMoving?: boolean;
}

const REWARDS: Record<number, { name: string; shortName: string; isSpecial: boolean; tileImage: string; type: "lottery" | "fixed" }> = {
  0:  { name: "起點", shortName: "起點", isSpecial: false, tileImage: tileStart, type: "fixed" },
  1:  { name: "機會/命運", shortName: "機會", isSpecial: false, tileImage: tileLottery, type: "lottery" },
  2:  { name: "指定 Deli 甜點免費兌換", shortName: "甜點兌換", isSpecial: true, tileImage: tileRewardCake, type: "fixed" },
  3:  { name: "機會/命運", shortName: "命運", isSpecial: false, tileImage: tileLottery, type: "lottery" },
  4:  { name: "機會/命運", shortName: "機會", isSpecial: false, tileImage: tileLottery, type: "lottery" },
  5:  { name: "機會/命運", shortName: "命運", isSpecial: false, tileImage: tileLottery, type: "lottery" },
  6:  { name: "NT$ 500 折價券", shortName: "$500", isSpecial: true, tileImage: tileRewardMoney, type: "fixed" },
  7:  { name: "機會/命運", shortName: "機會", isSpecial: false, tileImage: tileLottery, type: "lottery" },
  8:  { name: "NT$ 800 折價券", shortName: "$800", isSpecial: true, tileImage: tileRewardMoney, type: "fixed" },
  9:  { name: "機會/命運", shortName: "命運", isSpecial: false, tileImage: tileLottery, type: "lottery" },
  10: { name: "機會/命運", shortName: "機會", isSpecial: false, tileImage: tileLottery, type: "lottery" },
  11: { name: "餐飲買一送一", shortName: "買1送1", isSpecial: true, tileImage: tileRewardGift, type: "fixed" },
  12: { name: "機會/命運", shortName: "命運", isSpecial: false, tileImage: tileLottery, type: "lottery" },
  13: { name: "機會/命運", shortName: "機會", isSpecial: false, tileImage: tileLottery, type: "lottery" },
  14: { name: "機會/命運", shortName: "命運", isSpecial: false, tileImage: tileLottery, type: "lottery" },
  15: { name: "招牌餐點免費兌換", shortName: "🏆 大獎", isSpecial: true, tileImage: tileRewardTrophy, type: "fixed" },
};

// Grid positions for perimeter layout (row, col) - 1-indexed for CSS grid
const TILE_GRID: Record<number, { row: number; col: number }> = {
  0:  { row: 1, col: 1 },  // Start - top-left
  1:  { row: 1, col: 2 },
  2:  { row: 1, col: 3 },
  3:  { row: 1, col: 4 },
  4:  { row: 1, col: 5 },
  5:  { row: 1, col: 6 },  // top-right corner
  6:  { row: 2, col: 6 },
  7:  { row: 3, col: 6 },
  8:  { row: 4, col: 6 },  // bottom-right corner
  9:  { row: 4, col: 5 },
  10: { row: 4, col: 4 },
  11: { row: 4, col: 3 },
  12: { row: 4, col: 2 },
  13: { row: 4, col: 1 },  // bottom-left corner
  14: { row: 3, col: 1 },
  15: { row: 2, col: 1 },  // End - near start
};

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

      {/* Illustrated Board */}
      <div className="board-illustrated">
        {/* Decorative border frame */}
        <div className="board-inner">
          {/* Grid of tiles */}
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: "repeat(6, 1fr)",
              gridTemplateRows: "repeat(4, 1fr)",
              gap: "4px",
            }}
          >
            {/* Render all tiles */}
            {Array.from({ length: 16 }, (_, i) => {
              const pos = TILE_GRID[i];
              const reward = REWARDS[i];
              return (
                <div
                  key={i}
                  style={{
                    gridRow: pos.row,
                    gridColumn: pos.col,
                  }}
                >
                  <BoardTile
                    number={i}
                    reward={reward}
                    isCurrentPosition={currentPosition === i}
                    isPassed={currentPosition > i}
                    character={character}
                    isJumping={animatingTile === i}
                    isStart={i === 0}
                    isEnd={i === 15}
                  />
                </div>
              );
            })}

            {/* Center decorative area */}
            <div
              className="flex flex-col items-center justify-center p-2 rounded-xl"
              style={{
                gridRow: "2 / 4",
                gridColumn: "2 / 6",
                background: "hsl(var(--tile-bg) / 0.6)",
              }}
            >
              <img
                src={boardCenterDeco}
                alt=""
                className="w-20 h-20 object-contain mb-1 opacity-80"
              />
              <p
                className="text-[10px] font-black tracking-widest text-center leading-tight"
                style={{ color: "hsl(var(--board-border-outer))", fontFamily: "'Playfair Display', serif" }}
              >
                洲際味蕾
                <br />
                旅遊地圖
              </p>
              {character && (
                <img
                  src={character.image}
                  alt={character.name}
                  className="w-10 h-10 object-contain mt-1 drop-shadow-md"
                />
              )}
            </div>
          </div>
        </div>

        {/* Board title ribbon */}
        <div className="board-ribbon">
          <span>擲骰集點・完成旅途</span>
        </div>
      </div>

      {/* Grand prize notice */}
      <AnimatePresence>
        {totalPoints >= maxPoints && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 rounded-xl text-center border border-accent/40"
            style={{ background: "linear-gradient(135deg, hsl(40 20% 72% / 0.5), hsl(43 85% 55% / 0.3))" }}
          >
            <span className="text-base font-bold reward-text">
              🎉 恭喜抵達終點！獲得招牌餐點兌換券
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
        {character && (
          <span className="flex items-center gap-1">
            <img src={character.image} alt="角色" className="w-5 h-5 object-contain" />
            目前位置
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: "hsl(var(--board-bg))" }} />
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

// Character token
const CharacterToken = ({ image, isJumping }: { image: string; isJumping?: boolean }) => (
  <motion.div
    className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
    initial={{ y: -20, opacity: 0 }}
    animate={{
      y: isJumping ? [-20, -28, 0, -6, 0] : [0, -5, 0],
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
      className="w-10 h-10 object-contain"
      style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
      animate={isJumping ? { rotate: [0, -12, 12, 0] } : { rotate: [-2, 2, -2] }}
      transition={{ duration: isJumping ? 0.35 : 2, repeat: isJumping ? 0 : Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-full"
      style={{ background: "radial-gradient(ellipse, hsl(0 0% 0% / 0.25), transparent)" }}
      animate={isJumping ? { scaleX: [1, 0.5, 1.3, 0.8, 1] } : { scaleX: [1, 0.85, 1] }}
      transition={{ duration: isJumping ? 0.35 : 1.2, repeat: isJumping ? 0 : Infinity }}
    />
  </motion.div>
);

// Board tile
interface BoardTileProps {
  number: number;
  reward: { name: string; shortName: string; isSpecial: boolean; tileImage: string; type: "lottery" | "fixed" };
  isCurrentPosition: boolean;
  isPassed: boolean;
  character?: GameCharacterInfo;
  isJumping?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
}

const BoardTile = ({ number, reward, isCurrentPosition, isPassed, character, isJumping, isStart, isEnd }: BoardTileProps) => {
  return (
    <div className="relative">
      <motion.div
        className="board-tile group"
        data-special={reward.isSpecial || undefined}
        data-current={isCurrentPosition || undefined}
        data-start={isStart || undefined}
        data-end={isEnd || undefined}
        initial={false}
        animate={
          isCurrentPosition
            ? { boxShadow: ["0 2px 8px hsl(43 85% 55% / 0.4)", "0 2px 16px hsl(43 85% 55% / 0.7)", "0 2px 8px hsl(43 85% 55% / 0.4)"] }
            : {}
        }
        transition={{ duration: 1.5, repeat: Infinity }}
        whileHover={{ scale: 1.06 }}
      >
        {/* Tile illustration */}
        <div className="board-tile-icon">
          <img
            src={reward.tileImage}
            alt={reward.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Label */}
        <div className="board-tile-label">
          <span className="board-tile-number">{number}.</span>
          <span className="board-tile-name">{reward.shortName}</span>
        </div>

        {/* Special indicator */}
        {reward.isSpecial && !isStart && (
          <div className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center">
            <span className="text-[8px]">⭐</span>
          </div>
        )}

        {/* Passed overlay */}
        {isPassed && !isCurrentPosition && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center rounded-lg z-10"
            style={{ background: "hsl(var(--board-bg) / 0.55)" }}
          >
            <span className="text-white text-sm font-bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>✓</span>
          </motion.div>
        )}

        {/* Hover tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-[10px] font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-40 pointer-events-none border">
          {reward.name}
        </div>
      </motion.div>

      {/* Character token OUTSIDE overflow */}
      {isCurrentPosition && character && <CharacterToken image={character.image} isJumping={isJumping} />}
    </div>
  );
};

export default StampCard;