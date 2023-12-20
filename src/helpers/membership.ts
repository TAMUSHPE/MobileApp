export const isMemberVerified = (nationalExpiration: string|undefined, chapterExpiration:string|undefined) => {
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

export const formatExpirationDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
}
