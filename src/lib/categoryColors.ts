export interface CategoryColor {
  bg: string;
  text: string;
}

const CATEGORY_COLORS: Record<string, CategoryColor> = {
  "建築・リフォーム": { bg: "#DCFCE7", text: "#166534" }, // 緑
  "美容・理容": { bg: "#FCE7F3", text: "#9D174D" }, // ピンク
  "保険代理店": { bg: "#FEE2E2", text: "#991B1B" }, // 赤
  "不動産": { bg: "#FFEDD5", text: "#9A3412" }, // オレンジ
  "税理士": { bg: "#DBEAFE", text: "#1E40AF" }, // 青(士業)
  "司法書士": { bg: "#DBEAFE", text: "#1E40AF" },
  "社会保険労務士": { bg: "#DBEAFE", text: "#1E40AF" },
  "行政書士": { bg: "#DBEAFE", text: "#1E40AF" },
  "IT・システム開発": { bg: "#EDE9FE", text: "#5B21B6" }, // 紫
  "Web制作・デザイン": { bg: "#CCFBF1", text: "#115E59" }, // ティール
  "広告・マーケティング": { bg: "#CCFBF1", text: "#115E59" },
  "印刷・広告物": { bg: "#CCFBF1", text: "#115E59" },
  "人材紹介": { bg: "#E0E7FF", text: "#3730A3" }, // インディゴ
  "飲食": { bg: "#FEF3C7", text: "#92400E" }, // アンバー
};

const DEFAULT_COLOR: CategoryColor = { bg: "#F4F4F5", text: "#52525B" };

export function getCategoryColor(category: string): CategoryColor {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}
