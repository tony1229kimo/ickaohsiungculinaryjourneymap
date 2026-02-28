import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

const TILE_DESCRIPTIONS: Record<number, string> = {
  0: "遊戲起點，從這裡開始你的味蕾旅程！",
  1: "抽取機會卡，看看會獲得什麼驚喜獎勵！",
  2: "可免費兌換一份指定 Deli 甜點，含蛋糕、塔類、慕斯等精選品項。",
  3: "抽取命運卡，命運女神會帶給你什麼呢？",
  4: "抽取機會卡，看看會獲得什麼驚喜獎勵！",
  5: "抽取命運卡，命運女神會帶給你什麼呢？",
  6: "獲得 NT$500 折價券一張，可於下次消費時使用，不限餐期。",
  7: "抽取機會卡，看看會獲得什麼驚喜獎勵！",
  8: "獲得 NT$800 折價券一張，可於下次消費時使用，不限餐期。",
  9: "抽取命運卡，命運女神會帶給你什麼呢？",
  10: "抽取機會卡，看看會獲得什麼驚喜獎勵！",
  11: "任選一款餐飲品項，享買一送一優惠（以價低者為贈品）。",
  12: "抽取命運卡，命運女神會帶給你什麼呢？",
  13: "抽取機會卡，看看會獲得什麼驚喜獎勵！",
  14: "抽取命運卡，命運女神會帶給你什麼呢？",
  15: "🏆 終極大獎！可免費兌換一份主廚招牌餐點，含前菜、主餐及甜點。",
};

const StampCard = ({ totalPoints, maxPoints = 15, character }: StampCardProps) => {
  const [displayPosition, setDisplayPosition] = useState(totalPoints);
  const [animatingTile, setAnimatingTile] = useState<number | null>(null);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
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
    <div className="stamp-card overflow-visible p-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4 pt-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="shimmer-text">♔</span> 遊戲地圖
        </h3>
        <span className="text-sm font-medium px-3 py-1 rounded-full bg-accent/15 text-accent-foreground">
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
            id="game-board-grid"
            style={{
              gridTemplateColumns: "repeat(6, 1fr)",
              gridTemplateRows: "repeat(4, 1fr)",
              gap: "0px",
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
                    isJumping={animatingTile === i}
                    isStart={i === 0}
                    isEnd={i === 15}
                    onTap={() => setSelectedTile(i)}
                  />
                </div>
              );
            })}

            {/* Floating character token overlay */}
            {character && (
              <motion.div
                className="pointer-events-none z-30 flex items-center justify-center"
                style={{
                  gridRow: TILE_GRID[currentPosition].row,
                  gridColumn: TILE_GRID[currentPosition].col,
                  position: "relative",
                }}
                layout
                transition={{ type: "spring", stiffness: 200, damping: 20, mass: 0.8 }}
              >
                <motion.div
                  className="absolute -top-6"
                  animate={{
                    y: animatingTile !== null ? [-8, -18, 0, -6, 0] : [0, -4, 0],
                    scale: animatingTile !== null ? [1, 1.15, 0.95, 1.05, 1] : 1,
                  }}
                  transition={{
                    y: { duration: animatingTile !== null ? 0.3 : 1.5, repeat: animatingTile !== null ? 0 : Infinity, ease: "easeInOut" },
                    scale: { duration: 0.3 },
                  }}
                >
                  <motion.img
                    src={character.image}
                    alt="棋子"
                    className="w-12 h-12 object-contain"
                    style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))" }}
                    animate={animatingTile !== null ? { rotate: [0, -15, 15, 0] } : { rotate: [-2, 2, -2] }}
                    transition={{ duration: animatingTile !== null ? 0.3 : 2.5, repeat: animatingTile !== null ? 0 : Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-7 h-1.5 rounded-full"
                    style={{ background: "radial-gradient(ellipse, hsl(0 0% 0% / 0.2), transparent)" }}
                    animate={animatingTile !== null ? { scaleX: [1, 0.5, 1.2, 0.9, 1] } : { scaleX: [1, 0.85, 1] }}
                    transition={{ duration: animatingTile !== null ? 0.3 : 1.5, repeat: animatingTile !== null ? 0 : Infinity }}
                  />
                </motion.div>
              </motion.div>
            )}

            {/* Center decorative area */}
            <div
              className="flex flex-col items-center justify-center p-3 rounded-xl"
              style={{
                gridRow: "2 / 4",
                gridColumn: "2 / 6",
                background: "hsl(var(--tile-bg) / 0.6)",
              }}
            >
              <img
                src={boardCenterDeco}
                alt=""
                className="w-24 h-24 object-contain mb-1 opacity-80"
              />
              <p
                className="text-sm font-black tracking-widest text-center leading-tight"
                style={{ color: "hsl(var(--board-border-outer))", fontFamily: "'Playfair Display', serif" }}
              >
                洲際味蕾
                <br />
                旅遊地圖
              </p>
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
      <div className="mt-4 flex flex-wrap gap-3 justify-center text-sm text-muted-foreground px-4 pb-4">
        {character && (
          <span className="flex items-center gap-1">
            <img src={character.image} alt="角色" className="w-6 h-6 object-contain" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }} />
            目前位置
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-3.5 h-3.5 rounded" style={{ background: "hsl(var(--board-bg))" }} />
          機會/命運
        </span>
        <span className="flex items-center gap-1">
          <span className="text-accent">★</span>
          特殊獎勵
        </span>
        <span className="text-xs opacity-60">點擊格子查看詳情</span>
      </div>

      {/* Tile detail dialog */}
      <Dialog open={selectedTile !== null} onOpenChange={(open) => !open && setSelectedTile(null)}>
        <DialogContent className="max-w-xs rounded-2xl border-2" style={{ borderColor: selectedTile !== null && REWARDS[selectedTile]?.isSpecial ? "hsl(43 85% 55%)" : "hsl(var(--board-bg))" }}>
          {selectedTile !== null && (
            <>
              <DialogHeader className="items-center text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-xl overflow-hidden" style={{ background: REWARDS[selectedTile].isSpecial ? "linear-gradient(135deg, hsl(43 85% 55% / 0.2), hsl(40 20% 72% / 0.3))" : "hsl(var(--tile-bg))" }}>
                  <img src={REWARDS[selectedTile].tileImage} alt="" className="w-full h-full object-cover" />
                </div>
                <DialogTitle className="text-base">
                  第 {selectedTile} 格 — {REWARDS[selectedTile].name}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  {TILE_DESCRIPTIONS[selectedTile]}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                {selectedTile <= displayPosition ? (
                  <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground font-medium">✓ 已通過</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">尚未抵達</span>
                )}
                {REWARDS[selectedTile].isSpecial && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">⭐ 特殊獎勵</span>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};


// Board tile
interface BoardTileProps {
  number: number;
  reward: { name: string; shortName: string; isSpecial: boolean; tileImage: string; type: "lottery" | "fixed" };
  isCurrentPosition: boolean;
  isPassed: boolean;
  isJumping?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
}

const BoardTile = ({ number, reward, isCurrentPosition, isPassed, isJumping, isStart, isEnd, onTap }: BoardTileProps & { onTap?: () => void }) => {
  return (
    <div className="relative">
      <motion.div
        className="board-tile cursor-pointer active:scale-95 transition-transform"
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
        onClick={onTap}
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

      </motion.div>
    </div>
  );
};

export default StampCard;