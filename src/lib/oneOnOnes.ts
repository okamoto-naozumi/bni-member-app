import { supabase } from "@/lib/supabase";

export interface OneOnOne {
  id: string;
  member_a_id: string;
  member_b_id: string;
  /** 実施日("YYYY-MM-DD") */
  completed_at: string;
  note: string;
  created_at: string;
}

export interface OneOnOneInput {
  member_a_id: string;
  member_b_id: string;
  completed_at: string;
  note: string;
}

const DUMMY_STORAGE_KEY = "bni-dummy-one-on-ones-v1";

/** ペアの順序に依存しない一意キー(member_a_id/member_b_idの順序をソートして揃える) */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function buildSeedOneOnOnes(): OneOnOne[] {
  return [
    {
      id: "dummy-oto-1",
      member_a_id: "dummy-1",
      member_b_id: "dummy-2",
      completed_at: new Date().toISOString().slice(0, 10),
      note: "税務と労務の連携について情報交換。",
      created_at: new Date().toISOString(),
    },
  ];
}

function loadDummyOneOnOnes(): OneOnOne[] {
  if (typeof window === "undefined") return buildSeedOneOnOnes();
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedOneOnOnes();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as OneOnOne[];
  } catch {
    const seeded = buildSeedOneOnOnes();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDummyOneOnOnes(items: OneOnOne[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(items));
}

function normalize(o: OneOnOne): OneOnOne {
  return {
    ...o,
    note: o.note ?? "",
  };
}

/**
 * Supabaseでの実行を試み、未設定または通信エラーの場合はlocalStorageへ自動フォールバックする。
 * 1to1マトリクスは常に使える状態を優先する意図的な仕様(library_links等と同様)。
 */
async function withLocalFallback<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  if (!supabase) return fallback();
  try {
    return await run();
  } catch (err) {
    console.warn("[oneOnOnes] Supabaseへのアクセスに失敗したためローカルデータを使用します:", err);
    return fallback();
  }
}

export async function fetchOneOnOnes(): Promise<OneOnOne[]> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!.from("one_on_ones").select("*");
      if (error) throw error;
      return ((data ?? []) as OneOnOne[]).map(normalize);
    },
    () => loadDummyOneOnOnes()
  );
}

/**
 * 指定した2名の1to1実施記録を作成または更新する(1ペアにつき1レコード)。
 * DB側にユニーク制約は張っていないため、アプリ側で「既存レコードがあれば更新」を保証する。
 */
export async function upsertOneOnOne(input: OneOnOneInput): Promise<OneOnOne> {
  const [member_a_id, member_b_id] = [input.member_a_id, input.member_b_id].sort();
  const payload = { member_a_id, member_b_id, completed_at: input.completed_at, note: input.note };

  return withLocalFallback(
    async () => {
      const client = supabase!;
      const { data: existing, error: findError } = await client
        .from("one_on_ones")
        .select("id")
        .eq("member_a_id", member_a_id)
        .eq("member_b_id", member_b_id)
        .maybeSingle();
      if (findError) throw findError;

      if (existing) {
        const { data, error } = await client
          .from("one_on_ones")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return normalize(data as OneOnOne);
      }

      const { data, error } = await client
        .from("one_on_ones")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return normalize(data as OneOnOne);
    },
    () => {
      const items = loadDummyOneOnOnes();
      const key = pairKey(member_a_id, member_b_id);
      const index = items.findIndex((o) => pairKey(o.member_a_id, o.member_b_id) === key);
      if (index !== -1) {
        items[index] = { ...items[index], ...payload };
        saveDummyOneOnOnes(items);
        return items[index];
      }
      const created: OneOnOne = {
        id: crypto.randomUUID(),
        ...payload,
        created_at: new Date().toISOString(),
      };
      items.push(created);
      saveDummyOneOnOnes(items);
      return created;
    }
  );
}

export async function deleteOneOnOne(id: string): Promise<void> {
  return withLocalFallback(
    async () => {
      const { error } = await supabase!.from("one_on_ones").delete().eq("id", id);
      if (error) throw error;
    },
    () => {
      saveDummyOneOnOnes(loadDummyOneOnOnes().filter((o) => o.id !== id));
    }
  );
}
