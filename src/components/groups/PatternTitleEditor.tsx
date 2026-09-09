"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

export default function PatternTitleEditor({
  name,
  onRename,
}: {
  name: string;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    setEditing(false);
  }

  function startEditing() {
    setDraft(name);
    setEditing(true);
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
        className="flex items-center gap-1"
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onFocus={(e) => e.target.select()}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-base font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          className="rounded-full p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          aria-label="保存"
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          aria-label="キャンセル"
        >
          <X size={16} />
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{name}</h2>
      <button
        type="button"
        onClick={startEditing}
        className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        aria-label="パターン名を編集"
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}
