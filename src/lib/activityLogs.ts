import { supabase } from "@/lib/supabase";

/** 活動タイムラインの種別。カード表示時のアイコン・色分けに使う */
export type ActivityActionType =
  | "member_created"
  | "member_updated"
  | "referral_created"
  | "one_on_one_completed"
  | "visitor_created";

export interface ActivityLog {
  id: string;
  action_type: ActivityActionType;
  /** 画面表示用の日本語の一文(例: "山田太郎さんのメンバー情報を更新しました") */
  description: string;
  /** 関連するメンバーID(あれば)。メンバー削除時もログ自体は残すため on delete set null 相当で扱う */
  member_id: string | null;
  created_at: string;
}

export interface ActivityLogInput {
  action_type: ActivityActionType;
  description: string;
  member_id?: string | null;
}

const DUMMY_STORAGE_KEY = "bni-dummy-activity-logs-v1";
/** 肥大化を防ぐため、ローカルフォールバック時に保持する件数の上限 */
const MAX_DUMMY_LOGS = 200;

function loadDummyLogs(): ActivityLog[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ActivityLog[];
  } catch {
    return [];
  }
}

function saveDummyLogs(logs: ActivityLog[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_DUMMY_LOGS)));
}

function normalize(l: ActivityLog): ActivityLog {
  return {
    ...l,
    description: l.description ?? "",
    member_id: l.member_id ?? null,
  };
}

/**
 * Supabaseでの実行を試み、未設定または通信エラー(activity_logsテーブル未作成含む)の場合は
 * localStorageへ自動フォールバックする(library_links等と同様の意図的な例外仕様)。
 */
async function withLocalFallback<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  if (!supabase) return fallback();
  try {
    return await run();
  } catch (err) {
    console.warn("[activityLogs] Supabaseへのアクセスに失敗したためローカルデータを使用します:", err);
    return fallback();
  }
}

export async function fetchActivityLogs(limit = 100): Promise<ActivityLog[]> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as ActivityLog[]).map(normalize);
    },
    () =>
      loadDummyLogs()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit)
  );
}

/**
 * 活動ログを1件記録する。メンバー情報更新・リファーラル追加・1to1実施・ビジター追加などの
 * 操作の直後に呼び出す想定。ログ記録自体の失敗が本来の操作を妨げないよう、
 * 呼び出し側でtry/catchしなくても内部で例外を握りつぶして解決する(fire-and-forget用途)。
 */
export async function logActivity(input: ActivityLogInput): Promise<void> {
  try {
    await withLocalFallback(
      async () => {
        const { error } = await supabase!.from("activity_logs").insert({
          action_type: input.action_type,
          description: input.description,
          member_id: input.member_id ?? null,
        });
        if (error) throw error;
      },
      () => {
        const log: ActivityLog = {
          id: crypto.randomUUID(),
          action_type: input.action_type,
          description: input.description,
          member_id: input.member_id ?? null,
          created_at: new Date().toISOString(),
        };
        const logs = loadDummyLogs();
        logs.unshift(log);
        saveDummyLogs(logs);
      }
    );
  } catch (err) {
    console.warn("[activityLogs] 活動ログの記録に失敗しました(操作自体には影響しません):", err);
  }
}
