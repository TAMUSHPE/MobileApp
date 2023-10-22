import { auth } from "./firebaseConfig"
import * as functions from 'firebase-functions';

/**
 * Given a request header containing a `uid` and `roles` object, sets a user's custom claims to given `roles` object.
 * @throws `invalid-argument` if header does not contain uid and roles.
 * @throws `unauthenticated` if request does not contain authentication data.
 * @throws `permission-denied` if user does not have a custom claim for `admin`, `officer`, or `developer`.
*/
export const updateUserRole = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    } else if (typeof data.roles !== "object" || typeof data.uid !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data types passed into function");
    }

    const token = context.auth.token;
    if (token.admin !== true && token.officer !== true && token.developer !== true) {
        throw new functions.https.HttpsError("permission-denied", `Invalid credentials`);
    }

    return auth.getUser(data.uid).then((user) => {
        return auth.setCustomUserClaims(user.uid, data.roles);
    }).then(() => {
        return {
            status: 'success',
            message: `Success! User with uid ${data.uid} role has been updated to: ${JSON.stringify(data.roles)}`,
        };
    });
});
