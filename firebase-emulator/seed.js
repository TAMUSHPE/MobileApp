/**
 * Seeds the local Firebase emulators with a handful of deterministic fixtures.
 *
 * Run by the `seed` service in docker-compose.yml. It reaches the emulators only
 * through FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST, so firebase-admin
 * never looks for a service-account key and this script can never touch production.
 *
 * Idempotent: document IDs are fixed and writes use set(), and an Auth user that
 * already exists is treated as success. Re-running is a no-op in effect.
 */
const admin = require("firebase-admin");

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "tamushpemobileapp";
const PASSWORD = "password123";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.error("Refusing to run: FIRESTORE_EMULATOR_HOST is not set, so this would write to a real project.");
    process.exit(1);
}

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const auth = admin.auth();

/**
 * Fixtures mirror the shapes in src/types/user.ts. `gender` lives on privateInfo.
 *
 * Two users exist on purpose: one already answered the gender question and one has
 * never been asked. The second is what GenderPromptModal keys off — it shows only
 * when privateInfo.gender is `undefined` — so signing in as that account is the way
 * to exercise the prompt locally.
 */
const USERS = [
    {
        uid: "seed-member-no-gender",
        email: "member@tamu.edu",
        displayName: "Seed Member",
        publicInfo: {
            name: "Seed Member",
            bio: "Existing account created before the gender step shipped.",
            major: "Computer Science",
            classYear: "2027",
            roles: { reader: true },
            points: 12,
            pointsThisMonth: 4,
            interests: ["Software"],
            isStudent: true,
            isEmailPublic: false,
        },
        privateInfo: {
            completedAccountSetup: true,
            settings: { darkMode: false, useSystemDefault: true },
            // No `gender` key at all — this is the account that triggers the prompt.
        },
    },
    {
        uid: "seed-officer-with-gender",
        email: "officer@tamu.edu",
        displayName: "Seed Officer",
        publicInfo: {
            name: "Seed Officer",
            bio: "Account that has already answered the gender question.",
            major: "Mechanical Engineering",
            classYear: "2026",
            roles: { reader: true, officer: true },
            points: 140,
            pointsThisMonth: 30,
            interests: ["Leadership"],
            isStudent: true,
            isEmailPublic: true,
        },
        privateInfo: {
            completedAccountSetup: true,
            settings: { darkMode: true, useSystemDefault: false },
            gender: "Prefer not to say",
        },
    },
];

const seedUser = async (user) => {
    try {
        await auth.createUser({
            uid: user.uid,
            email: user.email,
            emailVerified: true,
            password: PASSWORD,
            displayName: user.displayName,
        });
    } catch (err) {
        // A re-run hits an existing account; anything else is a real failure.
        if (err.code !== "auth/uid-already-exists" && err.code !== "auth/email-already-exists") {
            throw err;
        }
    }

    await db.doc(`users/${user.uid}`).set(
        { uid: user.uid, email: user.email, ...user.publicInfo },
        { merge: true }
    );
    await db.doc(`users/${user.uid}/private/privateInfo`).set(user.privateInfo, { merge: true });

    console.log(`  ${user.email} (${user.uid}) — gender: ${user.privateInfo.gender ?? "not set"}`);
};

const main = async () => {
    console.log(`Seeding project "${PROJECT_ID}" via ${process.env.FIRESTORE_EMULATOR_HOST}`);

    for (const user of USERS) {
        await seedUser(user);
    }

    // Read by fetchLatestVersion() in src/api/firebaseUtils.ts for the update banner.
    await db.doc("config/global").set({ latestVersion: "1.1.4" }, { merge: true });

    console.log(`Done. Sign in with any seeded email and the password "${PASSWORD}".`);
};

main().then(() => process.exit(0)).catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
