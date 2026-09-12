import { supabase } from "@/lib/supabase";
import { extractMissingColumn } from "@/lib/postgrestError";

export type ReferralRequestStatus = "open" | "in_progress" | "fulfilled";

export const REFERRAL_STATUS_LABELS: Record<ReferralRequestStatus, string> = {
  open: "募集中",
  in_progress: "調整中",
  fulfilled: "充足",
};

export const REFERRAL_STATUS_OPTIONS: ReferralRequestStatus[] = [
  "open",
  "in_progress",
  "fulfilled",
];

export interface ReferralRequest {
  id: string;
  /** 募集カテゴリ(例: 不動産、弁護士) */
  category: string;
  /** 対象パワーチーム */
  power_team: string;
  description: string;
  /** 担当メンバー(紹介窓口)のID。未割り当ての場合はnull */
  contact_member_id: string | null;
  status: ReferralRequestStatus;
  created_at: string;
}

export interface ReferralRequestInput {
  category: string;
  power_team: string;
  description: string;
  contact_member_id: string | null;
  status: ReferralRequestStatus;
}

const DUMMY_STORAGE_KEY = "bni-dummy-referral-requests-v1";

function buildSeedRequests(): ReferralRequest[] {
  return [
    {
      id: "dummy-referral-1",
      category: "不動産",
      power_team: "建築・不動産パワーチーム",
      description:
        "事業用物件の売買・仲介ができるメンバーを探しています。チャプター内に不動産カテゴリが不足しています。",
      contact_member_id: "dummy-1",
      status: "open",
      created_at: new Date().toISOString(),
    },
    {
      id: "dummy-referral-2",
      category: "弁護士",
      power_team: "士業パワーチーム",
      description: "契約書レビューや企業法務に強い弁護士を募集中。ビジター招待の優先ターゲットです。",
      contact_member_id: "dummy-2",
      status: "in_progress",
      created_at: new Date().toISOString(),
    },
    {
      id: "dummy-referral-3",
      category: "Web制作・デザイン",
      power_team: "広告・デザインパワーチーム",
      description: "コーポレートサイト制作ができるメンバーが加入し、充足しました。",
      contact_member_id: "dummy-4",
      status: "fulfilled",
      created_at: new Date().toISOString(),
    },
  ];
}

function loadDummyRequests(): ReferralRequest[] {
  if (typeof window === "undefined") return buildSeedRequests();
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedRequests();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as ReferralRequest[];
  } catch {
    const seeded = buildSeedRequests();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDummyRequests(requests: ReferralRequest[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(requests));
}

/**
 * referral_requests テーブルの「対象パワーチーム」カラム名の候補。
 * 本番DBが `power_team` ではなく `team` で作成されている場合にも
 * エラーにならず動作するよう、両方を試すフォールバックに使う(presentationsの日付カラム対策と同様のパターン)。
 */
const TEAM_COLUMNS = ["power_team", "team"] as const;
type TeamColumn = (typeof TEAM_COLUMNS)[number];

/** 一度成功したカラム名をセッション内でキャッシュし、以降は最初にそれを試す。 */
let cachedTeamColumn: TeamColumn | null = null;

function rowToRequest(row: Record<string, unknown>): ReferralRequest {
  return {
    id: String(row.id),
    category: (row.category as string) ?? "",
    power_team: (row.power_team as string) ?? (row.team as string) ?? "",
    description: (row.description as string) ?? "",
    contact_member_id: (row.contact_member_id as string | null) ?? null,
    status: (row.status as ReferralRequestStatus) ?? "open",
    created_at: (row.created_at as string) ?? "",
  };
}

/**
 * `run` をパワーチームカラム名候補(power_team → team)の順に試し、
 * 「そのカラムが存在しない」エラーが返ってきた場合だけ次の候補にフォールバックする。
 * insert/updateのペイロードに実際のカラム名を指定する必要があるため、select("*")と違い明示的な試行が必要。
 */
async function withTeamColumnFallback<T>(
  run: (column: TeamColumn) => PromiseLike<{ data: T | null; error: unknown }>
): Promise<{ data: T; column: TeamColumn }> {
  const ordered: TeamColumn[] = cachedTeamColumn
    ? [cachedTeamColumn, ...TEAM_COLUMNS.filter((c) => c !== cachedTeamColumn)]
    : [...TEAM_COLUMNS];

  let lastError: unknown = null;
  for (const column of ordered) {
    const { data, error } = await run(column);
    if (!error) {
      cachedTeamColumn = column;
      return { data: data as T, column };
    }
    const missing = extractMissingColumn(error);
    if (missing && (TEAM_COLUMNS as readonly string[]).includes(missing)) {
      lastError = error;
      continue;
    }
    throw error;
  }
  throw (
    lastError ??
    new Error("referral_requests テーブルのパワーチームカラム(power_team / team)が見つかりません。")
  );
}

/**
 * Supabaseでの実行を試み、未設定または通信エラー(テーブル未作成等含む)の場合はlocalStorageへ自動フォールバックする。
 * library_links / events と同様、リファーラル掲示板が常に使える状態を優先する意図的な仕様。
 */
async function withLocalFallback<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  if (!supabase) return fallback();
  try {
    return await run();
  } catch (err) {
    console.warn(
      "[referralRequests] Supabaseへのアクセスに失敗したためローカルデータを使用します:",
      err
    );
    return fallback();
  }
}

export async function fetchReferralRequests(): Promise<ReferralRequest[]> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("referral_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(rowToRequest);
    },
    () => loadDummyRequests().sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function createReferralRequest(
  input: ReferralRequestInput
): Promise<ReferralRequest> {
  return withLocalFallback(
    async () => {
      const client = supabase!;
      const { category, description, contact_member_id, status } = input;
      const { data } = await withTeamColumnFallback<Record<string, unknown>>((col) =>
        client
          .from("referral_requests")
          .insert({ category, description, contact_member_id, status, [col]: input.power_team })
          .select()
          .single()
      );
      return rowToRequest(data);
    },
    () => {
      const request: ReferralRequest = {
        id: crypto.randomUUID(),
        ...input,
        created_at: new Date().toISOString(),
      };
      const requests = loadDummyRequests();
      requests.unshift(request);
      saveDummyRequests(requests);
      return request;
    }
  );
}

export async function updateReferralRequest(
  id: string,
  input: ReferralRequestInput
): Promise<ReferralRequest> {
  return withLocalFallback(
    async () => {
      const client = supabase!;
      const { category, description, contact_member_id, status } = input;
      const { data } = await withTeamColumnFallback<Record<string, unknown>>((col) =>
        client
          .from("referral_requests")
          .update({ category, description, contact_member_id, status, [col]: input.power_team })
          .eq("id", id)
          .select()
          .single()
      );
      return rowToRequest(data);
    },
    () => {
      const requests = loadDummyRequests();
      const index = requests.findIndex((r) => r.id === id);
      if (index === -1) throw new Error("募集情報が見つかりません");
      requests[index] = { ...requests[index], ...input };
      saveDummyRequests(requests);
      return requests[index];
    }
  );
}

export async function deleteReferralRequest(id: string): Promise<void> {
  return withLocalFallback(
    async () => {
      const { error } = await supabase!.from("referral_requests").delete().eq("id", id);
      if (error) throw error;
    },
    () => {
      saveDummyRequests(loadDummyRequests().filter((r) => r.id !== id));
    }
  );
}
