export function ranksFromValues(values: number[]): number[] {
  const order = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);
  const ranks = Array.from({ length: values.length }, () => 0);
  for (let position = 0; position < order.length; position += 1) {
    const current = order[position];
    if (!current) {
      continue;
    }
    const previous = order[position - 1];
    if (position > 0 && previous && current.value === previous.value) {
      ranks[current.index] = ranks[previous.index] ?? position;
    } else {
      ranks[current.index] = position + 1;
    }
  }
  return ranks;
}
