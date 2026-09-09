export const MEMBER_CATEGORIES = [
  "税理士",
  "司法書士",
  "社会保険労務士",
  "行政書士",
  "保険代理店",
  "不動産",
  "IT・システム開発",
  "Web制作・デザイン",
  "広告・マーケティング",
  "印刷・広告物",
  "人材紹介",
  "建築・リフォーム",
  "飲食",
  "美容・理容",
  "その他",
] as const;

export type MemberCategory = (typeof MEMBER_CATEGORIES)[number];
