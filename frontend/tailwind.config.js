/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          DEFAULT: '#241711',
          50: '#F5EFEB',
          100: '#E6D7CD',
          200: '#C7A996',
          700: '#3D251A',
          800: '#2C1B13',
          900: '#241711',
        },
        coffee: {
          DEFAULT: '#493126',
          50: '#FAF7F5',
          100: '#EFE7E2',
          200: '#DFC8BC',
          500: '#6E4E3E',
          600: '#493126',
          700: '#3A261D',
        },
        cream: {
          DEFAULT: '#F8F3EA',
          50: '#FDFBF7',
          100: '#F8F3EA',
          200: '#EFE6D5',
        },
        latte: {
          DEFAULT: '#E8D8C3',
          100: '#F4ECE1',
          200: '#E8D8C3',
          300: '#D7BE9E',
        },
        caramel: {
          DEFAULT: '#C7834B',
          400: '#D89862',
          500: '#C7834B',
          600: '#AC6A34',
        },
        sage: {
          DEFAULT: '#8A9A78',
          100: '#E7ECE3',
          400: '#A4B493',
          500: '#8A9A78',
          600: '#6E7E5C',
        },
        subtext: '#766A60',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 4px 20px -2px rgba(36, 23, 17, 0.08)',
        'warm-lg': '0 10px 30px -4px rgba(36, 23, 17, 0.12)',
        'warm-xl': '0 20px 40px -8px rgba(36, 23, 17, 0.16)',
      }
    },
  },
  plugins: [],
}

