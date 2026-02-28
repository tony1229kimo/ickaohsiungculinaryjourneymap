import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameCharacterInfo } from "./CharacterSelect";

interface StampCardProps {
  totalPoints: number;
  maxPoints?: number;
  character?: GameCharacterInfo;
}

// 獎項對照表
const REWARDS: Record<number, {name: string;isSpecial: boolean;icon: string;type: "lottery" | "fixed";}> = {
  1: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  2: { name: "指定 Deli 甜點免費兌換", isSpecial: true, icon: "🍰", type: "fixed" },
  3: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  4: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  5: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  6: { name: "NT$ 500 折價券", isSpecial: true, icon: "💵", type: "fixed" },
  7: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  8: { name: "NT$ 800 折價券", isSpecial: true, icon: "💰", type: "fixed" },
  9: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  10: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  11: { name: "餐飲買一送一", isSpecial: true, icon: "🎁", type: "fixed" },
  12: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  13: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  14: { name: "機會/命運", isSpecial: false, icon: "❓", type: "lottery" },
  15: { name: "招牌餐點免費兌換 (價值$3,880)", isSpecial: true, icon: "🏆", type: "fixed" }
};

// 蛇形排列：第一行左→右，第二行右→左，第三行左→右
const ROWS = [
[1, 2, 3, 4, 5],
[10, 9, 8, 7, 6], // 顯示順序反轉（蛇形）
[11, 12, 13, 14, 15]];


const StampCard = ({ totalPoints, maxPoints = 15, character }: StampCardProps) => {
  const [viewAngle, setViewAngle] = useState(0);
  const currentPosition = totalPoints;

  // 3D perspective angles
  const perspectives = [
  { rotateX: 45, rotateY: 0, label: "俯瞰" },
  { rotateX: 30, rotateY: -15, label: "左側" },
  { rotateX: 30, rotateY: 15, label: "右側" },
  { rotateX: 20, rotateY: 0, label: "正面" }];


  const currentPerspective = perspectives[viewAngle];

  return (
    <div className="stamp-card overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">♔
洲際味蕾旅遊地圖<span className="text-accent">♔</span> 洲際大富翁
        </h3>
        <span className="text-sm font-medium text-muted-foreground">
          第 {currentPosition} 格
        </span>
      </div>

      {/* Perspective controls */}
      















      {/* 3D Board */}
      <div className="flex justify-center" style={{ perspective: "800px" }}>
        <motion.div
          className="relative w-full max-w-[340px]"
          animate={{
            rotateX: currentPerspective.rotateX,
            rotateY: currentPerspective.rotateY
          }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          style={{ transformStyle: "preserve-3d" }}>

          {/* Board base */}
          <div
            className="rounded-2xl p-4 border-2 border-accent/30"
            style={{
              background: "linear-gradient(135deg, hsl(40 20% 72%) 0%, hsl(30 18% 80%) 50%, hsl(20 12% 72%) 100%)",
              boxShadow: "0 20px 60px -15px hsl(20 7% 22% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.3)"
            }}>

            {/* 起點 */}
            <div className="flex justify-center mb-3">
              <motion.div
                className={`relative w-16 h-16 rounded-xl flex flex-col items-center justify-center text-xs font-bold border-2 ${
                currentPosition === 0 ?
                "bg-foreground text-primary-foreground border-accent shadow-lg" :
                "text-foreground border-muted"}`
                }
                style={{
                  background: currentPosition === 0 ?
                  "linear-gradient(135deg, hsl(20 7% 22%), hsl(20 10% 30%))" :
                  "hsl(0 0% 100% / 0.6)"
                }}
                animate={currentPosition === 0 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}>

                <span className="text-xl">🏨</span>
                <span className={currentPosition === 0 ? "text-primary-foreground" : ""}>起點</span>
                {currentPosition === 0 && character &&
                <CharacterToken image={character.image} />
                }
              </motion.div>
            </div>

            {/* Board rows */}
            <div className="space-y-2">
              {ROWS.map((row, rowIndex) =>
              <div key={rowIndex} className="flex gap-2 justify-center">
                  {row.map((num) =>
                <BoardTile
                  key={num}
                  number={num}
                  reward={REWARDS[num]}
                  isCurrentPosition={currentPosition === num}
                  isPassed={currentPosition > num}
                  character={character} />

                )}
                </div>
              )}
            </div>

            {/* Grand prize notice */}
            <AnimatePresence>
              {totalPoints >= maxPoints &&
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-3 rounded-xl text-center border border-accent/40"
                style={{ background: "linear-gradient(135deg, hsl(40 20% 72% / 0.5), hsl(43 85% 55% / 0.3))" }}>

                  <span className="text-lg font-bold reward-text">
                    🎉 恭喜抵達終點！獲得招牌餐點兌換券
                  </span>
                </motion.div>
              }
            </AnimatePresence>
          </div>

          {/* 3D side effect */}
          <div
            className="absolute left-0 right-0 h-4 rounded-b-2xl -bottom-3"
            style={{
              background: "hsl(20 7% 22% / 0.3)",
              transform: "rotateX(-90deg)",
              transformOrigin: "top"
            }} />

        </motion.div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
        {character &&
        <span className="flex items-center gap-1">
            <img src={character.image} alt="角色" className="w-4 h-4 object-contain" />
            目前位置
          </span>
        }
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: "hsl(0 0% 100% / 0.6)" }} />
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
    </div>);

};

// Character token on the board
const CharacterToken = ({ image }: {image: string;}) =>
<motion.div
  className="absolute -top-7 left-1/2 -translate-x-1/2 z-20"
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: [0, -8, 0], opacity: 1 }}
  transition={{
    y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
    opacity: { duration: 0.3 }
  }}>

    <motion.img
    src={image}
    alt="棋子"
    className="w-10 h-10 object-contain drop-shadow-lg"
    animate={{ rotate: [-3, 3, -3] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />

  </motion.div>;


// Board tile
interface BoardTileProps {
  number: number;
  reward: {name: string;isSpecial: boolean;icon: string;type: "lottery" | "fixed";};
  isCurrentPosition: boolean;
  isPassed: boolean;
  character?: GameCharacterInfo;
}

const BoardTile = ({ number, reward, isCurrentPosition, isPassed, character }: BoardTileProps) => {
  const isLottery = reward.type === "lottery";

  // Tile colors based on state, using the elegant palette
  const getTileStyle = () => {
    if (isCurrentPosition) {
      return {
        background: "linear-gradient(135deg, hsl(40 20% 72%), hsl(43 85% 55% / 0.4))",
        borderColor: "hsl(43 85% 55%)",
        boxShadow: "0 0 16px hsl(43 85% 55% / 0.4)"
      };
    }
    if (isPassed) {
      return {
        background: "hsl(40 20% 72% / 0.8)",
        borderColor: "hsl(40 20% 60%)"
      };
    }
    if (reward.isSpecial) {
      return {
        background: "linear-gradient(135deg, hsl(43 85% 55% / 0.15), hsl(40 20% 80%))",
        borderColor: "hsl(43 85% 55% / 0.5)"
      };
    }
    if (isLottery) {
      return {
        background: "linear-gradient(135deg, hsl(20 12% 72% / 0.4), hsl(120 8% 48% / 0.15))",
        borderColor: "hsl(120 8% 48% / 0.4)"
      };
    }
    return {
      background: "hsl(0 0% 100% / 0.7)",
      borderColor: "hsl(20 12% 72% / 0.5)"
    };
  };

  return (
    <motion.div
      className="relative w-14 h-14 rounded-lg flex flex-col items-center justify-center text-xs font-medium border-2 cursor-default group"
      style={getTileStyle()}
      initial={false}
      animate={
      isCurrentPosition ?
      {
        boxShadow: [
        "0 0 0 0 hsl(43 85% 55% / 0.4)",
        "0 0 0 8px hsl(43 85% 55% / 0)"]

      } :
      {}
      }
      transition={{ duration: 1.5, repeat: Infinity }}
      whileHover={{ scale: isCurrentPosition ? 1.1 : 1.05 }}>

      <span className="text-lg">{reward.icon}</span>
      <span className={`text-[10px] ${reward.isSpecial ? "text-accent font-bold" : "text-foreground/70"}`}>
        {number}
      </span>

      {isCurrentPosition && character && <CharacterToken image={character.image} />}

      {isPassed && !isCurrentPosition &&
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute inset-0 flex items-center justify-center rounded-lg"
        style={{ background: "hsl(40 20% 72% / 0.4)" }}>

          <span className="text-foreground/60 text-lg">✓</span>
        </motion.div>
      }

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none border">
        {reward.name}
      </div>
    </motion.div>);

};

export default StampCard;