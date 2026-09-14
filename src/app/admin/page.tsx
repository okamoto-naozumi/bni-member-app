"use client";

import { useRef, useState } from "react";
import { DatabaseBackup, Download, ShieldCheck, Upload } from "lucide-react";
import { buildBackupBundle, restoreBackupBundle, type RestoreSummary } from "@/lib/backup";
import { getErrorMessage } from "@/lib/errorMessage";

const TABLE_LABELS: Record<keyof RestoreSummary, string> = {
  members: "メンバー",
  referral_requests: "リファーラル募集",
  one_on_ones: "1to1実施記録",
  visitor_invites: "ビジター招待",
  library_links: "資料ライブラリ",
  portfolios: "ポートフォリオ",
};

export default function AdminPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RestoreSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    setMessage(null);
    try {
      const bundle = await buildBackupBundle();
      const json = JSON.stringify(bundle, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateLabel = new Date().toISOString().slice(0, 10);
      a.download = `bni-enishi-backup-${dateLabel}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage(
        `バックアップを書き出しました(メンバー${bundle.members.length}件 / リファーラル募集${bundle.referral_requests.length}件 / 1to1${bundle.one_on_ones.length}件 / ビジター${bundle.visitor_invites.length}件 / 資料${bundle.library_links.length}件 / ポートフォリオ${bundle.portfolios.length}件)。`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(file: File | null) {
    if (!file) return;
    if (
      !window.confirm(
        "バックアップファイルを復元します。ファイル内のIDと一致する既存データは上書きされます。よろしいですか?"
      )
    ) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImporting(true);
    setError(null);
    setMessage(null);
    setSummary(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = await restoreBackupBundle(json);
      setSummary(result);
      setMessage("復元処理が完了しました。結果は下記をご確認ください。");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
        <DatabaseBackup size={20} />
        全データバックアップ・復元
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        メンバー・リファーラル募集・1to1実施記録・ビジター招待・資料ライブラリ・ポートフォリオの全データを1つのJSONファイルとして書き出し・復元できます。
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <Download size={16} />
          バックアップ(エクスポート)
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          現在の全データをJSONファイルとしてダウンロードします。
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="mt-3 flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          <Download size={14} />
          {exporting ? "書き出し中..." : "バックアップをダウンロード"}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <Upload size={16} />
          復元(リストア)
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          バックアップJSONファイルをアップロードして復元します。IDが一致するデータは上書き、一致しないデータは新規追加されます。レコード単位で安全にスキップされるため、一部のデータに問題があっても全体の復元は継続されます。
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="mt-3 flex items-center gap-1.5 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Upload size={14} />
          {importing ? "復元中..." : "バックアップファイルを選択して復元"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {message && (
        <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          <ShieldCheck size={14} />
          {message}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {summary && (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <th className="px-4 py-2 font-medium">テーブル</th>
                <th className="px-4 py-2 font-medium">成功</th>
                <th className="px-4 py-2 font-medium">失敗</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(TABLE_LABELS) as (keyof RestoreSummary)[]).map((key) => (
                <tr key={key} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                  <td className="px-4 py-2 text-zinc-800 dark:text-zinc-200">
                    {TABLE_LABELS[key]}
                  </td>
                  <td className="px-4 py-2 text-emerald-600 dark:text-emerald-400">
                    {summary[key].succeeded}
                  </td>
                  <td className="px-4 py-2 text-red-600 dark:text-red-400">
                    {summary[key].failed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
