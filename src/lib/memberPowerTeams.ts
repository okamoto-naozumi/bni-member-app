import { POWER_TEAM_SUGGESTIONS } from "@/lib/powerTeams";
import type { Member } from "@/lib/members";

/** 業種カテゴリ(MEMBER_CATEGORIES)をパワーチームへ振り分けるための対応表 */
const POWER_TEAM_CATEGORIES: Record<string, string[]> = {
  "士業パワーチーム": ["税理士", "司法書士", "社会保険労務士", "行政書士"],
  "建築・不動産パワーチーム": ["建築・リフォーム", "不動産"],
  "IT・Webパワーチーム": ["IT・システム開発", "Web制作・デザイン"],
  "金融・保険パワーチーム": ["保険代理店"],
  "広告・デザインパワーチーム": ["広告・マーケティング", "印刷・広告物"],
  "美容・健康パワーチーム": ["美容・理容"],
  "フード・サービスパワーチーム": ["飲食"],
  "人材・教育パワーチーム": ["人材紹介"],
};

/** どのパワーチームにも対応しないカテゴリ(「その他」等)の受け皿 */
export const UNASSIGNED_POWER_TEAM = "未分類";

const CATEGORY_TO_POWER_TEAM: Record<string, string> = Object.entries(
  POWER_TEAM_CATEGORIES
).reduce((acc, [team, categories]) => {
  for (const category of categories) acc[category] = team;
  return acc;
}, {} as Record<string, string>);

export function getPowerTeamForCategory(category: string): string {
  return CATEGORY_TO_POWER_TEAM[category] ?? UNASSIGNED_POWER_TEAM;
}

export interface PowerTeamGroup {
  name: string;
  /** このパワーチームに属する業種カテゴリ一覧(未分類チームの場合は空) */
  categories: string[];
  members: Member[];
  /** このパワーチーム内で、まだ誰も所属していないカテゴリ(空き枠) */
  openCategories: string[];
}

/**
 * メンバーをパワーチームごとにグループ化する。
 * カテゴリ未設定・未対応のメンバーは末尾の「未分類」グループにまとめる。
 */
export function buildPowerTeamGroups(members: Member[]): PowerTeamGroup[] {
  const groups: PowerTeamGroup[] = POWER_TEAM_SUGGESTIONS.map((name) => ({
    name,
    categories: POWER_TEAM_CATEGORIES[name] ?? [],
    members: [],
    openCategories: [],
  }));
  const groupByName = new Map(groups.map((g) => [g.name, g]));
  const unassigned: PowerTeamGroup = {
    name: UNASSIGNED_POWER_TEAM,
    categories: [],
    members: [],
    openCategories: [],
  };

  for (const member of members) {
    const teamName = member.category ? getPowerTeamForCategory(member.category) : UNASSIGNED_POWER_TEAM;
    (groupByName.get(teamName) ?? unassigned).members.push(member);
  }

  for (const group of groups) {
    const covered = new Set(group.members.map((m) => m.category));
    group.openCategories = group.categories.filter((c) => !covered.has(c));
  }

  return unassigned.members.length > 0 ? [...groups, unassigned] : groups;
}
