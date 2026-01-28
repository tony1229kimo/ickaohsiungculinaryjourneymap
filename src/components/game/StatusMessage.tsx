import { motion, AnimatePresence } from "framer-motion";

interface StatusMessageProps {
  message: string;
  type?: "info" | "success" | "error" | "loading";
}

const StatusMessage = ({ message, type = "info" }: StatusMessageProps) => {
  const icons = {
    info: "💬",
    success: "✅",
    error: "❌",
    loading: "☁️",
  };

  const colors = {
    info: "text-muted-foreground",
    success: "text-primary",
    error: "text-destructive",
    loading: "text-muted-foreground",
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`flex items-center justify-center gap-2 py-2 text-sm ${colors[type]}`}
      >
        <motion.span
          animate={type === "loading" ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: type === "loading" ? Infinity : 0 }}
        >
          {icons[type]}
        </motion.span>
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default StatusMessage;
