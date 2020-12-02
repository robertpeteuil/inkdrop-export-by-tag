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
  replaceHTMLImagesWithDataURI,
  addTitleToMarkdown
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

async function getTag(tags, tagName) {
  try {
    const { _id } = await tags.findWithName(tagName);
    return _id;
  } catch (err) {
    notify('Error', 'Export Failed', `Cannot find Tag ${tagName}`, true);
  }
}

async function getNotes(notes, tagId) {
  const queryOptions = {
    sort: [{ title: 'desc' }],
    includeDocs: true,
    limit: 500
  };

  try {
    const { docs } = await notes.findWithTag(tagId, queryOptions);
    return docs;
  } catch (err) {
    notify('Error', 'Error getting notes', err.message, true);
  }
}

export async function exportTaggedNotes(tagName, htmlMode) {

  const pConfig = inkdrop.config.get('export-by-tag');
  pConfig.htmlMode = htmlMode

  const db = await inkdrop.main.dataStore.getLocalDB();
  const tagId = await getTag(db.tags, tagName);
  var noteList = await getNotes(db.notes, tagId);

  if (noteList.length === 0) {
    notify('Warning', 'No Notes Exported', `Tag: ${tagName} not on any notes`, true);
  }

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
  
  const expType = (htmlMode) ? "HTML" : "Markdown"
  const notesP = (i > 1) ? "notes" : "note"
  notify('Info', `Exported ${notesP} with tag:${tagName}`, `${i} ${notesP} exported as ${expType}`);

  return `${i} notes exported to ${pConfig.exportPath}`;
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

    var fileBody;
    var fileExt;

    if (pConfig.htmlMode) {
      let body = '# ' + note.title + '\n\n' + note.body;
      body = await renderHTML(body);
      fileBody = await replaceHTMLImagesWithDataURI(body);
      fileExt = "html";
    } else {
      let body = note.body
      const uris = body.match(/inkdrop:\/\/file:[^) "']*/g) || []
      if (uris.length > 0) {
        const picDir = path.join(fileDir, "pics")
        await checkDir(picDir);
        body = await replaceImages(body, picDir, fileDir)
      }
      fileBody = await addTitleToMarkdown(body, note.title);
      fileExt = "md";
    }

    const sanitizedTitle = sanitize(note.title, { replacement: '-' });
    var fileName = `${sanitizedTitle}.${fileExt}`;
    var filePath = path.join(fileDir, fileName);
    const wFlag = (pConfig.allowOverwrite) ? "w" : "wx"

    try {
      fs.writeFileSync(filePath, fileBody, { flag: wFlag });
    } catch (err) {
      const dateSh = new Date().toISOString()
                               .replace(/-|:/g, '')
                               .replace(/T/, '-')
                               .substr(0, 15)
      fileName = `${sanitizedTitle}-${dateSh}.${fileExt}`;
      filePath = path.join(fileDir, fileName);
      try {
        fs.writeFileSync(filePath, fileBody, { flag: wFlag });
      } catch (err) {
        notify('Error', 'Error writing file', err.message, true);
      }
    }

    if (pConfig.dateType == "Note Create") {
      touch.sync(filePath, { time: new Date(note.createdAt) });
    } else if (pConfig.dateType == "Note Modify") {
      touch.sync(filePath, { time: new Date(note.updatedAt) });
    } else if (pConfig.dateType == "Separate Values") {
      fs.utimesSync(filePath, new Date(note.updatedAt), new Date(note.createdAt));
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