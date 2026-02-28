import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameHeader from "@/components/game/GameHeader";
import DiceRoller from "@/components/game/DiceRoller";
import StampCard from "@/components/game/StampCard";
import StatusMessage from "@/components/game/StatusMessage";
import QRScanner from "@/components/game/QRScanner";
import LotteryCard, { isLotteryTile, getRandomLotteryType, LotteryResult } from "@/components/game/LotteryCard";
import CharacterSelect, { GameCharacterInfo } from "@/components/game/CharacterSelect";

const MOCK_USER = {
  userId: "demo_user_123",
  displayName: "洲際會員",
};

const EXPECTED_QR_CODE = "INTERCONTINENTAL_2024";
const LOTTERY_POSITIONS = [1, 3, 4, 5, 7, 9, 10, 12, 13, 14];

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();
  const [totalPoints, setTotalPoints] = useState(0);
  const [statusMessage, setStatusMessage] = useState("正在連線至會員系統...");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "loading">("loading");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQRVerified, setIsQRVerified] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showLottery, setShowLottery] = useState(false);
  const [lotteryType, setLotteryType] = useState<"chance" | "fate">("chance");
  const [pendingPoints, setPendingPoints] = useState(0);
  const [earnedRewards, setEarnedRewards] = useState<LotteryResult[]>([]);

  // Character selection
  const [selectedCharacter, setSelectedCharacter] = useState<GameCharacterInfo | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setUserName(MOCK_USER.displayName);
        setStatusMessage("請掃描店家 QR Code 以擲骰一次");
        setStatusType("info");

        const savedPoints = localStorage.getItem(`points_${MOCK_USER.userId}`);
        if (savedPoints) setTotalPoints(parseInt(savedPoints));

        const savedRewards = localStorage.getItem(`rewards_${MOCK_USER.userId}`);
        if (savedRewards) setEarnedRewards(JSON.parse(savedRewards));

        const savedChar = localStorage.getItem(`character_${MOCK_USER.userId}`);
        if (savedChar) setSelectedCharacter(JSON.parse(savedChar));

        setIsLoading(false);
      } catch (error) {
        console.error("System initialization failed", error);
        setStatusMessage("連線失敗，請重新整理頁面");
        setStatusType("error");
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleCharacterSelect = (char: GameCharacterInfo) => {
    setSelectedCharacter(char);
    localStorage.setItem(`character_${MOCK_USER.userId}`, JSON.stringify(char));
  };

  const handleQRSuccess = () => {
    setIsQRVerified(true);
    setShowScanner(false);
    setStatusMessage("✅ 驗證成功！請擲骰一次");
    setStatusType("success");
  };

  const handleDiceRoll = async (points: number) => {
    setIsProcessing(true);
    setStatusMessage("正在移動棋子...");
    setStatusType("loading");

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newTotal = Math.min(totalPoints + points, 15);

      if (LOTTERY_POSITIONS.includes(newTotal) && newTotal > totalPoints) {
        setPendingPoints(newTotal);
        setLotteryType(getRandomLotteryType());
        setShowLottery(true);
        setIsProcessing(false);
        return;
      }
      finalizeDiceRoll(newTotal, points);
    } catch {
      setStatusMessage("擲骰失敗，請重試");
      setStatusType("error");
      setIsProcessing(false);
    }
  };

  const finalizeDiceRoll = (newTotal: number, steps: number) => {
    setTotalPoints(newTotal);
    localStorage.setItem(`points_${MOCK_USER.userId}`, newTotal.toString());
    setIsQRVerified(false);
    setStatusMessage(
      newTotal >= 15
        ? "🏆 恭喜抵達終點！獲得招牌餐點兌換券"
        : `🎲 前進 ${steps} 步！請再次掃描 QR Code 進行下一次遊戲`
    );
    setStatusType("success");
    setIsProcessing(false);
  };

  const handleLotteryClose = () => {
    setShowLottery(false);
    if (pendingPoints > 0) {
      finalizeDiceRoll(pendingPoints, pendingPoints - totalPoints);
      setPendingPoints(0);
    }
  };

  const handleRewardClaimed = (result: LotteryResult) => {
    const newRewards = [...earnedRewards, result];
    setEarnedRewards(newRewards);
    localStorage.setItem(`rewards_${MOCK_USER.userId}`, JSON.stringify(newRewards));
  };

  // Show character selection if no character chosen yet
  if (!isLoading && !selectedCharacter) {
    return <CharacterSelect onSelect={handleCharacterSelect} />;
  }

  return (
    <div className="game-container">
      <GameHeader userName={userName} isLoading={isLoading} />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md px-4 -mt-4 space-y-6"
      >
        <div className="stamp-card">
          <h2 className="text-lg font-bold text-foreground mb-4 text-center flex items-center justify-center gap-2">
            {selectedCharacter && (
              <img src={selectedCharacter.image} alt="" className="w-8 h-8 object-contain" />
            )}
            大富翁集點遊戲
          </h2>

          {!isQRVerified ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
              <div className="py-8">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >📱</motion.div>
                <p className="text-foreground font-medium mb-2">請掃描店家 QR Code</p>
                <p className="text-sm text-muted-foreground">每次掃描可擲骰一次，完成集點</p>
              </div>
              <button onClick={() => setShowScanner(true)} disabled={isLoading} className="dice-button">
                <span className="flex items-center justify-center gap-2">
                  <span className="text-xl">📷</span> 開始掃描 QR Code
                </span>
              </button>
            </motion.div>
          ) : (
            <DiceRoller onRoll={handleDiceRoll} disabled={isLoading || isProcessing} />
          )}

          <div className="mt-4">
            <StatusMessage message={statusMessage} type={statusType} />
          </div>
        </div>

        <StampCard totalPoints={totalPoints} maxPoints={15} character={selectedCharacter ?? undefined} />

        {/* Earned rewards */}
        {earnedRewards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stamp-card">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">🎁 已獲得獎項</h3>
            <div className="space-y-2">
              {earnedRewards.map((reward, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
                >
                  <span className="text-2xl">{reward.reward.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{reward.reward.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {reward.type === "chance" ? "機會卡" : "命運卡"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground pb-4 space-y-2"
        >
          <p>
            <a href="/qrcode" className="inline-flex items-center gap-1 bg-accent/20 hover:bg-accent/30 px-3 py-1.5 rounded-full transition-colors text-foreground font-medium">
              📱 查看店家 QR Code
            </a>
          </p>
          <p>高雄洲際酒店 InterContinental Kaohsiung</p>
        </motion.div>
      </motion.main>

      <AnimatePresence>
        {showScanner && (
          <QRScanner expectedCode={EXPECTED_QR_CODE} onSuccess={handleQRSuccess} onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLottery && (
          <LotteryCard type={lotteryType} onClose={handleLotteryClose} onRewardClaimed={handleRewardClaimed} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
