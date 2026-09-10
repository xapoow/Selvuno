import type { Transaction, TransactionType } from "@myfinances/types";

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLocaleLowerCase()
        .match(/[\p{L}\p{N}]+/gu)
        ?.filter((token) => token.length >= 2) ?? []
    )
  );
}

export function suggestCategoryId(
  text: string,
  type: TransactionType,
  transactions: Transaction[]
): string | null {
  const inputTokens = tokenize(text);
  if (!inputTokens.length) {
    return null;
  }
  const normalizedText = text.trim().toLocaleLowerCase();
  const scores = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.deletedAt || transaction.type !== type) {
      continue;
    }
    const note = transaction.note?.trim().toLocaleLowerCase() ?? "";
    const historicalTokens = tokenize(`${note} ${(transaction.tags ?? []).join(" ")}`);
    const overlap = inputTokens.filter((token) => historicalTokens.includes(token)).length;
    const exactBonus = note && note === normalizedText ? 8 : 0;
    const containsBonus = note && (note.includes(normalizedText) || normalizedText.includes(note)) ? 3 : 0;
    const score = exactBonus + containsBonus + overlap * 2;
    if (score > 0) {
      scores.set(transaction.categoryId, (scores.get(transaction.categoryId) ?? 0) + score);
    }
  }

  return (
    Array.from(scores.entries()).sort(
      ([leftId, leftScore], [rightId, rightScore]) =>
        rightScore - leftScore || leftId.localeCompare(rightId)
    )[0]?.[0] ?? null
  );
}
