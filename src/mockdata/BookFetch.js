// import books from './books.json';
const books = require('./books.json');

const tags = [
  'Suggestions',
  'Recently opened',
  'Popular this month',
  'Latest',
  'All time favorite'
];

export const suggestions = books.filter(book => book.tagline === tags[0]);
export const recentlyOpened = books.filter(book => book.tagline === tags[1]);
export const popularThisMonth = books.filter(book => book.tagline === tags[2]);
export const latest = books.filter(book => book.tagline === tags[3]);
export const allTimeFavorite = books.filter(book => book.tagline === tags[4]);
