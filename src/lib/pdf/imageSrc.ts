// @react-pdf/renderer の <Image> はPNG/JPEGのみ対応(SVG等を渡すと描画エンジンが
// 壊れてページ全体の描画が止まる/後続要素が消える)。URLが未設定・取得失敗・非対応形式の
// 場合はこのフォールバック画像(1x1の透過PNG)を返し、PDF生成全体が止まらないようにする。
const FALLBACK_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

/**
 * react-pdf の Image src に渡す関数。存在しない/取得失敗/PNG・JPEG以外の画像は
 * フォールバック画像に差し替える。
 */
export async function resolvePdfImageSrc(url: string | undefined | null): Promise<string> {
  if (!url) return FALLBACK_IMAGE;

  try {
    const res = await fetch(url);
    if (!res.ok) return FALLBACK_IMAGE;

    const contentType = res.headers.get("content-type") ?? "";
    if (!/image\/(png|jpe?g)/i.test(contentType)) return FALLBACK_IMAGE;

    return url;
  } catch {
    return FALLBACK_IMAGE;
  }
}
