import { randomStrRange } from '../unitTestUtils';
import * as validation from '../validation';
import fs from 'fs';

describe("String validation", () => {
    describe("Test email validation", () => {
        test("Valid addresses", () => {
            let addressJSON = fs.readFileSync("./src/helpers/__tests__/test_data/validEmails.json").toString();
            let addresses = JSON.parse(addressJSON);

            addresses.forEach((email: string) => {
                expect(validation.validateEmail(email)).toBe(true);
            });

            addressJSON = fs.readFileSync("./src/helpers/__tests__/test_data/validTamuEmails.json").toString();
            addresses = JSON.parse(addressJSON);

            addresses.forEach((email: string) => {
                expect(validation.validateEmail(email)).toBe(true);
            });
        });

        test("Invalid addresses", () => {
            const addressJSON = fs.readFileSync("./src/helpers/__tests__/test_data/invalidEmails.json").toString();
            const addresses = JSON.parse(addressJSON);

            addresses.forEach((email: string) => {
                expect(validation.validateEmail(email)).toBe(false);
            });
        });

        test("Incorrect data type", () => {
            expect(validation.validateEmail(1)).toBe(false);
            expect(validation.validateEmail(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', '\0'])).toBe(false);
            expect(validation.validateEmail(2.5425)).toBe(false);
            expect(validation.validateEmail({})).toBe(false);
            expect(validation.validateEmail(true)).toBe(false);
            expect(validation.validateEmail(undefined)).toBe(false);
            expect(validation.validateEmail(null)).toBe(false);
        });

    });

    describe("Test TAMU email validation", () => {
        test("Valid addresses", () => {
            const addressJSON = fs.readFileSync("./src/helpers/__tests__/test_data/validTamuEmails.json").toString();
            const addresses = JSON.parse(addressJSON);

            addresses.forEach((email: string) => {
                expect(validation.validateTamuEmail(email)).toBe(true);
            });
        });

        test("Invalid tamu addresses", () => {
            let addressJSON = fs.readFileSync("./src/helpers/__tests__/test_data/invalidEmails.json").toString();
            let addresses = JSON.parse(addressJSON);

            addresses.forEach((email: string) => {
                expect(validation.validateTamuEmail(email)).toBe(false);
            });

            addressJSON = fs.readFileSync("./src/helpers/__tests__/test_data/validEmails.json").toString();
            addresses = JSON.parse(addressJSON);

            addresses.forEach((email: string) => {
                expect(validation.validateTamuEmail(email)).toBe(false);
            });
        });

        test("Incorrect data type", () => {
            expect(validation.validateTamuEmail(1)).toBe(false);
            expect(validation.validateTamuEmail(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', '\0'])).toBe(false);
            expect(validation.validateTamuEmail(2.5425)).toBe(false);
            expect(validation.validateTamuEmail({})).toBe(false);
            expect(validation.validateTamuEmail(true)).toBe(false);
            expect(validation.validateTamuEmail(undefined)).toBe(false);
            expect(validation.validateTamuEmail(null)).toBe(false);
        });

    });

    describe("Password Validation", () => {
        test("Valid passwords", () => {
            const passwordJSON = fs.readFileSync("./src/helpers/__tests__/test_data/validPasswords.json").toString();
            const passwords = JSON.parse(passwordJSON);

            passwords.forEach((password: string) => {
                expect(validation.validatePassword(password)).toBe(true);
            });
        });

        test("Invalid passwords", () => {
            const passwordJSON = fs.readFileSync("./src/helpers/__tests__/test_data/invalidPasswords.json").toString();
            const passwords = JSON.parse(passwordJSON);

            passwords.forEach((password: string) => {
                expect(validation.validatePassword(password)).toBe(false);
            });
        });

        test("Incorrect data type", () => {
            expect(validation.validatePassword(1)).toBe(false);
            expect(validation.validatePassword(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', '\0'])).toBe(false);
            expect(validation.validatePassword(2.5425)).toBe(false);
            expect(validation.validatePassword({})).toBe(false);
            expect(validation.validatePassword(true)).toBe(false);
            expect(validation.validatePassword(undefined)).toBe(false);
            expect(validation.validatePassword(null)).toBe(false);
        });
    });

    describe("Password Strength", () => {
        test("Valid Paswords", () => {
            const passwordJSON = fs.readFileSync("./src/helpers/__tests__/test_data/validPasswords.json").toString();
            const passwords = JSON.parse(passwordJSON);

            passwords.forEach((password: string) => {
                const evaluation = validation.evaluatePasswordStrength(password);
                expect(evaluation == validation.PasswordStrength.WEAK || evaluation == validation.PasswordStrength.AVERAGE || evaluation == validation.PasswordStrength.STRONG).toBe(true);
            });
        });

        test("Invalid passwords", () => {
            const passwordJSON = fs.readFileSync("./src/helpers/__tests__/test_data/invalidPasswords.json").toString();
            const passwords = JSON.parse(passwordJSON);

            passwords.forEach((password: string) => {
                expect(validation.evaluatePasswordStrength(password) == validation.PasswordStrength.INVALID).toBe(true);
            });
        });
    });

    describe("Display Name Validation", () => {
        test("Valid Display Names", () => {
            expect(validation.validateDisplayName("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toBe(true);
            expect(validation.validateDisplayName("A")).toBe(true);
            for (let i = 0; i < 100; i++) {
                expect(validation.validateDisplayName(randomStrRange(1, 80))).toBe(true);
            }
        });

        test("Invalid Display Names", () => {
            expect(validation.validateDisplayName("")).toBe(false);
            expect(validation.validateDisplayName("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"))
            for (let i = 0; i < 100; i++) {
                expect(validation.validateDisplayName(randomStrRange(81, 500))).toBe(false);
            }
        });
    });

    describe("Name Validation", () => {
        test("Valid Names", () => {
            expect(validation.validateName("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toBe(true);
            for (let i = 0; i < 100; i++) {
                expect(validation.validateName(randomStrRange(1, 255))).toBe(true);
            }
        });

        test("Invalid Names", () => {
            expect(validation.validateName("")).toBe(false);
            expect(validation.validateName("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toBe(false);
        });
    });

});