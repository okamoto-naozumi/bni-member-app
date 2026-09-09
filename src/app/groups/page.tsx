"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Copy, Trash2, Plus, Rows3, Columns3 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchMembers, type Member } from "@/lib/members";
import {
  UNASSIGNED_ID,
  addGroupToPattern,
  createEmptyPattern,
  createProxyBadge,
  duplicatePattern,
  findContainer,
  getActivePatternId,
  loadPatterns,
  loadProxyBadges,
  removeGroupFromPattern,
  renameGroupInPattern,
  savePatterns,
  saveProxyBadges,
  setActivePatternId as persistActivePatternId,
  syncBoardWithRoster,
  type Board,
  type BoardItem,
  type GroupPattern,
  type ProxyBadge,
} from "@/lib/groupBoard";
import GroupColumn from "@/components/groups/GroupColumn";
import GroupRow from "@/components/groups/GroupRow";
import { CardAvatar } from "@/components/groups/BoardCard";
import AddProxyForm from "@/components/groups/AddProxyForm";
import PatternNameForm from "@/components/groups/PatternNameForm";
import PatternTitleEditor from "@/components/groups/PatternTitleEditor";

type PendingAction = "create" | "duplicate" | "addGroup" | null;
type Layout = "column" | "row";

const LAYOUT_STORAGE_KEY = "bni-group-layout";

export default function GroupsPage() {
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [patterns, setPatterns] = useState<GroupPattern[]>([]);
  const [proxyBadges, setProxyBadges] = useState<ProxyBadge[]>([]);
  const [activePatternId, setActivePatternIdState] = useState<string>("");
  const [activeItem, setActiveItem] = useState<BoardItem | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [layout, setLayout] = useState<Layout>(() => {
    if (typeof window === "undefined") return "column";
    const saved = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    return saved === "row" || saved === "column" ? saved : "column";
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const currentPattern = patterns.find((p) => p.id === activePatternId) ?? null;
  const board: Board = currentPattern?.board ?? {};
  const groups = currentPattern?.groups ?? [];

  useEffect(() => {
    fetchMembers().then((ms) => {
      const badges = loadProxyBadges();
      const syncedPatterns = loadPatterns().map((p) =>
        syncBoardWithRoster(p, ms, badges)
      );
      savePatterns(syncedPatterns);
      setMembers(ms);
      setPatterns(syncedPatterns);
      setProxyBadges(badges);

      const savedId = getActivePatternId();
      const active = syncedPatterns.find((p) => p.id === savedId) ?? syncedPatterns[0];
      setActivePatternIdState(active.id);
      persistActivePatternId(active.id);
      setReady(true);
    });
  }, []);

  // ドラッグ操作・グループ編集が落ち着いたタイミングで全パターンを永続化する
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => savePatterns(patterns), 300);
    return () => clearTimeout(timer);
  }, [patterns, ready]);

  function handleSetLayout(next: Layout) {
    setLayout(next);
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, next);
  }

  function updateActiveBoardWith(updater: (board: Board) => Board) {
    setPatterns((prev) =>
      prev.map((p) =>
        p.id === activePatternId
          ? { ...p, board: updater(p.board), updatedAt: new Date().toISOString() }
          : p
      )
    );
  }

  function findItem(id: string): BoardItem | null {
    for (const key of Object.keys(board)) {
      const item = board[key].find((i) => i.id === id);
      if (item) return item;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveItem(findItem(String(event.active.id)));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    updateActiveBoardWith((prevBoard) => {
      const activeContainer = findContainer(prevBoard, activeId);
      const overContainer = findContainer(prevBoard, overId);
      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return prevBoard;
      }

      const activeItems = prevBoard[activeContainer];
      const overItems = prevBoard[overContainer];
      const activeIndex = activeItems.findIndex((i) => i.id === activeId);
      const item = activeItems[activeIndex];
      if (!item) return prevBoard;

      const overIndex = overItems.findIndex((i) => i.id === overId);
      let newIndex: number;
      if (overId in prevBoard) {
        newIndex = overItems.length;
      } else {
        const isBelowOverItem =
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        newIndex = overIndex >= 0 ? overIndex + (isBelowOverItem ? 1 : 0) : overItems.length;
      }

      return {
        ...prevBoard,
        [activeContainer]: activeItems.filter((i) => i.id !== activeId),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          item,
          ...overItems.slice(newIndex),
        ],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    updateActiveBoardWith((prevBoard) => {
      const activeContainer = findContainer(prevBoard, activeId);
      const overContainer = findContainer(prevBoard, overId);
      if (!activeContainer || !overContainer || activeContainer !== overContainer) {
        return prevBoard;
      }
      const activeIndex = prevBoard[activeContainer].findIndex((i) => i.id === activeId);
      const overIndex = prevBoard[overContainer].findIndex((i) => i.id === overId);
      if (activeIndex === overIndex || overIndex < 0) return prevBoard;
      return {
        ...prevBoard,
        [overContainer]: arrayMove(prevBoard[overContainer], activeIndex, overIndex),
      };
    });
  }

  function handleAddProxy(label: string) {
    const badge = createProxyBadge(label);
    const updatedBadges = [...proxyBadges, badge];
    setProxyBadges(updatedBadges);
    saveProxyBadges(updatedBadges);
    // 新規バッジは全パターンの「未割り当て」に反映する
    setPatterns((prev) => prev.map((p) => syncBoardWithRoster(p, members, updatedBadges)));
  }

  function switchToPattern(id: string) {
    setActivePatternIdState(id);
    persistActivePatternId(id);
  }

  function handleSelectPattern(id: string) {
    if (patterns.some((p) => p.id === id)) switchToPattern(id);
  }

  function handleCreatePattern(name: string) {
    let pattern = createEmptyPattern(name);
    pattern = syncBoardWithRoster(pattern, members, proxyBadges);
    setPatterns((prev) => [...prev, pattern]);
    switchToPattern(pattern.id);
    setPendingAction(null);
  }

  function handleDuplicatePattern(name: string) {
    if (!currentPattern) return;
    let pattern = duplicatePattern(currentPattern, name);
    pattern = syncBoardWithRoster(pattern, members, proxyBadges);
    setPatterns((prev) => [...prev, pattern]);
    switchToPattern(pattern.id);
    setPendingAction(null);
  }

  function handleDeletePattern() {
    if (!currentPattern || patterns.length <= 1) return;
    if (!window.confirm(`パターン「${currentPattern.name}」を削除しますか?`)) return;
    const remaining = patterns.filter((p) => p.id !== currentPattern.id);
    setPatterns(remaining);
    switchToPattern(remaining[0].id);
  }

  function handleRenamePattern(name: string) {
    setPatterns((prev) =>
      prev.map((p) =>
        p.id === activePatternId ? { ...p, name, updatedAt: new Date().toISOString() } : p
      )
    );
  }

  function handleAddGroup(name: string) {
    setPatterns((prev) =>
      prev.map((p) => (p.id === activePatternId ? addGroupToPattern(p, name) : p))
    );
    setPendingAction(null);
  }

  function handleRenameGroup(groupId: string, name: string) {
    setPatterns((prev) =>
      prev.map((p) => (p.id === activePatternId ? renameGroupInPattern(p, groupId, name) : p))
    );
  }

  function handleRemoveGroup(groupId: string) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    if (
      !window.confirm(
        `グループ「${group.name}」を削除しますか?(配置済みのメンバーは未割り当てに戻ります)`
      )
    ) {
      return;
    }
    setPatterns((prev) =>
      prev.map((p) => (p.id === activePatternId ? removeGroupFromPattern(p, groupId) : p))
    );
  }

  const columns = [
    { id: UNASSIGNED_ID, name: "未割り当て", editable: false },
    ...groups.map((g) => ({ ...g, editable: true })),
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          グループ編成
        </h1>
        <AddProxyForm onAdd={handleAddProxy} />
      </div>

      {!isSupabaseConfigured && (
        <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Supabase未設定のため、ダミーメンバーで表示しています。配置はブラウザのlocalStorageに保存されます。
        </p>
      )}

      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        顔写真(パターン1: アイコン用)をドラッグして各グループの枠に配置してください。
      </p>

      {!ready ? (
        <p className="mt-6 text-sm text-zinc-500">読み込み中...</p>
      ) : (
        <>
          {currentPattern && (
            <div className="mt-4">
              <PatternTitleEditor name={currentPattern.name} onRename={handleRenamePattern} />
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              編成パターン:
            </label>
            <select
              value={activePatternId}
              onChange={(e) => handleSelectPattern(e.target.value)}
              className="input w-56"
            >
              {patterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setPendingAction(pendingAction === "create" ? null : "create")}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Plus size={14} />
              新規パターン
            </button>
            <button
              type="button"
              onClick={() => setPendingAction(pendingAction === "duplicate" ? null : "duplicate")}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Copy size={14} />
              複製
            </button>
            <button
              type="button"
              onClick={handleDeletePattern}
              disabled={patterns.length <= 1}
              className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <Trash2 size={14} />
              削除
            </button>

            <div className="ml-auto flex items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => handleSetLayout("row")}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  layout === "row"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Rows3 size={14} />
                縦並び
              </button>
              <button
                type="button"
                onClick={() => handleSetLayout("column")}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  layout === "column"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Columns3 size={14} />
                横並び
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPendingAction(pendingAction === "addGroup" ? null : "addGroup")}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Plus size={14} />
              グループを追加
            </button>
          </div>

          {pendingAction === "create" && (
            <div className="mt-3">
              <PatternNameForm
                placeholder="パターン名(例: 第10期テーブル配置案A)"
                submitLabel="作成"
                onSubmit={handleCreatePattern}
                onCancel={() => setPendingAction(null)}
              />
            </div>
          )}
          {pendingAction === "duplicate" && currentPattern && (
            <div className="mt-3">
              <PatternNameForm
                initialValue={`${currentPattern.name} のコピー`}
                placeholder="複製後のパターン名"
                submitLabel="複製して作成"
                onSubmit={handleDuplicatePattern}
                onCancel={() => setPendingAction(null)}
              />
            </div>
          )}
          {pendingAction === "addGroup" && (
            <div className="mt-3">
              <PatternNameForm
                placeholder="新しいグループ名(例: グループG)"
                submitLabel="追加"
                onSubmit={handleAddGroup}
                onCancel={() => setPendingAction(null)}
              />
            </div>
          )}

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {layout === "column" ? (
              <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
                {columns.map((col) => (
                  <GroupColumn
                    key={col.id}
                    id={col.id}
                    label={col.name}
                    items={board[col.id] ?? []}
                    editable={col.editable}
                    onRename={col.editable ? (name) => handleRenameGroup(col.id, name) : undefined}
                    onRemove={col.editable ? () => handleRemoveGroup(col.id) : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3 pb-4">
                {columns.map((col) => (
                  <GroupRow
                    key={col.id}
                    id={col.id}
                    label={col.name}
                    items={board[col.id] ?? []}
                    editable={col.editable}
                    onRename={col.editable ? (name) => handleRenameGroup(col.id, name) : undefined}
                    onRemove={col.editable ? () => handleRemoveGroup(col.id) : undefined}
                  />
                ))}
              </div>
            )}
            <DragOverlay>
              {activeItem ? (
                <div className="flex flex-col items-center gap-1 rounded-lg bg-white p-2 shadow-lg dark:bg-zinc-900">
                  <CardAvatar item={activeItem} />
                  <span className="w-16 truncate text-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {activeItem.label}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}
    </div>
  );
}
