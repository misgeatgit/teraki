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

const db = SQLite.openDatabase(
  {
    name: 'testing.db',
    location: 'default',
  },
  () => { },
  error => {
    console.log("ERROR: " + error);
  }
);

const execQuery = (db, queryParamPairArray) => new Promise((resolve, reject) => {
  db.transaction((tx) => {
    queryParamPairArray.forEach((queryParamPair) => {
      const query = queryParamPair.query;
      const params = queryParamPair.params;
      tx.executeSql(query, params, (tx, results) => {
        resolve(results);
      },
        (error) => {
          reject(error);
        });
    });
  });
  });

const initDB = async () => {
  const atomicCreateQueries = [{ query: createBookTable, params: [] },
  { query: createAudiofilesTable, params: [] },
  { query: createFrontcoverTable, params: [] }]
  const status = await execQuery(db, atomicCreateQueries);
  console.log(`*****Created DB ${JSON.stringify(status)}`);
}


export { BASE_URL, db, execQuery, ENDPOINTS, initDB};
