'use babel';

const { remote } = require('electron')
const sanitize = require('sanitize-filename');
const touch = require('touch');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { dialog } = remote
import {
  renderHTML,
  replaceImages,
  replaceHTMLImagesWithDataURI
} from 'inkdrop-export-utils'


function notify(level, message, details, critialErr) {
  const options = {
    dismissable: true
  };
  if (typeof details === 'string') {
    options.detail = details;
  }

  inkdrop.notifications[`add${level}`](message, options);

  if (critialErr) {
    throw new Error(details);
  }
}

async function getTag(db, tagName) {
  try {
    const tags = db.tags;
    const tagMeta = await tags.findWithName(tagName);
    return tagMeta._id;
  } catch (err) {
    notify('Error', 'Export Failed', `Cannot find Tag '${tagName}'`, true);
  }
}

async function getNotes(notes, tagId) {
  const queryOptions = {
    sort: [{ title: 'desc' }],
    includeDocs: true,
    limit: 500
  };

  var taggedNotes = {}
  try {
    taggedNotes = await notes.findWithTag(tagId, queryOptions);
  } catch (err) {
    notify('Error', 'Error getting notes', err.message, true);
  }
  if (taggedNotes['docs'].length == 0) {
    notify('Warning', 'No Notes Exported', 'Tag not on any notes', true);
  }
  return taggedNotes['docs'];
}

export async function exportTaggedNotes(htmlMode, tagName) {

  const pConfig = inkdrop.config.get('export-by-tag');

  pConfig.mode = (htmlMode) ? "html" : "md"

  const db = await inkdrop.main.dataStore.getLocalDB();
  const tagId = await getTag(db, tagName);
  var noteList = await getNotes(db.notes, tagId);

  if (pConfig.exportDir) {
    pConfig.exportPath = path.join(os.homedir(), pConfig.exportDir);
  } else {
    const { filePaths: pathArrayToSave } = await dialog.showOpenDialog({
      title: `Select a directory to export notes with tag "${tagName}"`,
      properties: ['openDirectory', 'createDirectory']
    })
    if (pathArrayToSave) {
      pConfig.exportPath = pathArrayToSave[0]
    }
  }

  for (var i = 0; i < noteList.length; i++) {

      var notePath = '';
      if (pConfig.dirStruct) {
        let bookArray = [];
        bookArray = await createBookArray(noteList[i].bookId, db.books, bookArray);
        notePath = bookArray.join('/');
      }

      await exportNote(noteList[i], notePath, pConfig);
 
  }
  
  if (i == 1) {
    notify('Info', `Exported Note with tag:${tagName}`, `${i} Note exported to ${pConfig.exportPath}`);
  } else if (i > 1) {
    notify('Info', `Exported Notes with tag:${tagName}`, `${i} Notes exported to ${pConfig.exportPath}`);
  } else {
    notify('Error', 'No Notes Exported', `Unknown Error`);
  }
  return `${i} Notes exported to ${pConfig.exportPath}`;
}

async function createBookArray(bookId, bookObj, bookArray) {
  let bookInfo = await bookObj.get(bookId);
  bookArray.unshift(bookInfo.name);
  if (bookInfo.parentBookId) {
    bookArray = await createBookArray(
      bookInfo.parentBookId,
      bookObj,
      bookArray
    );
  }
  return bookArray;
}

async function exportNote(note, notePath, pConfig) {
  if (note.body) {
    const fileDir = path.join(pConfig.exportPath, notePath);
    await checkDir(fileDir);

    var fileExt = pConfig.mode;
    var fileBody;

    if (pConfig.mode == "md") {
      let body = note.body
      const uris = body.match(/inkdrop:\/\/file:[^) "']*/g) || []
      if (uris.length > 0) {
        const picDir = path.join(fileDir, "pics")
        await checkDir(picDir);
        body = await replaceImages(body, picDir, fileDir)
      }
      fileBody = '# ' + note.title + '\n\n' + body;
    } else {
      const tempBody = '# ' + note.title + '\n\n' + note.body;
      const rawBody = await renderHTML(tempBody);
      fileBody = await replaceHTMLImagesWithDataURI(rawBody);
    }

    const sanitizedTitle = sanitize(note.title, { replacement: '-' });
    const fileName = `${sanitizedTitle}.${fileExt}`;
    const filePath = path.join(fileDir, fileName);

    try {
      fs.writeFileSync(filePath, fileBody);
    } catch (err) {
      notify('Error', 'Error writing file', err.message, true);
    }
    if (pConfig.dateType == "Create") {
      touch.sync(filePath, { time: new Date(note.createdAt) });
    } else if (pConfig.dateType == "Update") {
      touch.sync(filePath, { time: new Date(note.updatedAt) });
    }
  }
}

async function checkDir(dirName) {
  if (!fs.existsSync(dirName)) {
    try {
      fs.mkdirSync(dirName, { recursive: true });
    } catch (err) {
      notify('Error', 'Error writing to dir', err.message, true);
    }
  }
}