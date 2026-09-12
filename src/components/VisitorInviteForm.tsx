"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import {
  createVisitorInvite,
  updateVisitorInvite,
  deleteVisitorInvite,
  VISITOR_STATUS_LABELS,
  VISITOR_STATUS_OPTIONS,
  type VisitorInvite,
  type VisitorInviteInput,
} from "@/lib/visitorInvites";
import { MEMBER_CATEGORIES } from "@/lib/categories";
import type { Member } from "@/lib/members";
import { getErrorMessage } from "@/lib/errorMessage";

export default function VisitorInviteForm({
  initial,
  members,
  defaultStatus,
  onSaved,
  onDeleted,
  onCancel,
}: {
  initial?: VisitorInvite | null;
  members: Member[];
  defaultStatus?: VisitorInvite["status"];
  onSaved: (invite: VisitorInvite) => void;
  onDeleted?: (invite: VisitorInvite) => void;
  onCancel: () => void;
}) {
  const [visitorName, setVisitorName] = useState(initial?.visitor_name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [inviterMemberId, setInviterMemberId] = useState(initial?.inviter_member_id ?? "");
  const [status, setStatus] = useState(initial?.status ?? defaultStatus ?? "invited");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!visitorName.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const input: VisitorInviteInput = {
        visitor_name: visitorName.trim(),
        category: category.trim(),
        inviter_member_id: inviterMemberId || null,
        status,
        notes: notes.trim(),
      };
      const saved = initial
        ? await updateVisitorInvite(initial.id, input)
        : await createVisitorInvite(input);
      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm(`「${initial.visitor_name}」さんの招待記録を削除しますか?`)) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteVisitorInvite(initial.id);
      onDeleted?.(initial);
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
        className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {initial ? "ビジター招待を編集" : "ビジター招待を追加"}
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
            ビジター名<span className="ml-0.5 text-red-500">*</span>
          </span>
          <input
            required
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            className="input"
            placeholder="例: 山本 一郎"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            対象カテゴリ
          </span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            placeholder="例: 弁護士"
            list="visitor-category-suggestions"
          />
          <datalist id="visitor-category-suggestions">
            {MEMBER_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            招待担当メンバー
          </span>
          <select
            value={inviterMemberId}
            onChange={(e) => setInviterMemberId(e.target.value)}
            className="input"
          >
            <option value="">未設定</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            ステータス
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as VisitorInviteInput["status"])}
            className="input"
          >
            {VISITOR_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {VISITOR_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            進捗メモ
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-20 resize-y"
            placeholder="見学状況、入会に向けた課題など"
          />
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            {submitting ? "保存中..." : initial ? "更新する" : "登録する"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            キャンセル
          </button>
          {initial && (
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
