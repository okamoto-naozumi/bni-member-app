"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BoardItem } from "@/lib/groupBoard";

export default function BoardCard({ item }: { item: BoardItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: { kind: item.kind } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex cursor-grab flex-col items-center gap-1 rounded-lg border border-transparent p-2 text-center select-none active:cursor-grabbing ${
        isDragging
          ? "opacity-40"
          : "hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900"
      }`}
    >
      <CardAvatar item={item} />
      <span className="w-16 truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {item.label}
      </span>
    </div>
  );
}

export function CardAvatar({ item }: { item: BoardItem }) {
  if (item.kind === "proxy") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow-sm">
        {item.label.slice(0, 2)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- photoUrl may be a data URL or arbitrary remote host
    <img
      src={item.photoUrl}
      alt={item.label}
      className="h-12 w-12 rounded-full object-cover shadow-sm"
    />
  );
}
