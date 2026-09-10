import { supabase } from "@/lib/supabase";

export interface LibraryLink {
  id: string;
  title: string;
  description: string;
  /** Googleドライブ等の共有URL */
  url: string;
  /** 例: 定例会資料、フォーマット、ガイドライン */
  category: string;
  created_at: string;
}

export interface LibraryLinkInput {
  title: string;
  description: string;
  url: string;
  category: string;
}

export const LIBRARY_CATEGORY_SUGGESTIONS = [
  "定例会資料",
  "フォーマット",
  "ガイドライン",
  "研修・教育",
  "広報・PR素材",
  "その他",
] as const;

const DUMMY_STORAGE_KEY = "bni-dummy-library-links-v1";

function buildSeedLinks(): LibraryLink[] {
  return [
    {
      id: "dummy-library-1",
      title: "定例会 進行シナリオ テンプレート",
      description: "毎週の定例会で使用する進行台本のフォーマットです。司会担当は事前にコピーしてご利用ください。",
      url: "https://drive.google.com/",
      category: "定例会資料",
      created_at: new Date().toISOString(),
    },
    {
      id: "dummy-library-2",
      title: "1to1シート 手書き用フォーマット(PDF)",
      description: "システムのPDF自動生成が使えない場合の手書き用フォーマットです。",
      url: "https://drive.google.com/",
      category: "フォーマット",
      created_at: new Date().toISOString(),
    },
    {
      id: "dummy-library-3",
      title: "ビジター招待ガイドライン",
      description: "ビジターを招待する際の注意点、パワーチームの不足カテゴリーの伝え方をまとめています。",
      url: "https://drive.google.com/",
      category: "ガイドライン",
      created_at: new Date().toISOString(),
    },
  ];
}

function loadDummyLinks(): LibraryLink[] {
  if (typeof window === "undefined") return buildSeedLinks();
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedLinks();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as LibraryLink[];
  } catch {
    const seeded = buildSeedLinks();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDummyLinks(links: LibraryLink[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(links));
}

function normalizeLink(l: LibraryLink): LibraryLink {
  return {
    ...l,
    description: l.description ?? "",
    url: l.url ?? "",
    category: l.category ?? "",
  };
}

/**
 * Supabaseでの実行を試み、未設定またはエラー(library_linksテーブル未作成など)の場合は
 * localStorageのダミーデータへ自動的にフォールバックする。
 * 他のエンティティ(members等)と異なり、ここでは意図的にエラーを画面に伝播させず、
 * 「資料ライブラリはひとまずローカルで使える」ことを優先する。
 */
async function withLocalFallback<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  if (!supabase) return fallback();
  try {
    return await run();
  } catch (err) {
    console.warn("[libraryLinks] Supabaseへのアクセスに失敗したためローカルデータを使用します:", err);
    return fallback();
  }
}

export async function fetchLibraryLinks(): Promise<LibraryLink[]> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("library_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as LibraryLink[]).map(normalizeLink);
    },
    () => loadDummyLinks().sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function createLibraryLink(input: LibraryLinkInput): Promise<LibraryLink> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("library_links")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return normalizeLink(data as LibraryLink);
    },
    () => {
      const link: LibraryLink = {
        id: crypto.randomUUID(),
        ...input,
        created_at: new Date().toISOString(),
      };
      const links = loadDummyLinks();
      links.unshift(link);
      saveDummyLinks(links);
      return link;
    }
  );
}

export async function updateLibraryLink(
  id: string,
  input: LibraryLinkInput
): Promise<LibraryLink> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("library_links")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return normalizeLink(data as LibraryLink);
    },
    () => {
      const links = loadDummyLinks();
      const index = links.findIndex((l) => l.id === id);
      if (index === -1) throw new Error("資料が見つかりません");
      links[index] = { ...links[index], ...input };
      saveDummyLinks(links);
      return links[index];
    }
  );
}

export async function deleteLibraryLink(id: string): Promise<void> {
  return withLocalFallback(
    async () => {
      const { error } = await supabase!.from("library_links").delete().eq("id", id);
      if (error) throw error;
    },
    () => {
      saveDummyLinks(loadDummyLinks().filter((l) => l.id !== id));
    }
  );
}
