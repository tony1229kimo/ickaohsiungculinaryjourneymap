import { motion } from "framer-motion";
import headerBg from "@/assets/header-bg.png";
import headerMain from "@/assets/header-main.png";

interface GameHeaderProps {
  userName?: string;
  isLoading?: boolean;
}

const GameHeader = ({ userName, isLoading }: GameHeaderProps) => {
  return (
    <header className="game-header relative overflow-hidden w-full flex justify-center">
      <img

        alt="洲遊味蕾 Culinary Journey Map"
        className="w-full max-w-lg h-auto object-cover px-3 sm:px-3 max-sm:max-w-full max-sm:px-0" src={headerMain} />
      
    </header>);

};

export default GameHeader;