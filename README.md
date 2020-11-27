# Export Inkdrop notes by tag as Markdown or HTML

This [Inkdrop](https://www.inkdrop.app/) plugin allows exporting all notes with a Tag by simply right-clicking on the Tag and selecting an export format from the context menu.

![Example](https://user-images.githubusercontent.com/1554603/100481781-7af32880-30b2-11eb-9127-a272b733fd67.png)

Configuration options allow pre-defining an export location, setting file overwrite mode, configure the timestamps placed on exported files, and customizing the export directory structure.

## Install

```sh
ipm install export-by-tag
```

## Usage

1. Right-click on a Tag in any of these areas: sidebar tag-list, middle note-list, editor title block for note
2. Chose an export option from the pop-up
   1. Export notes with tag as Markdown
   2. Export notes with tag as HTML
3. Select a download destination in the dialog

## Options

The configurable options are described below, these are all optional.

### Set Download Folder

- Allows pre-defining the download folder. Can be any folder in users home-dir (`~/` on Mac/Linux).
- When not defined (default) a dialog box is displayed to enable selecting a download location
  - Once set, exported files are written to the folder specified and the dialog box isn't displayed.
- Using `/` at the beginning or end of the entry is not necessary.
  - example: `/notes/` is the same as `notes`, both are used as `{userhome}/notes/`

### Set Exported Files Create and Modify Timestamps

- Enables controlling timestamps of exported files (defaults to `Current Time`).
  - By default exported files are timestamped with the current date/time.
- There are options to set these to the metadata values from the corresponding note.
  - `Note Create` sets both File Create and Modified to the time the Note was created.
    - Useful when using file-system sort functions to sort dated meeting notes.
  - `Note Modify` sets both File Create and Modified to the time the Note was modified.
  - `Separate Values` sets File Create to note's creation time and File Modified to note's modified time.
    - Most accurate representation, but not always desired.

### Export Files to Directory Structure that matches Notebook Hierarchy

- Re-creates the notebook hierarchy for exported notes using folders (off by default).
  - Folders are created in the download folder (whether set by dialog or config)
- This option allows preserving the original organization of the notes.
  - This may be desired because exporting notes by tag will often export notes located in many different notebooks and sub-notebooks.

### Allow Exported Files to Overwrite Existing Files

- Allows exported files to overwrite existing files of the same name (off by default).
- By default, if a file exists a date-time string is appended to the filename.
  - The date-time string format is `YYYYMMDD-HHMMSS` and is appended before the file suffix.

## Change Log

See the [GitHub releases](https://github.com/robertpeteuil/inkdrop-export-by-tag/releases) for an overview of what changed in each update.
