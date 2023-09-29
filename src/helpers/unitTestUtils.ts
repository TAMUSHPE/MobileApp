import crypto from "crypto";

/**
 * Generates a pseudo-random string with a given length
 * @param length - Length of string to be generated. Defaults to 1
 */
export const randomStr = (length: number = 1): string => {
    length = Math.trunc(length);
    if (length < 0) {
        throw new Error("String length cannot be less than 0", { cause: "Argument 'length' in randomStr() is less than 0" });
    }
    return crypto.randomBytes(Math.floor(length / 2)).toString("hex");
};

/**
 * Generates a pseudo-random string with a given range of lengths
 * @param min - Minimum length of string. Defaults to 0
 * @param max - Maximum length of string. Defaults to 1
 */
export const randomStrRange = (min: number = 0, max: number = 1) => {
    min = Math.trunc(min);
    max = Math.trunc(max);
    if (min > max) {
        throw new Error("min cannot be greater than max", { cause: "'min' argument is greater than 'max' argument in randomStrRange()" })
    }
    else if (min < 0) {
        throw new Error("String length cannot be less than 0", { cause: "Argument 'min' in randomStrRange() is less than 0" });
    }
    const length = (Math.random() * (max - min)) + min;
    return randomStr(length);
};


/**
 * Generates a pseudo-random unsigned 8-byte integer array. 
 * @param size - Amount of random bytes to generate. Defaults to 100
*/
export const randomUint8Array = (size: number = 100): Uint8Array => {
    return new Uint8Array(crypto.randomBytes(size));
};
