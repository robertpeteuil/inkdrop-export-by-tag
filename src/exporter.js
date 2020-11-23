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

async function getIgnoreBookId(books, ignoreBook) {
  try {
    const bookMeta = await books.findWithName(ignoreBook);
    return bookMeta._id;
  } catch (err) {
    notify('Warning', `Warning: Not ignoring book '${ignoreBook}'`, 'Set in config but not found.');
    return '';
  }
}

async function extractTag(tagList, tagId) {
  // var i = 0;
  // while (i < tagList.length) {
  for (var i = 0; i < tagList.length; i++) {
    if (tagList[i] === tagId) {
      tagList.splice(i, 1);
      i--;
    // } else {
    //   ++i;
    }
  }
  return tagList;
}

export async function exportTaggedNotes(htmlMode, tagClicked) {

  const pConfig = inkdrop.config.get('export-by-tag');

  if (!tagClicked && !pConfig.exportTag) {
    notify('Error', 'Cannot export Notes with Preset Tag', 'Preset Tag not configured', true);
  }

  pConfig.mode = (htmlMode) ? "html" : "md"
  pConfig.express = (tagClicked) ? false : true
  const tagName = (tagClicked) ? tagClicked : pConfig.exportTag

  const db = await inkdrop.main.dataStore.getLocalDB();
  const tagId = await getTag(db, tagName);
  const ignoreBookId = (pConfig.ignoreBook && pConfig.express) ? await getIgnoreBookId(db.books, pConfig.ignoreBook) : ''
  var noteList = await getNotes(db.notes, tagId);

  // set base path based on mode and config settings
  if (pConfig.express || pConfig.useExPath) {
    pConfig.exportPath = path.join(os.homedir(), pConfig.expressPath);
  } else {
    const { filePaths: pathArrayToSave } = await dialog.showOpenDialog({
      title: `Select a directory to export notes with tag "${tagName}"`,
      properties: ['openDirectory', 'createDirectory']
    })
    if (pathArrayToSave) {
      pConfig.exportPath = pathArrayToSave[0]
    }
  }

  var s = 0;
  for (var i = 0; i < noteList.length; i++) {
    if (noteList[i].bookId != ignoreBookId) {

      var notePath = '';
      if (pConfig.dirStruct) {
        let bookArray = [];
        bookArray = await createBookArray(noteList[i].bookId, db.books, bookArray);
        notePath = bookArray.join('/');
      }

      await exportNote(noteList[i], notePath, pConfig);

      if (pConfig.removeTag && pConfig.express) {
        await updateNoteTags(noteList[i], db.notes, tagId);
      }
    } else {
      ++s;
    }
  }
  var exported = i - s;
  const messPre = (pConfig.express) ? "Express Export" : "Exported Note"
  if (exported == 1) {
    notify('Info', `${messPre} with tag:${tagName}`, `${exported} Note exported`);
  } else if (exported > 1) {
    notify('Info', `${messPre}s with tag:${tagName}`, `${exported} Notes exported`);
  } else {
    notify('Warning', 'No Notes Exported', `All notes with tag:${tagName} in ignored folder`);
  }
  return `${exported} Notes exported`;
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
      if (pConfig.express && pConfig.fileExt) {
        fileExt = pConfig.fileExt;
        if (fileExt[0] === '.') {
          fileExt = fileExt.substring(1);
        }
      }
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
    if (pConfig.setCreate) {
      touch.sync(filePath, { time: new Date(note.createdAt) });
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

async function updateNoteTags(note, noteObj, tagId) {
  const newTags = await extractTag(note.tags, tagId);
  console.log(`New Tags: ${newTags}`);

  note.tags = newTags;

  try {
    await noteObj.put(note);
  } catch (err) {
    notify('Error', 'Error updating tags on note', err.message);
  }
}