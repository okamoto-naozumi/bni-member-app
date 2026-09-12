import { supabase } from "@/lib/supabase";

export type VisitorInviteStatus = "invited" | "confirmed" | "considering" | "joined";

export const VISITOR_STATUS_LABELS: Record<VisitorInviteStatus, string> = {
  invited: "打診中",
  confirmed: "参加確定",
  considering: "入会検討中",
  joined: "入会済",
};

export const VISITOR_STATUS_OPTIONS: VisitorInviteStatus[] = [
  "invited",
  "confirmed",
  "considering",
  "joined",
];

export interface VisitorInvite {
  id: string;
  visitor_name: string;
  /** 対象カテゴリ(業種) */
  category: string;
  /** 招待担当メンバーのID。未割り当ての場合はnull */
  inviter_member_id: string | null;
  status: VisitorInviteStatus;
  /** 進捗メモ */
  notes: string;
  created_at: string;
}

export interface VisitorInviteInput {
  visitor_name: string;
  category: string;
  inviter_member_id: string | null;
  status: VisitorInviteStatus;
  notes: string;
}

const DUMMY_STORAGE_KEY = "bni-dummy-visitor-invites-v1";

function buildSeedInvites(): VisitorInvite[] {
  return [
    {
      id: "dummy-visitor-1",
      visitor_name: "山本 一郎",
      category: "弁護士",
      inviter_member_id: "dummy-1",
      status: "invited",
      notes: "来週の定例会に見学参加予定。",
      created_at: new Date().toISOString(),
    },
    {
      id: "dummy-visitor-2",
      visitor_name: "小林 恵",
      category: "Web制作・デザイン",
      inviter_member_id: "dummy-4",
      status: "considering",
      notes: "2回見学済み。入会条件について質問あり。",
      created_at: new Date().toISOString(),
    },
  ];
}

function loadDummyInvites(): VisitorInvite[] {
  if (typeof window === "undefined") return buildSeedInvites();
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedInvites();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as VisitorInvite[];
  } catch {
    const seeded = buildSeedInvites();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDummyInvites(invites: VisitorInvite[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(invites));
}

function normalize(v: VisitorInvite): VisitorInvite {
  return {
    ...v,
    category: v.category ?? "",
    inviter_member_id: v.inviter_member_id ?? null,
    notes: v.notes ?? "",
    status: v.status ?? "invited",
  };
}

/**
 * Supabaseでの実行を試み、未設定または通信エラーの場合はlocalStorageへ自動フォールバックする。
 * ビジター追跡ボードは常に使える状態を優先する意図的な仕様(library_links等と同様)。
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
      "[visitorInvites] Supabaseへのアクセスに失敗したためローカルデータを使用します:",
      err
    );
    return fallback();
  }
}

export async function fetchVisitorInvites(): Promise<VisitorInvite[]> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("visitor_invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as VisitorInvite[]).map(normalize);
    },
    () => loadDummyInvites().sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function createVisitorInvite(input: VisitorInviteInput): Promise<VisitorInvite> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("visitor_invites")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return normalize(data as VisitorInvite);
    },
    () => {
      const invite: VisitorInvite = {
        id: crypto.randomUUID(),
        ...input,
        created_at: new Date().toISOString(),
      };
      const invites = loadDummyInvites();
      invites.unshift(invite);
      saveDummyInvites(invites);
      return invite;
    }
  );
}

export async function updateVisitorInvite(
  id: string,
  input: VisitorInviteInput
): Promise<VisitorInvite> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("visitor_invites")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return normalize(data as VisitorInvite);
    },
    () => {
      const invites = loadDummyInvites();
      const index = invites.findIndex((v) => v.id === id);
      if (index === -1) throw new Error("ビジター招待情報が見つかりません");
      invites[index] = { ...invites[index], ...input };
      saveDummyInvites(invites);
      return invites[index];
    }
  );
}

export async function deleteVisitorInvite(id: string): Promise<void> {
  return withLocalFallback(
    async () => {
      const { error } = await supabase!.from("visitor_invites").delete().eq("id", id);
      if (error) throw error;
    },
    () => {
      saveDummyInvites(loadDummyInvites().filter((v) => v.id !== id));
    }
  );
}
