import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import cardChanceBg from "@/assets/card-chance-bg.png";
import cardFateBg from "@/assets/card-fate-bg.png";
import bonusBg from "@/assets/bonus_BG.png";

// Reward icon imports
import rewardIconCake from "@/assets/reward-icon-appetizer.png";
import rewardIconDrink from "@/assets/reward-icon-drink.png";
import rewardIconTea from "@/assets/reward-icon-tea.png";
import rewardIcon200 from "@/assets/reward-icon-200.png";

import rewardIcon100 from "@/assets/reward-icon-100.png";

// 機會獎項 (5選1)
const CHANCE_REWARDS = [
{ id: 1, name: "NT$ 200 餐飲優惠券", icon: "💵", image: rewardIcon200, link: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba3373e9a32d659304b5ac?platform=line&channelId=1656533412" },
{ id: 2, name: "「招牌飲品」免費兌換券", icon: "🥤", image: rewardIconDrink, link: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba30fde9a32d659304932b?platform=line&channelId=1656533412" },
{ id: 3, name: "「招牌前菜」免費兌換券", icon: "🥗", image: rewardIconCake, link: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba36038e2fbe3c064de78a?platform=line&channelId=1656533412" },
{ id: 4, name: "Delicatesse 烘焙坊「指定點心」免費兌換券", icon: "🍰", image: rewardIconCake, link: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba2f6eb38a592f937df5ef?platform=line&channelId=1656533412" },
{ id: 5, name: "玫果沁釀覆盆莓煎茶氣泡飲 免費兌換券", icon: "🧋", image: rewardIconTea, link: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba2f6eb38a592f937df5ef?platform=line&channelId=1656533412" }];


// 命運獎項 (固定)
const FATE_REWARD = { id: 1, name: "NT$ 100 餐飲優惠券", icon: "🎫", image: rewardIcon100, link: "https://api.omnichat.ai/restapi/v1/omo/bind/69ba342bc3025130d0f4e01a?platform=line&channelId=1656533412" };

export interface LotteryResult {
  type: "chance" | "fate";
  reward: {id: number;name: string;icon: string;};
}

interface LotteryCardProps {
  type: "chance" | "fate";
  onClose: () => void;
  onRewardClaimed: (result: LotteryResult) => void;
}

const LotteryCard = ({ type, onClose, onRewardClaimed }: LotteryCardProps) => {
  const [phase, setPhase] = useState<"back" | "flipping" | "front">("back");
  const [reward, setReward] = useState<{id: number;name: string;icon: string;image?: string;link?: string;} | null>(null);

  const bgImage = type === "chance" ? cardChanceBg : cardFateBg;

  useEffect(() => {
    // Show card back briefly, then flip
    const startFlip = setTimeout(() => {
      setPhase("flipping");

      // Determine reward during flip
      if (type === "chance") {
        const randomIndex = Math.floor(Math.random() * CHANCE_REWARDS.length);
        setReward(CHANCE_REWARDS[randomIndex]);
      } else {
        setReward(FATE_REWARD);
      }
    }, 800);

    return () => clearTimeout(startFlip);
  }, [type]);

  // When flip animation reaches midpoint, switch to front
  useEffect(() => {
    if (phase === "flipping") {
      const showFront = setTimeout(() => {
        setPhase("front");
      }, 600);
      return () => clearTimeout(showFront);
    }
  }, [phase]);

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (reward) {
      onRewardClaimed({ type, reward: { id: reward.id, name: reward.name, icon: reward.icon } });
      if (reward.link) {
        // 使用 <a> 模擬點擊，避免被瀏覽器攔截
        const a = document.createElement("a");
        a.href = reward.link;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ background: "radial-gradient(ellipse at center, hsl(0 0% 0% / 0.5), hsl(0 0% 0% / 0.75))" }} />
      

      {/* Sparkles */}
      {phase === "front" &&
      <>
          {[...Array(8)].map((_, i) =>
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: type === "chance" ?
            "hsl(40 80% 65%)" :
            "hsl(220 70% 70%)",
            left: `${20 + Math.random() * 60}%`,
            top: `${15 + Math.random() * 70}%`
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, -40 - Math.random() * 60]
          }}
          transition={{ delay: 0.3 + i * 0.1, duration: 1.2, ease: "easeOut" }} />

        )}
        </>
      }

      {/* 3D Card Container */}
      <div className="relative z-10" style={{ perspective: "1200px" }}>
        <motion.div
          className="relative w-72 h-[420px]"
          style={{ transformStyle: "preserve-3d" }}
          initial={{ scale: 0.3, rotateY: 0 }}
          animate={{
            scale: 1,
            rotateY: phase === "back" ? 0 : phase === "flipping" ? 180 : 180
          }}
          transition={{
            scale: { duration: 0.4, ease: "easeOut" },
            rotateY: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
          }}>
          
          {/* Card Back */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden border-2"
            style={{
              backfaceVisibility: "hidden",
              borderColor: type === "chance" ? "hsl(40 50% 60%)" : "hsl(220 30% 50%)",
              boxShadow: "0 20px 60px -10px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)"
            }}>
            
            <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {/* Shimmer effect on back */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(105deg, transparent 40%, hsl(0 0% 100% / 0.25) 45%, hsl(0 0% 100% / 0.35) 50%, hsl(0 0% 100% / 0.25) 55%, transparent 60%)",
                backgroundSize: "200% 100%"
              }}
              animate={{ backgroundPosition: ["-100% 0", "200% 0"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                className="text-6xl mb-3"
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}>
                
                {type === "chance" ? "❗" : "🔮"}
              </motion.div>
              <p className="text-white text-lg font-black tracking-wider" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                {type === "chance" ? "機 會 卡" : "命 運 卡"}
              </p>
            </div>
          </div>

          {/* Card Front */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}>



            {/* Front content */}
            <AnimatePresence>
              {phase === "front" && reward &&
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-8 text-secondary-foreground"
                style={{ backgroundImage: `url(${bonusBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                
                  {/* Type badge */}
                  <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}>
                  
                    <span
                    className="inline-block px-4 py-1.5 rounded-full font-bold mb-4 text-primary border-primary text-xl text-center"
                    style={{
                      background: "hsl(0 0% 100% / 0.25)",
                      backdropFilter: "blur(8px)",
                      color: "white",
                      textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      border: "1px solid hsl(0 0% 100% / 0.3)"
                    }}>
                    
                      {type === "chance" ? (
                        <>❗<br />機會</>
                      ) : (
                        <>🔮<br />命運</>
                      )}
                    </span>
                  </motion.div>

                  {/* Reward icon */}
                  <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.25, type: "spring", damping: 12, stiffness: 150 }}
                  className="relative mb-4">
                  
                    {reward.image ?
                  <img
                    src={reward.image}
                    alt={reward.name}
                    className="w-24 h-24 object-contain"
                    style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" }} /> :


                  <span className="text-7xl" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" }}>
                        {reward.icon}
                      </span>
                  }
                    {/* Glow ring */}
                    <motion.div
                    className="absolute inset-0 -m-3 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${type === "chance" ? "hsl(40 80% 65% / 0.3)" : "hsl(220 60% 65% / 0.3)"}, transparent 70%)`
                    }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }} />
                  
                  </motion.div>

                  {/* Reward name */}
                  <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-black text-center mb-6 px-2 leading-snug text-primary"
                  style={{ textShadow: "0 2px 8px rgba(0,0,0,0.35)" }}>
                  
                    {reward.name}
                  </motion.p>

                  {/* Claim button */}
                  <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleClaim}
                  className="px-8 py-3 rounded-2xl font-bold text-lg transition-colors"
                  style={{
                    background: "hsl(0 0% 100% / 0.92)",
                    color: type === "chance" ? "hsl(30 40% 30%)" : "hsl(230 30% 25%)",
                    boxShadow: "0 4px 20px hsl(0 0% 0% / 0.2), inset 0 1px 0 hsl(0 0% 100%)"
                  }}>
                  
                    領取獎勵 🎉
                  </motion.button>

                  {/* Note */}
                  <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.7 }}
                  className="text-xs mt-4 text-primary">
                  
                    獎券將發送至您的帳戶
                  </motion.p>
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>);

};

export default LotteryCard;

// 輔助函數：判斷位置是否為機會/命運格
export const isLotteryTile = (position: number): boolean => {
  const lotteryPositions = [1, 3, 4, 5, 7, 9, 10, 12, 13, 14];
  return lotteryPositions.includes(position);
};

// 輔助函數：隨機決定是機會還是命運
export const getRandomLotteryType = (): "chance" | "fate" => {
  return Math.random() > 0.5 ? "chance" : "fate";
};