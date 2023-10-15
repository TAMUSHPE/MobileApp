import * as colorUtils from "../colorUtils";
import { randomStr, randomStrRange } from "../unitTestUtils";



test("Test if validateHexColor produces", () => {
    const validHexColors = ["#123", "#Ab80F0", "#0002", "#ABCDEF", "#Fbe03723"];
    const invalidHexColors = ["", "aofhidkuvbnfidkusbvk", "ffffff", "#12", "#ABCe9CB", randomStr(), randomStr(5), randomStrRange(0, 100)];

    validHexColors.forEach((color) => {
        expect(colorUtils.validateHexColor(color)).toBe(true);
    });

    invalidHexColors.forEach((color) => {
        expect(colorUtils.validateHexColor(color)).toBe(false);
    });
});


test("Test conversion from hex string to RGBA object", () => {
    const validHexColors = ["#123", "#Ab80F0", "#0002"];
    const invalidHexColors = ["", "aofhidkuvbnfidkusbvk", "#12", "#ABCe9CB", randomStr(), randomStr(5), randomStrRange(7, 100)];

    invalidHexColors.forEach((color) => {
        expect(colorUtils.hexToRGBA(color)).toBeUndefined();
    });

    expect(colorUtils.hexToRGBA(validHexColors[0])).toMatchObject({
        r: 0x11,
        g: 0x22,
        b: 0x33,
        a: 0xFF,
    });

    expect(colorUtils.hexToRGBA(validHexColors[1])).toMatchObject({
        r: 0xAB,
        g: 0x80,
        b: 0xF0,
        a: 0xFF,
    });

    expect(colorUtils.hexToRGBA(validHexColors[2])).toMatchObject({
        r: 0x00,
        g: 0x00,
        b: 0x00,
        a: 0x22,
    });
});


test("Test conversion from RGBA object to hex string", () => {
    const hexColors: Array<colorUtils.ColorValues> = [
        { r: 0xAB, g: 0x04, b: 0xFB },
        { r: 0xC2, g: 0x24, b: 0xD7 },
        { r: 0x13, g: 0x58, b: 0x96, a: 0xAB },
        { r: 0xDB, g: 0x0E, b: 0x5B, a: 0x00 },
        { r: 0x11, g: 0x22, b: 0x33, a: 0x55 },
    ]

    expect(colorUtils.RGBAToHex(hexColors[0]).toUpperCase()).toBe("#AB04FB");
    expect(colorUtils.RGBAToHex(hexColors[1]).toUpperCase()).toBe("#C224D7");
    expect(colorUtils.RGBAToHex(hexColors[2]).toUpperCase()).toBe("#135896AB");
    expect(colorUtils.RGBAToHex(hexColors[3]).toUpperCase()).toBe("#DB0E5B00");
    expect(colorUtils.RGBAToHex(hexColors[4]).toUpperCase()).toBe("#11223355");
});


test("Test if luminosity for random color is within range [0, 255]", () => {
    const colorVals1: colorUtils.ColorValues = {
        r: Math.trunc(Math.random() * 255),
        g: Math.trunc(Math.random() * 255),
        b: Math.trunc(Math.random() * 255),
        a: Math.trunc(Math.random() * 255),
    };

    const luminosity1 = colorUtils.calculateRGBLuminosity(colorVals1);
    expect(luminosity1).toBeGreaterThanOrEqual(0);
    expect(luminosity1).toBeLessThanOrEqual(255);

    const colorVals2: colorUtils.ColorValues = {
        r: Math.trunc(Math.random() * 255),
        g: Math.trunc(Math.random() * 255),
        b: Math.trunc(Math.random() * 255),
    };

    const luminosity2 = colorUtils.calculateRGBLuminosity(colorVals2);
    expect(luminosity2).toBeGreaterThanOrEqual(0);
    expect(luminosity2).toBeLessThanOrEqual(255);
});


test("Test if luminosity for random color hex string is within range [0, 255] and invalid color returns 255.", () => {
    const colorVals: colorUtils.ColorValues = {
        r: Math.trunc(Math.random() * 255),
        g: Math.trunc(Math.random() * 255),
        b: Math.trunc(Math.random() * 255),
        a: Math.trunc(Math.random() * 255),
    };

    const luminosity = colorUtils.calculateHexLuminosity(colorUtils.RGBAToHex(colorVals));
    expect(luminosity).toBeGreaterThanOrEqual(0);
    expect(luminosity).toBeLessThanOrEqual(255);

    const invalidColorString = randomStrRange(0, 100);
    expect(colorUtils.calculateHexLuminosity(invalidColorString)).toBe(255);
});