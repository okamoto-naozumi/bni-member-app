/**
 * 文字サイズ設定。テーマ設定(theme.ts)と同様、アカウントの概念がないため
 * ブラウザのlocalStorageにのみ保存する(端末・ブラウザ単位の永続化)。
 */
export const FONT_SIZE_STORAGE_KEY = "bni-font-size-preference";

export type FontSizePreference = "standard" | "large" | "xlarge";

export const FONT_SIZE_OPTIONS: Array<{
  value: FontSizePreference;
  label: string;
  scalePercent: number;
}> = [
  { value: "standard", label: "標準", scalePercent: 100 },
  { value: "large", label: "大", scalePercent: 112.5 },
  { value: "xlarge", label: "特大", scalePercent: 125 },
];

export function getStoredFontSizePreference(): FontSizePreference {
  if (typeof window === "undefined") return "standard";
  const raw = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
  if (raw === "standard" || raw === "large" || raw === "xlarge") return raw;
  return "standard";
}

export function applyFontSize(preference: FontSizePreference): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-font-size", preference);
}

export function setStoredFontSizePreference(preference: FontSizePreference): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, preference);
  applyFontSize(preference);
}

/**
 * <head>に埋め込むブート用スクリプト文字列。ページ描画前にdata-font-size属性を確定させ、
 * 文字サイズ切替時のちらつき(FOUC)を防ぐ(theme.tsのthemeBootScriptと同じ考え方)。
 */
export function fontSizeBootScript(): string {
  return `(function(){try{var k=${JSON.stringify(
    FONT_SIZE_STORAGE_KEY
  )};var p=localStorage.getItem(k)||"standard";if(p!=="standard"&&p!=="large"&&p!=="xlarge"){p="standard";}document.documentElement.setAttribute("data-font-size",p);}catch(e){}})();`;
}
