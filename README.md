# Inkdrop Plugin - Export by Tag

This plugin allows exporting all notes with specified a tag in Markdown or HTML format.

It doesn't require pre-configuration and is used by right-clicking on a Tag, selecting an export type from the pop-up context menu (Markdown or HTML) and choosing a download destination.

Config options provide additional control over how the files are exported.

## Install

```
ipm install export-by-tag
```

## Usage

Right-clicking on a Tag to trigger an export is supported in the tag-list in sidebar, the message list in the middle, and the title area of a note in the editor.

and selecting one of the options from the context-menu

## Modes

This plugin runs in two different modes

- Context Mode: triggered via context menu when right-clicking on a tag
  - no configuration required
  - requires selecting download destination on each run
  - optional settings, including pre-define export folder
  - useful for occasional exports
- Express Mode: triggered via keystroke sequence or Export Menu
  - requires setting "export tag" and "export location" in plugin settings
  - many optional settings provide flexibility
  - no interaction required after triggering
  - useful for repetitive workflows

- an "express-mode" which exports without dialog boxes by using a predefined "export tag" and "export location" in settings

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
