# Chrome Post-it Notes Development History

This file documents the development process of the Chrome Post-it Notes extension through the prompts provided to Claude.

## Initial Creation
**Prompt:** "Can you create a chrome extension that allows me to save post it notes"

- Created basic Chrome extension structure
- Added manifest.json with storage permissions
- Created popup.html with simple note interface
- Implemented popup.js with Chrome storage functionality
- Added popup.css for yellow post-it styling
- Created placeholder icons

## GitHub Repository Setup
**Prompt:** "I have gh githiub cli tool installed. Can you use this to create a new repo for this project?"

- Initialized git repository
- Created .gitignore and README.md
- Used gh CLI to create public repository
- Pushed initial code to GitHub

## Tagging Feature
**Prompt:** "I'd like to be able to add tags, maybe another field to add tags or whatever you think looks professional"

- Added tags input field
- Implemented tag parsing (comma-separated)
- Added visual tag display as clickable pills
- Added tag filtering functionality
- Styled tags with hover effects

## Auto-fill Selected Text
**Prompt:** "I would like to automatically fill in the note with whatever is selected by the mouse. Is that possible?"

- Added activeTab and scripting permissions
- Implemented automatic text selection capture
- Auto-populates note field when extension opens

## Title and URL Fields
**Prompt:** "I would like a Title field for the user to fill out, and also a URL field that captures the current URL. If the user clicks "Add Note" without filling out the Title, then take the first 40 characters and append "..." if longer than 40 characters."

- Added title field with auto-generation from content
- Added URL field that auto-captures current page URL
- URL displays as clickable hostname in notes
- Implemented 40-character title truncation

## Advanced Fields and Tabbed Interface
**Prompt:** "I want a to add a creation date that is auto populated, a status and priority. status is open, closed, working, archived. priority is low, medium, high, critical. We should have two tab views, one with just the Title and Description (note text), and Tags. And a details tab view that has all the fields."

- Added creation date (auto-populated)
- Added status dropdown (open, working, closed, archived)
- Added priority dropdown (low, medium, high, critical)
- Created tabbed interface (Simple/Details)
- Added visual indicators for status and priority
- Added status filter in filter section

## Tab Reorganization
**Prompt:** "I want the "Filter by tag..." and below to go into a separate view tab called "Query". And rename "Simple" tab to "Add". Rename "Details" to "Add+"."

- Renamed Simple tab to "Add"
- Renamed Details tab to "Add+"
- Created Query tab for all filtering
- Moved filter controls to Query tab
- Tag clicks auto-switch to Query tab

## Query Tab Isolation
**Prompt:** "I don't want the query results showing on the "Add" and "Add+" tabs, only on the "Query" tab"

- Notes only display on Query tab
- Add/Add+ tabs show only input forms
- Cleaner, more focused interface

## Enhanced Tag Parsing
**Prompt:** "for tags, whitespace is a valid separator along with comma and semicolon"

- Updated tag parsing regex to accept whitespace, comma, and semicolon
- Updated placeholder text to reflect all separator options
- Examples: 'work todo', 'work,todo', 'work;todo' all work

## Edit Functionality
**Prompt:** "For the notes that are displayed, in addition to the "x" to delete, I want an edit icon which should allow me to edit all the details (i.e. opening an "Edit" tab with the same fields that are in the "Add+" tab with an "Apply" or "Cancel" button at the bottom). When the "Edit" tab is visible the other tabs should be invisible and vice-versa."

- Added edit icon (✎) to each note
- Created Edit interface with all fields
- Edit mode hides main tabs
- Apply button saves changes
- Cancel button returns without saving
- Preserves creation date while updating timestamp

## Documentation
**Prompt:** "Please add all my prompts to the CLAUDE.md file so that I have a good history of how this program was created."

- Created this CLAUDE.md file
- Documented all development prompts
- Provides complete development history

## Technical Summary

The Chrome Post-it Notes extension evolved from a simple note-taking tool to a full-featured application with:
- Multiple input modes (Add, Add+)
- Advanced filtering (Query tab)
- Full CRUD operations (Create, Read, Update, Delete)
- Rich metadata (status, priority, dates)
- Flexible tagging system
- Context-aware features (URL capture, text selection)

Each iteration built upon the previous functionality while maintaining backward compatibility and a clean user interface.