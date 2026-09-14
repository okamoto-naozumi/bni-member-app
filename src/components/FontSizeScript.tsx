import Script from "next/script";
import { fontSizeBootScript } from "@/lib/fontSize";

/**
 * ページ描画前(hydration前)にdata-font-size属性を確定させるためのインラインスクリプト。
 * ThemeScriptと同様 strategy="beforeInteractive" で最速に読み込ませる。
 */
export default function FontSizeScript() {
  return (
    <Script id="font-size-boot" strategy="beforeInteractive">
      {fontSizeBootScript()}
    </Script>
  );
}
