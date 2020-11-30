'use babel';

import { exportTaggedNotes } from './exporter';

let commandListener = null;

async function doExportContext(e, htmlMode) {
  const tagName = e.target.innerText
  const result = await exportTaggedNotes(tagName, htmlMode);
  if (result) {
    console.log(result);
  }
}

module.exports = {
  config: {
    exportDir: {
      title: "Set Download Folder (within home-dir)",
      description: "Destination within user-home for exported files",
      type: 'string',
      default: '',
    },
    dateType: {
      title: "Set Exported Files Create and Modify Timestamps",
      description: "Set exported file timestamps to Current Time, Note Creation Time, Note Modify Time or Separate Values (file create = note create, file modify = note modify)", 
      type: 'string',
      enum: ['Current Time', 'Note Create', 'Note Modify', 'Separate Values'],
      default: 'Current Time',
    },
    dirStruct: {
      title: 'Export Files to Directory Structure that matches Notebook Hierarchy',
      description: 'Export files into folders (created as necessary) to mirror notebooks',
      type: 'boolean',
      default: false,
    },
    allowOverwrite: {
      title: 'Allow Exported Files to Overwrite Existing Files',
      description: 'Disable overwrite protection and allow file replacement during export',
      type: 'boolean',
      default: false,
    },
    skipBooks: {
      title: 'Notebooks to Skip',
      description: 'Name of Notebooks to skip when searching for tagged notes (comma separated list).',
      type: 'string',
      default: '',
    },
  },
  activate: () => {
    commandListener = inkdrop.commands.add(document.body, {
      'export-by-tag:context': (e) => doExportContext(e, false),
      'export-by-tag:contextHtml': (e) => doExportContext(e, true),
    });
  },
  deactivate: () => {
    commandListener.dispose();
  },
};