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
router.get("/:userId", liffAuth, (req, res) => {
  const state = getGameState(req.params.userId);
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
router.put("/:userId", liffAuth, (req, res) => {
  const { displayName, totalPoints, earnedRewards, selectedCharacter, claimedTiles } = req.body;
  saveGameState({
    userId: req.params.userId,
    displayName: displayName ?? "",
    totalPoints: totalPoints ?? 0,
    earnedRewards: earnedRewards ?? [],
    selectedCharacter: selectedCharacter ?? null,
    claimedTiles: claimedTiles ?? [],
  });
  res.json({ success: true });
});

// POST /api/game-state/:userId/claim-tile
router.post("/:userId/claim-tile", liffAuth, (req, res) => {
  const { tile } = req.body;
  if (typeof tile !== "number") {
    return res.status(400).json({ error: "tile must be a number" });
  }
  const result = claimTile(req.params.userId, tile);
  res.json(result);
});

// POST /api/game-state/:userId/reset — admin-only (requires X-Admin-Token header)
router.post("/:userId/reset", requireAdmin, (req, res) => {
  resetGame(req.params.userId);
  res.json({ success: true });
});

export default router;
