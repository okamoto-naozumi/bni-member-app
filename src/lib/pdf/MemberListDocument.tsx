import { Document, Page, View, Text, Image, Link, StyleSheet } from "@react-pdf/renderer";
import type { Member } from "@/lib/members";
import { getCategoryColor } from "@/lib/categoryColors";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    padding: 32,
    fontSize: 9,
    color: "#18181B",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: "#18181B",
    paddingBottom: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "NotoSansJP",
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  chapterName: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 4,
    color: "#DC2626",
  },
  slogan: {
    fontSize: 9,
    color: "#71717A",
    marginTop: 2,
  },
  metaBox: {
    alignItems: "flex-end",
  },
  metaText: {
    fontSize: 8,
    color: "#71717A",
    marginTop: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  photo: {
    width: 42,
    height: 54,
    borderRadius: 4,
    objectFit: "cover",
    marginRight: 8,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  name: {
    fontSize: 11,
    fontWeight: 700,
    marginRight: 4,
  },
  kana: {
    fontSize: 8,
    color: "#71717A",
  },
  role: {
    fontSize: 8,
    fontWeight: 700,
    color: "#B45309",
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 3,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 7,
    fontWeight: 700,
  },
  company: {
    fontSize: 8.5,
    marginTop: 3,
    color: "#3F3F46",
  },
  description: {
    fontSize: 8,
    marginTop: 2,
    color: "#52525B",
    lineHeight: 1.35,
  },
  hpLink: {
    fontSize: 7.5,
    marginTop: 3,
    color: "#2563EB",
    textDecoration: "underline",
  },
  qrBox: {
    width: 36,
    marginLeft: 6,
    alignItems: "center",
  },
  qrImage: {
    width: 34,
    height: 34,
  },
  qrLabel: {
    fontSize: 5.5,
    color: "#A1A1AA",
    marginTop: 1,
    textAlign: "center",
  },
  empty: {
    fontSize: 10,
    color: "#71717A",
    marginTop: 20,
    textAlign: "center",
  },
});

interface MemberListDocumentProps {
  members: Member[];
  chapterName: string;
  slogan: string;
  /** member.id -> QRコードのdata URL(表示ONのメンバーのみ) */
  qrCodeMap?: Record<string, string>;
}

export default function MemberListDocument({
  members,
  chapterName,
  slogan,
  qrCodeMap = {},
}: MemberListDocumentProps) {
  return (
    <Document title="BNI CHAPTER MEMBER LIST">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerRow} fixed>
          <View>
            <Text style={styles.title}>BNI CHAPTER MEMBER LIST</Text>
            {chapterName ? (
              <Text style={styles.chapterName}>{chapterName}</Text>
            ) : null}
            {slogan ? <Text style={styles.slogan}>{slogan}</Text> : null}
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaText}>
              発行日: {new Date().toLocaleDateString("ja-JP")}
            </Text>
            <Text style={styles.metaText}>メンバー数: {members.length}名</Text>
          </View>
        </View>

        {members.length === 0 ? (
          <Text style={styles.empty}>登録済みのメンバーがいません。</Text>
        ) : (
          <View style={styles.grid}>
            {members.map((member) => {
              const color = getCategoryColor(member.category);
              const photo = member.photo_bust_url || member.photo_icon_url;
              return (
                <View key={member.id} style={styles.card} wrap={false}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop */}
                  <Image src={photo} style={styles.photo} />
                  <View style={styles.info}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{member.name}</Text>
                      {member.name_kana ? (
                        <Text style={styles.kana}>({member.name_kana})</Text>
                      ) : null}
                    </View>
                    {member.role ? <Text style={styles.role}>{member.role}</Text> : null}
                    {member.category ? (
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: color.bg }]}>
                          <Text style={[styles.badgeText, { color: color.text }]}>
                            {member.category}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                    {member.company ? (
                      <Text style={styles.company}>{member.company}</Text>
                    ) : null}
                    {member.comment ? (
                      <Text style={styles.description}>{member.comment}</Text>
                    ) : null}
                    {member.hp_url ? (
                      <Link src={member.hp_url} style={styles.hpLink}>
                        {member.hp_url}
                      </Link>
                    ) : null}
                  </View>
                  {member.show_qr_code && qrCodeMap[member.id] ? (
                    <View style={styles.qrBox}>
                      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop */}
                      <Image src={qrCodeMap[member.id]} style={styles.qrImage} />
                      <Text style={styles.qrLabel}>デジタル名刺</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </Page>
    </Document>
  );
}
