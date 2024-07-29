export const truncateStringWithEllipsis = (name: string | null | undefined, limit = 22) => {
    if (!name) {
        return;
    }
    if (name.length > limit) {
        return `${name.substring(0, limit)}...`;
    }
    return name;
};
