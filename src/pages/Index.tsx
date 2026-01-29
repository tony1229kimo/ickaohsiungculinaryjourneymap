import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameHeader from "@/components/game/GameHeader";
import DiceRoller from "@/components/game/DiceRoller";
import StampCard from "@/components/game/StampCard";
import StatusMessage from "@/components/game/StatusMessage";
import QRScanner from "@/components/game/QRScanner";
import LotteryCard, { isLotteryTile, getRandomLotteryType, LotteryResult } from "@/components/game/LotteryCard";

// Mock user for demo
const MOCK_USER = {
  userId: "demo_user_123",
  displayName: "洲際會員",
};

// 💡 店家設定的 QR Code 內容
const EXPECTED_QR_CODE = "INTERCONTINENTAL_2024";

// 判斷位置是否為機會/命運格
const LOTTERY_POSITIONS = [1, 3, 4, 5, 7, 9, 10, 12, 13, 14];

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();
  const [totalPoints, setTotalPoints] = useState(0);
  const [statusMessage, setStatusMessage] = useState("正在連線至會員系統...");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "loading">("loading");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // QR Code verification state
  const [isQRVerified, setIsQRVerified] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Lottery state
  const [showLottery, setShowLottery] = useState(false);
  const [lotteryType, setLotteryType] = useState<"chance" | "fate">("chance");
  const [pendingPoints, setPendingPoints] = useState(0);

  // 已獲得的獎項列表
  const [earnedRewards, setEarnedRewards] = useState<LotteryResult[]>([]);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setUserName(MOCK_USER.displayName);
        setStatusMessage("請先掃描店家 QR Code 以開始遊戲");
        setStatusType("info");
        
        const savedPoints = localStorage.getItem(`points_${MOCK_USER.userId}`);
        if (savedPoints) {
          setTotalPoints(parseInt(savedPoints));
        }

        const savedRewards = localStorage.getItem(`rewards_${MOCK_USER.userId}`);
        if (savedRewards) {
          setEarnedRewards(JSON.parse(savedRewards));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("System initialization failed", error);
        setStatusMessage("連線失敗，請重新整理頁面");
        setStatusType("error");
        setIsLoading(false);
      }
    };

    initLiff();
  }, []);

  const handleQRSuccess = () => {
    setIsQRVerified(true);
    setShowScanner(false);
    setStatusMessage("✅ 驗證成功！可以開始擲骰");
    setStatusType("success");
  };

  const handleDiceRoll = async (points: number) => {
    setIsProcessing(true);
    setStatusMessage("正在移動棋子...");
    setStatusType("loading");

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newTotal = Math.min(totalPoints + points, 15);
      
      // 檢查新位置是否為機會/命運格
      if (LOTTERY_POSITIONS.includes(newTotal) && newTotal > totalPoints) {
        // 儲存待加點數，等抽獎完成後再更新
        setPendingPoints(newTotal);
        setLotteryType(getRandomLotteryType());
        setShowLottery(true);
        setIsProcessing(false);
        return;
      }

      // 直接更新點數
      finalizeDiceRoll(newTotal, points);
    } catch (error) {
      console.error("Roll failed", error);
      setStatusMessage("擲骰失敗，請重試");
      setStatusType("error");
      setIsProcessing(false);
    }
  };

  const finalizeDiceRoll = (newTotal: number, steps: number) => {
    setTotalPoints(newTotal);
    localStorage.setItem(`points_${MOCK_USER.userId}`, newTotal.toString());
    
    // 擲骰後需要重新掃描 QR Code
    setIsQRVerified(false);
    
    if (newTotal >= 15) {
      setStatusMessage(`🏆 恭喜抵達終點！獲得招牌餐點兌換券`);
    } else {
      setStatusMessage(`前進 ${steps} 步！下次需重新掃描 QR Code`);
    }
    setStatusType("success");
    setIsProcessing(false);
  };

  const handleLotteryClose = () => {
    setShowLottery(false);
    // 抽獎後更新點數
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
            <span className="text-accent">♔</span> 擲骰遊戲
          </h2>

          {/* QR Code verification gate */}
          {!isQRVerified ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="py-8">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  📱
                </motion.div>
                <p className="text-foreground font-medium mb-2">
                  請先掃描店家 QR Code
                </p>
                <p className="text-sm text-muted-foreground">
                  消費滿 2,000 元後請向店員索取 QR Code
                </p>
              </div>
              
              <button
                onClick={() => setShowScanner(true)}
                disabled={isLoading}
                className="dice-button"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="text-xl">📷</span>
                  開始掃描 QR Code
                </span>
              </button>
            </motion.div>
          ) : (
            <DiceRoller
              onRoll={handleDiceRoll}
              disabled={isLoading || isProcessing}
            />
          )}
          
          <div className="mt-4">
            <StatusMessage message={statusMessage} type={statusType} />
          </div>
        </div>

        <StampCard totalPoints={totalPoints} maxPoints={15} />

        {/* 已獲得的獎項 */}
        {earnedRewards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stamp-card"
          >
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              🎁 已獲得獎項
            </h3>
            <div className="space-y-2">
              {earnedRewards.map((reward, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    reward.type === "chance" 
                      ? "bg-purple-500/10 border border-purple-400/30" 
                      : "bg-blue-500/10 border border-blue-400/30"
                  }`}
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
            <a 
              href="/qrcode" 
              className="inline-flex items-center gap-1 bg-accent/20 hover:bg-accent/30 px-3 py-1.5 rounded-full transition-colors text-foreground font-medium"
            >
              📱 查看店家 QR Code
            </a>
          </p>
          <p>高雄洲際酒店 InterContinental Kaohsiung</p>
        </motion.div>
      </motion.main>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner
            expectedCode={EXPECTED_QR_CODE}
            onSuccess={handleQRSuccess}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Lottery Card Modal */}
      <AnimatePresence>
        {showLottery && (
          <LotteryCard
            type={lotteryType}
            onClose={handleLotteryClose}
            onRewardClaimed={handleRewardClaimed}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;