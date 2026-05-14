/**
 * useDicePool — read the LIFF user's dice pool from the server.
 *
 * The pool is replenished by staff at /api/admin/tables/:id/activate; we just
 * read it here. Caller can call refetch() after a successful roll.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDiceRemaining, rollDice, type RollResult } from "@/api/dice";

export function useDicePool(userId: string | null, enabled: boolean) {
  const queryClient = useQueryClient();
  const queryKey = ["dicePool", userId];

  const query = useQuery({
    queryKey,
    queryFn: fetchDiceRemaining,
    // Only fetch once LIFF is initialized and we know the user.
    enabled: enabled && !!userId,
    // Refetch every 30s in case staff just activated.
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const rollMutation = useMutation({
    mutationFn: rollDice,
    onSuccess: (result) => {
      // If the roll succeeded, update cached remaining without refetching.
      if (result && typeof (result as RollResult).rolled === "number") {
        queryClient.setQueryData(queryKey, {
          user_id: userId,
          dice_remaining: (result as RollResult).dice_remaining,
        });
      } else {
        // On error, refetch authoritative state
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  return {
    diceRemaining: query.data?.dice_remaining ?? 0,
    isLoading: query.isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
    roll: rollMutation.mutateAsync,
    isRolling: rollMutation.isPending,
  };
}
