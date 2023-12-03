import { Alert } from "react-native";

/**
 * Matches generic email pattern. {name}@{second-level domain}.{top-level domain}
 * @param email Email of user
 * @param alertUser 
 * @returns If email is a valid email according to firebase's standards
 */
export const validateEmail = (email: any, alertUser: boolean = false): boolean => {
    const emailRegex: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    const isValid = typeof email == 'string' && emailRegex.test(email);

    if (!isValid && alertUser) {
        Alert.alert("Invalid email address.", "Make sure you spelled your email correctly (eg. bob@gmail.com)");
    }

    return isValid;
};

/**
 * Matches TAMU email pattern. {name}@tamu.edu
 * @param email Email of user
 * @param alertUser Whether or not to alert the user of any issues
 * @returns If email is a valid tamu email
 */
export const validateTamuEmail = (email: any, alertUser: boolean = false): boolean => {
    const emailRegex: RegExp = /^[A-Z0-9._%+-]+@(tamu.edu)$/i;
    const isValid = typeof email == 'string' && emailRegex.test(email);

    if (!isValid && alertUser) {
        Alert.alert("Invalid TAMU email address", "Make sure your email follows the convention: NetID@tamu.edu");
    }

    return isValid;
};

/**
 * Matches passwords with 6-64 characters with characters being alphanumeric or any special characters on a standard qwerty keyboard
 * @param password Password of user
 * @param alertUser Whether or not to alert the user of any issues
 * @returns If password is valid
 */
export const validatePassword = (password: any, alertUser: boolean = false): boolean => {
    const passwordRegex: RegExp = /^[A-Z0-9 !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]{6,64}$/i;
    const isValid = typeof password == 'string' && passwordRegex.test(password);

    if (!isValid && alertUser) {
        Alert.alert("Invalid password.", "Password must be between 6-64 characters long and use valid characters.");
    }

    return isValid;
};

/**
 * Checks if a display name is within a length of 1-80
 * @param displayName Name that is displayed on user's profile
 * @param alertUser Whether or not to alert the user of any issues
 * @returns If the display name is valid
 */
export const validateDisplayName = (displayName: any, alertUser: boolean = false): boolean => {
    const isValid = typeof displayName == 'string' && displayName.length > 0 && displayName.length <= 80

    if (!isValid && alertUser) {
        Alert.alert("Invalid display name.", "Display name must be between 1-80 characters long.");
    }

    return isValid;
};

/**
 * Checks if a name is both within a length of 1-255.
 * @param name Name that is displayed as user's real name
 * @param alertUser Whether or not to alert the user of any issues
 * @returns If the name is valid
 */
export const validateName = (name: any, alertUser: boolean = false): boolean => {
    const isValid = typeof name == 'string' && name.length > 0 && name.length <= 255;

    if (!isValid && alertUser) {
        Alert.alert("Name too short or too long.", "Please enter a name between 1-255 characters long.");
    }

    return isValid;
}

/**
 * Container of immutable constant lists of common mime types. These can be used along with validateFileBlob()
 * for any non-specific blob validation.
 */
export abstract class CommonMimeTypes {
    static readonly IMAGE_FILES = [
        "image/bmp",
        "image/gif",
        "image/vnd.microsoft.icon", // .ico
        "image/jpeg",
        "image/png",
        "image/avif",
        "image/svg+xml",
        "image/tiff",
        "image/webp",
        "image/cgm",
        "image/heic",
    ];
    static readonly TEXT_FILES = [
        "text/css",
        "text/javascript",
        "text/html",
        "text/csv",
        "text/plain",
    ];
    static readonly RESUME_FILES = [
        "application/pdf"
    ];
};

/**
 * Validates whether or not a given file blob matches a given list of mime types
 * @param file File blob 
 * @param allowedMimeTypes List of mime types to allow
 * @param maxSize The largest size file allowed in bytes. Defaults to 8MB (8388608 or 2^23)
 * @param alertUser Whether or not to alert the user of any issues
 * @returns If file is valid
 * @example
 * const userFile: Blob;
 * const allowedMimeTypes = ["image/png", "image/jpeg", "image/gif"];
 * 
 * if (validateFileBlob(userFile, allowedMimeTypes)) {
 *     console.log("Valid File");
 * }
 * @example
 * const userFile: Blob;
 * 
 * if (validateFileBlob(userFile, CommonMimeTypes.TEXT_FILES)) {
 *     console.log("Valid File");
 * }
 */
export const validateFileBlob = (file: Blob, allowedMimeTypes: Array<string>, alertUser: boolean = false, maxSize: number = 8388608): boolean => {
    const isValidMimeType = allowedMimeTypes.includes(file.type)
    const isValidSize = file.size < maxSize;
    const bytesInMegabyte = 1048576;

    if (!isValidMimeType && alertUser) {
        Alert.alert("Invalid File Type", `${file.type} is not a supported file type for this action.`);
    }
    else if (!isValidSize && alertUser) {
        Alert.alert("Your File is Too Big", `Your file is ${file.size / bytesInMegabyte} MB where a maximum of ${maxSize / bytesInMegabyte} MB is allowed.`);
    }

    return isValidMimeType && isValidSize;
}

/** Values used for password strength calculation */
export enum PasswordStrength {
    INVALID = 0,
    WEAK = 1,
    AVERAGE = 2,
    STRONG = 3
};

/**
 * Determines strength of a password based on certain conditions:
 *   - Invalid passwords are less than 4 characters long or use invalid characters defined in validatePassword()
 *   - Weak passwords are less than 7 characters long
 *   - Average passwords are either less than 10 characters long or are just a collection of letters or numbers that are less than 14 characters long
 *   - Strong passwords are greater than 10 characters and contain special characters or are greater than 14 characters
 * @param password User's password to check strength
 * @returns PasswordStrength enumerated value INVALID, WEAK, AVERAGE, or STRONG.
 */
export const evaluatePasswordStrength = (password: string): number => {
    const averagePasswordRegex: RegExp = /^[A-Z ]{7,14}$|^[0-9]{7,14}$/i;
    if (!validatePassword(password, false)) {
        return PasswordStrength.INVALID;
    }
    else if (password.length <= 7) {
        return PasswordStrength.WEAK;
    }
    else if ((averagePasswordRegex.test(password) || password.length < 10)) {
        return PasswordStrength.AVERAGE;
    }
    else {
        return PasswordStrength.STRONG;
    }
};

/**
 * Validates a username based on certain conditions:
 *   - Usernames must be alphanumeric and can include underscores or hyphens
 *   - Usernames must not include spaces or other special characters
 *   - This function can be extended to include length checks or other criteria
 * @param username User's username to check
 * @param alertUser Whether or not to alert the user of any issues
 * @returns If the username is valid
 */
export const validateUsername = (username: string, alertUser: boolean = false): boolean => {
    const usernameRegex: RegExp = /^[A-Za-z0-9_-]+$/;
    const isValid = typeof username == 'string' && usernameRegex.test(username);

    if (!isValid && alertUser) {
        Alert.alert("Invalid Username", "Usernames must only contain letters, numbers, underscores, or hyphens.");
    }

    return isValid;
};

