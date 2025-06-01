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

## Sidebar Feature
**Prompt:** "Please add button to the extension to pin the extension as a sidebar"

- Added Chrome Side Panel API support
- Created sidebar button (⎘) in popup header
- Created sidepanel.html with adapted layout
- Added background.js to handle side panel operations
- Extension can now be used as persistent sidebar

## Settings and Theme Feature
**Prompt:** "I would like to add a configuration (settings) that has theme (light/dark), user's name, and user's nickname"

- Added settings button (⚙) in header
- Created Settings tab with theme toggle
- Added user name and nickname fields
- Implemented light/dark theme with CSS
- Settings persist in Chrome storage
- Dark theme applies to all UI elements

## Settings Navigation Fix
**Prompt:** "When I save settings I want the settings tab to stop being visible. You should instead navigate to the tab that was showing before the settings was clicked on."

- Track previous tab before entering settings
- Return to previous tab after saving
- Show "Saved!" confirmation briefly
- Improved navigation flow

## Tab Display Bug Fix
**Prompt:** "When I switch from settings tab to another tab, I still see settings fields"

- Fixed tab visibility using CSS classes
- Removed problematic inline display styles
- Ensured proper tab switching behavior

## Add+ Tab Styling Fix
**Prompt:** "on Add+ tab, the "Add Note" button looks different than on the Add tab. Please fix."

- Fixed button styling consistency
- Ensured form styling matches across tabs
- Corrected #addNote2 button styles

## Dark Theme Dropdown Fix
**Prompt:** "in Dark theme, the drop down menus on the Add+ tab show light theme coloring. Please correct."

- Added dark theme styles for all select elements
- Fixed dropdown background and text colors
- Improved contrast in dark mode

## Selected Text Fix
**Prompt:** "The mouse selection is no longer being used to populate the description for a new note. Can you please restore that behavior."

- Added error handling for chrome.scripting API
- Added delay for page readiness
- Only populate empty fields
- Focus appropriate field based on active tab

## Browser Tab View Feature
**Prompt:** "Is it possible to click on a pop-out button such that the pop-up panel becomes expanded into its own new tab in the browser instead? If so, let's call this 'browser tab view' as opposed to 'pop-up view' mode, and 'sidebar view'."

- Added "Open in new tab" button (⬚) in header
- Created tab.html with full-page layout
- Two-column design (sidebar for controls, main area for notes)
- Responsive grid layout for notes display
- All functionality available in tab view
- Notes always visible for better overview

## Default View Setting
**Prompt:** "In the configuration settings, there should be a default view option of either 'browser tab', 'pop-up', or 'sidebar'. Then when you open the extension it should select the appropriate view."

- Added "Default View" dropdown in settings
- Options: Popup, Sidebar, Browser Tab
- Removed default_popup from manifest.json
- Implemented chrome.action.onClicked handler
- Extension opens in configured default view
- Settings available in all three views

## Settings Tab Visibility Fix
**Prompt:** "The Settings tab should not be visible after you click 'Save Settings'. Likewise, only the 'Settings' tab should be visible when you click on the settings configuration cog icon."

- Hide all tab buttons except Settings when cog clicked
- Show only Settings tab when in settings mode
- Restore all tabs after saving settings
- Consistent behavior in both popup and tab views

## Sidebar Opening Limitation
**Issue:** "The current behavior, when I changed to sidebar view and saved settings, now when I click on the extension icon the popup view momentarily appears and disappears, with no sidebar view presented"

**Error:** "Error opening side panel: Error: `sidePanel.open()` may only be called in response to a user gesture."

- Chrome's Side Panel API requires user interaction
- Cannot automatically open sidebar when extension icon clicked
- Solution: Show message prompting user to click sidebar button
- Browser tab view still works as default (can auto-open)
- Popup remains the most reliable default view

## Technical Summary

The Chrome Post-it Notes extension evolved from a simple note-taking tool to a full-featured application with:
- Multiple viewing modes (popup, sidebar, browser tab)
- Multiple input modes (Add, Add+)
- Advanced filtering (Query tab)
- Full CRUD operations (Create, Read, Update, Delete)
- Rich metadata (status, priority, dates)
- Flexible tagging system
- Context-aware features (URL capture, text selection)
- Customizable settings (theme, default view, user info)

Each iteration built upon the previous functionality while maintaining backward compatibility and a clean user interface.

Note: Due to Chrome API restrictions, the sidebar view cannot be set as a true default view - it requires user interaction to open.

## Multiple UI Improvements
**Prompt:** "please make the popup view resizable, also in the default size the priority is cut off and not visible so the layout should wrap. And the Priority should also be shown on the Query view in the Browswer Tab and Sidebar views. Double clicking on the Title should edit the note."

- Made popup view resizable with min/max constraints
- Fixed field-row layout to wrap when space is limited
- Priority already shown in all views (was already implemented)
- Added double-click on title to edit note functionality
- Added hover effect on titles to indicate clickability
- Applied changes to all view modes

## Database Integration
**Prompt:** "In the settings I want an optional database URL. This is a GRPC server where we can add, update, delete, query our postit notes. The database will automatically assign a note_id sequence number as a unique primary key for notes. The database on the backend is generic in nature and accepts requests for different databases and schemas. The file 'db.proto' is the protobuf file for the database. PostIt.schema is a schema representation of our particular schema."

- Added optional database URL field in settings
- Created database.js module for gRPC-Web communication
- Implemented CRUD operations (Create, Read, Update, Delete)
- Added automatic sync when notes are added/deleted
- Database ID tracking for local notes
- Connection status indicator in settings
- Support for tags through junction table
- Works across all view modes (popup, sidebar, browser tab)

## Sidebar Priority Usage
**Prompt:** "When I have the sidebar open and I click on the postit extension icon or mouse menu, it opens the popup. It should just use the sidebar menu and open the 'Add' view tab"

- Check for open sidebar before showing popup
- Right-click context menu properly uses existing sidebar
- Extension icon click shows popup briefly due to Chrome limitation
- When sidebar detected, popup auto-closes and sidebar switches to Add tab
- Chrome requires default_popup for normal popup functionality

---

## Session: Database Sync and UI Fixes (January 31, 2025)

### Database Connection Error Fix
**Context:** Extension tried to connect to "postit" database but server was using "default"

- Created missing REST gateway (rest-gateway.js) to translate HTTP/JSON to GRPC
- Created common.proto for shared GRPC types
- Fixed proto references to use correct service names
- Updated database name from "postit" to "default"
- Fixed parameterized queries by using escaped SQL strings

### Title Uniqueness and Error Handling
**Prompt:** "I got an error because the title was null. Default the title to the first 40 characters of the description if no title is given"

- Added automatic title generation from description
- Falls back to "Untitled Note" if no description

**Prompt:** "each time we open the extension, it now adding inserting all the rows into the database, so we keep duplicating existing rows. I have updated the database to make the title is also a unique alternate key for the notes table."

- Fixed duplicate insertions by checking title before syncing
- Added duplicate title prevention in UI
- Implemented proper unique constraint handling
- Links existing notes by title instead of creating duplicates

### Enhanced Error Notifications
**Prompt:** "When I click 'Add Note' with a duplicate title, I get a very brief green toaster popup that a note with that title already exists. This toaster should be red since it is an error and it should stay on the screen until dismissed."

- Modified showToast function to accept error type
- Error toasts now red with dismiss button (×)
- Success toasts remain green and auto-dismiss
- Added proper dark theme styling for error toasts

### Database Field Updates
**Prompt:** "I have added a last_updated column to the notes table. Show this in the view for notes and in the Edit view (readonly). Automatically, update this field when a note is edited successfully."

- Added last_updated field to database operations
- Shows "Updated: [date]" in note metadata when modified
- Added readonly Last Updated field in edit view
- Automatically sets to CURRENT_TIMESTAMP on updates
- Sets to created_at on initial insert

### Database Sync Feature
**Prompt:** "In Settings there should be 'Sync Database' button if we are connected to the database. This should run a synchronization between the frontend and the backend database"

- Added "Sync Database" button that appears when connected
- Implemented comprehensive two-way sync:
  - Uploads local notes without db_id
  - Downloads database notes not in local storage
  - Resolves conflicts based on lastUpdated timestamp
  - Links notes by title when possible
- Shows progress feedback during sync
- Automatic sync on initial connection

### Popup Resize Issues
**Prompt:** "The resize triangle on the popup will not allow for height increase, only reduction. Also the width is limited to the current width and can only be made smaller."

- Removed CSS max-width/height constraints (was 600x800)
- Increased maximum to 90% of screen or 1200x900px
- Fixed resize handle from position:fixed to position:absolute
- Added visual feedback during resize (cursor change)
- Properly saves and restores dimensions

### Delete Operation Fix
**Prompt:** "when you 'x' a note it should result in a delete database operation"

- Fixed deleteNote function to pass both noteId and db_id
- Added debug logging to troubleshoot connection issues
- Ensures database delete happens when note has db_id

### Missing Function Fix
**Prompt:** "Failed to sync notes from database: TypeError: dbClient.getNotes is not a function"

- Added missing getNotes() function as alias for queryNotes()

### Git Operations
**Prompt:** "Have you being pushing these commits to github?" / "I have the gh cli tool, please use that"

- Used git to stage all changes
- Created comprehensive commit message
- Pushed to GitHub repository using git push
- Commit included 18 files with 3,231 insertions

### Documentation Update
**Prompt:** "I copied CLAUDE.md to PROMPT_HISTORY.md. In future I want the prompts and summary of actions taken for each prompt to be stored in the PROMPT_HISTORY.md file."

- Compressed CLAUDE.md to concise overview format
- Documented session prompts in PROMPT_HISTORY.md
- Established new documentation pattern for future sessions