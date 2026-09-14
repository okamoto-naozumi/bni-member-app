import { supabase } from "@/lib/supabase";

export interface LibraryCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface LibraryCategoryInput {
  name: string;
  sort_order?: number;
}

const DUMMY_STORAGE_KEY = "bni-dummy-library-categories-v1";

function buildSeedCategories(): LibraryCategory[] {
  const names = ["運営", "ビジホス", "フォーマット", "ガイドライン", "その他"];
  return names.map((name, i) => ({
    id: `dummy-library-category-${i + 1}`,
    name,
    sort_order: i,
    created_at: new Date().toISOString(),
  }));
}

function loadDummyCategories(): LibraryCategory[] {
  if (typeof window === "undefined") return buildSeedCategories();
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedCategories();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as LibraryCategory[];
  } catch {
    const seeded = buildSeedCategories();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDummyCategories(categories: LibraryCategory[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(categories));
}

function normalizeCategory(c: LibraryCategory): LibraryCategory {
  return {
    ...c,
    sort_order: c.sort_order ?? 0,
  };
}

/**
 * Supabaseでの実行を試み、未設定または通信エラー(library_categoriesテーブル未作成など)の場合は
 * localStorageへ自動フォールバックする。library_links / eventCategories と同様、
 * 資料ライブラリ全体が常に使える状態を優先する意図的な例外仕様。
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
      "[libraryCategories] Supabaseへのアクセスに失敗したためローカルデータを使用します:",
      err
    );
    return fallback();
  }
}

export async function fetchLibraryCategories(): Promise<LibraryCategory[]> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("library_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as LibraryCategory[]).map(normalizeCategory);
    },
    () => loadDummyCategories().sort((a, b) => a.sort_order - b.sort_order)
  );
}

export async function createLibraryCategory(
  input: LibraryCategoryInput
): Promise<LibraryCategory> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("library_categories")
        .insert({ name: input.name, sort_order: input.sort_order ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return normalizeCategory(data as LibraryCategory);
    },
    () => {
      const category: LibraryCategory = {
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

export async function updateLibraryCategory(
  id: string,
  input: LibraryCategoryInput
): Promise<LibraryCategory> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("library_categories")
        .update({ name: input.name, sort_order: input.sort_order ?? 0 })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return normalizeCategory(data as LibraryCategory);
    },
    () => {
      const categories = loadDummyCategories();
      const index = categories.findIndex((c) => c.id === id);
      if (index === -1) throw new Error("カテゴリが見つかりません");
      categories[index] = {
        ...categories[index],
        name: input.name,
        sort_order: input.sort_order ?? categories[index].sort_order,
      };
      saveDummyCategories(categories);
      return categories[index];
    }
  );
}

export async function deleteLibraryCategory(id: string): Promise<void> {
  return withLocalFallback(
    async () => {
      const { error } = await supabase!.from("library_categories").delete().eq("id", id);
      if (error) throw error;
    },
    () => {
      saveDummyCategories(loadDummyCategories().filter((c) => c.id !== id));
    }
  );
}
