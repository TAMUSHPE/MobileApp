"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePasswordStrength = exports.PasswordStrength = exports.validatePassword = exports.validateTamuEmail = exports.validateEmail = void 0;
/**
 * Matches generic email pattern. {name}@{second-level domain}.{top-level domain}
 */
const validateEmail = (email) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    return typeof email == 'string' && emailRegex.test(email);
};
exports.validateEmail = validateEmail;
/**
 * Matches TAMU email pattern. {name}@tamu.edu
 */
const validateTamuEmail = (email) => {
    const emailRegex = /^[A-Z0-9._%+-]+@(tamu.edu)$/i;
    return typeof email == 'string' && emailRegex.test(email);
};
exports.validateTamuEmail = validateTamuEmail;
/**
 * Matches passwords with 4-64 characters with characters being alphanumeric or any special characters on a standard qwerty keyboard
 */
const validatePassword = (password) => {
    const passwordRegex = /^[A-Z0-9 !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]{4,64}$/i;
    return typeof password == 'string' && passwordRegex.test(password);
};
exports.validatePassword = validatePassword;
/**
 * Values used for password strength calculation
 */
var PasswordStrength;
(function (PasswordStrength) {
    PasswordStrength[PasswordStrength["INVALID"] = 0] = "INVALID";
    PasswordStrength[PasswordStrength["WEAK"] = 1] = "WEAK";
    PasswordStrength[PasswordStrength["AVERAGE"] = 2] = "AVERAGE";
    PasswordStrength[PasswordStrength["STRONG"] = 3] = "STRONG";
})(PasswordStrength = exports.PasswordStrength || (exports.PasswordStrength = {}));
;
/**
 * Determines strength of a password based on certain conditions:
 *   - Invalid passwords are less than 4 characters long or use invalid characters defined in validatePassword()
 *   - Weak passwords are less than 7 characters long
 *   - Average passwords are either less than 10 characters long or are just a collection of letters or numbers that are less than 14 characters long
 *   - Strong passwords are greater than 10 characters and contain special characters or are greater than 14 characters
 */
const evaluatePasswordStrength = (password) => {
    const averagePasswordRegex = /^[A-Z ]{7,14}$|^[0-9]{7,14}$/i;
    if (!(0, exports.validatePassword)(password)) {
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
exports.evaluatePasswordStrength = evaluatePasswordStrength;
//# sourceMappingURL=validation.js.map