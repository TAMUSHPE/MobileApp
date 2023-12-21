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

export const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = monthNames[date.getMonth()];

    return `${month} ${day}`;
}

export const formatTime = (date: Date) => {
    const hour = date.getHours();
    const minute = date.getMinutes();

    return `${hour % 12}:${minute.toString().padStart(2, '0')} ${hour > 11 ? "PM" : "AM"}`
}

