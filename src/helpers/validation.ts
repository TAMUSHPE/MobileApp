export const validateEmail = (email: string): boolean => {
    // Matches pattern {}
    const emailRegex: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    return typeof email == 'string' && emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
    // Matches passwords with 4-64 characters with characters being alphanumeric or any special characters on a standard qwerty keyboard
    const passwordRegex: RegExp = /^[A-Z0-9 !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]{4,64}$/i;
    return typeof password == 'string' && passwordRegex.test(password);
};

export enum PasswordStrength {
    INVALID = 0,
    WEAK = 1,
    AVERAGE = 2,
    STRONG = 3
};

export const evaluatePasswordStrength = (password: string): number => {
    const averagePasswordRegex: RegExp = /^[A-Z]{4,64}$/i;
    if (!validatePassword(password)) {
        return PasswordStrength.INVALID;
    }
    else if (password.length < 6) {
        return PasswordStrength.WEAK;
    }
    else if (averagePasswordRegex.test(password)) {
        return PasswordStrength.AVERAGE;
    }
    else {
        return PasswordStrength.STRONG;
    }
};
