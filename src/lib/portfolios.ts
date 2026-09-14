import { supabase } from "@/lib/supabase";
import { uploadPortfolioImage } from "@/lib/portfolioImages";
import { fileToDataUrl } from "@/lib/fileToDataUrl";
import { upsertManyWithColumnFallback, type RestoreResult } from "@/lib/backupHelpers";

export const PORTFOLIO_CATEGORY_SUGGESTIONS = ["取扱商品", "施工事例", "サービス実績", "その他"] as const;

export interface Portfolio {
  id: string;
  /** 投稿者(掲載対象)のメンバーID */
  member_id: string | null;
  title: string;
  description: string;
  /** 例: 取扱商品/施工事例/サービス実績 */
  category: string;
  image_url: string;
  created_at: string;
}

export interface PortfolioInput {
  member_id: string | null;
  title: string;
  description: string;
  category: string;
}

export interface PortfolioImageFile {
  file?: File | null;
  removeImage?: boolean;
}

const DUMMY_STORAGE_KEY = "bni-dummy-portfolios-v1";

function loadDummyPortfolios(): Portfolio[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Portfolio[];
  } catch {
    return [];
  }
}

function saveDummyPortfolios(items: Portfolio[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(items));
}

function normalize(p: Portfolio): Portfolio {
  return {
    ...p,
    member_id: p.member_id ?? null,
    description: p.description ?? "",
    category: p.category ?? "",
    image_url: p.image_url ?? "",
  };
}

/**
 * Supabaseでの実行を試み、未設定または通信エラー(portfoliosテーブル未作成等含む)の場合は
 * localStorageへ自動フォールバックする。library_links等と同様、ギャラリーが常に使える状態を優先する。
 */
async function withLocalFallback<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  if (!supabase) return fallback();
  try {
    return await run();
  } catch (err) {
    console.warn("[portfolios] Supabaseへのアクセスに失敗したためローカルデータを使用します:", err);
    return fallback();
  }
}

export async function fetchPortfolios(): Promise<Portfolio[]> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("portfolios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as Portfolio[]).map(normalize);
    },
    () => loadDummyPortfolios().sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

async function resolveImage(
  file: File | null | undefined,
  removeImage: boolean | undefined,
  fallbackUrl: string,
  portfolioId: string
): Promise<string> {
  if (file) {
    return supabase ? uploadPortfolioImage(file, portfolioId) : fileToDataUrl(file);
  }
  if (removeImage) return "";
  return fallbackUrl;
}

export async function createPortfolio(
  input: PortfolioInput,
  image: PortfolioImageFile = {}
): Promise<Portfolio> {
  const id = crypto.randomUUID();
  const image_url = await resolveImage(image.file, image.removeImage, "", id);

  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("portfolios")
        .insert({ id, ...input, image_url })
        .select()
        .single();
      if (error) throw error;
      return normalize(data as Portfolio);
    },
    () => {
      const portfolio: Portfolio = {
        id,
        ...input,
        image_url,
        created_at: new Date().toISOString(),
      };
      const items = loadDummyPortfolios();
      items.unshift(portfolio);
      saveDummyPortfolios(items);
      return portfolio;
    }
  );
}

export async function updatePortfolio(
  id: string,
  input: PortfolioInput,
  image: PortfolioImageFile,
  existingImageUrl: string
): Promise<Portfolio> {
  const image_url = await resolveImage(image.file, image.removeImage, existingImageUrl, id);

  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("portfolios")
        .update({ ...input, image_url })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return normalize(data as Portfolio);
    },
    () => {
      const items = loadDummyPortfolios();
      const index = items.findIndex((p) => p.id === id);
      if (index === -1) throw new Error("ポートフォリオが見つかりません");
      items[index] = { ...items[index], ...input, image_url };
      saveDummyPortfolios(items);
      return items[index];
    }
  );
}

export async function deletePortfolio(id: string): Promise<void> {
  return withLocalFallback(
    async () => {
      const { error } = await supabase!.from("portfolios").delete().eq("id", id);
      if (error) throw error;
    },
    () => {
      saveDummyPortfolios(loadDummyPortfolios().filter((p) => p.id !== id));
    }
  );
}

/**
 * 全データバックアップからの復元用: idを保持したままレコード配列を丸ごと反映する。
 */
export async function restorePortfolios(records: Portfolio[]): Promise<RestoreResult> {
  if (!supabase) {
    const current = loadDummyPortfolios();
    const byId = new Map(current.map((p) => [p.id, p]));
    for (const record of records) byId.set(record.id, record);
    saveDummyPortfolios(Array.from(byId.values()));
    return { succeeded: records.length, failed: 0 };
  }

  return upsertManyWithColumnFallback(supabase, "portfolios", records);
}
