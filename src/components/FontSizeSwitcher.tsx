"use client";

import { useEffect, useRef, useState } from "react";
import { ALargeSmall } from "lucide-react";
import {
  FONT_SIZE_OPTIONS,
  getStoredFontSizePreference,
  setStoredFontSizePreference,
  type FontSizePreference,
} from "@/lib/fontSize";

export default function FontSizeSwitcher() {
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState<FontSizePreference>(() =>
    getStoredFontSizePreference()
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function choose(value: FontSizePreference) {
    setPreference(value);
    setStoredFontSizePreference(value);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="文字サイズ"
        aria-label="文字サイズ"
        className="flex items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
      >
        <ALargeSmall size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-40 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          {FONT_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => choose(opt.value)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                preference === opt.value
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {opt.label}
              <span className="text-xs text-zinc-400">{opt.scalePercent}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
