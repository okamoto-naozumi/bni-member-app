/**
 * SupabaseのPostgrestError等、Errorのインスタンスではないエラーオブジェクトを渡すと
 * String(err) が "[object Object]" になってしまうため、人が読める文字列に整形する。
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;

  if (err && typeof err === "object") {
    const e = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    if (typeof e.message === "string" && e.message) {
      const extras = [
        typeof e.hint === "string" && e.hint ? `ヒント: ${e.hint}` : null,
        typeof e.code === "string" && e.code ? `コード: ${e.code}` : null,
      ].filter(Boolean);
      return extras.length > 0 ? `${e.message}(${extras.join(" / ")})` : e.message;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }

  return String(err);
}
