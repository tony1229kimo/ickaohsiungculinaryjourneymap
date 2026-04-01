import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchGameState, saveGameState, claimTileApi, resetGameApi, type GameStateData } from "@/api/gameState";

export function useGameState(userId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["gameState", userId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchGameState(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<GameStateData>) => saveGameState(userId!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const claimTileMutation = useMutation({
    mutationFn: (tile: number) => claimTileApi(userId!, tile),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetGameApi(userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    gameState: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    save: saveMutation.mutateAsync,
    claimTile: claimTileMutation.mutateAsync,
    resetGame: resetMutation.mutateAsync,
  };
}
