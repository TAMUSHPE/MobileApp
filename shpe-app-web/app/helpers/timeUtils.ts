/** ===================================================================================
 *  The content below should only be changed to match MobileApp/src/types/Events.ts

 *  You may manually add any imports above at the top of this file if needed
 *  ===================================================================================
 *  */



/**
 * Set of constants which can be used to do math with milliseconds
 */
export abstract class MillisecondTimes {
    static readonly YEAR = 31556952000;
    static readonly MONTH = 2629746000;
    static readonly WEEK = 604800000;
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

    return `${month} ${day}, ${year}`;
}

/**
 * Constructs a readable string that represents the time of day of a given `Date` object
 * @param date 
 * @returns Formatted time string
 */
export const formatTime = (date: Date): string => {
    const hour = date.getHours();
    const minute = date.getMinutes();

    return `${hour % 12 == 0 ? 12 : hour % 12}:${minute.toString().padStart(2, '0')} ${hour > 11 ? "PM" : "AM"}`
}

/**
 * Constructs a readable string that represents the date and time of day of a given `Date` object and it's timezone offset.
 * @param date 
 * @returns Formatted date-time string
 */
export const formatDateTime = (date: Date): string => {
    return `${formatDate(date)}, ${formatTime(date)} GMT${date.getTimezoneOffset() < 0 ? "+" : "-"}${(date.getTimezoneOffset() / 60).toString().padStart(2, '0')}`
}

export const formatEventDate = (startTime: Date, endTime: Date) => {
    const isSameDay = startTime.getDate() === endTime.getDate() &&
        startTime.getMonth() === endTime.getMonth() &&
        startTime.getFullYear() === endTime.getFullYear();

    const isSameMonth = startTime.getMonth() === endTime.getMonth() &&
        startTime.getFullYear() === endTime.getFullYear();

    const isSameYear = startTime.getFullYear() === endTime.getFullYear();
    const formatMonthDayOnly = (date: Date): string => {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];

        return `${month} ${day}`;
    }

    const formatDayYearOnly = (date: Date): string => {
        const day = date.getDate();
        const year = date.getFullYear();

        return `${day} ${year}`;
    }

    if (isSameDay) {
        return `${formatDate(startTime)}`;
    } else if (isSameMonth) {
        return `${formatMonthDayOnly(startTime)}-${formatDayYearOnly(endTime)}`;
    } else if (isSameYear) {
        return `${formatMonthDayOnly(startTime)}-${formatDate(endTime)}`;
    } else {
        return `${formatDate(startTime)} - ${formatDate(endTime)}`;
    }
};

/**
 * Constructs a readable string that represents the hour of the day from 12 AM to 11 PM
 * @param hour 
 * @returns Formatted hour string
 */
export const formatHour = (hour: number): string => {
    if (hour >= 0 && hour <= 23) {
        let formattedHour = hour % 12;
        if (formattedHour === 0) {
            formattedHour = 12;
        }
        return `${formattedHour} ${hour > 11 ? "PM" : "AM"}`
    }
    else {
        return "Invalid hour"
    }
}