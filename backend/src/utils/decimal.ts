export function toDecimal(value: number | string): number {
  return Number(value);
}

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}
