"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { createTeam, deleteTeam, fetchTeams, updateTeam, type Team } from "@/lib/teams";

export default function TeamsSettingsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    try {
      const team = await createTeam(name);
      setTeams((prev) => [...prev, team].sort((a, b) => a.name.localeCompare(b.name, "ja")));
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function startEdit(team: Team) {
    setEditingId(team.id);
    setEditingName(team.name);
  }

  async function handleSaveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setError(null);
    try {
      const updated = await updateTeam(id, name);
      setTeams((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(team: Team) {
    if (!window.confirm(`チーム「${team.name}」を削除しますか?`)) return;
    setError(null);
    try {
      await deleteTeam(team.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/members"
        className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <ArrowLeft size={14} />
        メンバー管理に戻る
      </Link>

      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">チーム設定</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        ここで追加・編集したチームは、メンバー登録画面の「チーム」選択肢に反映されます。
      </p>

      <form
        onSubmit={handleAdd}
        className="mt-6 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しいチーム名"
          className="input flex-1"
        />
        <button
          type="submit"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          <Plus size={14} />
          追加
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-zinc-500">読み込み中...</p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-zinc-500">チームが登録されていません。</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {teams.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                {editingId === team.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="input flex-1"
                  />
                ) : (
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">{team.name}</span>
                )}

                <div className="flex shrink-0 items-center gap-1">
                  {editingId === team.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(team.id)}
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
                        onClick={() => startEdit(team)}
                        className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        aria-label="編集"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(team)}
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
