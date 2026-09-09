"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Member } from "@/lib/members";
import MemberCard from "@/components/MemberCard";

export default function SortableMemberCard({
  member,
  onEdit,
  onDelete,
}: {
  member: Member;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? "z-10 opacity-50" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute -left-2 -top-2 z-10 flex h-6 w-6 cursor-grab items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm hover:text-zinc-700 active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200"
        aria-label="ドラッグして並べ替え"
      >
        <GripVertical size={12} />
      </button>
      <MemberCard member={member} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
