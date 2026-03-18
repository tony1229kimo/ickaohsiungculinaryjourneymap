import { motion, AnimatePresence } from "framer-motion";

interface StatusMessageProps {
  message: string;
  type?: "info" | "success" | "error" | "loading";
}

const StatusMessage = ({ message, type = "info" }: StatusMessageProps) => {
  const styles = {
    info: { color: "text-muted-foreground", bg: "bg-muted/30" },
    success: { color: "text-primary", bg: "bg-accent/10" },
    error: { color: "text-destructive", bg: "bg-destructive/5" },
    loading: { color: "text-muted-foreground", bg: "bg-muted/20" }
  };

  const icons = {
    info: "💬",
    success: "✅",
    error: "❌",
    loading: "⏳"
  };

  const { color, bg } = styles[type];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }} className="">

        
        <motion.span
          animate={type === "loading" ? { rotate: [0, 360] } : {}}
          transition={{ duration: 1.5, repeat: type === "loading" ? Infinity : 0, ease: "linear" }}
          className="text-base">
          
          {icons[type]}
        </motion.span>
        <span className="font-medium">{message}</span>
      </motion.div>
    </AnimatePresence>);

};

export default StatusMessage;