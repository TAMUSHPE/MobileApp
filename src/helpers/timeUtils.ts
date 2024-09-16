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

/**
 * Constructs a readable string that represents the date and time of day of a given `Date` object and it's timezone offset.
 * @param date 
 * @returns Formatted date-time string
 */
export const formatDateTime = (date: Date): string => {
    return `${formatDate(date)}, ${formatTime(date)} GMT${date.getTimezoneOffset() < 0 ? "+" : "-"}${(date.getTimezoneOffset() / 60).toString().padStart(2, '0')}`
}

export const formatEventDate = (startTime: Date, endTime: Date): string => {
    // Formats the date as "Monday, September 16"
    const formatFullDate = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Formats the date as "September 16"
    const formatMonthDay = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Formats the date as "September 16, 2024"
    const formatMonthDayYear = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Check if start and end times are on the same day, month, or year
    const isSameDay = startTime.getDate() === endTime.getDate() &&
        startTime.getMonth() === endTime.getMonth() &&
        startTime.getFullYear() === endTime.getFullYear();

    const isSameMonth = startTime.getMonth() === endTime.getMonth() &&
        startTime.getFullYear() === endTime.getFullYear();

    const isSameYear = startTime.getFullYear() === endTime.getFullYear();

    if (isSameDay) {
        return formatFullDate(startTime); // "Monday, September 16"
    } else if (isSameMonth) {
        return `${formatMonthDay(startTime)} - ${endTime.getDate()}`; // "September 16 - 17"
    } else if (isSameYear) {
        return `${formatMonthDay(startTime)} - ${formatMonthDay(endTime)}`; // "September 16 - October 18"
    } else {
        return `${formatMonthDayYear(startTime)} - ${formatMonthDayYear(endTime)}`; // "December 17, 2024 - December 18, 2025"
    }
};


export const formatEventDateTime = (startTime: Date, endTime: Date): string => {
    // Formats the date as "Monday, September 16"
    const formatFullDate = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Formats the date as "September 16"
    const formatMonthDay = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Formats the date as "September 16, 2024"
    const formatMonthDayYear = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Formats the time as "1:00pm"
    const formatTime = (date: Date): string => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const amPm = hours >= 12 ? 'pm' : 'am';
        const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
        const formattedMinute = minutes.toString().padStart(2, '0');
        return `${formattedHour}:${formattedMinute}${amPm}`;
    };

    const isSameDay = startTime.getDate() === endTime.getDate() &&
        startTime.getMonth() === endTime.getMonth() &&
        startTime.getFullYear() === endTime.getFullYear();

    const isSameMonth = startTime.getMonth() === endTime.getMonth() &&
        startTime.getFullYear() === endTime.getFullYear();

    const isSameYear = startTime.getFullYear() === endTime.getFullYear();

    if (isSameDay) {
        return `${formatFullDate(startTime)}, ${formatTime(startTime)} - ${formatTime(endTime)}`; // "Monday, September 16, 1:00pm - 2:00pm"
    } else if (isSameMonth) {
        return `${formatMonthDay(startTime)}, ${formatTime(startTime)} - ${formatMonthDay(endTime)}, ${formatTime(endTime)}`; // "September 16, 1:00pm - September 17, 2:00pm"
    } else if (isSameYear) {
        return `${formatMonthDay(startTime)}, ${formatTime(startTime)} - ${formatMonthDay(endTime)}, ${formatTime(endTime)}`; // "September 16, 1:00pm - October 18, 2:00pm"
    } else {
        return `${formatMonthDayYear(startTime)}, ${formatTime(startTime)} - ${formatMonthDayYear(endTime)}, ${formatTime(endTime)}`; // "December 17, 2024, 1:00pm - December 18, 2025, 2:00pm"
    }
};

export const formatEventTime = (startDate: Date, endDate: Date): string => {
    // Helper function to format time
    const formatTime = (date: Date): string => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const amPm = hours >= 12 ? 'pm' : 'am';
        const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
        const formattedMinute = minutes.toString().padStart(2, '0');
        return `${formattedHour}:${formattedMinute}${amPm}`;
    };

    const startFormatted = formatTime(startDate);
    const endFormatted = formatTime(endDate);

    // Format time range output
    return `${startFormatted} - ${endFormatted}`;
};
