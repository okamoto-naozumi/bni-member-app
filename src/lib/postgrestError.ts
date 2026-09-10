/**
 * PostgrestErrorのメッセージから「存在しない列」の列名を抽出する。
 * DBにまだ存在しないカラムや、実際のカラム名が想定と異なる場合でも、
 * それを検知して安全にフォールバックするために使う。
 */
export function extractMissingColumn(error: unknown): string | null {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";
  const patterns = [
    /Could not find the '([a-zA-Z0-9_]+)' column/i,
    /column "?([a-zA-Z0-9_]+)"? of relation "?\w+"? does not exist/i,
    /column \w+\.([a-zA-Z0-9_]+) does not exist/i,
    /column "?([a-zA-Z0-9_]+)"? does not exist/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  return null;
}
