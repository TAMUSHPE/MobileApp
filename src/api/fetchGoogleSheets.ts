import { validateTamuEmail } from "../helpers/validation";
import { GoogleSheetsResponse, PointsColumnVals } from "../types/GoogleSheetsTypes";

/**
 * Constant defining different google sheet ids used
 */
export const GoogleSheetsIDs = {
    POINTS_ID: "1_9UeStHLTNDxjI6ZcLVzXyPaRFNTFGoUFRsUFR5dEs0",
    TEST_BANK_ID: "1aPolyNLDlj6XqzIghBVQ97704hCVk-lEaMBsMtKlF7g",
}

/**
 * Queries a given Google Sheet and returns the data obtained from it.
 * 
 * @param sheetID - The ID of the Google Sheet. This should be defined in the GoogleSheetsIDs constant.
 * @param query - The query for Google Sheets. Queries follow a syntax similar to SQL.
 *                By default, the query selects all data. Documentation can be found here:
 *                https://support.google.com/docs/answer/3093343?hl=en
 * @param sheetName - The name of the sheet. Defaults to 'Sheet1'.
 * @returns - Returns the JSON response given by Google Sheets.
 */
export const queryGoogleSpreadsheet = async (sheetID: string, query: string = "select *", sheetName: string = "Sheet1"): Promise<GoogleSheetsResponse | null> => {
    /*
    This function queries a google spreadsheet for data given certain parameters
    */
    const spreadsheetURI = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tq=${encodeURIComponent(query)}&sheet=${sheetName}`;
    
    return await fetch(spreadsheetURI)
        .then(async (res) => {
            const responseText = await res.text()
            const headerPattern = /(\/\*O_o\*\/\n|google\.visualization\.Query\.setResponse\(|\)\;)/g; // Regex for identifying the header added on the to sheets response
            const data = JSON.parse(responseText.replace(headerPattern, ""));
            return data;
        })
        .catch((err) => {
            console.error(err);
            return null
        });
};
