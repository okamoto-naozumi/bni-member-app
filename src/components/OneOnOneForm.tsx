"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { upsertOneOnOne, deleteOneOnOne, type OneOnOne } from "@/lib/oneOnOnes";
import type { Member } from "@/lib/members";
import { getErrorMessage } from "@/lib/errorMessage";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function OneOnOneForm({
  memberA,
  memberB,
  existing,
  onSaved,
  onDeleted,
  onCancel,
}: {
  memberA: Member;
  memberB: Member;
  existing: OneOnOne | null;
  onSaved: (record: OneOnOne) => void;
  onDeleted: (id: string) => void;
  onCancel: () => void;
}) {
  const [completedAt, setCompletedAt] = useState(existing?.completed_at ?? today());
  const [note, setNote] = useState(existing?.note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!completedAt) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await upsertOneOnOne({
        member_a_id: memberA.id,
        member_b_id: memberB.id,
        completed_at: completedAt,
        note: note.trim(),
      });
      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    if (!window.confirm("この1to1の実施記録を削除しますか?")) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteOneOnOne(existing.id);
      onDeleted(existing.id);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {memberA.name} × {memberB.name}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            実施日<span className="ml-0.5 text-red-500">*</span>
          </span>
          <input
            required
            type="date"
            value={completedAt}
            onChange={(e) => setCompletedAt(e.target.value)}
            className="input"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">メモ</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input min-h-20 resize-y"
            placeholder="話した内容、次回のアクションなど"
          />
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            {submitting ? "保存中..." : "実施済みとして保存"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            キャンセル
          </button>
          {existing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="ml-auto flex items-center gap-1 rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <Trash2 size={12} />
              削除
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
