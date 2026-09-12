import { supabase } from "@/lib/supabase";

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface CategoryInput {
  name: string;
  sort_order?: number;
}

const DUMMY_STORAGE_KEY = "bni-dummy-event-categories-v1";

function buildSeedCategories(): Category[] {
  const names = ["定例会", "パワーチームミーティング", "研修・セミナー", "イベント", "その他"];
  return names.map((name, i) => ({
    id: `dummy-category-${i + 1}`,
    name,
    sort_order: i,
    created_at: new Date().toISOString(),
  }));
}

function loadDummyCategories(): Category[] {
  if (typeof window === "undefined") return buildSeedCategories();
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedCategories();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as Category[];
  } catch {
    const seeded = buildSeedCategories();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDummyCategories(categories: Category[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(categories));
}

function normalizeCategory(c: Category): Category {
  return {
    ...c,
    sort_order: c.sort_order ?? 0,
  };
}

/**
 * Supabaseでの実行を試み、未設定または通信エラーの場合はlocalStorageへ自動フォールバックする。
 * library_links と同様、カレンダー機能全体が常に使える状態を優先する意図的な例外仕様。
 */
async function withLocalFallback<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  if (!supabase) return fallback();
  try {
    return await run();
  } catch (err) {
    console.warn("[eventCategories] Supabaseへのアクセスに失敗したためローカルデータを使用します:", err);
    return fallback();
  }
}

export async function fetchCategories(): Promise<Category[]> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as Category[]).map(normalizeCategory);
    },
    () => loadDummyCategories().sort((a, b) => a.sort_order - b.sort_order)
  );
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("categories")
        .insert({ name: input.name, sort_order: input.sort_order ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return normalizeCategory(data as Category);
    },
    () => {
      const category: Category = {
        id: crypto.randomUUID(),
        name: input.name,
        sort_order: input.sort_order ?? 0,
        created_at: new Date().toISOString(),
      };
      const categories = loadDummyCategories();
      categories.push(category);
      saveDummyCategories(categories);
      return category;
    }
  );
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("categories")
        .update({ name: input.name, sort_order: input.sort_order ?? 0 })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return normalizeCategory(data as Category);
    },
    () => {
      const categories = loadDummyCategories();
      const index = categories.findIndex((c) => c.id === id);
      if (index === -1) throw new Error("カテゴリが見つかりません");
      categories[index] = { ...categories[index], name: input.name, sort_order: input.sort_order ?? categories[index].sort_order };
      saveDummyCategories(categories);
      return categories[index];
    }
  );
}

export async function deleteCategory(id: string): Promise<void> {
  return withLocalFallback(
    async () => {
      const { error } = await supabase!.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    () => {
      saveDummyCategories(loadDummyCategories().filter((c) => c.id !== id));
    }
  );
}

/**
 * 名前でカテゴリを検索し、存在しなければ新規作成して返す。
 * CSVインポート時の「カテゴリ名の名寄せ補完」に使用する。
 */
export async function ensureCategoryByName(
  name: string,
  existing: Category[]
): Promise<{ category: Category; created: boolean }> {
  const trimmed = name.trim();
  const found = existing.find((c) => c.name === trimmed);
  if (found) return { category: found, created: false };
  const category = await createCategory({ name: trimmed, sort_order: existing.length });
  return { category, created: true };
}
