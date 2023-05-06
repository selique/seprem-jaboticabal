/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',

    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#806D56',
        secondary: '#997D5C',
        terciary: '#997D5C'
      },
      textColor: {
        primary: '#806D56',
        secondary: '#997D5C'
      },
      fontSize: {
        xs: '0.9375rem', // 25% larger than .75rem
        sm: '1.09375rem', // 25% larger than .875rem
        base: '1.40625rem', // 25% larger than 1.125rem
        lg: '1.5625rem', // 25% larger than 1.25rem
        xl: '1.875rem', // 25% larger than 1.5rem
        '2xl': '2.34375rem', // 25% larger than 1.875rem
        '3xl': '2.8125rem', // 25% larger than 2.25rem
        '4xl': '3.75rem', // 25% larger than 3rem
        '5xl': '5rem', // 25% larger than 4rem
        '6xl': '6.25rem' // 25% larger than 5rem
      }
    }
  },
  plugins: [require('tailwindcss-radix')()]
}
