import { Router, type Request, type Response, type NextFunction } from "express";
import { getGameState, saveGameState, claimTile, resetGame } from "../db.js";
import { requireLiffAuth } from "../middleware/liffAuth.js";

const router = Router();

// All per-user routes go through LIFF id_token verification.
// Admin reset still has its own guard below, so it does not need LIFF auth.
const liffAuth = requireLiffAuth();

// Admin guard — protects state-wiping endpoints. Set ADMIN_TOKEN in Zeabur env.
// If ADMIN_TOKEN is unset, the guarded endpoints are disabled entirely (503),
// so a misconfigured deploy can't silently expose them.
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: "Admin endpoints disabled (ADMIN_TOKEN not configured)" });
  }
  const provided = req.header("x-admin-token");
  if (provided !== expected) {
    return res.status(401).json({ error: "Invalid admin token" });
  }
  next();
}

// GET /api/game-state/:userId
router.get("/:userId", liffAuth, async (req, res) => {
  const state = await getGameState(req.params.userId);
  if (!state) {
    return res.json({
      userId: req.params.userId,
      displayName: "",
      totalPoints: 0,
      earnedRewards: [],
      selectedCharacter: null,
      claimedTiles: [],
    });
  }
  res.json(state);
});

// PUT /api/game-state/:userId
// Tony 2026-06-20 (bugfix): PARTIAL update. 之前這裡用 `field ?? default` 整列覆寫,
// 前端只送部分欄位的存檔(例如擲骰後只送 { totalPoints })會把 selectedCharacter /
// earnedRewards / claimedTiles 一起洗成 null/[]。症狀:選完角色擲一次骰,背景 refetch
// 把角色載回成 null → 又跳回「選擇角色」;點數/獎勵也會被偷偷清。現在先讀現有資料,
// 只覆寫 body 真的有帶的欄位,沒帶的保留原值。
router.put("/:userId", liffAuth, async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const current = await getGameState(req.params.userId);
  const has = (k: string) => body[k] !== undefined;
  await saveGameState({
    userId: req.params.userId,
    displayName: (has("displayName") ? body.displayName : current?.displayName ?? "") as string,
    totalPoints: (has("totalPoints") ? body.totalPoints : current?.totalPoints ?? 0) as number,
    earnedRewards: (has("earnedRewards") ? body.earnedRewards : current?.earnedRewards ?? []) as unknown[],
    selectedCharacter: has("selectedCharacter") ? body.selectedCharacter : current?.selectedCharacter ?? null,
    claimedTiles: (has("claimedTiles") ? body.claimedTiles : current?.claimedTiles ?? []) as number[],
  });
  res.json({ success: true });
});

// POST /api/game-state/:userId/claim-tile
router.post("/:userId/claim-tile", liffAuth, async (req, res) => {
  const { tile } = req.body;
  if (typeof tile !== "number") {
    return res.status(400).json({ error: "tile must be a number" });
  }
  const result = await claimTile(req.params.userId, tile);
  res.json(result);
});

// POST /api/game-state/:userId/reset — admin-only (requires X-Admin-Token header)
router.post("/:userId/reset", requireAdmin, async (req, res) => {
  await resetGame(req.params.userId);
  res.json({ success: true });
});

export default router;
