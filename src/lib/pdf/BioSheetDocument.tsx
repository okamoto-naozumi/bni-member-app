import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Member } from "@/lib/members";
import { getCategoryColor } from "@/lib/categoryColors";
import { PdfAvatar } from "@/lib/pdf/PdfAvatar";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    padding: 32,
    fontSize: 9.5,
    color: "#18181B",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#18181B",
    paddingBottom: 12,
    marginBottom: 16,
  },
  photo: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 700,
    marginRight: 6,
  },
  kana: {
    fontSize: 9,
    color: "#71717A",
  },
  metaLine: {
    fontSize: 9,
    color: "#52525B",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 14,
    marginBottom: 6,
    color: "#18181B",
    borderLeftWidth: 3,
    borderLeftColor: "#B45309",
    paddingLeft: 6,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 7.5,
    color: "#A1A1AA",
  },
  infoValue: {
    fontSize: 9.5,
    color: "#27272A",
    marginTop: 1,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#A1A1AA",
    textAlign: "center",
  },
});

interface BioSheetDocumentProps {
  member: Member;
  photoDataUri?: string | null;
}

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

export default function BioSheetDocument({ member, photoDataUri }: BioSheetDocumentProps) {
  const color = getCategoryColor(member.category);
  const filledItems = BIO_ITEMS.filter((item) => String(member[item.key] ?? "").trim());

  return (
    <Document title={`メンバー略歴シート_${member.name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <PdfAvatar
            name={member.name}
            dataUri={photoDataUri}
            width={64}
            height={64}
            borderRadius={32}
            style={styles.photo}
          />
          <View>
            <Text style={styles.title}>メンバー略歴シート</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{member.name}</Text>
              {member.name_kana ? <Text style={styles.kana}>({member.name_kana})</Text> : null}
            </View>
            {(member.chapter || member.role) && (
              <Text style={styles.metaLine}>
                {[member.chapter, member.role].filter(Boolean).join(" / ")}
              </Text>
            )}
            <View style={styles.badgeRow}>
              {member.category ? (
                <View style={[styles.badge, { backgroundColor: color.bg }]}>
                  <Text style={[styles.badgeText, { color: color.text }]}>{member.category}</Text>
                </View>
              ) : null}
              {member.company ? (
                <View style={[styles.badge, { backgroundColor: "#F4F4F5" }]}>
                  <Text style={[styles.badgeText, { color: "#3F3F46" }]}>{member.company}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>メンバー略歴</Text>
        {filledItems.length === 0 ? (
          <Text style={styles.infoValue}>登録されている項目がありません。</Text>
        ) : (
          <View style={styles.infoGrid}>
            {filledItems.map((item) => (
              <View key={item.key} style={styles.infoItem}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{String(member[item.key])}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          発行日: {new Date().toLocaleDateString("ja-JP")} ／ {member.chapter || "BNI"} メンバー略歴シート
        </Text>
      </Page>
    </Document>
  );
}
