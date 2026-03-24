import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import qrScanIllustration from "@/assets/qr-scan-illustration.png";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import GameHeader from "@/components/game/GameHeader";
import DiceRoller from "@/components/game/DiceRoller";
import StampCard, { REWARD_LINKS, FIXED_REWARD_TILES } from "@/components/game/StampCard";
import StatusMessage from "@/components/game/StatusMessage";
import QRScanner from "@/components/game/QRScanner";
import LotteryCard, { isLotteryTile, LotteryResult } from "@/components/game/LotteryCard";
import CardPicker from "@/components/game/CardPicker";
import CharacterSelect, { GameCharacterInfo } from "@/components/game/CharacterSelect";
import iconScan from "@/assets/icon-scan.png";
import uiBg from "@/assets/ui-background.png";
import rewardIconAppetizer from "@/assets/reward-icon-appetizer.png";

const MOCK_USER = {
  userId: "demo_user_123",
  displayName: "洲際玩家",
};

const EXPECTED_QR_CODE = "INTERCONTINENTAL_2026";
const LOTTERY_POSITIONS = [1, 3, 4, 5, 7, 9, 10, 12, 13, 14];

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();
  const [totalPoints, setTotalPoints] = useState(0);
  const [statusMessage, setStatusMessage] = useState("正在連線至會員系統...");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "loading">("loading");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQRVerified, setIsQRVerified] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showLottery, setShowLottery] = useState(false);
  const [lotteryType, setLotteryType] = useState<"chance" | "fate">("chance");
  const [pendingPoints, setPendingPoints] = useState(0);
  const [earnedRewards, setEarnedRewards] = useState<LotteryResult[]>([]);
  const [fixedRewardPopup, setFixedRewardPopup] = useState<{ tile: number; name: string; link: string } | null>(null);
  const [showRulesDialog, setShowRulesDialog] = useState(false);

  // Character selection
  const [selectedCharacter, setSelectedCharacter] = useState<GameCharacterInfo | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setUserName(MOCK_USER.displayName);
        setStatusMessage(
          "參加方式：</br>\n單筆消費滿 NT$2,000 即可參加，每滿 NT$2,000 獲得一次擲骰機會。</br>掃描店家 QR Code 後即可擲骰，前進 1-3 格。\n\n獎項說明：</br>\n擲出的步數將對應地圖上的獎項，包括主廚招牌餐點、餐飲抵用金、餐點買一送一等隱藏驚喜。 遭遇「機會／命運」格時，您可選擇二選一，讓直覺或運氣為您的旅程增添驚喜。\n\n終點獎勵：</br>\n抵達地圖終點並完成旅程，即可兌換高雄洲際招牌主餐。祝您享受美味旅程！\n\n",
        );
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

  // Auto-verify if coming from external QR code system
  useEffect(() => {
    const ticket = searchParams.get("ticket");
    if (ticket && !isLoading && !isQRVerified && selectedCharacter) {
      setIsQRVerified(true);
      setStatusMessage("✅ QR Code 驗證成功！請擲骰一次");
      setStatusType("success");
      // Remove ticket param from URL
      searchParams.delete("ticket");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, isLoading, isQRVerified, selectedCharacter, setSearchParams]);

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
      await new Promise((resolve) => setTimeout(resolve, 800));
      const newTotal = Math.min(totalPoints + points, 15);

      if (LOTTERY_POSITIONS.includes(newTotal) && newTotal > totalPoints) {
        setPendingPoints(newTotal);
        setShowCardPicker(true);
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

  const FIXED_REWARD_NAMES: Record<number, string> = {
    2: "Delicatesse 烘焙坊「指定點心」免費兌換券",
    6: "NT$500 餐飲優惠券",
    8: "NT$800 餐飲優惠券",
    11: "指定主餐「買一送一」優惠券",
    15: "「招牌主餐」免費兌換券",
  };

  const finalizeDiceRoll = (newTotal: number, steps: number) => {
    setTotalPoints(newTotal);
    localStorage.setItem(`points_${MOCK_USER.userId}`, newTotal.toString());
    setIsQRVerified(false);

    // Check if landed on a fixed reward tile
    if (FIXED_REWARD_TILES.includes(newTotal) && REWARD_LINKS[newTotal]) {
      setFixedRewardPopup({
        tile: newTotal,
        name: FIXED_REWARD_NAMES[newTotal] || `第 ${newTotal} 格獎勵`,
        link: REWARD_LINKS[newTotal],
      });
    }

    setStatusMessage(
      newTotal >= 15 ? "🏆 恭喜抵達終點！獲得招牌餐點兌換券" : `🎲 前進 ${steps} 步！請再次掃描 QR Code 進行下一次遊戲`,
    );
    setStatusType("success");
    setIsProcessing(false);
  };

  const handleCardPick = (type: "chance" | "fate") => {
    setShowCardPicker(false);
    setLotteryType(type);
    setShowLottery(true);
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
    <div
      className="game-container"
      style={{
        backgroundImage: 'url("/lovable-uploads/df075914-91c7-4040-843a-613d26f13054.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <GameHeader userName={userName} isLoading={isLoading} />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-lg px-3 -mt-4 space-y-6"
      >
        {/* ＯＯＯＯＯＯＯＯＯ掃描qrcode StartＯＯＯＯＯＯＯＯＯ*/}

        <div className="stamp-card rounded mx-0 mb-0 mt-[30px] py-0 my-[35px] overflow-visible">
          <div className="relative gap-2 mb-1 flex-col flex items-center justify-center my-[5px]">
            {selectedCharacter && (
              <img
                src={selectedCharacter.image}
                alt=""
                className="w-[96px] h-[96px] object-contain drop-shadow-md -mt-[12px] my-0"
              />
            )}
            <h2 className="text-lg font-black text-foreground tracking-wide">{"\n"}</h2>
          </div>
          <p className="text-xs text-muted-foreground text-center mb-4">
            {userName ? `歡迎，${userName}` : "集點遊戲"}
          </p>
          <div className="gold-divider mb-5 rounded-none bg-primary-foreground text-destructive" />

          {!isQRVerified ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-5">
              <div className="scan-prompt">
                <div className="w-[200px] h-[200px] mx-auto mb-2 -mt-8">
                  <img src={qrScanIllustration} alt="掃描 QR Code" className="block w-full h-full object-contain" />
                </div>
                <p className="text-foreground font-bold mb-1.5">請掃描店家 QR Code</p>
                <p className="text-xs text-muted-foreground">每次掃描可擲骰一次，完成集點</p>
              </div>
              <button
                onClick={() => setShowScanner(true)}
                disabled={isLoading}
                style={{ backgroundColor: "#DAD9D6", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
                className="w-full py-2 px-4 rounded-2xl font-bold text-lg transition-all duration-300 relative overflow-hidden text-foreground"
              >
                <span className="flex items-center justify-center gap-2">📷 開始掃描 QR Code</span>
              </button>
            </motion.div>
          ) : (
            <DiceRoller onRoll={handleDiceRoll} disabled={isLoading || isProcessing} />
          )}

          <div className="mt-5">
            <StatusMessage message={statusMessage} type={statusType} />
          </div>
        </div>
        {/* 掃描ＯＯＯＯＯＯＯＯＯ qrcode EndＯＯＯＯＯＯＯＯＯ*/}

        <StampCard
          totalPoints={totalPoints}
          maxPoints={15}
          character={selectedCharacter ?? undefined}
          isMoving={isProcessing}
        />

        {/* Earned rewards */}
        {earnedRewards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stamp-card">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              🎁 <span>已獲得獎項</span>
              <span className="ml-auto text-xs font-normal text-muted-foreground">{earnedRewards.length} 項</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-3">（請從個人 LINE 帳號查看）</p>
            <div className="space-y-2.5">
              {earnedRewards.map((reward, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-border/60 cursor-pointer hover:bg-accent/30 transition-colors"
                  style={{ background: "hsl(0 0% 100% / 0.5)" }}
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = "https://line.me/R/nv/coupon";
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.click();
                  }}
                >
                  <span className="text-2xl">{reward.reward.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{reward.reward.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {reward.type === "chance" ? "機會卡" : "命運卡"}
                    </p>
                  </div>
                  <span className="text-xs text-primary font-medium shrink-0">查看 →</span>
                </motion.div>
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
          <p>高雄洲際酒店 InterContinental Kaohsiung</p>
        </motion.div>
      </motion.main>

      <AnimatePresence>
        {showScanner && (
          <QRScanner
            expectedCode={EXPECTED_QR_CODE}
            onSuccess={handleQRSuccess}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{showCardPicker && <CardPicker onPick={handleCardPick} />}</AnimatePresence>

      <AnimatePresence>
        {showLottery && (
          <LotteryCard type={lotteryType} onClose={handleLotteryClose} onRewardClaimed={handleRewardClaimed} />
        )}
      </AnimatePresence>

      {/* Fixed reward popup */}
      <AnimatePresence>
        {fixedRewardPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse at center, hsl(0 0% 0% / 0.5), hsl(0 0% 0% / 0.75))" }}
            />

            <motion.div
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="relative z-10 w-full max-w-xs rounded-3xl p-6 text-center border-2"
              style={{
                background: "linear-gradient(160deg, hsl(40 30% 95%), hsl(40 20% 88%))",
                borderColor: "hsl(43 85% 55%)",
                boxShadow: "0 20px 60px -10px hsl(0 0% 0% / 0.4)",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", damping: 10 }}
                className="text-6xl mb-3 flex justify-center"
              >
                <img src={rewardIconAppetizer} alt="獎勵" className="w-24 h-24 object-contain" />
              </motion.div>
              <h3 className="text-lg font-black text-foreground mb-1">恭喜獲得獎勵！</h3>
              <p className="text-base font-bold mb-1" style={{ color: "hsl(30 40% 30%)" }}>
                {fixedRewardPopup.name}
              </p>
              <p className="text-xs text-muted-foreground mb-5">第 {fixedRewardPopup.tile} 格固定獎勵</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const a = document.createElement("a");
                  a.href = fixedRewardPopup.link;
                  a.target = "_blank";
                  a.rel = "noopener noreferrer";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setFixedRewardPopup(null);
                }}
                className="w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer mb-3"
                style={{
                  background: "linear-gradient(135deg, hsl(43 85% 55%), hsl(40 70% 45%))",
                  color: "hsl(0 0% 100%)",
                  boxShadow: "0 4px 12px hsl(43 85% 55% / 0.4)",
                }}
              >
                🎁 領取獎勵
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 暫時用的 debug 按鈕 - 跳過 QR 掃描 */}
      {!isQRVerified && selectedCharacter && !isLoading && (
        <button
          onClick={handleQRSuccess}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "red",
            color: "white",
            border: "none",
            fontSize: 12,
            fontWeight: "bold",
            zIndex: 9999,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          GO
        </button>
      )}
    </div>
  );
};

export default Index;
