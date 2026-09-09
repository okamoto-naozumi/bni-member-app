import { MEMBER_CATEGORIES } from "@/lib/categories";

export interface ContactCircle {
  id: string;
  name: string;
  categories: string[];
}

const OTHER_CIRCLE_ID = "other";

export const CONTACT_CIRCLES: ContactCircle[] = [
  {
    id: "construction",
    name: "建築",
    categories: ["建築・リフォーム"],
  },
  {
    id: "beauty-health",
    name: "美容・健康",
    categories: ["美容・理容", "飲食"],
  },
  {
    id: "biz-support",
    name: "経営者サポート",
    categories: ["税理士", "司法書士", "社会保険労務士", "行政書士", "保険代理店", "人材紹介"],
  },
  {
    id: "real-estate",
    name: "不動産・資産",
    categories: ["不動産"],
  },
  {
    id: "it-creative",
    name: "IT・クリエイティブ",
    categories: ["IT・システム開発", "Web制作・デザイン", "広告・マーケティング", "印刷・広告物"],
  },
  {
    id: OTHER_CIRCLE_ID,
    name: "その他",
    categories: ["その他"],
  },
];

const CATEGORY_TO_CIRCLE: Record<string, ContactCircle> = CONTACT_CIRCLES.reduce(
  (acc, circle) => {
    for (const category of circle.categories) acc[category] = circle;
    return acc;
  },
  {} as Record<string, ContactCircle>
);

export function getContactCircle(category: string): ContactCircle {
  return CATEGORY_TO_CIRCLE[category] ?? CONTACT_CIRCLES[CONTACT_CIRCLES.length - 1];
}

/**
 * マトリクスの列(カテゴリー)一覧を返す。
 * MEMBER_CATEGORIES を基本としつつ、実際のメンバーデータにのみ存在する
 * 未知のカテゴリー文字列があれば末尾に追加する。
 */
export function buildMatrixCategories(memberCategories: string[]): string[] {
  const known = new Set<string>(MEMBER_CATEGORIES);
  const extras = Array.from(new Set(memberCategories)).filter(
    (c) => c && !known.has(c)
  );
  return [...MEMBER_CATEGORIES, ...extras];
}
