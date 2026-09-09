"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { X } from "lucide-react";
import type { BoardItem } from "@/lib/groupBoard";
import BoardCard from "./BoardCard";
import EditableGroupName from "./EditableGroupName";

export default function GroupColumn({
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
    <div className="flex w-40 shrink-0 flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-1 rounded-t-xl border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <EditableGroupName
          name={label}
          editable={editable}
          onRename={(name) => onRename?.(name)}
          className="min-w-0 flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        />
        <div className="flex shrink-0 items-center gap-1">
          <span className="rounded-full bg-zinc-200 px-1.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {items.length}
          </span>
          {editable && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
              aria-label="グループを削除"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-[260px] flex-1 flex-col gap-1 p-2 transition-colors ${
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
