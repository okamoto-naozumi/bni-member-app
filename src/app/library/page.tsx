"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Library as LibraryIcon, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteLibraryLink,
  fetchLibraryLinks,
  type LibraryLink,
} from "@/lib/libraryLinks";
import { getErrorMessage } from "@/lib/errorMessage";
import LibraryLinkForm from "@/components/LibraryLinkForm";

const ALL_CATEGORY = "すべて";

export default function LibraryPage() {
  const [links, setLinks] = useState<LibraryLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORY);
  const [formState, setFormState] = useState<{ open: boolean; editing: LibraryLink | null }>({
    open: false,
    editing: null,
  });

  useEffect(() => {
    fetchLibraryLinks()
      .then(setLinks)
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(links.map((l) => l.category).filter(Boolean));
    return [ALL_CATEGORY, ...Array.from(set).sort((a, b) => a.localeCompare(b, "ja"))];
  }, [links]);

  const filtered = useMemo(
    () =>
      categoryFilter === ALL_CATEGORY
        ? links
        : links.filter((l) => l.category === categoryFilter),
    [links, categoryFilter]
  );

  function handleSaved(link: LibraryLink) {
    setLinks((prev) => {
      const exists = prev.some((l) => l.id === link.id);
      return exists ? prev.map((l) => (l.id === link.id ? link : l)) : [link, ...prev];
    });
    setFormState({ open: false, editing: null });
  }

  async function handleDelete(link: LibraryLink) {
    if (!window.confirm(`「${link.title}」を削除しますか?`)) return;
    try {
      await deleteLibraryLink(link.id);
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            <LibraryIcon size={20} />
            資料ライブラリ
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Googleドライブ等で管理している資料の共有リンクをまとめて掲載します。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormState({ open: true, editing: null })}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          <Plus size={14} />
          資料を追加
        </button>
      </div>

      {categories.length > 1 && (
        <div className="mt-5 flex w-fit flex-wrap items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === c
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">読み込み中...</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          該当する資料がありません。「資料を追加」から登録してください。
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((link) => (
            <div
              key={link.id}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                {link.category && (
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {link.category}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{link.title}</h3>

              {link.description && (
                <p className="line-clamp-4 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                  {link.description}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
                >
                  <ExternalLink size={12} />
                  開く
                </a>
                <button
                  type="button"
                  onClick={() => setFormState({ open: true, editing: link })}
                  className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Pencil size={12} />
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(link)}
                  className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  <Trash2 size={12} />
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formState.open && (
        <LibraryLinkForm
          initial={formState.editing}
          onSaved={handleSaved}
          onCancel={() => setFormState({ open: false, editing: null })}
        />
      )}
    </div>
  );
}
