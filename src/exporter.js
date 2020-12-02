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
    const tagMeta = await tags.findWithName(tagName);
    return tagMeta._id;
  } catch (err) {
    notify('Error', 'Export Failed', `Cannot find Tag: ${tagName}`, true);
  }
}

async function getFilteredNotes(db, tagId, pConfig) {
  var {noteList, unused} = await getNotes(db.notes, tagId);
  if (noteList.length === 0) {
    return {noteList: [], skipped: 0};
  }
  
  const skipNames = pConfig.skipBooks.replace(/,\s+/g, ',').split(',')
  var skipIds = [];
  for (var i = 0; i < skipNames.length; i++) {
    try {
      var { _id } = await db.books.findWithName(skipNames[i]);
      skipIds.push(_id);
    } catch {
      if (!pConfig.ignoreBookErrors) {
        notify('Warning', `Unable to skip book: ${skipNames[i]}`, "Not found but listed in config");
      } else {
        console.log(`Notebook: ${skipNames[i]} not found, yet listed in skipBooks config entry`);
      }
    }
  }
  console.log(`skipped book ids: ${skipIds}`);

  const filteredNotes = noteList.filter(note => !skipIds.includes(note.bookId))
  const skipNotes = noteList.length - filteredNotes.length
  return {noteList: filteredNotes, skipped: skipNotes}
}

async function getNotes(notes, tagId) {
  const queryOptions = {
    sort: [{ title: 'desc' }],
    includeDocs: true,
    limit: 500
  };

  try {
    var { docs } = await notes.findWithTag(tagId, queryOptions);
    return {noteList: docs, skipped: 0};
  } catch (err) {
    notify('Error', 'Error getting notes', err.message, true);
  }
}

export async function exportTaggedNotes(tagName, htmlMode) {

  const pConfig = inkdrop.config.get('export-by-tag');
  pConfig.htmlMode = htmlMode

  const db = await inkdrop.main.dataStore.getLocalDB();
  const tagId = await getTag(db.tags, tagName);
  const {noteList, skipped} = pConfig.skipBooks ?
            await getFilteredNotes(db, tagId, pConfig) :
            await getNotes(db.notes, tagId);

  if (noteList.length === 0 && skipped === 0) {
    notify('Warning', 'Zero Notes Exported', `Tag: ${tagName} not on any notes`, true);
  } else if (noteList.length === 0) {
    notify('Warning', 'Zero Notes Exported', `${skipped} ${noteWord(skipped)} with Tag: ${tagName} skipped`, true);
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
  notify('Info', `Exported ${i} ${noteWord(i)} with tag: ${tagName}`, `${noteWord(i)} exported in ${expType} format`);

  console.log(`exported notes: ${noteList.length}, skipped notes: ${skipped}`);

  return `${i} ${noteWord(i)} exported in ${expType} format to ${pConfig.exportPath}`;
}

function noteWord(checkVal){
  return checkVal > 1 ? "notes" : "note"
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

async function addTitleToMarkdown(md, title) {
  const match = md.match(/^---\n.*?---/ms);

  if (match instanceof Array && match.length > 0 && match.index === 0) {
    const frontmatter = match[0];
    return `${frontmatter}\n# ${title}\n${md.substr(frontmatter.length)}`;
  } else {
    let body = (md.match(/^.*$/m)[0].length === 0) ? `\n${md}` : `\n\n${md}`
    return `# ${title}${body}`;
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