import { createEvent, resolveEndTime, DEFAULT_EVENT_COLOR, type Event } from "@/lib/events";
import { ensureCategoryByName, type Category } from "@/lib/eventCategories";

/**
 * 14列構成のCSVフォーマット:
 * 1.タイトル 2.開始年 3.開始月 4.開始日 5.開始時間 6.終了年 7.終了月 8.終了日 9.終了時間
 * 10.詳細 11.場所 12.Zoomリンク 13.背景色 14.カテゴリ名
 */
export const CSV_HEADERS = [
  "タイトル",
  "開始年",
  "開始月",
  "開始日",
  "開始時間",
  "終了年",
  "終了月",
  "終了日",
  "終了時間",
  "詳細",
  "場所",
  "Zoomリンク",
  "背景色",
  "カテゴリ名",
] as const;

/** RFC4180風のCSV1行分の値をエスケープする(カンマ・改行・ダブルクォートを含む場合のみ引用符で囲む) */
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function splitDateTime(dateTime: string): { year: string; month: string; day: string; time: string } {
  const [datePart, timePart] = dateTime.split("T");
  const [year, month, day] = (datePart ?? "").split("-");
  return { year: year ?? "", month: month ?? "", day: day ?? "", time: timePart ?? "" };
}

export function serializeEventsCsv(events: Event[], categories: Category[]): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const rows = events.map((e) => {
    const start = splitDateTime(e.start_time);
    const end = splitDateTime(e.end_time);
    const fields = [
      e.title,
      start.year,
      start.month,
      start.day,
      start.time,
      end.year,
      end.month,
      end.day,
      end.time,
      e.description,
      e.location,
      e.zoom_url,
      e.color,
      e.category_id ? categoryMap.get(e.category_id) ?? "" : "",
    ];
    return fields.map(escapeCsvField).join(",");
  });
  // Excel等での文字化けを避けるためBOMを付与し、改行はCRLFで出力する
  return "﻿" + [CSV_HEADERS.join(","), ...rows].join("\r\n");
}

/** RFC4180風のCSVテキストを行×列の文字列配列にパースする(引用符内のカンマ・改行に対応) */
function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // 次の \n で行確定するのでここでは何もしない
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function pad2(value: string): string {
  return value.trim().padStart(2, "0");
}

/** "9:5" のような桁欠けの時刻表記を "09:05" に正規化する */
function normalizeTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "00:00";
  const [h, m = "00"] = trimmed.split(":");
  return `${pad2(h)}:${pad2(m)}`;
}

function buildDateTime(year: string, month: string, day: string, time: string): string {
  if (!year.trim() || !month.trim() || !day.trim()) return "";
  return `${year.trim()}-${pad2(month)}-${pad2(day)}T${normalizeTime(time)}`;
}

export interface ImportEventsResult {
  imported: number;
  createdCategories: string[];
  skipped: number;
}

/**
 * CSVテキストを読み込み、イベントを一件ずつ登録する。
 * カテゴリ名が既存 `categories` に存在しない場合は自動的に新規作成して紐付ける(名寄せ補完)。
 * 終了日時列が空欄の場合は開始日時を自動補完する。
 */
export async function importEventsFromCsv(
  text: string,
  existingCategories: Category[]
): Promise<ImportEventsResult> {
  const rows = parseCsvText(text);
  if (rows.length === 0) return { imported: 0, createdCategories: [], skipped: 0 };

  // 1行目がヘッダー行かどうかを判定する(1列目が "タイトル" ならヘッダーとみなしスキップ)
  const dataRows = rows[0][0]?.trim() === CSV_HEADERS[0] ? rows.slice(1) : rows;

  const categories = [...existingCategories];
  const createdCategories: string[] = [];
  let imported = 0;
  let skipped = 0;

  for (const row of dataRows) {
    const [
      title,
      startYear,
      startMonth,
      startDay,
      startTime,
      endYear,
      endMonth,
      endDay,
      endTime,
      description = "",
      location = "",
      zoomUrl = "",
      color = "",
      categoryName = "",
    ] = row;

    const start = buildDateTime(startYear ?? "", startMonth ?? "", startDay ?? "", startTime ?? "");
    if (!title?.trim() || !start) {
      skipped++;
      continue;
    }
    const endRaw = buildDateTime(endYear ?? "", endMonth ?? "", endDay ?? "", endTime ?? "");
    const end = resolveEndTime(start, endRaw);

    let category_id: string | null = null;
    if (categoryName?.trim()) {
      const { category, created } = await ensureCategoryByName(categoryName, categories);
      if (created) {
        categories.push(category);
        createdCategories.push(category.name);
      }
      category_id = category.id;
    }

    await createEvent({
      title: title.trim(),
      start_time: start,
      end_time: end,
      category_id,
      color: color?.trim() || DEFAULT_EVENT_COLOR,
      description: description?.trim() ?? "",
      location: location?.trim() ?? "",
      zoom_url: zoomUrl?.trim() ?? "",
    });
    imported++;
  }

  return { imported, createdCategories, skipped };
}
