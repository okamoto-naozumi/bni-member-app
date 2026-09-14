import { supabase } from "@/lib/supabase";

const BUCKET = "member-attachments";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

/**
 * member-attachments バケットに資料ファイル(PDF等)をアップロードし、公開URLを返す。
 */
export async function uploadMemberAttachment(file: File, memberId: string): Promise<string> {
  const client = requireSupabase();
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${memberId}/attachment-${Date.now()}.${ext}`;

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

/**
 * member-attachments バケットに1to1シート添付ファイル(PDF/画像)をアップロードし、公開URLを返す。
 * 通常の添付資料とはファイル名プレフィックスを分けて同一バケット内で共存させる。
 */
export async function uploadOneToOneAttachment(file: File, memberId: string): Promise<string> {
  const client = requireSupabase();
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${memberId}/one-to-one-${Date.now()}.${ext}`;

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
