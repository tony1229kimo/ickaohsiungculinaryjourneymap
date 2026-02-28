import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bearCelebration from "@/assets/bear-celebration.png";
import bearWish from "@/assets/bear-wish.png";

export interface GameCharacterInfo {
  id: string;
  name: string;
  image: string;
  description: string;
}

export const CHARACTERS: GameCharacterInfo[] = [
  {
    id: "celebration",
    name: "洲賀熊",
    image: bearCelebration,
    description: "熱情好客的洲際吉祥物，給你洲賀（祝福），陪你暢遊大富翁！",
  },
  {
    id: "wish",
    name: "白金星願熊",
    image: bearWish,
    description: "帶著滿滿祝福的聖誕限定角色！",
  },
];

interface CharacterSelectProps {
  onSelect: (character: GameCharacterInfo) => void;
}

const CharacterSelect = ({ onSelect }: CharacterSelectProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    const character = CHARACTERS.find((c) => c.id === selected);
    if (character) onSelect(character);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, hsl(40 20% 72%) 0%, hsl(20 12% 72%) 50%, hsl(20 7% 22%) 100%)" }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-sm rounded-3xl p-6 space-y-6 shadow-2xl border border-border/30"
        style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.95), hsl(30 18% 93% / 0.95))" }}
      >
        {/* Title */}
        <div className="text-center space-y-2">
          <motion.h2
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            className="text-2xl font-black text-foreground tracking-wide"
          >
            ♔ 選擇你的角色
          </motion.h2>
          <p className="text-sm text-muted-foreground">
            選一位夥伴陪你征服洲際大富翁！
          </p>
        </div>

        {/* Characters */}
        <div className="grid grid-cols-2 gap-4">
          {CHARACTERS.map((char, i) => (
            <motion.button
              key={char.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              onClick={() => setSelected(char.id)}
              className={`relative rounded-2xl p-4 text-center transition-all duration-300 border-2 ${
                selected === char.id
                  ? "border-accent shadow-lg shadow-accent/20 scale-105 bg-accent/10"
                  : "border-border/40 hover:border-accent/50 bg-card/60"
              }`}
            >
              {selected === char.id && (
                <motion.div
                  layoutId="character-ring"
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-bold shadow-md"
                >
                  ✓
                </motion.div>
              )}
              <motion.img
                src={char.image}
                alt={char.name}
                className="w-24 h-24 mx-auto object-contain mb-3 drop-shadow-md"
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                animate={selected === char.id ? { y: [0, -6, 0] } : {}}
                transition={{ duration: 1.5, repeat: selected === char.id ? Infinity : 0 }}
              />
              <h3 className="font-bold text-foreground text-sm">{char.name}</h3>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                {char.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Confirm */}
        <AnimatePresence>
          {selected && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={handleConfirm}
              className="dice-button w-full"
            >
              開始冒險！
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default CharacterSelect;
