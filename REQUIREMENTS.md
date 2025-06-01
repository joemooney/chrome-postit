# Chrome Post-it Notes Extension Requirements

## Overview
A Chrome extension for creating, managing, and optionally syncing post-it notes with a backend database. The extension provides multiple viewing modes and rich note management features.

## Functional Requirements

### 1. Note Management

#### 1.1 Note Creation
- Users can create notes with the following fields:
  - **Title** (optional - auto-generated from first 40 chars of content if not provided)
  - **Description/Content** (required)
  - **Tags** (optional - multiple tags supported)
  - **URL** (auto-captured from current tab)
  - **Status** (dropdown: open, working, closed, archived)
  - **Priority** (dropdown: low, medium, high, critical)
  - **Creation Date** (auto-populated)
  - **Last Updated** (auto-tracked)

#### 1.2 Note Display
- Notes display all metadata in a visually organized format
- Color-coded indicators for status and priority
- Tags shown as clickable pills
- URLs display as clickable hostnames
- Shows last updated date when different from creation date

#### 1.3 Note Operations
- **Create**: Add new notes via form submission
- **Read**: View all notes in Query tab
- **Update**: Edit all note fields via edit interface
- **Delete**: Remove notes with confirmation

#### 1.4 Data Validation
- Prevent duplicate titles (enforced at UI and database level)
- Auto-generate title if not provided
- Validate required fields before saving

### 2. User Interface

#### 2.1 View Modes
- **Popup View**: Compact 350px default width, resizable
- **Sidebar View**: Chrome side panel integration
- **Browser Tab View**: Full-page two-column layout

#### 2.2 Tab Structure
- **Add Tab**: Simple form (title, description, tags)
- **Query Tab**: Note list with filtering
- **Settings Tab**: Configuration options
- **Edit Tab**: Full form for editing (replaces other tabs when active)

#### 2.3 Theme Support
- Light theme (default)
- Dark theme with full UI coverage
- Theme preference persists across sessions

#### 2.4 Responsive Design
- Popup view resizable (300-1200px width, 400-900px height)
- Field layout wraps appropriately at small widths
- Browser tab view uses responsive grid for notes

### 3. Features

#### 3.1 Auto-Capture
- Automatically capture selected text when extension opens
- Auto-fill current tab URL
- Populate appropriate fields based on context

#### 3.2 Context Menu Integration
- Right-click menu option "Post-it"
- "Add" option when text is selected
- "Query" option when no text selected
- Opens in existing view if available

#### 3.3 Filtering System
- Filter by tags (type to filter)
- Filter by status (dropdown)
- Clear filter button
- Clicking tags auto-filters

#### 3.4 Tag System
- Multiple separators supported (comma, semicolon, whitespace)
- Tags display as interactive pills
- Click tags to filter notes
- Visual hover effects

### 4. Data Management

#### 4.1 Local Storage
- Chrome storage API for persistence
- Notes survive extension updates
- Settings persist across sessions
- Saved popup dimensions

#### 4.2 Database Integration (Optional)
- Connect to GRPC backend via REST gateway
- Two-way synchronization
- Conflict resolution based on timestamps
- Manual sync button in settings
- Connection status indicator

#### 4.3 Data Schema
```
notes:
  - id (local identifier)
  - db_id (database identifier)
  - title (unique)
  - description/text
  - url
  - tags (array)
  - status
  - priority
  - creationDate
  - lastUpdated
  - userName
  - createdBy

tags:
  - id
  - name (unique)

note_tags:
  - note_id
  - tag_id
```

### 5. User Settings

#### 5.1 Configurable Options
- **Theme**: Light/Dark mode toggle
- **Default View**: Popup/Sidebar/Browser Tab
- **User Name**: Optional personal identifier
- **User Nickname**: Optional display name
- **Database URL**: Optional backend connection

#### 5.2 Settings Behavior
- Save button applies changes
- Cancel button reverts changes
- Settings tab exclusive when active
- Returns to previous tab after save

### 6. Error Handling

#### 6.1 User Notifications
- Success toasts (green, auto-dismiss after 1.5s)
- Error toasts (red, manual dismiss required)
- Connection status messages
- Sync progress indicators

#### 6.2 Data Integrity
- Handle duplicate title conflicts
- Graceful database connection failures
- Individual sync failures don't stop batch operations
- Proper error messages for all failure modes

## Technical Requirements

### 1. Chrome Extension APIs
- **Manifest V3** compliance
- **Permissions Required**:
  - `storage` - Local data persistence
  - `activeTab` - Current tab information
  - `scripting` - Content script injection
  - `sidePanel` - Sidebar functionality
  - `contextMenus` - Right-click integration

### 2. Browser Compatibility
- Chrome/Chromium browsers
- Minimum Chrome version: 114 (for Side Panel API)
- Responsive to different screen sizes
- Handle multiple monitor setups

### 3. Performance
- Fast note creation/retrieval
- Efficient filtering implementation
- Smooth UI transitions
- Minimal memory footprint

### 4. Backend Integration
- REST API gateway for GRPC translation
- Support for SQLite database backend
- Proper connection handling
- Secure data transmission

### 5. Development Setup
- Node.js for REST gateway
- NPM packages: express, @grpc/grpc-js, @grpc/proto-loader, cors
- Proto files for GRPC definitions
- Optional database server (datasink)

## Constraints and Limitations

### 1. Chrome API Limitations
- Side Panel requires user gesture to open
- Cannot set sidebar as true default view
- Content script injection requires page load
- Extension popup has size constraints

### 2. Database Requirements
- Requires REST gateway server running
- Database must use "default" identifier
- Title field must be unique
- GRPC direct connection not possible from browser

### 3. UI Constraints
- Maximum popup size limited by screen
- Some features require specific Chrome versions
- Dark theme requires explicit styling for all elements

## Future Considerations

### 1. Potential Enhancements
- Cloud sync without external database
- Multi-user collaboration features
- Advanced search capabilities
- Export/Import functionality
- Keyboard shortcuts

### 2. Scalability
- Handle thousands of notes efficiently
- Optimize database queries
- Implement pagination for large datasets
- Consider IndexedDB for better local storage

### 3. Security
- Sanitize user inputs
- Secure database connections
- Protect sensitive user data
- Implement proper authentication for multi-user scenarios