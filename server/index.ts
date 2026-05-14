import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import gameStateRoutes from "./routes/gameState.js";
import ticketRoutes from "./routes/ticket.js";
import webhookRoutes from "./routes/webhook.js";
import tableAdminRoutes from "./routes/tableAdmin.js";
import dicePoolRoutes from "./routes/dicePool.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001");

app.use(cors());

// LINE webhook needs the raw body to verify the X-Line-Signature HMAC.
// Mount express.raw() ONLY for that path; everything else still gets json().
app.use("/api/webhook", express.raw({ type: "application/json" }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString("utf-8");
    (req as express.Request & { rawBody?: string }).rawBody = raw;
    try {
      req.body = JSON.parse(raw);
    } catch {
      req.body = {};
    }
  }
  next();
});
app.use(express.json());

app.use("/api/game-state", gameStateRoutes);
app.use("/api/ticket", ticketRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/admin", tableAdminRoutes);
app.use("/api/dice", dicePoolRoutes);
app.use("/api/dice-pool", dicePoolRoutes); // alias to match spec naming

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
