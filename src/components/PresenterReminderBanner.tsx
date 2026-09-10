"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { fetchPresentations, getNextPresentation, daysUntil, type Presentation } from "@/lib/presentations";
import { fetchMembers } from "@/lib/members";

export default function PresenterReminderBanner() {
  const [next, setNext] = useState<Presentation | null>(null);
  const [presenterName, setPresenterName] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([fetchPresentations(), fetchMembers()])
      .then(([presentations, members]) => {
        const upcoming = getNextPresentation(presentations);
        setNext(upcoming);
        if (upcoming?.member_id) {
          setPresenterName(members.find((m) => m.id === upcoming.member_id)?.name ?? "");
        }
      })
      .catch(() => setNext(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !next) return null;

  const days = daysUntil(next.presentation_date);
  const dateLabel = new Date(`${next.presentation_date}T00:00:00`).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
  });
  const countdownLabel = days === 0 ? "本日" : days > 0 ? `資料準備まであと${days}日` : "";

  return (
    <Link
      href="/presenters"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
    >
      <CalendarClock size={16} className="shrink-0" />
      <span>
        次回のメインプレゼンター: <strong>{dateLabel}</strong>
        {presenterName ? `(${presenterName}さん)` : ""}
      </span>
      {countdownLabel && (
        <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white dark:bg-amber-500">
          {countdownLabel}
        </span>
      )}
    </Link>
  );
}
