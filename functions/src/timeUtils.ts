/**
 * Set of constants which can be used to do math with milliseconds
 */
export abstract class MillisecondTimes {
    static readonly YEAR = 31556952000;
    static readonly MONTH = 2629746000;
    static readonly DAY = 86400000;
    static readonly HOUR = 3600000;
    static readonly MINUTE = 60000;
    static readonly SECOND = 1000;
}

/**
 * Returns the number of milliseconds elapsed since midnight, January 1, 1970 Universal Coordinated Time (UTC) rounded up to the next hour. 
 * @returns unix timestamp of next hour
 */
export const getNextHourMillis = (): number => {
    const currentTime = Date.now();
    return currentTime + MillisecondTimes.HOUR - (currentTime % MillisecondTimes.HOUR);
}

export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Constructs a readable string that represents the month and day of a given `Date` object
 * @param date 
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${month} ${day} ${year}`;
}

/**
 * Constructs a readable string that represents the time of day of a given `Date` object
 * @param date 
 * @returns Formatted time string
 */
export const formatTime = (date: Date): string => {
    const hour = date.getHours();
    const minute = date.getMinutes();

    return `${hour % 12}:${minute.toString().padStart(2, '0')} ${hour > 11 ? "PM" : "AM"}`
}

/**
 * Constructs a readable string that represents the date and time of day of a given `Date` object and it's timezone offset.
 * @param date 
 * @returns Formatted date-time string
 */
export const formatDateTime = (date: Date): string => {
    return `${formatDate(date)}, ${formatTime(date)} GMT${date.getTimezoneOffset() < 0 ? "+" : "-"}${(date.getTimezoneOffset() / 60).toString().padStart(2, '0')}`
}

