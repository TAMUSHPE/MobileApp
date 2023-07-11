import { GoogleSheetsResponse, PointsColumnVals } from "../types/GoogleSheetsTypes";

export const GoogleSheetsIDs = {
    POINTS_ID: "1gKGAPlJLJL4yqYwt9mo4YeiS9KKuQzPvsyY1zuj4ZsU",
    TEST_BANK_ID: "",
    RESUMES_ID: "",
}

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
        .catch((error) => {
            console.log("Error:", error);
            return null
        });
};

export const memberPoints = async (email: string): Promise<number> => {
    /*
    This function parses data obtained from querying a google sheets document containing each member and their point values.
    If any abnormal data is passed, the default value is 0.
    */
    const data = await queryGoogleSpreadsheet(GoogleSheetsIDs.POINTS_ID, `where C contains "${email}"`, "Master");

    if (!data || data["table"]["rows"].length < 1 || !email) {
        return 0;
    }

    const userPointsRow = data["table"]["rows"].at(0);

    if (!userPointsRow || userPointsRow["c"].length < 1 || userPointsRow["c"][PointsColumnVals.EMAIL]["v"] != email) {
        return 0;
    }
    else {
        const value = userPointsRow["c"].at(PointsColumnVals.TOTAL_POINTS) ? ["v"] : 0;
        return typeof value === "number" ? value : 0;
    }
};
