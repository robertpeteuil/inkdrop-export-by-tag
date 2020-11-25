# Inkdrop Plugin - Export by Tag

This plugin exporting all notes with specified a tag in Markdown or HTML format.

Just right-click on a Tag, chose an export type in the pop-up and select a download destination.

Config options provide the ability to streamline and configure settings for your workflow.

## Install

```
ipm install export-by-tag
```

## Usage

1. Right-clicking on a Tag in the: tag-list in sidebar, note list in the middle, title block of editor
2. Chose an export type in the pop-up menu
   1. Export notes with tag as Markdown
   2. Export notes with tag as HTML
3. Select a download destination in the dialog

## Options

set default a default download directory, control file overwrites, set exports control over how the files are exported.

This plugin runs in two different modes

- Context Mode: triggered via context menu when right-clicking on a tag
  - no configuration required
  - requires selecting download destination on each run
  - optional settings, including pre-define export folder
  - useful for occasional exports

It enables right-clicking on a tag and selecting from the context menu, "Export as Markdown" and "Export as HTML".
This brings up a dialog to select the export location, and then exports Notes with that tag in format chosen (markdown or HTML)). Right-clicking on tags can be performed in two locations: the tag list in the sidebar and the title block of the note in the editor pane.

- context export - via right-click menu
  - tag list, or tag in header of note editor
  - no config required
    - opens dialog and asks where to save
  - optional settings
    - keep hierarchy
    - keep creation date
    - use express export folder
      - no prompts

## Changelog

See the [GitHub releases](https://github.com/robertpeteuil/inkdrop-export-by-tag/releases) for an overview of what changed in each update.
