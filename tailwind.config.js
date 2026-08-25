/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{js,jsx}']
  },
  theme: {
    extend: {
      colors: {
        primary: '#434395',
        ink: '#151521',
        mpesa: '#e60000',
        emola: '#fcc200'
      },
      fontFamily: {
        hotspot: ['BodyHotspot', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 18px 45px rgba(0, 0, 0, 0.18)',
        lift: '0 8px 24px rgba(0, 0, 0, 0.16)'
      }
    }
  },
  plugins: []
};
