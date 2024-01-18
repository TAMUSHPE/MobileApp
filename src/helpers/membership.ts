import { Timestamp } from "firebase/firestore";

export const isMemberVerified = (nationalExpiration: Timestamp | undefined, chapterExpiration: Timestamp | undefined) => {
    const nationalExpirationDate = nationalExpiration?.toDate();
    const chapterExpirationDate = chapterExpiration?.toDate();

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

export const formatExpirationDate = (date: Date | undefined): string => {
    if (!date) return '';
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
}
