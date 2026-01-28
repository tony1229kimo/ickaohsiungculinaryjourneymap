import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GameHeader from "@/components/game/GameHeader";
import DiceRoller from "@/components/game/DiceRoller";
import StampCard from "@/components/game/StampCard";
import StatusMessage from "@/components/game/StatusMessage";

// Mock user for demo (in production, this would come from LINE LIFF)
const MOCK_USER = {
  userId: "demo_user_123",
  displayName: "測試會員",
};

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();
  const [totalPoints, setTotalPoints] = useState(0);
  const [statusMessage, setStatusMessage] = useState("正在連線至 LINE 帳號...");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "loading">("loading");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Simulate LIFF initialization
    const initLiff = async () => {
      try {
        // In production, you would initialize LIFF here:
        // await liff.init({ liffId: "YOUR_LIFF_ID" });
        // const profile = await liff.getProfile();
        
        // Simulating async load
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock successful login
        setUserName(MOCK_USER.displayName);
        setStatusMessage("已成功綁定 LINE 帳號");
        setStatusType("success");
        
        // Load existing points (mock)
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

  const handleDiceRoll = async (points: number, times: number) => {
    setIsProcessing(true);
    setStatusMessage("正在更新電子集點卡...");
    setStatusType("loading");

    try {
      // Simulate API call to Google Apps Script
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTotal = totalPoints + points;
      setTotalPoints(newTotal);
      
      // Save to localStorage (in production, this would be synced to backend)
      localStorage.setItem(`points_${MOCK_USER.userId}`, newTotal.toString());
      
      setStatusMessage(`目前累積總點數：${newTotal}`);
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
          
          <DiceRoller
            onRoll={handleDiceRoll}
            disabled={isLoading || isProcessing}
          />
          
          <div className="mt-4">
            <StatusMessage message={statusMessage} type={statusType} />
          </div>
        </div>

        <StampCard totalPoints={totalPoints} maxPoints={15} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground pb-4"
        >
          <p>💡 提示：此為展示版本</p>
          <p>實際使用需綁定 LINE LIFF 與後端服務</p>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default Index;
