"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  LayoutGrid,
  Library as LibraryIcon,
  List,
  Pencil,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";
import {
  deleteLibraryLink,
  fetchLibraryLinks,
  type LibraryLink,
} from "@/lib/libraryLinks";
import { fetchLibraryCategories, type LibraryCategory } from "@/lib/libraryCategories";
import { getErrorMessage } from "@/lib/errorMessage";
import LibraryLinkForm from "@/components/LibraryLinkForm";
import LibraryCategoryManageModal from "@/components/LibraryCategoryManageModal";

const ALL_CATEGORY = "すべて";
type ViewMode = "card" | "list";

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LibraryPage() {
  const [links, setLinks] = useState<LibraryLink[]>([]);
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORY);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [formState, setFormState] = useState<{ open: boolean; editing: LibraryLink | null }>({
    open: false,
    editing: null,
  });

  useEffect(() => {
    Promise.allSettled([fetchLibraryLinks(), fetchLibraryCategories()]).then(
      ([linksResult, categoriesResult]) => {
        if (linksResult.status === "fulfilled") {
          setLinks(linksResult.value);
        } else {
          setLoadError(getErrorMessage(linksResult.reason));
        }
        if (categoriesResult.status === "fulfilled") {
          setCategories(categoriesResult.value);
        }
        setLoading(false);
      }
    );
  }, []);

  const categoryTabs = useMemo(() => {
    const masterNames = categories.map((c) => c.name);
    const extra = Array.from(new Set(links.map((l) => l.category).filter(Boolean)))
      .filter((name) => !masterNames.includes(name))
      .sort((a, b) => a.localeCompare(b, "ja"));
    return [ALL_CATEGORY, ...masterNames, ...extra];
  }, [links, categories]);

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Tags size={14} />
            大分類を管理
          </button>
          <button
            type="button"
            onClick={() => setFormState({ open: true, editing: null })}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            <Plus size={14} />
            資料を追加
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        {categoryTabs.length > 1 ? (
          <div className="flex w-fit flex-wrap items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
            {categoryTabs.map((c) => (
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
        ) : (
          <span />
        )}

        <div className="flex w-fit items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setViewMode("card")}
            aria-pressed={viewMode === "card"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "card"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <LayoutGrid size={14} />
            カード表示
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <List size={14} />
            リスト表示
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">読み込み中...</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          該当する資料がありません。「資料を追加」から登録してください。
        </p>
      ) : viewMode === "card" ? (
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

              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                更新日時: {formatDateTime(link.updated_at)}
              </p>

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
      ) : (
        <LibraryListView
          items={filtered}
          onEdit={(link) => setFormState({ open: true, editing: link })}
          onDelete={handleDelete}
        />
      )}

      {formState.open && (
        <LibraryLinkForm
          initial={formState.editing}
          onSaved={handleSaved}
          onCancel={() => setFormState({ open: false, editing: null })}
        />
      )}

      {categoryModalOpen && (
        <LibraryCategoryManageModal
          categories={categories}
          onChange={setCategories}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}
    </div>
  );
}

function LibraryListView({
  items,
  onEdit,
  onDelete,
}: {
  items: LibraryLink[];
  onEdit: (link: LibraryLink) => void;
  onDelete: (link: LibraryLink) => void;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="px-4 py-2 font-medium">資料タイトル</th>
            <th className="px-4 py-2 font-medium">大分類カテゴリー</th>
            <th className="px-4 py-2 font-medium">概要説明</th>
            <th className="px-4 py-2 font-medium">更新日時</th>
            <th className="px-4 py-2 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((link) => (
            <tr key={link.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
              <td className="min-w-[160px] px-4 py-3 align-top font-medium text-zinc-900 dark:text-zinc-50">
                {link.title}
              </td>
              <td className="px-4 py-3 align-top">
                {link.category ? (
                  <span className="inline-block whitespace-nowrap rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {link.category}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="min-w-[220px] max-w-sm px-4 py-3 align-top text-zinc-600 dark:text-zinc-300">
                <p className="line-clamp-2 whitespace-pre-wrap">{link.description || "—"}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-top text-zinc-500 dark:text-zinc-400">
                {formatDateTime(link.updated_at)}
              </td>
              <td className="px-4 py-3 align-top">
                <div className="flex items-center justify-end gap-1">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
                  >
                    <ExternalLink size={12} />
                    開く
                  </a>
                  <button
                    type="button"
                    onClick={() => onEdit(link)}
                    className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Pencil size={12} />
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(link)}
                    className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                  >
                    <Trash2 size={12} />
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
