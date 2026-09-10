import { supabase } from "@/lib/supabase";

const BUCKET = "presentation-materials";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

/**
 * presentation-materials バケットにプレゼン資料(PDF/PPT等)をアップロードし、公開URLを返す。
 */
export async function uploadPresentationMaterial(
  file: File,
  presentationId: string
): Promise<string> {
  const client = requireSupabase();
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${presentationId}/material-${Date.now()}.${ext}`;

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
