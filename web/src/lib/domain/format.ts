export function formatPoints(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

export function formatHeldOn(heldOn: string): string {
  const [year, month, day] = heldOn.split("-");
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

export function describePlayerCounts(playerCounts: Iterable<number>): string {
  const set = new Set(playerCounts);
  const labels: string[] = [];
  if (set.has(4)) {
    labels.push("四麻");
  }
  if (set.has(3)) {
    labels.push("三麻");
  }
  return labels.join("・");
}
