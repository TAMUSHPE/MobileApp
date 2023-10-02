import { Alert } from "react-native";

/**  Matches generic email pattern. {name}@{second-level domain}.{top-level domain} */
export const validateEmail = (email: any, suppressAlert: boolean = false): boolean => {
    const emailRegex: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    const isValid = typeof email == 'string' && emailRegex.test(email);

    if (!(isValid || suppressAlert)) {
        Alert.alert("Invalid email address.", "Make sure you spelled your email correctly (eg. bob@gmail.com)");
    }

    return isValid;
};

/**  Matches TAMU email pattern. {name}@tamu.edu */
export const validateTamuEmail = (email: any, suppressAlert: boolean = false): boolean => {
    const emailRegex: RegExp = /^[A-Z0-9._%+-]+@(tamu.edu)$/i;
    const isValid = typeof email == 'string' && emailRegex.test(email);

    if (!(isValid || suppressAlert)) {
        Alert.alert("Invalid TAMU email address", "Make sure your email follows the convention: NetID@tamu.edu");
    }

    return isValid;
};

/** Matches passwords with 6-64 characters with characters being alphanumeric or any special characters on a standard qwerty keyboard */
export const validatePassword = (password: any, suppressAlert: boolean = false): boolean => {
    const passwordRegex: RegExp = /^[A-Z0-9 !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]{6,64}$/i;
    const isValid = typeof password == 'string' && passwordRegex.test(password);

    if (!(isValid || suppressAlert)) {
        Alert.alert("Invalid password.", "Password must be between 6-64 characters long and use valid characters.");
    }

    return isValid;
};

/** Checks if a display name is both within a length and unique. Alerts user of issue should it arise. */
export const validateDisplayName = (displayName: any, suppressAlert: boolean = false): boolean => {
    const isValid = typeof displayName == 'string' && displayName.length > 0 && displayName.length <= 80

    if (!(isValid || suppressAlert)) {
        Alert.alert("Invalid display name.", "Display name must be between 1-80 characters long.");
    }

    return isValid;
};

/** Checks if a name is both within a length. Alerts user of issue should it arise. */
export const validateName = (name: any, suppressAlert: boolean = false): boolean => {
    const isValid = typeof name == 'string' && name.length > 0 && name.length <= 255;

    if (!(isValid || suppressAlert)) {
        Alert.alert("Name too short or too long.", "Please enter a name between 1-255 characters long.");
    }

    return isValid;
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

