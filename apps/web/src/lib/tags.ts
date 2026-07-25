export function normalizeTags(tags: readonly string[] = []): string[] {
  const seen = new Set<string>();

  return tags
    .map((tag) => tag.trim().replace(/^#+/, "").trim())
    .filter(Boolean)
    .map((tag) => tag.slice(0, 32))
    .filter((tag) => {
      const key = tag.toLocaleLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

export function parseTagsInput(value: string): string[] {
  return normalizeTags(value.split(/[,;\n]/));
}

export function formatTagsInput(tags: readonly string[] | undefined): string {
  return normalizeTags(tags).join(", ");
}
