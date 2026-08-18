export function splitByKamicha(total: number, count: number): number[] {
  if (count <= 0) {
    return [];
  }
  const units = Math.round(total * 10);
  const quotient = Math.floor(units / count);
  const remainder = units - quotient * count;
  return Array.from({ length: count }, (_, index) =>
    index < remainder ? (quotient + 1) / 10 : quotient / 10,
  );
}
