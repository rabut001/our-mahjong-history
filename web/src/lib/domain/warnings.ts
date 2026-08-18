export function isScoreTotalMismatched(
  scores: number[],
  startingScore: number,
  playerCount: 3 | 4,
): boolean {
  const total = scores.reduce((sum, score) => sum + score, 0);
  return total !== startingScore * playerCount;
}
