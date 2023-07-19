import { GoogleSheetsResponse, PointsColumnVals } from "../types/GoogleSheetsTypes";

/**
 * Constant defining different google sheet ids used
 */
export const GoogleSheetsIDs = {
    POINTS_ID: "1gKGAPlJLJL4yqYwt9mo4YeiS9KKuQzPvsyY1zuj4ZsU",
    TEST_BANK_ID: "",
    RESUMES_ID: "",
}

/**
 * This function queries a given google sheet query and returns the data obtained from it.
 * @param sheetID 
 * String indicating the id of the sheet. These should be defined in the GoogleSheetsIDs constant
 * @param query 
 * This is the query for google sheets. Querys follow similar syntax to SQL and documentation can be found here: https://support.google.com/docs/answer/3093343?hl=en.
 * 
 * By default, the query selects all data
 * @param sheetName 
 * Name of the sheet. Default is Sheet1
 * @returns 
 * Returns the json response given by google sheets
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

/**
 * This function queries the points sheet for a user with a given email. If any abnormal data is passed or received, the default value is 0.
 * @param email 
 * The email of the user to query
 * @returns 
 * A promise for the point value given an email address. If no points are found or an error occurs, defaults to 0.
 */
export const memberPoints = async (email: string): Promise<number> => {
    return await queryGoogleSpreadsheet(GoogleSheetsIDs.POINTS_ID, `where C contains "${email}"`, "Master")
        .then((data) => {
            if (!data || data["table"]["rows"].length < 1 || !email) {
                return 0;
            }

            const userPointsRow = data["table"]["rows"].at(0);

            if (!userPointsRow || userPointsRow["c"].length < 1 || userPointsRow["c"][PointsColumnVals.EMAIL]["v"] != email) {
                return 0;
            }
            else {
                const value = userPointsRow["c"].at(PointsColumnVals.TOTAL_POINTS)!["v"];
                return typeof value === "number" ? value : 0;
            }
        })
        .catch((error) => {
            console.error(error);
            return 0;
        });
};
