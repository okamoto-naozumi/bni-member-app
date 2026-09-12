/**
 * @react-pdf/renderer の <Image> にSupabase Storage等の外部URL(http/https)をそのまま渡すと、
 * ブラウザのCORS制限や読み込み失敗時にキャンバス上で黒塗りの矩形として描画されてしまう
 * (react-pdfの内部Canvas実装が、デコードできなかった画像を黒背景としてfillするため)。
 * これを避けるため、PDF生成前に画像を fetch してBase64のdata URIへ変換しておき、
 * <Image> には常に読み込み済みのdata URIだけを渡す(未解決の外部URLを渡さない)。
 */

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("画像の読み込みに失敗しました"));
    reader.readAsDataURL(blob);
  });
}

/**
 * 画像URL(またはdata URL)をPNG/JPEGのBase64 data URIへ変換する。
 * 取得できない・未対応形式の場合は null を返す(呼び出し側は null を「フォールバック描画」の合図として扱う)。
 */
export async function resolveImageDataUri(url: string | undefined | null): Promise<string | null> {
  if (!url) return null;

  // すでにdata URLの場合(Supabase未設定時のlocalStorageフォールバック)はfetch不要
  if (url.startsWith("data:")) {
    return /^data:image\/(png|jpe?g);base64,/i.test(url) ? url : null;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const blob = await res.blob();
    if (!/^image\/(png|jpe?g)$/i.test(blob.type)) return null;

    return await blobToDataUri(blob);
  } catch {
    return null;
  }
}

/**
 * 複数の画像URLをまとめてdata URIへ変換する。PDFドキュメントを描画する前に呼び出し、
 * 結果のマップ(元URL → data URI)をDocumentコンポーネントへpropsで渡す。
 * 変換に失敗したURLはマップに含まれない(呼び出し側でフォールバック描画に切り替える)。
 */
export async function buildImageDataUriMap(
  urls: Array<string | null | undefined>
): Promise<Record<string, string>> {
  const uniqueUrls = Array.from(new Set(urls.filter((u): u is string => Boolean(u))));
  const entries = await Promise.all(
    uniqueUrls.map(async (url) => [url, await resolveImageDataUri(url)] as const)
  );

  const map: Record<string, string> = {};
  for (const [url, dataUri] of entries) {
    if (dataUri) map[url] = dataUri;
  }
  return map;
}
