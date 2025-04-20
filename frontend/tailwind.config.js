/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        'gh-dark': {
          bg: {
            primary: '#0d1117',    // Main background
            secondary: '#161b22',  // Card/container background
            tertiary: '#21262d',   // Secondary container background
            input: '#0d1117',      // Input background
          },
          text: {
            primary: '#f0f6fc',     // Primary text (white)
            secondary: '#c9d1d9',   // Secondary text (light gray)
            muted: '#8b949e',       // Muted text (darker gray)
          },
          border: {
            primary: '#30363d',     // Primary border
            secondary: '#21262d',   // Secondary border
          },
          button: {
            primary: {
              bg: '#238636',         // Green button background
              hover: '#2ea043',      // Green button hover
              text: '#ffffff',       // Button text
            },
            secondary: {
              bg: '#21262d',         // Secondary button background
              hover: '#30363d',      // Secondary button hover
              text: '#c9d1d9',       // Secondary button text
            },
            danger: {
              bg: '#da3633',         // Red button background
              hover: '#f85149',      // Red button hover
              text: '#ffffff',       // Danger button text
            },
          },
          accent: {
            blue: '#58a6ff',        // Blue accent
            green: '#3fb950',       // Green accent
            red: '#f85149',         // Red accent
            yellow: '#e3b341',      // Yellow accent
          },
        },
      },
    },
  },
  plugins: [],
}
