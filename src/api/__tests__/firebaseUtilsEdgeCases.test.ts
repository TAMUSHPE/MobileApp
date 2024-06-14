import { auth } from "../../config/firebaseConfig";
import { getPrivateUserData, getPublicUserData, setPrivateUserData, setPublicUserData } from "../firebaseUtils";


test("Getter functions throw errors when user is unauthenticated", async () => {
    expect(auth.currentUser).toBeNull();

    await expect(getPublicUserData).rejects.toThrow();
    await expect(getPrivateUserData).rejects.toThrow();
});

test("Setter functions throw errors when user is unauthenticated", async () => {
    expect(auth.currentUser).toBeNull();

    await expect(setPublicUserData({})).rejects.toThrow();
    await expect(setPrivateUserData({})).rejects.toThrow();
});