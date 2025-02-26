/**
 * Represents a single day for SHPE-Gains posts
 */
export type SHPEGainsEvent = {
    unixTimestamp: number,
    dateString: string,
}

/**
 * Represents a post made by a user for SHPE-Gains
*/
export type SHPEGainsPost = {
    unixTimestamp: number,
    attachmentURI: string,
    caption: string,
}
