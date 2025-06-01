# Chrome Post-it Notes Extension

A feature-rich Chrome extension for managing post-it notes with database synchronization capabilities.

## Overview

This Chrome extension allows users to create, manage, and sync post-it notes across different view modes with optional database backend integration. The extension was developed iteratively through AI-assisted programming with Claude.

## Key Features

### Core Functionality
- **Multi-View Support**: Popup, Sidebar, and Browser Tab views
- **Note Management**: Create, edit, delete notes with rich metadata
- **Auto-capture**: Automatically captures selected text and current URL
- **Tagging System**: Flexible tagging with multiple separator support (comma, semicolon, whitespace)
- **Advanced Filtering**: Filter by tags and status

### Note Fields
- Title (auto-generated from content if not provided)
- Description/Content
- Tags
- URL (auto-captured)
- Status (open, working, closed, archived)
- Priority (low, medium, high, critical)
- Creation Date (auto-populated)
- Last Updated (auto-tracked)

### User Interface
- **Tabbed Interface**: Add, Query, Settings, and Edit tabs
- **Theme Support**: Light and dark themes
- **Resizable Popup**: Dynamic resizing with saved dimensions
- **Visual Indicators**: Color-coded status and priority
- **Right-Click Context Menu**: Quick note creation from selected text

### Database Integration
- **Optional GRPC Backend**: Connect to external database via REST gateway
- **Two-way Sync**: Full bidirectional synchronization
- **Conflict Resolution**: Timestamp-based conflict handling
- **Unique Constraints**: Prevents duplicate titles
- **Sync Button**: Manual sync control in settings

### Technical Features
- **Chrome Storage API**: Local persistence
- **Side Panel API**: Persistent sidebar view
- **Context Menus API**: Right-click integration
- **Manifest V3**: Modern Chrome extension architecture

## Recent Major Updates

1. **Database Sync System**: Full GRPC backend integration with REST gateway
2. **Last Updated Tracking**: Automatic timestamp updates on edits
3. **Duplicate Prevention**: Title uniqueness enforcement
4. **Enhanced Error Handling**: Persistent error toasts with dismiss buttons
5. **Popup Resize Fix**: Improved resize behavior allowing expansion in all directions

## Architecture

- `manifest.json`: Extension configuration
- `popup.js/html/css`: Main UI logic and styling
- `background.js`: Service worker for context menus and tab management
- `database.js`: Database client for GRPC communication
- `rest-gateway.js`: HTTP-to-GRPC proxy server
- `sidepanel.html`: Sidebar view implementation
- `tab.html/js`: Full browser tab view

## Database Schema

When connected to a database, the extension uses three tables:
- `notes`: Main note storage with all metadata
- `tags`: Unique tag definitions
- `note_tags`: Many-to-many relationship between notes and tags

## Limitations

- Chrome's Side Panel API requires user interaction to open (cannot be set as default)
- Database connection requires running REST gateway server
- Maximum popup dimensions constrained by screen size

## Development Method

This extension was created through iterative development using AI-assisted programming, with each feature added incrementally based on specific requirements and user feedback.