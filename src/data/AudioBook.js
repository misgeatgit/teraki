import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import  SQLite from 'react-native-sqlite-storage';
import { createBookTable, createAudiofilesTable, createFrontcoverTable } from '../Settings';
import { booksLoaded } from './Actions';

const books = require('../mockdata/books.json');

async function download(url) {
  return new Promise((resolve, reject) => {
    FileSystem.downloadAsync(
      url,
      // TODO make sure there is no name collision.
      FileSystem.documentDirectory + url.split('/').pop()
    )
      .then(({ uri }) => {
        resolve(uri);
      })
      .catch(error => {
        reject(error);
      });
  });
}
const executeSql = async (sql, params = []) => {
  const db = SQLite.openDatabase('test.db');
  return new Promise((resolve, reject) =>
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    })
  );
};

const ExecuteQuery = (db, queryParamPairArray) => new Promise((resolve, reject) => {
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

async function persistBook(books) {
  console.log(`[info] persisting books.`);
  const insertQuery = `INSERT INTO book (id, author, title, synopsis) values (?, ?, ?, ?)`;
  Object.values(books).forEach(async book => {
    if (!book.author) book.author = 'various';
    if (!book.title) book.title = 'not given';
    if (!book.synopsis) {
      book.synopsis = 'not provided';
    }

    const id = await generateBookId(book);
    console.log(
      `[info] persisting book by ${book.author} TITLE: ${
        book.title
      } SYNOPSIS: ${book.synopsis} id:${JSON.stringify(id)}.`
    );
    try {
      const db = SQLite.openDatabase('testing.db');
      const atomicCreateQueries = [{ query: createBookTable, params: [] },
      { query: createAudiofilesTable, params: [] },
      { query: createFrontcoverTable, params: [] } ]
      const status = await ExecuteQuery(db, atomicCreateQueries);
      console.log(`[info] created ${JSON.stringify(status)}`);

      const atomicInsertQueries = [
        {query: insertQuery, params: [id, book.author, book.title, book.synopsis]}
      ]
      const result = await ExecuteQuery(db, atomicInsertQueries);
      console.log(`[info] select result ${JSON.stringify(result)}`);
    } catch (e) {
      console.log(`[error] ${JSON.stringify(e)}`);
    }
  });
}

async function persistChapter(chapter, bookId) {
  const path = await download(chapter.audio_file);
  const insertQuery = `INSERT INTO audiofiles (path, url, name, book_id) values (?, ?, ?, ?)`;
  db.transaction(
    tx => {
      tx.executeSql(insertQuery, [
        path,
        chapter.url,
        chapter.audio_file,
        bookId
      ]);
    },
    () => console.log(`[info] audiofile added to db.`),
    (t, error) =>
      console.log(
        `[error] audiofile inserting failed. ${JSON.stringify(error)}.`
      )
  );
  return path;
}

async function persistFrontCover(url, bookId) {
  console.log(`[info] persisting front cover url:${url}`);
  try {
    const path = await download(url);
    const insertQuery = `INSERT INTO frontcover (path, url, book_id) values (?, ?, ?)`;
    const db = SQLite.openDatabase('testing.db');
    const result = await ExecuteQuery(db, [{ query: insertQuery, params: [path, url, bookId] }]);
    console.log(`[info] select result ${JSON.stringify(result)}`);
    return path;
  } catch (e) {
    console.log(`[error] Error ${JSON.stringify(e)}`);
  }
}

async function generateBookId(book) {
  const fkey = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    `${book.author}${book.title}`,
    { encoding: Crypto.CryptoEncoding.HEX }
  );

  return fkey;
}
/*
     @param chapter {audio_file:'', chapter:''}
     @returns local url
    */
async function getLocalURL(book, chapter) {
  let url = '';
  const fkey = await generateBookId(book);
  const query = `SELECT * FROM audiofiles WHERE book_id=${fkey}`;
  // See resultsetObject here https://docs.expo.io/versions/latest/sdk/sqlite/#transaction--objects
  db.transaction(tx => {
    tx.executeSql(
      query,
      [],
      (_, { rows }) => {
        if (rows.length < 1) {
          console.log(`[info] audiofile not found`);
          /* let r = '';
          persistChapter(chapter, fkey)
            .then(path => {
              r = path;
            })
            .catch(error => {
              throw error;
            });
          url = r; */
        } else {
          url = rows.item(0).path;
          console.log(`[info] url: ${rows.item(0).path}`);
        }
      },
      () => console.log(`[info] transaction succeeded.`),
      error => {
        throw error;
      }
    );
  });

  return url;
}

export default class AudioBook {
  constructor(title, author, frontCover, synopsis, kwargs) {
    this.title = title;
    this.author = author;
    this.frontCover = frontCover;
    this.synopsis = synopsis;
    if (kwargs) {
      this.sample = kwargs.sample;
      this.chapters = kwargs.chapters;
    }
  }
}

function createAudioBooks(data) {
  const books = [];
  Object.values(data).forEach(b => {
    const bookChapters = [];
    const sample = b.sample ? b.sample : null;
    Object.values(b.book_chapter).forEach(bc => {
      bookChapters.push({
        audio_file: bc.audio_file,
        chapter: bc.chapter
      });
    });
    const params = { sample, chapters: bookChapters };
    const book = new AudioBook(
      b.title,
      b.author,
      b.front_cover,
      b.synopsis,
      params
    );
    books.push(book);
  });

  return books;
}

/* Called on new login */
async function getBooks() {
  console.log(`[info] getBook: persisting books to db.`);
  const localBooks = Object.values(books).map(async book => {
    const url = book.front_cover;
    const id = await generateBookId(book);
    console.log(`[info]: persisting book id: ${id}`);
    const path = await persistFrontCover(url, id);
    console.log(`[info] persisted to ${path}`);
    return { ...book, id: id, front_cover_path: path };
  });

  booksLoaded(localBooks);
}

function fetchMockData() {
  // eslint-disable-next-line global-require
  // TODO donot bundle mockdata in production.
  const data = __DEV__ ? require('../mockdata/books.json') : [];
  return createAudioBooks(data);
}

export { download, fetchMockData, getBooks, getLocalURL };
