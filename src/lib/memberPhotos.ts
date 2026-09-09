import { supabase } from "@/lib/supabase";

const BUCKET = "member-photos";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

/**
 * member-photos バケットに顔写真をアップロードし、公開URLを返す。
 * variant で パターン1(icon)/パターン2(bust) を区別してパスを分ける。
 */
export async function uploadMemberPhoto(
  file: File,
  memberId: string,
  variant: "icon" | "bust"
): Promise<string> {
  const client = requireSupabase();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${memberId}/${variant}-${Date.now()}.${ext}`;

  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return getMemberPhotoUrl(path);
}

/**
 * 指定したパスの公開URLを取得する。
 */
export function getMemberPhotoUrl(path: string): string {
  const client = requireSupabase();
  const {
    data: { publicUrl },
  } = client.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * member-photos バケットから写真を削除する。
 */
export async function deleteMemberPhoto(path: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.storage.from(BUCKET).remove([path]);

  if (error) {
    throw error;
  }
}
