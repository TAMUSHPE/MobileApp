import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig";
import { HttpsError } from 'firebase-functions/v1/auth';
import { SHPEGainsEvent, SHPEGainsPost } from './types/shpeGains';

const formatDateToDocumentName = (date: Date) => {
    const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/Chicago" }).format(date);
    const month = new Intl.DateTimeFormat("en", { month: "short", timeZone: "America/Chicago" }).format(date);
    const day = new Intl.DateTimeFormat("en", { day: "2-digit", timeZone: "America/Chicago" }).format(date);

    return `${month}-${day}-${year}`;
}

/**
 * Automatically creates a document every day for SHPE Gains to aggregate all the posts of that day
 */
export const createSHPEGainsEvent = functions.pubsub.schedule("every day 00:00").timeZone('America/Chicago').onRun(async (_) => {
    const currentDate = new Date();
    const documentRef = db.doc(`shpe-gains/${formatDateToDocumentName(currentDate)}`);
    const data: SHPEGainsEvent = {
        unixTimestamp: currentDate.getTime(),
        dateString: currentDate.toLocaleDateString("en-us", { year: "numeric", month: "long", day: "2-digit", timeZone: "America/Chicago" }),
    }

    documentRef.set(data);
});

export const createSHPEGainsPost = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    }

    const currentDate = new Date();
    const postDocumentName = `${context.auth.uid}-${formatDateToDocumentName(currentDate)}`;
    const publicPostDocRef = db.doc(`shpe-gains/${formatDateToDocumentName(currentDate)}/posts/${postDocumentName}`);
    const personalArchiveDocRef = db.doc(`users/${context.auth.uid}/shpe-gains-posts/${postDocumentName}`);

    const postData: SHPEGainsPost = {
        unixTimestamp: currentDate.getTime(),
        caption: data.caption,
        attachmentURI: data.attachmentURI
    }

    await db.runTransaction(async (transaction) => {
        return transaction
            .set(publicPostDocRef, postData)
            .set(personalArchiveDocRef, postData);
    }).then(() => {
        functions.logger.log(`Successfully created SHPEGains post by user ${context.auth?.uid}`);
    }).catch((err) => {
        functions.logger.error("Error occurred while creating SHPEGains post: ", err);
        throw new HttpsError("aborted", "Issue occurred while creating post documents");
    });
});
