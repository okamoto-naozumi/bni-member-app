import { fetchMembers, restoreMembers, type Member } from "@/lib/members";
import {
  fetchReferralRequests,
  restoreReferralRequests,
  type ReferralRequest,
} from "@/lib/referralRequests";
import { fetchOneOnOnes, restoreOneOnOnes, type OneOnOne } from "@/lib/oneOnOnes";
import {
  fetchVisitorInvites,
  restoreVisitorInvites,
  type VisitorInvite,
} from "@/lib/visitorInvites";
import { fetchLibraryLinks, restoreLibraryLinks, type LibraryLink } from "@/lib/libraryLinks";
import { fetchPortfolios, restorePortfolios, type Portfolio } from "@/lib/portfolios";
import type { RestoreResult } from "@/lib/backupHelpers";

export const BACKUP_FORMAT_VERSION = 1;

export interface BackupBundle {
  format: "bni-enishi-backup";
  version: number;
  exported_at: string;
  members: Member[];
  referral_requests: ReferralRequest[];
  one_on_ones: OneOnOne[];
  visitor_invites: VisitorInvite[];
  library_links: LibraryLink[];
  portfolios: Portfolio[];
}

/**
 * members / referral_requests / one_on_ones / visitor_invites / library_links / portfolios の
 * 全件を1つのJSONにまとめて取得する。
 */
export async function buildBackupBundle(): Promise<BackupBundle> {
  const [members, referral_requests, one_on_ones, visitor_invites, library_links, portfolios] =
    await Promise.all([
      fetchMembers(),
      fetchReferralRequests(),
      fetchOneOnOnes(),
      fetchVisitorInvites(),
      fetchLibraryLinks(),
      fetchPortfolios(),
    ]);

  return {
    format: "bni-enishi-backup",
    version: BACKUP_FORMAT_VERSION,
    exported_at: new Date().toISOString(),
    members,
    referral_requests,
    one_on_ones,
    visitor_invites,
    library_links,
    portfolios,
  };
}

export interface RestoreSummary {
  members: RestoreResult;
  referral_requests: RestoreResult;
  one_on_ones: RestoreResult;
  visitor_invites: RestoreResult;
  library_links: RestoreResult;
  portfolios: RestoreResult;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * アップロードされたバックアップJSONから全テーブルを復元する。
 * referral_requests / one_on_ones / visitor_invites / portfolios は members.id への
 * 外部キー参照を持つため、members を先に復元してから残りを並行復元する
 * (順序を守らないと、実DBでは外部キー制約違反により復元が失敗しうる)。
 * 各テーブル・各レコードは個別に成否を判定するため、一部が失敗しても全体は止まらない
 * (「安全フォールバック」= 壊れたレコードだけスキップし、正常なレコードは復元し続ける)。
 */
export async function restoreBackupBundle(raw: unknown): Promise<RestoreSummary> {
  if (!raw || typeof raw !== "object") {
    throw new Error("バックアップファイルの形式が正しくありません(JSONオブジェクトではありません)。");
  }
  const bundle = raw as Partial<BackupBundle>;

  const members = await restoreMembers(asArray<Member>(bundle.members));

  const [referral_requests, one_on_ones, visitor_invites, library_links, portfolios] =
    await Promise.all([
      restoreReferralRequests(asArray<ReferralRequest>(bundle.referral_requests)),
      restoreOneOnOnes(asArray<OneOnOne>(bundle.one_on_ones)),
      restoreVisitorInvites(asArray<VisitorInvite>(bundle.visitor_invites)),
      restoreLibraryLinks(asArray<LibraryLink>(bundle.library_links)),
      restorePortfolios(asArray<Portfolio>(bundle.portfolios)),
    ]);

  return { members, referral_requests, one_on_ones, visitor_invites, library_links, portfolios };
}
