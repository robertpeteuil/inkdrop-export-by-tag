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

async function getTag(tags, tagName) {
  try {
    // const tags = db.tags;
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

  // pConfig.mode = (htmlMode) ? "html" : "md"
  pConfig.htmlMode = htmlMode

  const db = await inkdrop.main.dataStore.getLocalDB();
  const tagId = await getTag(db.tags, tagName);
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
  
  const notesP = (i > 1) ? "Notes" : "Note"
  notify('Info', `Exported ${notesP} with tag:${tagName}`, `${i} ${notesP} exported to ${pConfig.exportPath}`);

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

    // var fileExt = pConfig.mode;
    var fileExt;
    var fileBody;

    if (pConfig.htmlMode) {
      const tempBody = '# ' + note.title + '\n\n' + note.body;
      const rawBody = await renderHTML(tempBody);
      fileBody = await replaceHTMLImagesWithDataURI(rawBody);
      fileExt = "html"
    } else {
      let body = note.body
      const uris = body.match(/inkdrop:\/\/file:[^) "']*/g) || []
      if (uris.length > 0) {
        const picDir = path.join(fileDir, "pics")
        await checkDir(picDir);
        body = await replaceImages(body, picDir, fileDir)
      }
      fileBody = '# ' + note.title + '\n\n' + body;
      fileExt = "md"
    }

    // if (pConfig.mode == "md") {
    //   let body = note.body
    //   const uris = body.match(/inkdrop:\/\/file:[^) "']*/g) || []
    //   if (uris.length > 0) {
    //     const picDir = path.join(fileDir, "pics")
    //     await checkDir(picDir);
    //     body = await replaceImages(body, picDir, fileDir)
    //   }
    //   fileBody = '# ' + note.title + '\n\n' + body;
    // } else {
    //   const tempBody = '# ' + note.title + '\n\n' + note.body;
    //   const rawBody = await renderHTML(tempBody);
    //   fileBody = await replaceHTMLImagesWithDataURI(rawBody);
    // }

    // console.log("about to start writing file")
    // new method
    const sanitizedTitle = sanitize(note.title, { replacement: '-' });
    await writeToFile(sanitizedTitle, fileExt, fileDir, fileBody, pConfig.dateType, note);

    // original method
    // const sanitizedTitle = sanitize(note.title, { replacement: '-' });
    // var fileName = `${sanitizedTitle}.${fileExt}`;
    // var filePath = path.join(fileDir, fileName);
    // try {
    //   fs.writeFileSync(filePath, fileBody);
    // } catch (err) {
    //   notify('Error', 'Error writing file', err.message, true);
    // }

    // Set optional create and modify date on file
    // if (pConfig.dateType == "Create") {
    //   touch.sync(filePath, { time: new Date(note.createdAt) });
    // } else if (pConfig.dateType == "Update") {
    //   touch.sync(filePath, { time: new Date(note.updatedAt) });
    // } else if (pConfig.dateType == "Both") {
    //   fs.utimesSync(filePath, new Date(note.updatedAt), new Date(note.createdAt));
    //   touch.sync(filePath, { time: new Date(note.updatedAt) });
    // }
  }
}

async function writeToFile(fileTitle, fileExt, fileDir, fileBody, dateType, note) {
  var fileName = `${fileTitle}.${fileExt}`;
  var filePath = path.join(fileDir, fileName);

  // flag "wx" = write without overwrite, "w" write okay to overwrite
  fs.writeFile(filePath, fileBody, { flag: "wx" }, function(err) {
    if (err) {
      // console.log("file " + fileName + " already exists, testing next");
      const datestr = new Date().toISOString().replace(/-/g, '').replace('.', '').replace(/:/g, '').replace('T','-').replace('Z','')
      fileTitle = fileTitle + '-' + datestr;
      writeToFile(fileTitle, fileExt, fileDir, fileBody, dateType, note);
    }
    else {
      // console.log("Successfully written " + fileTitle);
      // Set optional create and modify date on file
      if (dateType == "Create") {
        touch.sync(filePath, { time: new Date(note.createdAt) });
      } else if (dateType == "Update") {
        touch.sync(filePath, { time: new Date(note.updatedAt) });
      } else if (dateType == "Both") {
        fs.utimesSync(filePath, new Date(note.updatedAt), new Date(note.createdAt));
        touch.sync(filePath, { time: new Date(note.updatedAt) });
      }
    }
});
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