/** Interface representing a color. Include r (red), g (green), b (blue) values and an optional a (alpha) value representing opacity. */
export interface ColorValues {
    r: number
    g: number
    b: number
    a?: number
};

/** Checks if a string is valid as a hexadecimal color code */
export const validateHexColor = (hexColor: string): boolean => {
    const hexRegex: RegExp = /^#?([\dA-Fa-f]{6}|[\dA-Fa-f]{3}|[\dA-Fa-f]{4}|[\dA-Fa-f]{8})$/i
    return typeof hexColor == 'string' && hexRegex.test(hexColor);
};

/** Converts a hex-code to a parsable object containing RGBA values */
export const hexToRGBA = (hexColor: string): ColorValues | undefined => {
    if (!validateHexColor(hexColor)) return undefined;

    if (hexColor.length == 4 || hexColor.length == 7) {
        // Converts hex code with 3 values to 6 values. Ex: #0F8 => #00FF88
        const tripletRegex = /^#?([\dA-Fa-f])([\dA-Fa-f])([\dA-Fa-f])$/i;
        hexColor = hexColor.replace(tripletRegex, (m, r, g, b) => {
            return r + r + g + g + b + b;
        });
        const result = /^#?([\dA-Fa-f]{2})([\dA-Fa-f]{2})([\dA-Fa-f]{2})$/i.exec(hexColor);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 255,
        } : undefined;
    }
    else {
        // Converts hex code with 4 values to 8 values. Ex: #0F83 => #00FF8833
        const quadrupletRegex = /^#?([\dA-Fa-f])([\dA-Fa-f])([\dA-Fa-f])([\dA-Fa-f])$/i;
        hexColor = hexColor.replace(quadrupletRegex, (m, r, g, b, a) => {
            return r + r + g + g + b + b + a + a;
        });
        const result = /^#?([\dA-Fa-f]{2})([\dA-Fa-f]{2})([\dA-Fa-f]{2})([\dA-Fa-f]{2})$/i.exec(hexColor);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: parseInt(result[4], 16),
        } : undefined;
    }
};

/** Calculates a generally accepted perceived luminosity for a given set of RGB values according to Digital UTI BT.601. */
export const calculateRGBLuminosity = (color: ColorValues): number => {
    return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
};

/** Calculates a generally accepted perceived luminosity for a given hex value according to Digital UTI BT.601.
 * @argument color - hex code of color being used in calculation
 * @returns perceived luminosity. returns 256 if color is not valid
 */
export const calculateHexLuminosity = (color: string): number => {
    const colorRGBAVals = hexToRGBA(color);
    return colorRGBAVals ? calculateRGBLuminosity(colorRGBAVals) : 256;
};