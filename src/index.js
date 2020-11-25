'use babel';

import { exportTaggedNotes } from './exporter';

let commandListener = null;

async function doExportContext(htmlMode, e) {
  const tagName = e.target.innerText
  const result = await exportTaggedNotes(htmlMode, tagName);
  if (result) {
    console.log(result);
  }
}

module.exports = {
  config: {
    exportDir: {
      title: "Set predefined Download Folder (under user home-dir)",
      description: "Destination under user-home dir for exported files (appended to '~/').",
      type: 'string',
      default: 'Downloads',
    },
    dateType: {
      title: "Date to Set on File, match 'Create' / 'Update' of Note or use 'Current'",
      description: "Date to set on exported file, current or match update/create of Note.", 
      type: 'string',
      enum: ['Current', 'Create', 'Update', 'Both'],
      default: 'Current',
    },
    dirStruct: {
      title: 'Export Files to Folders matching Notebook Hierarchy',
      description: 'Export files into folders/sub-folders that mirror notebook hierarchy.',
      type: 'boolean',
      default: false,
    },
    allowOverwrite: {
      title: 'Allow Overwrite of Existing Files by Exported Files',
      description: 'Disable overwrite protection and allow files to replaced during export.',
      type: 'boolean',
      default: false,
    },
  },
  activate: () => {
    commandListener = inkdrop.commands.add(document.body, {
      'export-by-tag:context': (e) => doExportContext(false, e),
      'export-by-tag:contextHtml': (e) => doExportContext(true, e),
    });
  },
  deactivate: () => {
    commandListener.dispose();
  },
};