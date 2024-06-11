import { signInAnonymously } from "firebase/auth";
import { getPublicUserData, initializeCurrentUserData } from "../firebaseUtils";
import { auth, storage } from "../../config/firebaseConfig";

beforeAll(() => {
    signInAnonymously(auth);
});

describe("Testing environment is set up correctly", () => {
    test("Environment variables are setup", () => {
        expect(process.env.FIREBASE_AUTH_PORT).toBeDefined();
        expect(process.env.FIREBASE_CLOUD_FUNCTIONS_PORT).toBeDefined();
        expect(process.env.FIREBASE_FIRESTORE_PORT).toBeDefined();
        expect(process.env.FIREBASE_STORAGE_PORT).toBeDefined();

        expect(Number(process.env.FIREBASE_AUTH_PORT)).not.toBeNaN();
        expect(Number(process.env.FIREBASE_CLOUD_FUNCTIONS_PORT)).not.toBeNaN();
        expect(Number(process.env.FIREBASE_FIRESTORE_PORT)).not.toBeNaN();
        expect(Number(process.env.FIREBASE_STORAGE_PORT)).not.toBeNaN();
    });
});


describe("User Profile", () => {
    test("Initializes correctly", () => {
        // initializeCurrentUserData();

        // const user = getPublicUserData();
    });
});

