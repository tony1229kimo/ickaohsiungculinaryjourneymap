import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import gameStateRoutes from "./routes/gameState.js";
import ticketRoutes from "./routes/ticket.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001");

app.use(cors());
app.use(express.json());

app.use("/api/game-state", gameStateRoutes);
app.use("/api/ticket", ticketRoutes);

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
