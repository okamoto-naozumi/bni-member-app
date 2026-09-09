import QRCode from "qrcode";

/**
 * メンバーのデジタル名刺(まとめページ)への絶対URLを返す。
 */
export function memberProfileUrl(memberId: string): string {
  if (typeof window === "undefined") return `/m/${memberId}`;
  return `${window.location.origin}/m/${memberId}`;
}

/**
 * 指定テキストのQRコードをPNGのdata URLとして生成する。
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 256,
    color: { dark: "#18181B", light: "#FFFFFF" },
  });
}
