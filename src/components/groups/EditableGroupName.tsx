"use client";

import { useState } from "react";

export default function EditableGroupName({
  name,
  editable,
  onRename,
  className,
}: {
  name: string;
  editable: boolean;
  onRename: (name: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    setEditing(false);
  }

  if (!editable) {
    return <span className={className}>{name}</span>;
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onFocus={(e) => e.target.select()}
          className="w-full min-w-0 rounded border border-zinc-300 bg-white px-1 py-0.5 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      className={`${className} truncate text-left hover:underline`}
      title="クリックして名前を編集"
    >
      {name}
    </button>
  );
}
