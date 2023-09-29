import { signInAnonymously } from "firebase/auth";
import { db, auth, storage } from "../../config/firebaseConfig";
import { PrivateUserInfo, PublicUserInfo } from "../../types/User";
import { randomUint8Array, randomStr, randomStrRange } from "../../helpers/unitTestUtils"
import * as firebaseUtils from "../firebaseUtils";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref } from "firebase/storage";

// Creates an anonymous user account for testing. If this doesn't work, all other tests will fail.
beforeAll(async () => {
    await signInAnonymously(auth);
    expect(auth.currentUser).toBeTruthy();
});

// Cleans up any data created in firebase
afterAll(async () => {
    if (auth.currentUser) {
        await deleteObject(ref(storage, `user-docs/${auth.currentUser.uid}/test-file`));
        await deleteDoc(doc(db, "users", auth.currentUser?.uid, "private", "privateInfo"));
        await deleteDoc(doc(db, "users", auth.currentUser?.uid));
        await auth.currentUser?.delete();
    }
});


describe("Verify user data can be created and modified in firestore", () => {
    test("Test setting and getting publicUserInfo", async () => {
        const publicData: PublicUserInfo = {
            email: randomStrRange(0, 80),
            tamuEmail: randomStrRange(0, 80),
            displayName: randomStrRange(0, 80),
            photoURL: randomStrRange(0, 100),
            resumeURL: randomStrRange(0, 100),
            roles: {
                reader: Math.random() < 0.5,
                admin: Math.random() < 0.5,
                officer: Math.random() < 0.5,
                developer: Math.random() < 0.5,
            },
            name: randomStrRange(0, 80),
            bio: randomStrRange(0, 80),
            major: randomStrRange(0, 80),
            classYear: randomStrRange(0, 10),
            committees: [randomStrRange(0, 80), randomStrRange(0, 80)],
            pointsRank: Math.random() * 10000,
            rankChange: "same",
        };
        await firebaseUtils.setPublicUserData(publicData);

        await firebaseUtils.getPublicUserData().then((firebaseData) => {
            expect(firebaseData).toBeTruthy();
            expect(firebaseData).toMatchObject(publicData);
        });
    });

    test("Test setting and getting privateUserInfo", async () => {
        const privateData: PrivateUserInfo = {
            completedAccountSetup: Math.random() < 0.5,
            settings: {
                darkMode: Math.random() < 0.5,
            },
            expoPushTokens: [
                randomStr(50),
                randomStr(50),
                randomStr(50),
                randomStr(50),
            ],
        };

        await firebaseUtils.setPrivateUserData(privateData);
        await firebaseUtils.getPrivateUserData().then((firebaseData) => {
            expect(firebaseData).toBeTruthy();
            expect(firebaseData).toMatchObject(privateData);
        });
    });
});


describe("Verify firestore cloud storage works", () => {
    test("Upload bytes and verify bytes are uploaded correctly", async () => {
        var URL = "";
        const byteBuffer: ArrayBuffer = randomUint8Array().buffer;
        const uploadTask = firebaseUtils.uploadFileToFirebase(byteBuffer, `user-docs/${auth.currentUser?.uid}/test-file`);

        await new Promise((resolve, reject) => {
            uploadTask.on("state_changed",
                () => { },
                (error) => { reject(error) },
                async () => {
                    URL = await getDownloadURL(uploadTask.snapshot.ref)
                    resolve(null);
                },
            );
        });

        await fetch(URL).then(async (res) => {
            const resByteBuffer = await (await res.blob()).arrayBuffer();
            expect(resByteBuffer).toMatchObject(byteBuffer);
        });
    });
});
