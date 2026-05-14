/**
 * Dice pool client — for the customer-facing game.
 *
 * The dice value is rolled by the server, not the client. Previously the
 * client picked a number and the server believed it. Now the server picks
 * (Math.random on backend) so a tampered client cannot always roll 3.
 *
 * See server/routes/dicePool.ts and TABLE_FLOW_SPEC.md §6.2.
 */

import { getLineIdToken } from "@/contexts/LiffContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getLineIdToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export interface DicePoolStatus {
  user_id: string;
  dice_remaining: number;
}

export async function fetchDiceRemaining(): Promise<DicePoolStatus> {
  const res = await fetch(`${API_BASE}/api/dice-pool/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`dice-pool fetch failed: ${res.status}`);
  return res.json();
}

export interface RollResult {
  rolled: number;          // 1-3
  dice_remaining: number;  // after this roll
}

export interface RollError {
  error: "no_dice_available" | "no user" | string;
  dice_remaining?: number;
}

export async function rollDice(): Promise<RollResult | RollError> {
  const res = await fetch(`${API_BASE}/api/dice/roll`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return data as RollError;
  return data as RollResult;
}
