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
        className="w-full max-w-lg h-auto object-cover px-3 sm:px-3 max-sm:max-w-full max-sm:px-0" src="/lovable-uploads/99ff90de-e5e5-48c1-a505-e8a65847721a.png" />
      
    </header>);

};

export default GameHeader;