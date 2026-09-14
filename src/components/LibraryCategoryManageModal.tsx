"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createLibraryCategory,
  deleteLibraryCategory,
  updateLibraryCategory,
  type LibraryCategory,
} from "@/lib/libraryCategories";
import { getErrorMessage } from "@/lib/errorMessage";

export default function LibraryCategoryManageModal({
  categories,
  onChange,
  onClose,
}: {
  categories: LibraryCategory[];
  /** カテゴリ一覧が変化するたびに呼ばれる。呼び出し元(親)の状態を更新するために使う */
  onChange: (categories: LibraryCategory[]) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    try {
      const category = await createLibraryCategory({ name, sort_order: categories.length });
      onChange([...categories, category].sort((a, b) => a.sort_order - b.sort_order));
      setNewName("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function startEdit(category: LibraryCategory) {
    setEditingId(category.id);
    setEditingName(category.name);
  }

  async function handleSaveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setError(null);
    try {
      const updated = await updateLibraryCategory(id, { name });
      onChange(categories.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(category: LibraryCategory) {
    if (!window.confirm(`大分類「${category.name}」を削除しますか?`)) return;
    setError(null);
    try {
      await deleteLibraryCategory(category.id);
      onChange(categories.filter((c) => c.id !== category.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            大分類カテゴリー管理
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          ここで追加・編集・削除した大分類は、資料ライブラリの登録フォームおよびフィルタータブに反映されます。
        </p>

        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新しい大分類名(例: 運営)"
            className="input flex-1"
          />
          <button
            type="submit"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            <Plus size={14} />
            追加
          </button>
        </form>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {categories.length === 0 ? (
          <p className="text-sm text-zinc-500">大分類が登録されていません。</p>
        ) : (
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                {editingId === category.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="input flex-1"
                  />
                ) : (
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">
                    {category.name}
                  </span>
                )}

                <div className="flex shrink-0 items-center gap-1">
                  {editingId === category.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(category.id)}
                        className="rounded-full p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        aria-label="保存"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        aria-label="キャンセル"
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        aria-label="編集"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="rounded-full p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        aria-label="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
