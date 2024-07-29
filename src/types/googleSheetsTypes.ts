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

export type Test = {
    subject?: string;
    course?: string;
    semester?: string;
    year?: string;
    testType?: string;
    typeNumber?: string;
    professor?: string;
    student?: string;
    grade?: string;
    testURL?: string;
}