"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

export default function AddProxyForm({
  onAdd,
}: {
  onAdd: (label: string) => void;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const label = value.trim();
    if (!label) return;
    onAdd(label);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="代理参加者名(例: 井口)"
        className="input w-44"
      />
      <button
        type="submit"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        <UserPlus size={16} />
        代理参加者バッジ追加
      </button>
    </form>
  );
}
