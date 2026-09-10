import { Document, Page, View, Text, Image, Link, StyleSheet } from "@react-pdf/renderer";
import type { Member } from "@/lib/members";
import { getCategoryColor } from "@/lib/categoryColors";
import { resolvePdfImageSrc } from "@/lib/pdf/imageSrc";

const REFERRAL_TIER_COLORS = {
  gold: { bg: "#FEF3C7", border: "#D97706", text: "#92400E" },
  silver: { bg: "#F1F5F9", border: "#94A3B8", text: "#475569" },
  bronze: { bg: "#FFEDD5", border: "#C2410C", text: "#9A3412" },
} as const;

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    padding: 32,
    fontSize: 9.5,
    color: "#18181B",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#18181B",
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    objectFit: "cover",
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
  qrBox: {
    width: 72,
    alignItems: "center",
  },
  qrImage: {
    width: 68,
    height: 68,
  },
  qrLabel: {
    fontSize: 6,
    color: "#A1A1AA",
    marginTop: 2,
    textAlign: "center",
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
    marginTop: 16,
    marginBottom: 6,
    color: "#18181B",
    borderLeftWidth: 3,
    borderLeftColor: "#18181B",
    paddingLeft: 6,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 6,
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
  link: {
    fontSize: 9,
    color: "#2563EB",
    textDecoration: "underline",
  },
  bodyText: {
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#27272A",
  },
  referralRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  referralCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  referralLabel: {
    fontSize: 8,
    fontWeight: 700,
  },
  referralValue: {
    fontSize: 8.5,
    marginTop: 3,
    lineHeight: 1.4,
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

interface OneToOneSheetDocumentProps {
  member: Member;
  qrCodeDataUrl?: string | null;
}

export default function OneToOneSheetDocument({
  member,
  qrCodeDataUrl,
}: OneToOneSheetDocumentProps) {
  const color = getCategoryColor(member.category);
  const photo = member.photo_bust_url || member.photo_icon_url;

  return (
    <Document title={`1to1シート_${member.name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop */}
            <Image src={() => resolvePdfImageSrc(photo)} style={styles.photo} />
            <View>
              <Text style={styles.title}>1to1 プロファイルシート</Text>
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
                    <Text style={[styles.badgeText, { color: color.text }]}>
                      {member.category}
                    </Text>
                  </View>
                ) : null}
                {member.team ? (
                  <View style={[styles.badge, { backgroundColor: "#E0E7FF" }]}>
                    <Text style={[styles.badgeText, { color: "#3730A3" }]}>{member.team}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {qrCodeDataUrl ? (
            <View style={styles.qrBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop */}
              <Image src={qrCodeDataUrl} style={styles.qrImage} />
              <Text style={styles.qrLabel}>デジタル名刺</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>基本情報・連絡先</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>会社名・事業名</Text>
            <Text style={styles.infoValue}>{member.company || "-"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>連絡先(電話番号)</Text>
            <Text style={styles.infoValue}>{member.contact || "-"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>メールアドレス</Text>
            <Text style={styles.infoValue}>{member.email || "-"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>HP</Text>
            {member.hp_url ? (
              <Link src={member.hp_url} style={styles.link}>
                {member.hp_url}
              </Link>
            ) : (
              <Text style={styles.infoValue}>-</Text>
            )}
          </View>
        </View>

        {member.comment ? (
          <>
            <Text style={styles.sectionTitle}>事業内容・コメント</Text>
            <Text style={styles.bodyText}>{member.comment}</Text>
          </>
        ) : null}

        {member.wanted_referral ? (
          <>
            <Text style={styles.sectionTitle}>欲しいリファーラル</Text>
            <Text style={styles.bodyText}>{member.wanted_referral}</Text>
          </>
        ) : null}

        {(member.gold_referral || member.silver_referral || member.bronze_referral) && (
          <>
            <Text style={styles.sectionTitle}>金・銀・銅のリファーラル</Text>
            <View style={styles.referralRow}>
              <View
                style={[
                  styles.referralCard,
                  {
                    backgroundColor: REFERRAL_TIER_COLORS.gold.bg,
                    borderColor: REFERRAL_TIER_COLORS.gold.border,
                  },
                ]}
              >
                <Text style={[styles.referralLabel, { color: REFERRAL_TIER_COLORS.gold.text }]}>
                  金のリファーラル
                </Text>
                <Text style={[styles.referralValue, { color: REFERRAL_TIER_COLORS.gold.text }]}>
                  {member.gold_referral || "-"}
                </Text>
              </View>
              <View
                style={[
                  styles.referralCard,
                  {
                    backgroundColor: REFERRAL_TIER_COLORS.silver.bg,
                    borderColor: REFERRAL_TIER_COLORS.silver.border,
                  },
                ]}
              >
                <Text style={[styles.referralLabel, { color: REFERRAL_TIER_COLORS.silver.text }]}>
                  銀のリファーラル
                </Text>
                <Text style={[styles.referralValue, { color: REFERRAL_TIER_COLORS.silver.text }]}>
                  {member.silver_referral || "-"}
                </Text>
              </View>
              <View
                style={[
                  styles.referralCard,
                  {
                    backgroundColor: REFERRAL_TIER_COLORS.bronze.bg,
                    borderColor: REFERRAL_TIER_COLORS.bronze.border,
                  },
                ]}
              >
                <Text style={[styles.referralLabel, { color: REFERRAL_TIER_COLORS.bronze.text }]}>
                  銅のリファーラル
                </Text>
                <Text style={[styles.referralValue, { color: REFERRAL_TIER_COLORS.bronze.text }]}>
                  {member.bronze_referral || "-"}
                </Text>
              </View>
            </View>
          </>
        )}

        {member.custom_fields.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>その他の項目</Text>
            <View style={styles.infoGrid}>
              {member.custom_fields.map((field, i) => (
                <View key={i} style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{field.key}</Text>
                  <Text style={styles.infoValue}>{field.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.footer}>
          発行日: {new Date().toLocaleDateString("ja-JP")} ／ {member.chapter || "BNI"} 1to1シート
        </Text>
      </Page>
    </Document>
  );
}
