import { GoogleSheetsResponse, PointsColumnVals } from "../types/GoogleSheetsTypes";

export const pointsData = async (email: string): Promise<GoogleSheetsResponse | null> => {
    // TODO: Create email validation function
    if (!email) {
        return null;
    }

    const uri = `https://docs.google.com/spreadsheets/d/1gKGAPlJLJL4yqYwt9mo4YeiS9KKuQzPvsyY1zuj4ZsU/gviz/tq?tq=${encodeURIComponent(`where C contains "${email}"`)}&sheet=Master`
    return await fetch(uri)
        .then(async (res) => {
            const responseText = await res.text()
            const headerPattern = /(\/\*O_o\*\/\n|google\.visualization\.Query\.setResponse\(|\)\;)/g;
            const data = JSON.parse(responseText.replace(headerPattern, ""));
            return data;
        })
        .catch((error) => {
            console.error("Error:", error);
            return null;
        });
};

export const memberPoints = (data: GoogleSheetsResponse | null, email: string): number => {
    /*
    This function parses data obtained from querying a google sheets document containing each member and their point values.
    If any abnormal data is passed, the default value is 0.
    */

    if (!data || data["table"]["rows"].length < 1 || !email) {
        return 0;
    }

    const userPointsRow = data["table"]["rows"].at(0);

    if (!userPointsRow || userPointsRow["c"].length < 1 || userPointsRow["c"][PointsColumnVals.EMAIL]["v"] != email) {
        return 0;
    }
    else {
        const value = userPointsRow["c"].at(PointsColumnVals.TOTAL_POINTS)?["v"] : 0;
        return typeof value === "number" ? value : 0;
    }
};
