import Script from "next/script";
import { themeBootScript } from "@/lib/theme";

/**
 * ページ描画前(hydration前)にdata-theme属性を確定させるためのインラインスクリプト。
 * strategy="beforeInteractive" でNext.jsのコード実行より先に読み込ませる。
 */
export default function ThemeScript() {
  return (
    <Script id="theme-boot" strategy="beforeInteractive">
      {themeBootScript()}
    </Script>
  );
}
