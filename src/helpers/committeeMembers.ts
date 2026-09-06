import { PublicUserInfo } from '../types/user';

export type CommitteeTeamMember = PublicUserInfo & { uid: string };

export const isCommitteeTeamMember = (
    member: PublicUserInfo | undefined
): member is CommitteeTeamMember => Boolean(member?.uid);

export const removeCommitteeMemberUid = (
    memberUids: readonly string[] | undefined,
    uidToRemove: string
): string[] => (memberUids || []).filter(uid => uid !== uidToRemove);

export const removeCommitteeTeamMember = (
    members: readonly CommitteeTeamMember[] | undefined,
    uidToRemove: string
): CommitteeTeamMember[] => (members || []).filter(member => member.uid !== uidToRemove);
