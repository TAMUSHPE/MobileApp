/**  Matches generic email pattern. {name}@{second-level domain}.{top-level domain} */
export const validateEmail = (email: string): boolean => {
    const emailRegex: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    return typeof email == 'string' && emailRegex.test(email);
};

/**  Matches TAMU email pattern. {name}@tamu.edu */
export const validateTamuEmail = (email: string): boolean => {
    const emailRegex: RegExp = /^[A-Z0-9._%+-]+@(tamu.edu)$/i;
    return typeof email == 'string' && emailRegex.test(email);
};

/** Matches passwords with 4-64 characters with characters being alphanumeric or any special characters on a standard qwerty keyboard */
export const validatePassword = (password: string): boolean => {
    const passwordRegex: RegExp = /^[A-Z0-9 !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]{4,64}$/i;
    return typeof password == 'string' && passwordRegex.test(password);
};

/** Checks if a display name is both within the a range of length and unique. Currently stubbed */
export const validateDisplayName = (username: string): boolean => {
    return true;
};

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
    if (!validatePassword(password)) {
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

