import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

interface GameQRCodeProps {
  code?: string;
  size?: number;
  showDownload?: boolean;
}

const GameQRCode = ({
  code = "INTERCONTINENTAL_2024",
  size = 200,
  showDownload = true
}: GameQRCodeProps) => {
  const handleDownload = () => {
    const svg = document.getElementById("game-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = size * 2;
      canvas.height = size * 2;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "intercontinental-game-qrcode.png";
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4">

      <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-accent">
        <QRCodeSVG
          id="game-qr-code"
          value={code}
          size={size}
          level="H"
          includeMargin={true}
          bgColor="#FFFFFF"
          fgColor="#3D3935" />

      </div>
      
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          高雄洲際酒店 大富翁遊戲
        </p>
        <p className="text-xs text-muted-foreground">
          掃描此 QR Code 開始遊戲
        </p>
        <code className="text-xs bg-muted px-2 py-1 rounded block mt-2">
          {code}
        </code>
      </div>

      {showDownload






      }
    </motion.div>);

};

export default GameQRCode;