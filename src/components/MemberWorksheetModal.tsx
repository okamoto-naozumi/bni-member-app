"use client";

import { useState } from "react";
import { X, Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import type { Member } from "@/lib/members";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { resolveImageDataUri } from "@/lib/pdf/imageSrc";
import BioSheetDocument from "@/lib/pdf/BioSheetDocument";
import GainsWorksheetDocument from "@/lib/pdf/GainsWorksheetDocument";
import { getErrorMessage } from "@/lib/errorMessage";

type WorksheetKind = "bio" | "gains";

const BIO_ITEMS: Array<{ key: keyof Member; label: string }> = [
  { key: "bio_past_occupation", label: "過去に経験した職業" },
  { key: "bio_spouse", label: "配偶者" },
  { key: "bio_family", label: "家族" },
  { key: "bio_pet", label: "ペット" },
  { key: "bio_hobby", label: "趣味" },
  { key: "bio_other_interests", label: "その他の関心事" },
  { key: "bio_hometown", label: "出身地" },
  { key: "bio_residence", label: "居住地" },
  { key: "bio_residence_years", label: "居住年数" },
  { key: "bio_strong_desire", label: "私の強い願望は" },
  { key: "bio_unknown_fact", label: "誰も知らない私" },
  { key: "bio_success_key", label: "私の成功の鍵は" },
];

const GAINS_ITEMS: Array<{ key: keyof Member; label: string; sub: string }> = [
  { key: "gains_goals", label: "Goals", sub: "目標" },
  { key: "gains_accomplishments", label: "Accomplishments", sub: "実績" },
  { key: "gains_interests", label: "Interests", sub: "興味" },
  { key: "gains_networks", label: "Networks", sub: "人脈" },
  { key: "gains_skills", label: "Skills", sub: "スキル" },
];

const KIND_LABELS: Record<WorksheetKind, string> = {
  bio: "メンバー略歴シート",
  gains: "G.A.I.N.S.ワークシート",
};

export default function MemberWorksheetModal({
  member,
  kind,
  onClose,
}: {
  member: Member;
  kind: WorksheetKind;
  onClose: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setGenerating(true);
    setError(null);
    try {
      registerPdfFonts();
      const photoDataUri = await resolveImageDataUri(
        member.photo_bust_url || member.photo_icon_url
      );
      const pdfDocument =
        kind === "bio" ? (
          <BioSheetDocument member={member} photoDataUri={photoDataUri} />
        ) : (
          <GainsWorksheetDocument member={member} photoDataUri={photoDataUri} />
        );
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${KIND_LABELS[kind]}_${member.name || member.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {KIND_LABELS[kind]} - {member.name}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating}
              className="flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
            >
              <Download size={12} />
              {generating ? "生成中..." : "PDFダウンロード"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              aria-label="閉じる"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

        {kind === "bio" ? (
          <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
            {BIO_ITEMS.map((item) => (
              <div key={item.key}>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                  {String(member[item.key] ?? "") || (
                    <span className="text-zinc-400 dark:text-zinc-600">未入力</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {GAINS_ITEMS.map((item) => (
              <div
                key={item.key}
                className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {item.label}({item.sub})
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                  {String(member[item.key] ?? "") || (
                    <span className="text-zinc-400 dark:text-zinc-600">未入力</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
