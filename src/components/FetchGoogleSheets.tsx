export const pointsData = async () => {
    try {
        let data = await fetch(
            "https://sheets.googleapis.com/v4/spreadsheets/1gKGAPlJLJL4yqYwt9mo4YeiS9KKuQzPvsyY1zuj4ZsU/values/Master?valueRenderOption=FORMATTED_VALUE&key=AIzaSyDHGLfvY0yzIco9AebUaAJesVnqdotK0tQ"
        );
        let { values } = await data.json();
        let [, ...Data] = values.map((data: any) => data);
        return Data;
    } catch {
        console.log("Error");
    }
};