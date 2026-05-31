export function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export function fromDateInputValue(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return date.toISOString();
}
