# Inkdrop Plugin - Export Notes by Tag

This plugin allows exporting all notes with specified a tag in Markdown or HTML format.

The plugin can be used ad-hoc by right-clicking on a Tag, choosing the export option in the context menu and selecting the download destination.  It also allows pre-defining the Tag and download destination, which allows it to run without user interaction.  It includes a number of optional settings to enable its use in varied workflows.

## Install

```
ipm install export-by-tag
```

## Usage

The plugin can be used in different modes, which provide alternate methods of triggering

- right-clicking on a tag and selecting one of the new options from the context-menu runs the plugin in Context Mode.
  - no configuration required
  - requires selecting download destination on each run

- triggered via keystroke sequence or Export Menu (Express Mode)
  - requires setting "export tag" and "export location" in plugin settings
  - no interaction required after triggering

Usage in Context Mode doesn't require any configuration and allows you to choose an export location for each export. Config options provide additional control over exported files.

Usage in Express Mode doesn't require and user interaction, but requires setting

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
- express mode - via menu or hot-key
  - pre-defined export tag (reqd)
  - export folder (reqd)
    - defaults to user home
  - other options
    - options listed above
      - hierarchy & keep creation date
    - book to ignore
      - useful to ignore templates
    - custom file extension for markdown
      - simplifies identification of files
    - remove tag after complete
      - workflow to only export once

Includes many options for adjusting workflow: ignoring notebooks, exporting into folders that match the notebook hierarchy, setting file creation date to note date, removing tag after export and more.



Before attempting to export, make sure to set the Export Tag in the Plugin Preferences.

The export can be triggered by calling the command `export-by-tag:trigger`.

## Configure Shortcut

Add a shortcut for the plugin by editing [keymap.cson](https://docs.inkdrop.app/manual/customizing-keybindings) and mapping keys to the command `export-by-tag:trigger`.

Example binding:

```cson
'body':
  'cmd-ctrl-alt-e': 'export-by-tag:trigger'
```

## Changelog

See the [GitHub releases](https://github.com/robertpeteuil/inkdrop-export-by-tag/releases) for an overview of what changed in each update.
