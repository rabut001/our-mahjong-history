export function formatPoints(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

export function formatHeldOn(heldOn: string): string {
  const [year, month, day] = heldOn.split("-");
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}
