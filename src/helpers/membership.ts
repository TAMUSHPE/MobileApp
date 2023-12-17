export const isMemberVerified = (nationalExpiration: Date|undefined, chapterExpiration:Date|undefined) => {
    const nationalExpirationString = nationalExpiration;
    const chapterExpirationString = chapterExpiration;

    const currentDate = new Date();
    let isNationalValid = true;
    let isChapterValid = true;

    if (nationalExpirationString) {
        const nationalExpirationDate = new Date(nationalExpirationString);
        isNationalValid = currentDate <= nationalExpirationDate;
    }

    if (chapterExpirationString) {
        const chapterExpirationDate = new Date(chapterExpirationString);
        isChapterValid = currentDate <= chapterExpirationDate;
    }

    return isNationalValid && isChapterValid
};

export const getBadgeColor = (isOfficer:boolean, isVerified:boolean) => {
    if (isOfficer) return '#FCE300';
    if (isVerified) return '#500000';
    return '';
};
