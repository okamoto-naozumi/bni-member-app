/**
 * 背景テーマ設定。ログイン機能がないため、選択内容はブラウザのlocalStorageにのみ保存する
 * (アカウント単位ではなく端末・ブラウザ単位の永続化)。
 */
export const THEME_STORAGE_KEY = "bni-theme-preference";

export type ThemePreference = "system" | "light" | "dark" | "warm" | "ocean";
export type ResolvedTheme = "light" | "dark" | "warm" | "ocean";

export const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; swatch: string }> = [
  { value: "system", label: "システムに合わせる", swatch: "linear-gradient(135deg, #ffffff 50%, #0a0a0a 50%)" },
  { value: "light", label: "ライト", swatch: "#fafafa" },
  { value: "dark", label: "ダーク", swatch: "#0a0a0a" },
  { value: "warm", label: "ウォーム", swatch: "#fdf6ec" },
  { value: "ocean", label: "オーシャン", swatch: "#eef6fb" },
];

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return preference;
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === "system" || raw === "light" || raw === "dark" || raw === "warm" || raw === "ocean") {
    return raw;
  }
  return "system";
}

export function applyTheme(preference: ThemePreference): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolveTheme(preference));
}

export function setStoredThemePreference(preference: ThemePreference): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyTheme(preference);
}

/**
 * <head>に埋め込むブート用スクリプト文字列。ページ描画前にdata-theme属性を確定させ、
 * テーマ切替時のちらつき(FOUC)を防ぐ。
 */
export function themeBootScript(): string {
  return `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var p=localStorage.getItem(k)||"system";var r=p;if(p==="system"){r=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",r);}catch(e){}})();`;
}
