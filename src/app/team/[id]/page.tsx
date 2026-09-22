"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users } from "lucide-react";
import { fetchSharedTeamById, type SharedTeam } from "@/lib/sharedTeams";
import { fetchMembers, type Member } from "@/lib/members";
import { generateQrDataUrl, memberProfileUrl } from "@/lib/qrcode";
import { getErrorMessage } from "@/lib/errorMessage";
import MemberCard from "@/components/MemberCard";
import MemberDetailModal from "@/components/MemberDetailModal";

export default function SharedTeamPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [team, setTeam] = useState<SharedTeam | null | undefined>(undefined);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchSharedTeamById(id), fetchMembers()])
      .then(([sharedTeam, allMembers]) => {
        setTeam(sharedTeam);
        if (sharedTeam) {
          const byId = new Map(allMembers.map((m) => [m.id, m]));
          setMembers(
            sharedTeam.member_ids
              .map((memberId) => byId.get(memberId))
              .filter((m): m is Member => Boolean(m))
          );
        }
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  useEffect(() => {
    const targets = members.filter((m) => m.show_qr_code);
    if (targets.length === 0) return;
    let cancelled = false;
    Promise.all(
      targets.map(async (m) => [m.id, await generateQrDataUrl(memberProfileUrl(m.id))] as const)
    ).then((entries) => {
      if (cancelled) return;
      setQrCodeMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => {
      cancelled = true;
    };
  }, [members]);

  if (team === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (team === null) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-500">共有ページが見つかりませんでした。URLをご確認ください。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Users size={20} className="text-zinc-400" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{team.name}</h1>
      </div>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {members.length}名のメンバーをご紹介します。
      </p>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {members.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">表示できるメンバーがいません。</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              qrCodeUrl={qrCodeMap[m.id]}
              onDetail={() => setDetailMember(m)}
            />
          ))}
        </div>
      )}

      {detailMember && (
        <MemberDetailModal member={detailMember} onClose={() => setDetailMember(null)} />
      )}
    </div>
  );
}
