/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rokad: {
          teal: '#59BBAF',
          'teal-hover': '#50A89E',
          'teal-active': '#47968C',
          'teal-dark': '#438C83',
          'teal-darker': '#1F413D',
          'teal-light': '#EEF8F7',
          navy: '#202A5A',
          'navy-hover': '#1D2651',
          'navy-active': '#1A2248',
          'navy-darker': '#0B0F1F',
          'navy-light': '#E9EAEF',
          ruby: '#E0195B',
          'ruby-darker': '#4E0920',
          'ruby-light': '#FCE8EF',
          orange: '#F8A41D',
          'orange-darker': '#57390A',
          'orange-light': '#FEF6E8',
          purple: '#8A38F5',
          'purple-darker': '#2E1065',
          'purple-light': '#F4EBFD',
          darkBg: '#0B0F17',
          darkSurface: '#151C28',
          darkSurfaceRaised: '#1C2536',
          darkBorder: '#242F42',
        }
      },
      fontFamily: {
        sans: ['IRANSansXFaNum', 'IRANSansX', 'sans-serif'],
      },
      boxShadow: {
        'hard-xs': '1.5px 1.5px 0 var(--theme-shadow-color, #1F413D)',
        'hard-sm': '2px 2px 0 var(--theme-shadow-color, #1F413D)',
        'hard-md': '2.75px 2.75px 0 var(--theme-shadow-color, #1F413D)',
        'hard-lg': '3.5px 3.5px 0 var(--theme-shadow-color, #1F413D)',
        'hard-xl': '4px 4px 0 var(--theme-shadow-color, #1F413D)',
      },
    },
  },
  plugins: [],
}
