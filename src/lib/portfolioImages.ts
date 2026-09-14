import { supabase } from "@/lib/supabase";

const BUCKET = "portfolio-images";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

/**
 * portfolio-images バケットに商品・事例写真をアップロードし、公開URLを返す。
 */
export async function uploadPortfolioImage(file: File, portfolioId: string): Promise<string> {
  const client = requireSupabase();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${portfolioId}/image-${Date.now()}.${ext}`;

  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = client.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}
