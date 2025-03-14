import { create } from 'twrnc';

const tw = create({
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007AFF',
          dark: '#0056b3',
        },
      },
    },
  },
});

export default tw;
