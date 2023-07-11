export enum PointsColumnVals {
    FIRST_NAME = 0,
    LAST_NAME = 1,
    EMAIL = 2,
    TOTAL_POINTS = 3,
}

export interface GoogleSheetsResponse {
    "version": string,
    "reqId": string,
    "status": string,
    "sig"?: string,
    "table": {
        "cols": Array<{
            "id": string,
            "label": string,
            "type": string,
            "pattern"?: string,
        }>,
        "rows": Array<{
            "c": Array<{
                "v": any,
                "f": string,
            }>
        }>,
        "parsedNumHeaders"?: number,
    },
};
