import SQLite from 'react-native-sqlite-storage';

const BASE_URL = 'http://localhost:8000/api/v1.0/';

const ENDPOINTS = {
  Books: `${BASE_URL}books/`,
  JWTRegister: `${BASE_URL}register/`,
  JWTLogin: `${BASE_URL}login/`,
  JWTrefreshToken: `${BASE_URL}login/refresh/`
};

const AnbabianDB = 'anbabian.db';

export const createBookTable = 'CREATE TABLE IF NOT EXISTS book (id  TEXT PRIMARY KEY, author \
                                               TEXT not NULL, title TEXT NOT NULL, synopsis TEXT);'
export const createAudiofilesTable = 'CREATE TABLE IF NOT EXISTS audiofiles (id  \
   INTEGER PRIMARY KEY, path  TEXT NOT NULL, url  TEXT NOT NULL, name TEXT NOT NULL, \
   paused_at INTEGER, book_id  TEXT not NULL, FOREIGN KEY (book_id) REFERENCES book(id) \
   ON DELETE CASCADE);'
export const createFrontcoverTable = 'CREATE TABLE IF NOT EXISTS frontcover (id  \
  INTEGER PRIMARY KEY, path  TEXT NOT NULL, url  TEXT NOT NULL, book_id  TEXT not NULL, \
  FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE);';

function setUpDB() {
  const db = SQLite.openDatabase(AnbabianDB);
  console.log(`[info] Setting up db.`);
  db.transaction(tx => {
    tx.executeSql(createBookDBSQLString, [], null, error => {
      throw error;
    });
  });
  console.log('Database created successfully!');
}

export { BASE_URL, ENDPOINTS, setUpDB };
