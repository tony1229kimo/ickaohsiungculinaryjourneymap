import { getLineIdToken } from "@/contexts/LiffContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface GameStateData {
  userId: string;
  displayName: string;
  totalPoints: number;
  earnedRewards: any[];
  selectedCharacter: any | null;
  claimedTiles: number[];
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  // LIFF id_token is attached on every per-user request. The backend's
  // liffAuth middleware (server/middleware/liffAuth.ts) verifies it against
  // LINE's official endpoint and rejects mismatched userIds.
  const token = getLineIdToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export async function fetchGameState(userId: string): Promise<GameStateData> {
  const res = await fetch(`${API_BASE}/api/game-state/${encodeURIComponent(userId)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch game state: ${res.status}`);
  return res.json();
}

export async function saveGameState(userId: string, data: Partial<GameStateData>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/game-state/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to save game state: ${res.status}`);
}

export async function claimTileApi(userId: string, tile: number): Promise<{ success: boolean; alreadyClaimed: boolean }> {
  const res = await fetch(`${API_BASE}/api/game-state/${encodeURIComponent(userId)}/claim-tile`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ tile }),
  });
  if (!res.ok) throw new Error(`Failed to claim tile: ${res.status}`);
  return res.json();
}

