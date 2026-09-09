import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * 日本語グリフを含むフォントを登録する。PDF文書を生成する前に一度だけ呼び出すこと。
 * public/fonts に self-host しているため、外部ネットワークに依存しない。
 */
export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: "/fonts/NotoSansJP-Regular.woff", fontWeight: 400 },
      { src: "/fonts/NotoSansJP-Bold.woff", fontWeight: 700 },
    ],
  });

  // react-pdf の自動ハイフネーションは日本語には不要なため無効化する
  Font.registerHyphenationCallback((word) => [word]);
}
