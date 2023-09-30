import * as unitTestUtils from "../unitTestUtils";

test("Create random strings of specified lengths with randomStr()", () => {
    const str1 = unitTestUtils.randomStr(0);
    const str2 = unitTestUtils.randomStr(10);
    const str3 = unitTestUtils.randomStr(100);
    const str4 = unitTestUtils.randomStr(255.8365);
    const str5 = unitTestUtils.randomStr();

    expect(str1.length).toBe(0);
    expect(str2.length).toBe(10);
    expect(str3.length).toBe(100);
    expect(str4.length).toBe(255);
    expect(str5.length).toBe(1);
});

test("Create strings of invalid lengths with randomStr()", () => {
    expect(() => unitTestUtils.randomStr(-1)).toThrow();
    expect(() => unitTestUtils.randomStr(-255)).toThrow();
    expect(() => unitTestUtils.randomStr(Math.random() * -1 * 255)).toThrow();
});

test("Create random strings from range of lengths with randomStrRange()", () => {
    const str1 = unitTestUtils.randomStrRange();
    const str2 = unitTestUtils.randomStrRange(10, 100);
    const str3 = unitTestUtils.randomStrRange(100, 255);
    const str4 = unitTestUtils.randomStrRange(255.8365, 1000.245);

    expect(str1.length).toBeGreaterThanOrEqual(0);
    expect(str1.length).toBeLessThanOrEqual(1);

    expect(str2.length).toBeGreaterThanOrEqual(10);
    expect(str2.length).toBeLessThanOrEqual(100);

    expect(str3.length).toBeGreaterThanOrEqual(100);
    expect(str3.length).toBeLessThanOrEqual(255);

    expect(str4.length).toBeGreaterThanOrEqual(255);
    expect(str4.length).toBeLessThanOrEqual(1000);
});

test("Create strings of invalid length ranges with randomStrRange()", () => {
    expect(() => unitTestUtils.randomStrRange(-5)).toThrow();
    expect(() => unitTestUtils.randomStrRange(10, 9.9999)).toThrow();
    expect(() => unitTestUtils.randomStrRange(-1, 20)).toThrow();
    expect(() => unitTestUtils.randomStrRange(21, 20.4)).toThrow();
    expect(() => unitTestUtils.randomStrRange(-2, -4)).toThrow();
    expect(() => unitTestUtils.randomStrRange(5, -4)).toThrow();
});