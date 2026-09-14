import type { SupabaseClient } from "@supabase/supabase-js";
import { extractMissingColumn } from "@/lib/postgrestError";

/**
 * バックアップ復元(リストア)用の共通ヘルパー。id をキーに upsert することで、
 * 参照関係(member_id等)を保ったまま元のレコードをそのまま書き戻す。
 * 本番DBが未マイグレーションで一部の列が存在しない場合でも、その列だけを除いて
 * 再試行することで、レコードそのものの復元自体は失敗させない(members.tsの
 * insertMemberSafely/updateMemberSafelyと同じ考え方を、複数レコードの一括処理向けに一般化したもの)。
 * 1件ごとに成功・失敗を判定するため、一部のレコードが不正でも全体の復元は止まらない。
 */
export async function upsertRecordWithColumnFallback(
  client: SupabaseClient,
  table: string,
  record: object
): Promise<boolean> {
  let attempt: Record<string, unknown> = { ...record };
  const maxAttempts = Object.keys(attempt).length + 1;
  for (let i = 0; i < maxAttempts; i++) {
    const { error } = await client.from(table).upsert(attempt, { onConflict: "id" });
    if (!error) return true;

    const missing = extractMissingColumn(error);
    if (missing && missing in attempt) {
      const { [missing]: _drop, ...rest } = attempt;
      attempt = rest;
      continue;
    }
    console.warn(`[backup] ${table} へのレコード復元に失敗しました:`, error);
    return false;
  }
  return false;
}

export interface RestoreResult {
  succeeded: number;
  failed: number;
}

export async function upsertManyWithColumnFallback<T extends object>(
  client: SupabaseClient,
  table: string,
  records: T[]
): Promise<RestoreResult> {
  let succeeded = 0;
  let failed = 0;
  for (const record of records) {
    const ok = await upsertRecordWithColumnFallback(client, table, record);
    if (ok) succeeded++;
    else failed++;
  }
  return { succeeded, failed };
}
