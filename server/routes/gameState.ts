import { Router } from "express";
import { getGameState, saveGameState, claimTile, resetGame } from "../db.js";

const router = Router();

// GET /api/game-state/:userId
router.get("/:userId", (req, res) => {
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
router.put("/:userId", (req, res) => {
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
router.post("/:userId/claim-tile", (req, res) => {
  const { tile } = req.body;
  if (typeof tile !== "number") {
    return res.status(400).json({ error: "tile must be a number" });
  }
  const result = claimTile(req.params.userId, tile);
  res.json(result);
});

// POST /api/game-state/:userId/reset
router.post("/:userId/reset", (req, res) => {
  resetGame(req.params.userId);
  res.json({ success: true });
});

export default router;
