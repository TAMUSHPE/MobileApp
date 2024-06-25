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
        "continue-dark": "#ED652F",
        "continue-light": "#C24E3A",
        "primary-bg-dark": "#000000",
        "primary-bg-light": "#FFFFFF",
        "secondary-bg-dark": "#262626",
        "secondary-bg-light": "#FAF9F6",
        "grey-dark": "#808080",
        "grey-light": "#B4B4B4",
        "primary-blue": "#1870B8",
        "secondary-blue-1": "#468DC6",
        "secondary-blue-2": "#E8F1F8",
        "red-1": "#FF0000",
        "green-1": "#AEF359",
      },
    },
  },
  plugins: [],
};
