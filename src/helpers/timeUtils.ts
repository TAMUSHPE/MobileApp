/** Anything added to this document needs to be added to functions/src/types/timeUtils.ts **/

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

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Constructs a readable string that represents the month and day of a given `Date` object
 * @param date 
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
    if (!date) {
        return "";
    }
    const dayOfWeek = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];

    return `${dayOfWeek}, ${month} ${day}`;
};

export const formatDateWithYear = (date: Date): string => {
    if (!date) {
        return "";
    }
    const dayOfWeek = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];

    return `${month} ${day}, ${date.getFullYear()}`;
};


/**
 * Constructs a readable string that represents the time of day of a given `Date` object
 * @param date 
 * @returns Formatted time string
 */
export const formatTime = (date: Date): string => {
    const hour = date.getHours();
    const minute = date.getMinutes();

    return `${hour % 12 == 0 ? 12 : hour % 12}:${minute.toString().padStart(2, '0')}${hour > 11 ? "pm" : "am"}`;
}

export const formatEventTime = (startDate: Date, endDate: Date): string => {
    const startHour = startDate.getHours();
    const endHour = endDate.getHours();
    const startMinute = startDate.getMinutes();
    const endMinute = endDate.getMinutes();

    const startAmPm = startHour >= 12 ? "pm" : "am";
    const endAmPm = endHour >= 12 ? "pm" : "am";

    const formattedStartTime = `${startHour % 12 === 0 ? 12 : startHour % 12}:${startMinute.toString().padStart(2, '0')}`;
    const formattedEndTime = `${endHour % 12 === 0 ? 12 : endHour % 12}:${endMinute.toString().padStart(2, '0')}${endAmPm}`;

    if (startAmPm === endAmPm) {
        return `${formattedStartTime} - ${formattedEndTime}`;
    }

    return `${formattedStartTime}${startAmPm} - ${formattedEndTime}`;
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



    if (isSameDay) {
        return `${formatDate(startTime)}`;
    } else if (isSameMonth) {
        return `${formatMonthDayOnly(startTime)} - ${endTime.getDate()}`;
    } else if (isSameYear) {
        return `${formatMonthDayOnly(startTime)} - ${formatDate(endTime)}`;
    } else {
        return `${formatDateWithYear(startTime)} - ${formatDateWithYear(endTime)}`;
    }
};