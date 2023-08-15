/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                offwhite: "#FAF9F6",
                maroon: "#500000",
                navy: "#001F5B",
                orange: "#FD652F",
                "red-orange": "#C24E3A",
                "pale-blue": "#72A9BE",
                "dark-navy": "#191740",
                "pale-orange": "#EF9260",
                "continue-dark": "#C24E3A",
                "continue-light": "#C24E3A",
                "primary-bg-dark": "#191740",
                "primary-bg-light": "#FAF9F6",
                "secondary-bg-dark": "#191740",
                "secondary-bg-light": "#FFFFFF",
            },
        },
    },
    plugins: [],
};
