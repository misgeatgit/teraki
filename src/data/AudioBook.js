import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import logger from '../utils/Logger';
import {
  db,
  execQuery
} from '../Settings';
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

async function persistBook(books) {
  logger.info(`Persisting books.`);
  const insertQuery = `INSERT INTO book (id, author, title, synopsis) values (?, ?, ?, ?)`;
  Object.values(books).forEach(async book => {
    if (!book.author) book.author = 'various';
    if (!book.title) book.title = 'not given';
    if (!book.synopsis) {
      book.synopsis = 'not provided';
    }

    const id = await generateBookId(book);
    logger.info(
      `Persisting book by ${book.author} TITLE: ${
        book.title
      } SYNOPSIS: ${book.synopsis} id:${JSON.stringify(id)}.`
    );
    try {
      const atomicInsertQueries = [
        { query: insertQuery, params: [id, book.author, book.title, book.synopsis] }
      ]
      const result = await execQuery(db, atomicInsertQueries);
      logger.info(`Insert result ${JSON.stringify(result)}`);
    } catch (e) {
      logger.error(`${JSON.stringify(e)}`);
    }
  });
}

async function persistChapter(chapter, bookId) {
  logger.info(`Persisting Chapter.`);
  const path = await download(chapter.audio_file);
  const insertAudioFile = `INSERT INTO audiofiles (path, url, name, book_id) values (?, ?, ?, ?)`;
  try {
    const atomicInsertQuery = [{
      query: insertAudioFile,
      params: [path, chapter.audio_file, chapter.chapter, bookId]
    }];
    const result = await execQuery(db, atomicInsertQuery);
    logger.info(`---Select result ${JSON.stringify(result)}`);
    return path;
  } catch (e) {
    logger.error(`---${JSON.stringify(e)}`);
  }
}

async function persistFrontCover(url, bookId) {
  logger.info(`Persisting front cover url:${url}`);
  try {
    const path = await download(url);
    const insertQuery = `INSERT INTO frontcover (path, url, book_id) values (?, ?, ?)`;
    const result = await execQuery(db, [{ query: insertQuery, params: [path, url, bookId] }]);
    logger.info(`---Select result ${JSON.stringify(result)}`);
    return path;
  } catch (e) {
    logger.error(`---${JSON.stringify(e)}`);
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
async function getLocalAudioURL(book, chapter) {
  try {
    const bookId = await generateBookId(book);
    const selectChapterQuery = `SELECT * FROM audiofiles WHERE book_id='${bookId}'`;
    const result = await execQuery(db, [{ query: selectChapterQuery, params: [] }]);
    let path = '';
    if (result.rows.length < 1) {
      logger.info(`AudioFile not found in local directory.
    Downloading and persisting to local storage.`);
      path = await persistChapter(chapter, bookId);
    } else {
      logger.info('Audiofile found in local resource dir.');
      path = result.rows[0].item[0];
    }
    
    return path;
  } catch (e) {
    logger.error(`${JSON.stringify(e)}`);
  }
}

async function getLocalCoverImageURL(book) {
  const funcName = 'getLocalCoverImageURL' 
  logger.info(`[${funcName}] Fetching local cover image url.`);
 try {
    const bookId = await generateBookId(book);
    const selectChapterQuery = `SELECT * FROM frontcover WHERE book_id='${bookId}'`;
    const result = await execQuery(db, [{ query: selectChapterQuery, params: [] }]);
    var path = '';
    if (result.rows.length < 1) {
      logger.info(`---[${funcName}] Cover image not found in local directory.
    Downloading and persisting to local storage.`);
      path = await persistFrontCover(book.front_cover, bookId);
    } else {
      path = result.rows.item(0).path;
      logger.info(`---[${funcName}] Cover image found in local resource dir. ${JSON.stringify(path)}`);
    }
    return path;
  } catch (e) {
    logger.error(`[${funcName}] ${JSON.stringify(e)}`);
  }

}

async function downloadFrontCover(books, downloadNotify) {
  const funcName = 'downloadFrontCover';
  logger.info(`[${funcName}] Persisting books to db.`);
  try {
    const localBooks = Object.values(books).map(async book => {
      const path = await getLocalCoverImageURL(book);
      logger.info(`---[${funcName}] Persisted to ${path}`);
      const newBook = { ...book, front_cover_path: path };
      downloadNotify(newBook);
      return newBook;
    });
    return localBooks;
  } catch (e) {
    logger.error(`[${funcName}] ${JSON.stringify(e)}`);
  }
}

function bookCoverDownloaded(book) {
  logger.info(`Updating bookList in redux store.`);
  booksLoaded([book]); 
}

async function preFetch(N) {
 let booksByTagline = {}
 books.forEach(book => {
   if(booksByTagline[book.tagline] && booksByTagline[book.tagline].length < N) {
     booksByTagline[book.tagline].push(book);
   } else if(!booksByTagline[book.tagline]) {
     booksByTagline[book.tagline] = [book];
   }
 });
 let prefetchs = []
 Object.values(booksByTagline).forEach(books => prefetchs.push(...books));
 prefetchs = await downloadFrontCover(prefetchs, bookCoverDownloaded);

}

async function fetchAll() {
    let books = await downloadFrontCover(books, bookCoverDownloaded);
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

function fetchMockData() {
  // eslint-disable-next-line global-require
  // TODO donot bundle mockdata in production.
  const data = __DEV__ ? require('../mockdata/books.json') : [];
  return createAudioBooks(data);
}

export {
  download,
  fetchMockData,
  generateBookId,
  getLocalAudioURL,
  getLocalCoverImageURL,
  preFetch,
  fetchAll
};
