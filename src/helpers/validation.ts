import { Alert } from "react-native";

/**  Matches generic email pattern. {name}@{second-level domain}.{top-level domain} */
export const validateEmail = (email: any, alertUser: boolean = false): boolean => {
    const emailRegex: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    const isValid = typeof email == 'string' && emailRegex.test(email);

    if (!isValid && alertUser) {
        Alert.alert("Invalid email address.", "Make sure you spelled your email correctly (eg. bob@gmail.com)");
    }

    return isValid;
};

/**  Matches TAMU email pattern. {name}@tamu.edu */
export const validateTamuEmail = (email: any, alertUser: boolean = false): boolean => {
    const emailRegex: RegExp = /^[A-Z0-9._%+-]+@(tamu.edu)$/i;
    const isValid = typeof email == 'string' && emailRegex.test(email);

    if (!isValid && alertUser) {
        Alert.alert("Invalid TAMU email address", "Make sure your email follows the convention: NetID@tamu.edu");
    }

    return isValid;
};

/** Matches passwords with 6-64 characters with characters being alphanumeric or any special characters on a standard qwerty keyboard */
export const validatePassword = (password: any, alertUser: boolean = false): boolean => {
    const passwordRegex: RegExp = /^[A-Z0-9 !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]{6,64}$/i;
    const isValid = typeof password == 'string' && passwordRegex.test(password);

    if (!isValid && alertUser) {
        Alert.alert("Invalid password.", "Password must be between 6-64 characters long and use valid characters.");
    }

    return isValid;
};

/** Checks if a display name is both within a length and unique. Alerts user of issue should it arise. */
export const validateDisplayName = (displayName: any, alertUser: boolean = false): boolean => {
    const isValid = typeof displayName == 'string' && displayName.length > 0 && displayName.length <= 80

    if (!isValid && alertUser) {
        Alert.alert("Invalid display name.", "Display name must be between 1-80 characters long.");
    }

    return isValid;
};

/**
 * Checks if a name is both within a length.
 * @param name 
 * @param alertUser Whether or not to alert the user of any issues
 * @returns 
 */
export const validateName = (name: any, alertUser: boolean = false): boolean => {
    const isValid = typeof name == 'string' && name.length > 0 && name.length <= 255;

    if (!isValid && alertUser) {
        Alert.alert("Name too short or too long.", "Please enter a name between 1-255 characters long.");
    }

    return isValid;
}

/**
 * Validates whether or not a given file blob matches a given list
 * @param file File blob 
 * @param allowedMimeTypes List of mime types to allow
 * @param maxSize The largest size file allowed in bytes. Defaults to 8MB (8388608 or 2^23)
 * @param alertUser Whether or not to alert the user of any issues
 * @returns true if file is valid else false
 * @example
 * const userFile: Blob;
 * const allowedMimeTypes = ["image/png", "image/jpeg", "image/gif"];
 * 
 * if (validateFileBlob(userFile, allowedMimeTypes)) {
 *     console.log("Valid File");
 * }
 */
export const validateFileBlob = (file: Blob, allowedMimeTypes: Array<string>, maxSize: number = 8388608, alertUser: boolean = false): boolean => {
    const isValidMimeType = allowedMimeTypes.includes(file.type)
    const isValidSize = file.size < maxSize;
    const bytesInMegabyte = 1048576;

    if (!isValidMimeType && alertUser) {
        Alert.alert("Invalid File Type", `${file.type} is not a supported file type for this action.`);
    }
    else if(!isValidSize && alertUser){
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
 */
export const evaluatePasswordStrength = (password: string): number => {
    const averagePasswordRegex: RegExp = /^[A-Z ]{7,14}$|^[0-9]{7,14}$/i;
    if (!validatePassword(password, true)) {
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

