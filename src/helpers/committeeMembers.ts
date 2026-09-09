import { PublicUserInfo } from '../types/user';

export type CommitteeTeamMember = PublicUserInfo & { uid: string };

export const isCommitteeTeamMember = (
    member: PublicUserInfo | undefined
): member is CommitteeTeamMember => Boolean(member?.uid);

/**
 * Fallback for a uid whose profile failed to hydrate (network/permission error,
 * not a deleted user). Keeps the uid visible and removable instead of silently
 * dropping it, which would let it get written back to Firestore unremovable.
 */
export const createFallbackTeamMember = (uid: string): CommitteeTeamMember => ({
    uid,
    name: `Unknown user (${uid})`,
});

export const removeCommitteeMemberUid = (
    memberUids: readonly string[] | undefined,
    uidToRemove: string
): string[] => (memberUids || []).filter(uid => uid !== uidToRemove);

export const removeCommitteeTeamMember = (
    members: readonly CommitteeTeamMember[] | undefined,
    uidToRemove: string
): CommitteeTeamMember[] => (members || []).filter(member => member.uid !== uidToRemove);
