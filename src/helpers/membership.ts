import { Timestamp } from "firebase/firestore";

export const isMemberVerified = (nationalExpiration: Timestamp | { seconds: number; nanoseconds: number; } | undefined, chapterExpiration: Timestamp | { seconds: number; nanoseconds: number; } | undefined) => {
    if (!nationalExpiration || !chapterExpiration) return false;

    const nationalExpirationDate = nationalExpiration instanceof Timestamp ? nationalExpiration.toDate() : nationalExpiration ? new Date(nationalExpiration.seconds * 1000) : undefined;
    const chapterExpirationDate = chapterExpiration instanceof Timestamp ? chapterExpiration.toDate() : chapterExpiration ? new Date(chapterExpiration.seconds * 1000) : undefined;

    const currentDate = new Date();
    let isNationalValid = true;
    let isChapterValid = true;

    if (nationalExpirationDate) {
        isNationalValid = currentDate <= nationalExpirationDate;
    }

    if (chapterExpirationDate) {
        isChapterValid = currentDate <= chapterExpirationDate;
    }

    return isNationalValid && isChapterValid
};

export const getBadgeColor = (isOfficer: boolean, isVerified: boolean) => {
    if (isOfficer) return '#FCE300';
    if (isVerified) return '#500000';
    return '';
};


export const formatExpirationDate = (expiration: Timestamp | { seconds: number; nanoseconds: number; } | undefined): string => {
    if (!expiration) return ''; // Handle undefined cases
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    const expirationDate = expiration instanceof Timestamp ? expiration.toDate() : new Date(expiration.seconds * 1000);

    return new Intl.DateTimeFormat('en-US', options).format(expirationDate);
};
