import { motion } from "framer-motion";
import headerBg from "@/assets/header-bg.png";

interface GameHeaderProps {
  userName?: string;
  isLoading?: boolean;
}

const GameHeader = ({ userName, isLoading }: GameHeaderProps) => {
  return (
    <header className="game-header relative overflow-hidden">
      <img
        src={headerBg}
        alt="洲遊味蕾 Culinary Journey Map"
        className="w-full h-auto object-cover"
      />
    </header>
  );
};

export default GameHeader;
