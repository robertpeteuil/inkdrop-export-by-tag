'use babel';

import { exportTaggedNotes } from './exporter';

let commandListener = null;

async function doExportExpress(htmlMode) {
  const result = await exportTaggedNotes(htmlMode);
  if (result) {
    console.log(result);
  }
}

async function doExportContext(htmlMode, e) {
  const tagName = e.target.innerText
  const result = await exportTaggedNotes(htmlMode, tagName);
  if (result) {
    console.log(result);
  }
}

module.exports = {
  config: {
    dirStruct: {
      title: 'Export Files to Folders matching Notebook Hierarchy',
      description: 'Export files into folders/sub-folders that mirror notebook hierarchy.',
      type: 'boolean',
      default: false,
    },
    setCreate: {
      title: 'Set File Creation-Date to Match Note',
      description: "Set creation date of exported file to creation of Note.",
      type: 'boolean',
      default: true,
    },
    useExPath: {
      title: 'Always Download to Express Mode Export Folder (set below)',
      description: "Use Express Mode Export Folder for all exported files (don't prompt).",
      type: 'boolean',
      default: false,
    },
    expressPath: {
      title: "Express Mode - Export Folder",
      description: "User directory for exported files (appended to '~/').",
      type: 'string',
      default: 'Downloads',
    },
    exportTag: {
      title: 'Express Mode - Export Tag',
      description: 'Notes with this tag exported.',
      type: 'string',
      default: '',
    },
    ignoreBook: {
      title: 'Express Mode - Ignore Notebook',
      description: 'Ignore this notebook when searching for Notes.',
      type: 'string',
      default: '',
    },
    fileExt: {
      title: "Express Mode - Custom Markdown File Extension",
      description: 'Create exported markdown files with this extension.',
      type: 'string',
      default: '',
    },
    removeTag: {
      title: 'Express Mode - Remove Tag after Export',
      description: 'Remove Export Tag from Notes after express-mode export.',
      type: 'boolean',
      default: false,
    },
  },
  activate: () => {
    commandListener = inkdrop.commands.add(document.body, {
      'export-by-tag:express': () => doExportExpress(false),
      'export-by-tag:expressHtml': () => doExportExpress(true),
      'export-by-tag:context': (e) => doExportContext(false, e),
      'export-by-tag:contextHtml': (e) => doExportContext(true, e),
    });
  },
  deactivate: () => {
    commandListener.dispose();
  },
};