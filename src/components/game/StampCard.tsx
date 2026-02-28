import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameCharacterInfo } from "./CharacterSelect";

interface StampCardProps {
  totalPoints: number;
  maxPoints?: number;
  character?: GameCharacterInfo;
}

// 獎項對照表
const REWARDS: Record<number, { name: string; isSpecial: boolean; icon: string; type: "lottery" | "fixed"; color: string; sideColor: string }> = {
  1:  { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery", color: "hsl(40 28% 66%)", sideColor: "hsl(40 28% 52%)" },
  2:  { name: "Deli 甜點", isSpecial: true, icon: "🍰", color: "hsl(20 22% 78%)", sideColor: "hsl(20 22% 64%)", type: "fixed" },
  3:  { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery", color: "hsl(60 5% 65%)", sideColor: "hsl(60 5% 50%)" },
  4:  { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery", color: "hsl(40 28% 66%)", sideColor: "hsl(40 28% 52%)" },
  5:  { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery", color: "hsl(0 1% 88%)", sideColor: "hsl(0 1% 72%)" },
  6:  { name: "$500 折價", isSpecial: true, icon: "💵", color: "hsl(20 22% 78%)", sideColor: "hsl(20 22% 64%)", type: "fixed" },
  7:  { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery", color: "hsl(60 5% 65%)", sideColor: "hsl(60 5% 50%)" },
  8:  { name: "$800 折價", isSpecial: true, icon: "💰", color: "hsl(40 40% 60%)", sideColor: "hsl(40 40% 46%)", type: "fixed" },
  9:  { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery", color: "hsl(40 28% 66%)", sideColor: "hsl(40 28% 52%)" },
  10: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery", color: "hsl(0 1% 88%)", sideColor: "hsl(0 1% 72%)" },
  11: { name: "買一送一", isSpecial: true, icon: "🎁", color: "hsl(20 22% 78%)", sideColor: "hsl(20 22% 64%)", type: "fixed" },
  12: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery", color: "hsl(60 5% 65%)", sideColor: "hsl(60 5% 50%)" },
  13: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery", color: "hsl(40 28% 66%)", sideColor: "hsl(40 28% 52%)" },
  14: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery", color: "hsl(0 1% 88%)", sideColor: "hsl(0 1% 72%)" },
  15: { name: "大獎 $3,880", isSpecial: true, icon: "🏆", color: "hsl(40 50% 55%)", sideColor: "hsl(40 50% 40%)", type: "fixed" },
};

// 蛇形排列
const ROWS = [
  [1, 2, 3, 4, 5],
  [10, 9, 8, 7, 6],
  [11, 12, 13, 14, 15],
];

const TILE_W = 60;
const TILE_H = 50;
const TILE_DEPTH = 14;

const StampCard = ({ totalPoints, maxPoints = 15, character }: StampCardProps) => {
  const [viewAngle, setViewAngle] = useState(0);
  const currentPosition = totalPoints;

  const perspectives = [
    { rotateX: 50, rotateY: 0, label: "俯瞰" },
    { rotateX: 35, rotateY: -20, label: "左側" },
    { rotateX: 35, rotateY: 20, label: "右側" },
    { rotateX: 25, rotateY: 0, label: "正面" },
  ];

  const currentPerspective = perspectives[viewAngle];

  return (
    <div className="stamp-card overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="text-accent">♔</span> 洲際大富翁
        </h3>
        <span className="text-sm font-medium text-muted-foreground">
          第 {currentPosition} 格
        </span>
      </div>

      {/* Perspective controls */}
      <div className="flex gap-2 justify-center mb-4">
        {perspectives.map((p, i) => (
          <button
            key={i}
            onClick={() => setViewAngle(i)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              viewAngle === i
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 3D Board */}
      <div className="flex justify-center py-6" style={{ perspective: "900px" }}>
        <motion.div
          className="relative"
          animate={{
            rotateX: currentPerspective.rotateX,
            rotateY: currentPerspective.rotateY,
          }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* 起點 tile */}
          <div className="flex justify-center mb-3" style={{ transformStyle: "preserve-3d" }}>
            <IsometricTile
              label="起點"
              icon="🏨"
              topColor="hsl(20 7% 22%)"
              sideColor="hsl(20 7% 14%)"
              textColor="#fff"
              isActive={currentPosition === 0}
              isCurrent={currentPosition === 0}
              character={currentPosition === 0 ? character : undefined}
              width={80}
            />
          </div>

          {/* Board rows */}
          <div className="space-y-1" style={{ transformStyle: "preserve-3d" }}>
            {ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center" style={{ transformStyle: "preserve-3d" }}>
                {row.map((num, colIndex) => {
                  const reward = REWARDS[num];
                  const isCurrent = currentPosition === num;
                  const isPassed = currentPosition > num;
                  return (
                    <IsometricTile
                      key={num}
                      label={reward.name}
                      icon={reward.icon}
                      number={num}
                      topColor={reward.color}
                      sideColor={reward.sideColor}
                      isActive={isPassed || isCurrent}
                      isCurrent={isCurrent}
                      isPassed={isPassed}
                      isSpecial={reward.isSpecial}
                      character={isCurrent ? character : undefined}
                      delay={rowIndex * 0.1 + colIndex * 0.05}
                    />
                  );
                })}
              </div>
            ))}
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
                <span className="text-lg font-bold reward-text">
                  🎉 恭喜抵達終點！獲得招牌餐點兌換券
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
        {character && (
          <span className="flex items-center gap-1">
            <img src={character.image} alt="角色" className="w-4 h-4 object-contain" />
            目前位置
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: "hsl(0 1% 88%)" }} />
          未達成
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-accent/60" />
          已通過
        </span>
        <span className="flex items-center gap-1">
          <span className="text-accent">★</span>
          特殊獎勵
        </span>
      </div>
    </div>
  );
};

/* ─── Isometric 3D Tile ─── */
interface IsometricTileProps {
  label: string;
  icon: string;
  number?: number;
  topColor: string;
  sideColor: string;
  textColor?: string;
  isActive?: boolean;
  isCurrent?: boolean;
  isPassed?: boolean;
  isSpecial?: boolean;
  character?: GameCharacterInfo;
  width?: number;
  delay?: number;
}

const IsometricTile = ({
  label,
  icon,
  number,
  topColor,
  sideColor,
  textColor,
  isActive,
  isCurrent,
  isPassed,
  isSpecial,
  character,
  width = TILE_W,
  delay = 0,
}: IsometricTileProps) => {
  const depth = TILE_DEPTH;
  const height = TILE_H;

  return (
    <motion.div
      className="relative group cursor-default"
      style={{
        width,
        height: height + depth,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {/* Character token */}
      {isCurrent && character && (
        <motion.div
          className="absolute -top-10 left-1/2 -translate-x-1/2 z-30"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.img
            src={character.image}
            alt="棋子"
            className="w-10 h-10 object-contain drop-shadow-lg"
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      )}

      {/* ── Top face ── */}
      <div
        className="absolute inset-x-0 top-0 rounded-lg flex flex-col items-center justify-center overflow-hidden"
        style={{
          height,
          background: isCurrent
            ? `linear-gradient(135deg, ${topColor}, hsl(40 50% 60%))`
            : isPassed
            ? `${topColor}99`
            : topColor,
          border: isCurrent
            ? "2px solid hsl(40 50% 55%)"
            : isSpecial
            ? "2px solid hsl(40 40% 55% / 0.6)"
            : "1.5px solid hsl(0 0% 100% / 0.4)",
          boxShadow: isCurrent
            ? "0 0 20px hsl(40 50% 55% / 0.5), inset 0 1px 2px hsl(0 0% 100% / 0.4)"
            : "inset 0 1px 2px hsl(0 0% 100% / 0.3)",
          zIndex: 2,
        }}
      >
        {/* Shimmer on current */}
        {isCurrent && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.3) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["-200% 0", "200% 0"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}

        <span className="text-xl relative z-10">{icon}</span>
        <span
          className="text-[8px] font-bold leading-tight text-center px-1 relative z-10 mt-0.5"
          style={{ color: textColor || (isPassed ? "hsl(20 7% 22% / 0.5)" : "hsl(20 7% 22%)") }}
        >
          {label}
        </span>

        {number !== undefined && (
          <span
            className="absolute top-0.5 right-1 text-[9px] font-black z-10"
            style={{ color: isSpecial ? "hsl(40 50% 40%)" : "hsl(20 7% 22% / 0.4)" }}
          >
            {number}
          </span>
        )}

        {/* Passed overlay */}
        {isPassed && !isCurrent && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 rounded-lg z-10">
            <span className="text-foreground/50 text-lg font-bold">✓</span>
          </div>
        )}

        {/* Special star badge */}
        {isSpecial && !isPassed && (
          <div
            className="absolute top-0.5 left-1 z-10"
          >
            <span className="text-[10px]">⭐</span>
          </div>
        )}
      </div>

      {/* ── Front face (depth) ── */}
      <div
        className="absolute inset-x-0 rounded-b-lg"
        style={{
          top: height - 1,
          height: depth + 1,
          background: isPassed && !isCurrent
            ? `${sideColor}88`
            : isCurrent
            ? `linear-gradient(180deg, ${sideColor}, hsl(40 40% 35%))`
            : sideColor,
          borderLeft: "1.5px solid hsl(0 0% 0% / 0.08)",
          borderRight: "1.5px solid hsl(0 0% 0% / 0.08)",
          borderBottom: "1.5px solid hsl(0 0% 0% / 0.12)",
          zIndex: 1,
        }}
      />

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-40 pointer-events-none border">
        {number !== undefined ? `${number}. ` : ""}{label}
      </div>

      {/* Pulse ring for current */}
      {isCurrent && (
        <motion.div
          className="absolute inset-x-0 top-0 rounded-lg pointer-events-none"
          style={{ height, zIndex: 3 }}
          animate={{
            boxShadow: [
              "0 0 0 0 hsl(40 50% 55% / 0.4)",
              "0 0 0 10px hsl(40 50% 55% / 0)",
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

export default StampCard;
