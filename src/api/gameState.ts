const API_BASE = import.meta.env.VITE_API_URL || "";

export interface GameStateData {
  userId: string;
  displayName: string;
  totalPoints: number;
  earnedRewards: any[];
  selectedCharacter: any | null;
  claimedTiles: number[];
}

export async function fetchGameState(userId: string): Promise<GameStateData> {
  const res = await fetch(`${API_BASE}/api/game-state/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`Failed to fetch game state: ${res.status}`);
  return res.json();
}

export async function saveGameState(userId: string, data: Partial<GameStateData>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/game-state/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to save game state: ${res.status}`);
}

export async function claimTileApi(userId: string, tile: number): Promise<{ success: boolean; alreadyClaimed: boolean }> {
  const res = await fetch(`${API_BASE}/api/game-state/${encodeURIComponent(userId)}/claim-tile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tile }),
  });
  if (!res.ok) throw new Error(`Failed to claim tile: ${res.status}`);
  return res.json();
}

