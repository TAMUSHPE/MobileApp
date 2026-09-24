import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { getConventionAttendanceData } from '../firebaseUtils';

jest.mock('../../config/firebaseConfig', () => ({
    auth: {},
    db: {},
    functions: {},
    storage: {},
}));

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
}));

jest.mock('firebase/storage', () => ({}));
jest.mock('firebase/functions', () => ({}));
jest.mock('firebase/auth', () => ({}));
jest.mock('expo-location', () => ({}));

const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

describe('getConventionAttendanceData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDoc.mockImplementation(((_db: unknown, ...segments: string[]) =>
            segments.join('/')) as unknown as typeof doc);
        mockCollection.mockImplementation(((_db: unknown, path: string) =>
            path) as unknown as typeof collection);
    });

    test('rejects the entire load when any event metadata read fails', async () => {
        const readError = new Error('event read failed');

        mockGetDoc.mockImplementation(async (reference) => {
            switch (reference as unknown as string) {
                case 'convention-tracking/member-1':
                    return {
                        exists: () => true,
                        data: () => ({ dateAdded: undefined }),
                    } as never;
                case 'events/event-1':
                    return {
                        exists: () => true,
                        data: () => ({ eventType: 'Workshop', name: 'Event 1' }),
                    } as never;
                case 'events/event-2':
                    throw readError;
                default:
                    throw new Error(`Unexpected document read: ${String(reference)}`);
            }
        });
        mockGetDocs.mockResolvedValue({
            docs: [
                { id: 'event-1', data: () => ({ eventId: 'event-1' }) },
                { id: 'event-2', data: () => ({ eventId: 'event-2' }) },
            ],
        } as never);

        await expect(getConventionAttendanceData('member-1')).rejects.toBe(readError);
    });
});
