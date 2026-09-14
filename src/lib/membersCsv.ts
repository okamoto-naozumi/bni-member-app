import { createMember, updateMember, type CustomField, type Member, type MemberInput } from "@/lib/members";

/**
 * 40列構成のCSVフォーマット。写真・添付ファイル(photo_icon_url等)はURLが長大かつ
 * バイナリアップロード由来のためCSVでの往復編集に向かず、対象外としている
 * (これらは既存メンバーであれば更新時にそのまま維持される)。
 */
export const CSV_HEADERS = [
  "ID",
  "所属チャプター",
  "役職",
  "氏名",
  "フリガナ",
  "会社名",
  "カテゴリ",
  "チーム",
  "欲しいリファーラル",
  "金のリファーラル",
  "銀のリファーラル",
  "銅のリファーラル",
  "紹介文",
  "連絡先",
  "メールアドレス",
  "HPリンク",
  "デジタル名刺URL",
  "LINE URL",
  "Instagram URL",
  "Facebook URL",
  "QRコード表示",
  "1to1シートURL",
  "過去に経験した職業",
  "配偶者",
  "家族",
  "ペット",
  "趣味",
  "その他の関心事",
  "出身地",
  "居住地",
  "居住年数",
  "私の強い願望は",
  "誰も知らない私",
  "私の成功の鍵は",
  "GAINS_Goals",
  "GAINS_Accomplishments",
  "GAINS_Interests",
  "GAINS_Networks",
  "GAINS_Skills",
  "カスタム項目(JSON)",
] as const;

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeMembersCsv(members: Member[]): string {
  const rows = members.map((m) => {
    const fields = [
      m.id,
      m.chapter,
      m.role,
      m.name,
      m.name_kana,
      m.company,
      m.category,
      m.team,
      m.wanted_referral,
      m.gold_referral,
      m.silver_referral,
      m.bronze_referral,
      m.comment,
      m.contact,
      m.email,
      m.hp_url,
      m.digital_card_url,
      m.line_url,
      m.instagram_url,
      m.facebook_url,
      m.show_qr_code ? "TRUE" : "FALSE",
      m.one_to_one_sheet_url,
      m.bio_past_occupation,
      m.bio_spouse,
      m.bio_family,
      m.bio_pet,
      m.bio_hobby,
      m.bio_other_interests,
      m.bio_hometown,
      m.bio_residence,
      m.bio_residence_years,
      m.bio_strong_desire,
      m.bio_unknown_fact,
      m.bio_success_key,
      m.gains_goals,
      m.gains_accomplishments,
      m.gains_interests,
      m.gains_networks,
      m.gains_skills,
      JSON.stringify(m.custom_fields ?? []),
    ];
    return fields.map((v) => escapeCsvField(String(v ?? ""))).join(",");
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

function parseCustomFields(raw: string): CustomField[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((f): f is CustomField => typeof f?.key === "string" && typeof f?.value === "string")
      .map((f) => ({ key: f.key, value: f.value }));
  } catch {
    return [];
  }
}

function rowToMemberInput(row: string[]): { id: string; input: MemberInput } {
  const [
    id = "",
    chapter = "",
    role = "",
    name = "",
    name_kana = "",
    company = "",
    category = "",
    team = "",
    wanted_referral = "",
    gold_referral = "",
    silver_referral = "",
    bronze_referral = "",
    comment = "",
    contact = "",
    email = "",
    hp_url = "",
    digital_card_url = "",
    line_url = "",
    instagram_url = "",
    facebook_url = "",
    show_qr_code = "",
    one_to_one_sheet_url = "",
    bio_past_occupation = "",
    bio_spouse = "",
    bio_family = "",
    bio_pet = "",
    bio_hobby = "",
    bio_other_interests = "",
    bio_hometown = "",
    bio_residence = "",
    bio_residence_years = "",
    bio_strong_desire = "",
    bio_unknown_fact = "",
    bio_success_key = "",
    gains_goals = "",
    gains_accomplishments = "",
    gains_interests = "",
    gains_networks = "",
    gains_skills = "",
    customFieldsRaw = "",
  ] = row;

  return {
    id: id.trim(),
    input: {
      chapter: chapter.trim(),
      role: role.trim(),
      name: name.trim(),
      name_kana: name_kana.trim(),
      company: company.trim(),
      category: category.trim(),
      team: team.trim(),
      wanted_referral: wanted_referral.trim(),
      gold_referral: gold_referral.trim(),
      silver_referral: silver_referral.trim(),
      bronze_referral: bronze_referral.trim(),
      comment: comment.trim(),
      contact: contact.trim(),
      email: email.trim(),
      hp_url: hp_url.trim(),
      custom_fields: parseCustomFields(customFieldsRaw),
      digital_card_url: digital_card_url.trim(),
      line_url: line_url.trim(),
      instagram_url: instagram_url.trim(),
      facebook_url: facebook_url.trim(),
      show_qr_code: /^(true|1|yes|on)$/i.test(show_qr_code.trim()),
      one_to_one_sheet_url: one_to_one_sheet_url.trim(),
      bio_past_occupation: bio_past_occupation.trim(),
      bio_spouse: bio_spouse.trim(),
      bio_family: bio_family.trim(),
      bio_pet: bio_pet.trim(),
      bio_hobby: bio_hobby.trim(),
      bio_other_interests: bio_other_interests.trim(),
      bio_hometown: bio_hometown.trim(),
      bio_residence: bio_residence.trim(),
      bio_residence_years: bio_residence_years.trim(),
      bio_strong_desire: bio_strong_desire.trim(),
      bio_unknown_fact: bio_unknown_fact.trim(),
      bio_success_key: bio_success_key.trim(),
      gains_goals: gains_goals.trim(),
      gains_accomplishments: gains_accomplishments.trim(),
      gains_interests: gains_interests.trim(),
      gains_networks: gains_networks.trim(),
      gains_skills: gains_skills.trim(),
    },
  };
}

export interface ImportMembersResult {
  created: number;
  updated: number;
  skipped: number;
}

/**
 * CSVテキストを読み込み、メンバーを一件ずつ登録・更新する。
 * ID列が既存メンバーのIDと一致する場合は更新、一致しない(または空欄)場合は新規登録する。
 * 写真・添付ファイル等CSVに含まれない項目は、更新時は既存の値をそのまま維持する。
 */
export async function importMembersFromCsv(
  text: string,
  existingMembers: Member[]
): Promise<ImportMembersResult> {
  const rows = parseCsvText(text);
  if (rows.length === 0) return { created: 0, updated: 0, skipped: 0 };

  const dataRows = rows[0][0]?.trim() === CSV_HEADERS[0] ? rows.slice(1) : rows;
  const existingById = new Map(existingMembers.map((m) => [m.id, m]));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of dataRows) {
    const { id, input } = rowToMemberInput(row);
    if (!input.name) {
      skipped++;
      continue;
    }

    const existing = id ? existingById.get(id) : undefined;
    if (existing) {
      await updateMember(
        existing.id,
        input,
        {},
        {
          photo_icon_url: existing.photo_icon_url,
          photo_bust_url: existing.photo_bust_url,
          attachment_url: existing.attachment_url,
          attachment_name: existing.attachment_name,
          one_to_one_attachment_url: existing.one_to_one_attachment_url,
          one_to_one_attachment_name: existing.one_to_one_attachment_name,
        }
      );
      updated++;
    } else {
      await createMember(input, {});
      created++;
    }
  }

  return { created, updated, skipped };
}
