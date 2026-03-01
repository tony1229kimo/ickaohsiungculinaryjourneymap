import { motion } from "framer-motion";
import cardChanceBg from "@/assets/card-chance-bg.png";
import cardFateBg from "@/assets/card-fate-bg.png";

interface CardPickerProps {
  onPick: (type: "chance" | "fate") => void;
}

const CardPicker = ({ onPick }: CardPickerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ background: "radial-gradient(ellipse at center, hsl(0 0% 0% / 0.55), hsl(0 0% 0% / 0.8))" }}
      />

      {/* Title */}
      <motion.div
        className="relative z-10 text-center mb-8"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p
          className="text-2xl font-black tracking-wider"
          style={{ color: "hsl(43 85% 65%)", textShadow: "0 2px 12px hsl(43 85% 55% / 0.4)" }}
        >
          選擇一張卡片
        </p>
        <p className="text-sm mt-2" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
          點選「機會」或「命運」翻牌
        </p>
      </motion.div>

      {/* Two cards */}
      <div className="relative z-10 flex gap-5">
        {(["chance", "fate"] as const).map((type, idx) => {
          const isChance = type === "chance";
          return (
            <motion.button
              key={type}
              initial={{ y: 60, opacity: 0, rotateY: 15 * (idx === 0 ? -1 : 1) }}
              animate={{ y: 0, opacity: 1, rotateY: 0 }}
              transition={{ delay: 0.35 + idx * 0.15, type: "spring", damping: 14, stiffness: 120 }}
              whileHover={{ scale: 1.06, y: -8 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPick(type)}
              className="relative rounded-2xl overflow-hidden focus:outline-none group"
              style={{
                width: "150px",
                height: "210px",
                border: `2px solid ${isChance ? "hsl(40 50% 60%)" : "hsl(220 30% 50%)"}`,
                boxShadow: `0 12px 40px -8px hsl(0 0% 0% / 0.5), 0 0 20px ${isChance ? "hsl(40 60% 55% / 0.2)" : "hsl(220 50% 55% / 0.2)"}`,
              }}
            >
              {/* Card bg image */}
              <img src={isChance ? cardChanceBg : cardFateBg} alt="" className="absolute inset-0 w-full h-full object-cover" />

              {/* Shimmer */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, hsl(0 0% 100% / 0.22) 45%, hsl(0 0% 100% / 0.32) 50%, hsl(0 0% 100% / 0.22) 55%, transparent 60%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["-100% 0", "200% 0"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: idx * 0.6 }}
              />

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  className="text-5xl mb-2"
                  animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: idx * 0.3 }}
                  style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}
                >
                  {isChance ? "❗" : "🔮"}
                </motion.div>
                <p
                  className="text-base font-black tracking-widest"
                  style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                >
                  {isChance ? "機 會" : "命 運"}
                </p>
              </div>

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(ellipse at center, ${isChance ? "hsl(40 70% 60% / 0.2)" : "hsl(220 60% 60% / 0.2)"}, transparent 70%)`,
                }}
              />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CardPicker;
