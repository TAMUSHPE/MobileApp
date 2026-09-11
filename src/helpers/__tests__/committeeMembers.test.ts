import {
    CommitteeTeamMember,
    removeCommitteeMemberUid,
    removeCommitteeTeamMember,
} from '../committeeMembers';

const memberUids = ['lead-1', 'lead-2', 'lead-3'];
const teamMembers: CommitteeTeamMember[] = memberUids.map(uid => ({
    uid,
    name: uid,
}));

describe('committee leadership member removal', () => {
    test.each([
        ['first', memberUids, 'lead-1', ['lead-2', 'lead-3']],
        ['middle', memberUids, 'lead-2', ['lead-1', 'lead-3']],
        ['last', memberUids, 'lead-3', ['lead-1', 'lead-2']],
        ['only', ['lead-1'], 'lead-1', []],
    ])('removes only the %s member from stored and hydrated state', (_position, storedUids, uidToRemove, expectedUids) => {
        expect(removeCommitteeMemberUid(storedUids, uidToRemove)).toEqual(expectedUids);

        const hydratedMembers = teamMembers.filter(member => storedUids.includes(member.uid));
        expect(removeCommitteeTeamMember(hydratedMembers, uidToRemove).map(member => member.uid))
            .toEqual(expectedUids);
    });
});
