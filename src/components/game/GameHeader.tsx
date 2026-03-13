import { motion } from "framer-motion";
import headerLogo from "@/assets/header-logo.png";

interface GameHeaderProps {
  userName?: string;
  isLoading?: boolean;
}

const GameHeader = ({ userName, isLoading }: GameHeaderProps) => {
  return (
    <header className="game-header bg-[#962222]">
      









































      

      {/* Subtle decorative dots */}
      <div className="absolute top-6 left-6 w-1.5 h-1.5 rounded-full bg-white/20" />
      <div className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-white/20" />
      <div className="absolute bottom-10 left-10 w-1 h-1 rounded-full bg-white/10" />
      <div className="absolute bottom-10 right-10 w-1 h-1 rounded-full bg-white/10" />
    </header>);

};

export default GameHeader;