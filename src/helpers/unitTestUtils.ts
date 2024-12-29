import crypto from "crypto";
import fs from 'fs';

/**
 * Options for random string generation.
 * @property {BufferEncoding} encoding - Indicates what encoding to use to interpret a random string of bytes. Defaults to utf8
 * @property {string} charSet          - String with characters to be used in generation. If defined, randomStr will use Math.random() instead of crypto.randomBytes(). This means the string will be much less random and thus less secure.
 */
type RandomStringOptions = {
    encoding?: BufferEncoding,
    charSet?: string
}

/**
 * Generates a pseudo-random string with a given length
 * @param length  - Length of string to be generated. Defaults to 1
 * @param options - Object containing various generation options.
 */
export const randomStr = (length: number = 1, options?: RandomStringOptions): string => {
    length = Math.trunc(length);
    const encoding = options?.encoding ?? "utf8";

    if (length < 0) {
        throw new Error("String length cannot be less than 0", { cause: "Argument 'length' in randomStr() is less than 0" });
    }

    if (options?.charSet) {
        const charSetLength = options.charSet.length;
        let result = "";

        for (let index = 0; index < length; index++) {
            result += options.charSet.charAt(Math.trunc(Math.random() * charSetLength));
        }
        return result;
    }
    else {
        // Creates random bytes and converts them to a string. Padding is used in case the length is odd.
        return crypto.randomBytes(Math.trunc(length / 2)).toString(encoding).padEnd(length, crypto.randomBytes(1).toString(encoding));
    }
};

/**
 * Generates a pseudo-random string with a given range of lengths
 * @param min - Minimum length of string. Defaults to 0
 * @param max - Maximum length of string. Defaults to 1
 * @throws When `min > max` or when `min < 0`
 */
export const randomStrRange = (min: number = 0, max: number = 1, options?: RandomStringOptions) => {
    min = Math.trunc(min);
    max = Math.trunc(max);
    if (min > max) {
        throw new Error("min cannot be greater than max", { cause: "'min' argument is greater than 'max' argument in randomStrRange()" })
    }
    else if (min < 0) {
        throw new Error("String length cannot be less than 0", { cause: "Argument 'min' in randomStrRange() is less than 0" });
    }
    const length = (Math.random() * (max - min)) + min;
    return randomStr(length, options);
};


/**
 * Generates a pseudo-random unsigned 8-byte integer array. 
 * @param size - Amount of random bytes to generate. Defaults to 100
*/
export const randomUint8Array = (size: number = 100): Uint8Array => {
    return new Uint8Array(crypto.randomBytes(size));
};


/**
 * Generates a given amount of test cases them to a JSON file as a list. Does not write to a file if it already exists.
 * @param dataFactory - Function that generates a single test case. 
 * @param file        - File path to write to.
 * @param amount      - Specified amount of test cases. Defaults to 100 
 * @param options     - Options to be passed into fs when writing to the file. Defaults to mode: { flag: "wx" }
 */
/* istanbul ignore next */
export const writeTestDataFile = <T>(dataFactory: () => T, file: string, amount: number = 100, options: fs.WriteFileOptions = { flag: "wx" }): void => {
    if (amount < 1) {
        throw new Error("Amount must be greater than or equal to 1", { cause: "argument amount < 1" })
    }

    const data: Array<T> = [];

    for (let i = 0; i < amount; i++) {
        data.push(dataFactory());
    }

    fs.writeFile(file, JSON.stringify(data, null, 4), options, (err) => {
        if (err)
            console.error(err);
        else
            console.log("File saved")
    });
};
