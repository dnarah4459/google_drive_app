module.exports = {
  content: [
    "./views/**/*.ejs", // Include your EJS templates here
    "./public/**/*.html", // If you have static HTML files as well
  ],
  theme: {
    extend: {
      fontFamily: {
        lexend: ['Lexend', 'sans-serif'],  // Add Lexend font to Tailwind
      },
    },
  },
  plugins: [],
};


