/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  important: '#root', // Ensure Tailwind utility classes cooperate nicely with MUI
  theme: {
    extend: {
      colors: {
        campus: {
          navy: "#0f172a",
          blue: "#1e40af",
          lightBlue: "#3b82f6",
          accent: "#2563eb",
          grayBg: "#f8fafc",
          surface: "#ffffff",
          border: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
};
