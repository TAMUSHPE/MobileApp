/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        offwhite: "#FAF9F6",
        maroon: "#500000",
        navy: "#001F5B",
        red: "#C24E3A",
        "pale-blue": "#72A9BE",
        "dark-navy": "#191740",
        orange: "FD652F",
        "pale-orange": "#EF9260",
      },
    },
  },
  plugins: [],
};
