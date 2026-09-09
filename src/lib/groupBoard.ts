import type { Member } from "@/lib/members";

export const UNASSIGNED_ID = "unassigned";

export interface GroupDef {
  id: string;
  name: string;
}

export interface BoardItem {
  id: string;
  kind: "member" | "proxy";
  label: string;
  subLabel?: string;
  photoUrl?: string;
}

export type Board = Record<string, BoardItem[]>;

export interface GroupPattern {
  id: string;
  name: string;
  groups: GroupDef[];
  board: Board;
  updatedAt: string;
}

export interface ProxyBadge {
  id: string;
  label: string;
}

const DEFAULT_GROUP_NAMES = ["グループA", "グループB", "グループC", "グループD", "グループE", "グループF"];

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createDefaultGroups(): GroupDef[] {
  return DEFAULT_GROUP_NAMES.map((name) => ({ id: generateId("group"), name }));
}

export function emptyBoardFor(groups: GroupDef[]): Board {
  const board: Board = { [UNASSIGNED_ID]: [] };
  for (const g of groups) board[g.id] = [];
  return board;
}

function normalizeBoard(board: Board | undefined, groups: GroupDef[]): Board {
  const next: Board = { [UNASSIGNED_ID]: board?.[UNASSIGNED_ID] ?? [] };
  for (const g of groups) next[g.id] = board?.[g.id] ?? [];
  return next;
}

// ---------------------------------------------------------------------------
// 代理参加者バッジ(グローバルなレジストリ。全パターンで共有される)
// ---------------------------------------------------------------------------

const PROXY_BADGES_STORAGE_KEY = "bni-proxy-badges";

export function loadProxyBadges(): ProxyBadge[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PROXY_BADGES_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProxyBadges(badges: ProxyBadge[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROXY_BADGES_STORAGE_KEY, JSON.stringify(badges));
}

export function createProxyBadge(label: string): ProxyBadge {
  return { id: generateId("proxy"), label };
}

// ---------------------------------------------------------------------------
// パターンの永続化
// ---------------------------------------------------------------------------

const PATTERNS_STORAGE_KEY = "bni-group-patterns";
const ACTIVE_PATTERN_STORAGE_KEY = "bni-group-active-pattern-id";

interface RawPattern {
  id?: string;
  name?: string;
  groups?: GroupDef[];
  board?: Board;
  updatedAt?: string;
}

function normalizePattern(raw: RawPattern): GroupPattern {
  const rawBoard: Board = raw.board ?? {};
  let groups = Array.isArray(raw.groups) ? raw.groups : [];

  if (groups.length === 0) {
    // 旧形式(固定 A〜F のカラムID)からの移行措置: board のキーからグループ定義を復元する
    groups = Object.keys(rawBoard)
      .filter((key) => key !== UNASSIGNED_ID)
      .map((key) => ({ id: key, name: `グループ${key}` }));
  }

  return {
    id: raw.id ?? generateId("pattern"),
    name: raw.name ?? "無題のパターン",
    groups,
    board: normalizeBoard(rawBoard, groups),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export function createEmptyPattern(name: string): GroupPattern {
  const groups = createDefaultGroups();
  return {
    id: generateId("pattern"),
    name,
    groups,
    board: emptyBoardFor(groups),
    updatedAt: new Date().toISOString(),
  };
}

export function duplicatePattern(pattern: GroupPattern, name: string): GroupPattern {
  return {
    id: generateId("pattern"),
    name,
    groups: pattern.groups.map((g) => ({ ...g })),
    board: normalizeBoard(pattern.board, pattern.groups),
    updatedAt: new Date().toISOString(),
  };
}

export function loadPatterns(): GroupPattern[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PATTERNS_STORAGE_KEY);
  if (!raw) {
    const initial = [createEmptyPattern("案A")];
    savePatterns(initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(raw) as RawPattern[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = [createEmptyPattern("案A")];
      savePatterns(initial);
      return initial;
    }
    return parsed.map(normalizePattern);
  } catch {
    const initial = [createEmptyPattern("案A")];
    savePatterns(initial);
    return initial;
  }
}

export function savePatterns(patterns: GroupPattern[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(patterns));
}

export function getActivePatternId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_PATTERN_STORAGE_KEY);
}

export function setActivePatternId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_PATTERN_STORAGE_KEY, id);
}

// ---------------------------------------------------------------------------
// グループ(列/行)の追加・削除・改名
// ---------------------------------------------------------------------------

export function addGroupToPattern(pattern: GroupPattern, name: string): GroupPattern {
  const group: GroupDef = { id: generateId("group"), name };
  return {
    ...pattern,
    groups: [...pattern.groups, group],
    board: { ...pattern.board, [group.id]: [] },
  };
}

export function renameGroupInPattern(
  pattern: GroupPattern,
  groupId: string,
  name: string
): GroupPattern {
  return {
    ...pattern,
    groups: pattern.groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
  };
}

/** グループを削除する。配置されていたメンバー/バッジは「未割り当て」に戻す。 */
export function removeGroupFromPattern(pattern: GroupPattern, groupId: string): GroupPattern {
  const displaced = pattern.board[groupId] ?? [];
  const nextBoard: Board = { ...pattern.board };
  delete nextBoard[groupId];
  nextBoard[UNASSIGNED_ID] = [...nextBoard[UNASSIGNED_ID], ...displaced];

  return {
    ...pattern,
    groups: pattern.groups.filter((g) => g.id !== groupId),
    board: nextBoard,
  };
}

// ---------------------------------------------------------------------------
// メンバー・代理バッジ名簿との同期
// ---------------------------------------------------------------------------

/**
 * 最新のメンバー一覧・代理バッジ登録状況をパターンへ反映する。
 * - 未配置のメンバー/バッジは「未割り当て」へ追加
 * - 既存カードの表示情報(名前・写真・カテゴリー)を最新化
 * - 削除されたメンバー/バッジのカードはボードから除去
 */
export function syncBoardWithRoster(
  pattern: GroupPattern,
  members: Member[],
  proxyBadges: ProxyBadge[]
): GroupPattern {
  const board = normalizeBoard(pattern.board, pattern.groups);
  const memberIds = new Set(members.map((m) => m.id));
  const proxyIds = new Set(proxyBadges.map((p) => p.id));

  const placedMemberIds = new Set<string>();
  const placedProxyIds = new Set<string>();
  for (const key of Object.keys(board)) {
    for (const item of board[key]) {
      if (item.kind === "member") placedMemberIds.add(item.id);
      else placedProxyIds.add(item.id);
    }
  }

  const nextBoard: Board = {};
  for (const key of Object.keys(board)) {
    nextBoard[key] = board[key]
      .filter((item) =>
        item.kind === "member" ? memberIds.has(item.id) : proxyIds.has(item.id)
      )
      .map((item) => {
        if (item.kind !== "member") return item;
        const member = members.find((m) => m.id === item.id);
        if (!member) return item;
        return {
          ...item,
          label: member.name,
          subLabel: member.category,
          photoUrl: member.photo_icon_url,
        };
      });
  }

  const newMembers = members.filter((m) => !placedMemberIds.has(m.id));
  const newProxies = proxyBadges.filter((p) => !placedProxyIds.has(p.id));

  nextBoard[UNASSIGNED_ID] = [
    ...nextBoard[UNASSIGNED_ID],
    ...newMembers.map<BoardItem>((m) => ({
      id: m.id,
      kind: "member",
      label: m.name,
      subLabel: m.category,
      photoUrl: m.photo_icon_url,
    })),
    ...newProxies.map<BoardItem>((p) => ({ id: p.id, kind: "proxy", label: p.label })),
  ];

  return { ...pattern, board: nextBoard };
}

export function findContainer(board: Board, id: string): string | undefined {
  if (id in board) return id;
  return Object.keys(board).find((key) => board[key].some((item) => item.id === id));
}
