import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameHeader from "@/components/game/GameHeader";
import DiceRoller from "@/components/game/DiceRoller";
import StampCard from "@/components/game/StampCard";
import StatusMessage from "@/components/game/StatusMessage";
import QRScanner from "@/components/game/QRScanner";

// Mock user for demo (in production, this would come from LINE LIFF)
const MOCK_USER = {
  userId: "demo_user_123",
  displayName: "測試會員",
};

// 💡 店家設定的 QR Code 內容（實際使用時請更換）
const EXPECTED_QR_CODE = "STORE_LOYALTY_2024";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();
  const [totalPoints, setTotalPoints] = useState(0);
  const [statusMessage, setStatusMessage] = useState("正在連線至 LINE 帳號...");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "loading">("loading");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // QR Code verification state
  const [isQRVerified, setIsQRVerified] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

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
        
        setIsLoading(false);
      } catch (error) {
        console.error("LIFF initialization failed", error);
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
    setStatusMessage("正在更新電子集點卡...");
    setStatusType("loading");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTotal = totalPoints + points;
      setTotalPoints(newTotal);
      
      localStorage.setItem(`points_${MOCK_USER.userId}`, newTotal.toString());
      
      // 擲骰後需要重新掃描 QR Code
      setIsQRVerified(false);
      setStatusMessage(`獲得 ${points} 點！下次需重新掃描 QR Code`);
      setStatusType("success");
    } catch (error) {
      console.error("Sync failed", error);
      setStatusMessage("同步失敗，請檢查網路連線");
      setStatusType("error");
    } finally {
      setIsProcessing(false);
    }
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
          <h2 className="text-lg font-bold text-foreground mb-4 text-center">
            擲骰遊戲
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
                  消費後請向店員索取 QR Code 進行驗證
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground pb-4 space-y-1"
        >
          <p>💡 展示版 QR Code 內容：<code className="bg-muted px-2 py-0.5 rounded">{EXPECTED_QR_CODE}</code></p>
          <p>實際使用需綁定 LINE LIFF 與後端服務</p>
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
    </div>
  );
};

export default Index;
