"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { X } from "lucide-react";
import type { BoardItem } from "@/lib/groupBoard";
import BoardCard from "./BoardCard";
import EditableGroupName from "./EditableGroupName";

export default function GroupRow({
  id,
  label,
  items,
  editable = false,
  onRename,
  onRemove,
}: {
  id: string;
  label: string;
  items: BoardItem[];
  editable?: boolean;
  onRename?: (name: string) => void;
  onRemove?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-l-xl border-r border-zinc-200 bg-zinc-900 p-2 text-center dark:border-zinc-800 dark:bg-zinc-100">
        <EditableGroupName
          name={label}
          editable={editable}
          onRename={(name) => onRename?.(name)}
          className="w-full text-sm font-semibold text-white dark:text-black"
        />
        <span className="rounded-full bg-white/20 px-1.5 text-xs text-white dark:bg-black/10 dark:text-black">
          {items.length}名
        </span>
        {editable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-white/70 hover:text-red-300 dark:text-black/60 dark:hover:text-red-600"
            aria-label="グループを削除"
          >
            <X size={13} />
          </button>
        )}
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-[90px] flex-1 flex-wrap items-start gap-1 p-2 transition-colors ${
            isOver ? "bg-emerald-50 dark:bg-emerald-950/30" : ""
          }`}
        >
          {items.map((item) => (
            <BoardCard key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
