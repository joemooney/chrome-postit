// Tab view JavaScript - reuses most of the popup.js logic with adjustments for full page display
document.addEventListener('DOMContentLoaded', function() {
  // Tab elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Add tab fields
  const noteTitle = document.getElementById('noteTitle');
  const noteText = document.getElementById('noteText');
  const noteTags = document.getElementById('noteTags');
  
  // Details fields (in Add tab)
  const noteUrl = document.getElementById('noteUrl');
  const creationDate = document.getElementById('creationDate');
  const noteStatus = document.getElementById('noteStatus');
  const notePriority = document.getElementById('notePriority');
  
  // Details section elements
  const detailsToggle = document.getElementById('toggleDetails');
  const detailsSection = document.getElementById('detailsSection');
  
  // Edit tab fields
  const editNoteId = document.getElementById('editNoteId');
  const editNoteTitle = document.getElementById('editNoteTitle');
  const editNoteText = document.getElementById('editNoteText');
  const editNoteUrl = document.getElementById('editNoteUrl');
  const editCreationDate = document.getElementById('editCreationDate');
  const editNoteStatus = document.getElementById('editNoteStatus');
  const editNotePriority = document.getElementById('editNotePriority');
  const editNoteTags = document.getElementById('editNoteTags');
  
  // Other elements
  const addNoteBtn = document.getElementById('addNote');
  const applyEditBtn = document.getElementById('applyEdit');
  const cancelEditBtn = document.getElementById('cancelEdit');
  const notesList = document.getElementById('notesList');
  const filterTags = document.getElementById('filterTags');
  const filterStatus = document.getElementById('filterStatus');
  const clearFilterBtn = document.getElementById('clearFilter');
  const mainTabs = document.getElementById('mainTabs');
  const editMode = document.getElementById('editMode');
  const editTab = document.getElementById('edit-tab');
  
  // Settings elements
  const openSettingsBtn = document.getElementById('openSettings');
  const themeSelect = document.getElementById('themeSelect');
  const defaultViewSelect = document.getElementById('defaultViewSelect');
  const userName = document.getElementById('userName');
  const userNickname = document.getElementById('userNickname');
  const databaseUrl = document.getElementById('databaseUrl');
  const dbStatus = document.getElementById('dbStatus');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const settingsTab = document.getElementById('settings-tab');
  
  let allNotes = [];
  let currentFilter = '';
  let currentStatusFilter = '';
  let activeTab = 'add';
  let previousTab = 'add';
  let dbClient = null;

  loadNotes();
  loadSettings();
  checkContextMenuData();
  setCurrentDate();
  
  // Notes are always visible in tab view
  
  // Handle settings button
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', function() {
      // Save current tab before switching
      previousTab = activeTab;
      
      // Hide all tab buttons except settings
      tabButtons.forEach(btn => {
        if (btn.dataset.tab === 'settings') {
          btn.classList.add('active');
          btn.style.display = 'inline-block';
        } else {
          btn.classList.remove('active');
          btn.style.display = 'none';
        }
      });
      
      // Hide all tab contents except settings
      tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = '';
      });
      
      settingsTab.classList.add('active');
      activeTab = 'settings';
    });
  }

  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      // Save previous tab if we're not already in settings
      if (activeTab !== 'settings' && targetTab === 'settings') {
        previousTab = activeTab;
      }
      
      // Update active states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => {
        content.classList.remove('active');
        // Remove any inline display styles to let CSS take over
        content.style.display = '';
      });
      
      this.classList.add('active');
      const targetContent = document.getElementById(`${targetTab}-tab`);
      targetContent.classList.add('active');
      
      activeTab = targetTab;
      
      // No longer syncing between tabs
    });
  });

  // Details toggle functionality
  if (detailsToggle) {
    detailsToggle.addEventListener('click', function() {
      const toggleIcon = detailsToggle.querySelector('.toggle-icon');
      const isExpanded = detailsSection.style.display !== 'none';
      
      if (isExpanded) {
        detailsSection.style.display = 'none';
        toggleIcon.textContent = '▶';
      } else {
        detailsSection.style.display = 'block';
        toggleIcon.textContent = '▼';
      }
    });
  }

  // Toast notification function
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Force reflow to ensure animation plays
    toast.offsetHeight;
    
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }

  // Add note from Add tab
  addNoteBtn.addEventListener('click', function() {
    const title = noteTitle.value.trim();
    const text = noteText.value.trim();
    const tags = noteTags.value.trim();
    
    if (text) {
      // Get values from details section
      const url = noteUrl.value.trim();
      const status = noteStatus.value || 'open';
      const priority = notePriority.value || 'medium';
      const date = creationDate.value || new Date().toISOString();
      
      // Pass a callback but don't close the window
      addNote(title, text, url, tags, status, priority, date, function(success) {
        if (success) {
          clearForm();
          showToast('Post-it Added Successfully');
        }
      });
    }
  });


  function clearForm() {
    noteTitle.value = '';
    noteText.value = '';
    noteTags.value = '';
    noteStatus.value = 'open';
    notePriority.value = 'medium';
    noteUrl.value = '';
    setCurrentDate();
    
    // Collapse details section
    if (detailsSection && detailsSection.style.display !== 'none') {
      detailsSection.style.display = 'none';
      const toggleIcon = detailsToggle.querySelector('.toggle-icon');
      if (toggleIcon) {
        toggleIcon.textContent = '▶';
      }
    }
  }

  noteText.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNoteBtn.click();
    }
  });


  filterTags.addEventListener('input', function() {
    currentFilter = filterTags.value.trim().toLowerCase();
    filterNotes();
  });

  filterStatus.addEventListener('change', function() {
    currentStatusFilter = filterStatus.value;
    filterNotes();
  });

  clearFilterBtn.addEventListener('click', function() {
    filterTags.value = '';
    filterStatus.value = '';
    currentFilter = '';
    currentStatusFilter = '';
    displayNotes(allNotes);
  });

  function addNote(title, text, url, tags, status, priority, date, callback) {
    chrome.storage.local.get(['notes'], function(result) {
      const notes = result.notes || [];
      // Split by comma, semicolon, or whitespace
      const tagArray = tags ? tags.split(/[,;\s]+/).map(tag => tag.trim()).filter(tag => tag) : [];
      
      // Generate title from text if not provided
      const finalTitle = title || (text.length > 40 ? text.substring(0, 40) + '...' : text);
      
      const newNote = {
        id: Date.now(),
        title: finalTitle,
        text: text,
        url: url,
        tags: tagArray,
        status: status || 'open',
        priority: priority || 'medium',
        creationDate: date || new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
      notes.unshift(newNote);
      chrome.storage.local.set({ notes: notes }, function() {
        allNotes = notes;
        filterNotes();
        if (callback) callback(true);
      });
    });
  }

  function loadNotes() {
    chrome.storage.local.get(['notes'], function(result) {
      allNotes = result.notes || [];
      // Migrate old notes to have new fields
      allNotes = allNotes.map(note => ({
        ...note,
        status: note.status || 'open',
        priority: note.priority || 'medium',
        creationDate: note.creationDate || note.timestamp
      }));
      displayNotes(allNotes);
    });
  }

  function filterNotes() {
    let filteredNotes = allNotes;
    
    if (currentFilter) {
      filteredNotes = filteredNotes.filter(note => {
        return note.tags && note.tags.some(tag => 
          tag.toLowerCase().includes(currentFilter)
        );
      });
    }
    
    if (currentStatusFilter) {
      filteredNotes = filteredNotes.filter(note => 
        note.status === currentStatusFilter
      );
    }
    
    displayNotes(filteredNotes);
  }

  function displayNotes(notes) {
    notesList.innerHTML = '';
    notes.forEach(function(note) {
      const noteElement = createNoteElement(note);
      notesList.appendChild(noteElement);
    });
  }

  function createNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note';
    noteDiv.dataset.id = note.id;
    
    // Add status and priority indicators
    const statusClass = `status-${note.status || 'open'}`;
    const priorityClass = `priority-${note.priority || 'medium'}`;
    noteDiv.classList.add(statusClass, priorityClass);

    // Add title if exists
    if (note.title) {
      const noteTitle = document.createElement('div');
      noteTitle.className = 'note-title';
      noteTitle.textContent = note.title;
      noteTitle.title = 'Double-click to edit';
      
      // Add double-click to edit functionality
      noteTitle.addEventListener('dblclick', function() {
        editNote(note);
      });
      
      noteDiv.appendChild(noteTitle);
    }

    const noteContent = document.createElement('div');
    noteContent.className = 'note-content';
    noteContent.textContent = note.text;

    // Add metadata section
    const metaDiv = document.createElement('div');
    metaDiv.className = 'note-meta';
    
    // Format date
    const dateStr = new Date(note.creationDate || note.timestamp).toLocaleDateString();
    metaDiv.innerHTML = `
      <span class="meta-date">${dateStr}</span>
      <span class="meta-status">${note.status || 'open'}</span>
      <span class="meta-priority">${note.priority || 'medium'}</span>
    `;
    
    // Add URL if exists
    if (note.url) {
      const noteUrlDiv = document.createElement('div');
      noteUrlDiv.className = 'note-url';
      const urlLink = document.createElement('a');
      urlLink.href = note.url;
      urlLink.target = '_blank';
      try {
        urlLink.textContent = new URL(note.url).hostname;
      } catch {
        urlLink.textContent = 'Link';
      }
      urlLink.title = note.url;
      noteUrlDiv.appendChild(urlLink);
      noteDiv.appendChild(noteUrlDiv);
    }

    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'note-tags';
    if (note.tags && note.tags.length > 0) {
      note.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = tag;
        tagSpan.addEventListener('click', function() {
          filterTags.value = tag;
          currentFilter = tag.toLowerCase();
          filterNotes();
        });
        tagsDiv.appendChild(tagSpan);
      });
    }

    const noteActions = document.createElement('div');
    noteActions.className = 'note-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '✎';
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', function() {
      editNote(note);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', function() {
      deleteNote(note.id);
    });

    noteActions.appendChild(editBtn);
    noteActions.appendChild(deleteBtn);
    noteDiv.appendChild(noteContent);
    noteDiv.appendChild(metaDiv);
    if (note.tags && note.tags.length > 0) {
      noteDiv.appendChild(tagsDiv);
    }
    noteDiv.appendChild(noteActions);

    return noteDiv;
  }

  function deleteNote(noteId) {
    chrome.storage.local.get(['notes'], function(result) {
      const notes = result.notes || [];
      const updatedNotes = notes.filter(note => note.id !== noteId);
      chrome.storage.local.set({ notes: updatedNotes }, function() {
        allNotes = updatedNotes;
        filterNotes();
      });
    });
  }

  function setCurrentDate() {
    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    creationDate.value = dateStr;
  }

  // Edit functionality
  function editNote(note) {
    // Show edit mode
    mainTabs.style.display = 'none';
    editMode.style.display = 'block';
    
    // Hide all tabs except edit
    tabContents.forEach(content => content.style.display = 'none');
    editTab.style.display = 'block';
    
    // Populate edit fields
    editNoteId.value = note.id;
    editNoteTitle.value = note.title || '';
    editNoteText.value = note.text || '';
    editNoteUrl.value = note.url || '';
    editCreationDate.value = new Date(note.creationDate || note.timestamp).toLocaleDateString() + ' ' + 
                            new Date(note.creationDate || note.timestamp).toLocaleTimeString();
    editNoteStatus.value = note.status || 'open';
    editNotePriority.value = note.priority || 'medium';
    editNoteTags.value = note.tags ? note.tags.join(' ') : '';
    
    // Focus on text field
    editNoteText.focus();
  }

  // Apply edit button
  applyEditBtn.addEventListener('click', function() {
    const noteId = parseInt(editNoteId.value);
    const updatedNote = {
      id: noteId,
      title: editNoteTitle.value.trim() || (editNoteText.value.trim().length > 40 ? 
              editNoteText.value.trim().substring(0, 40) + '...' : editNoteText.value.trim()),
      text: editNoteText.value.trim(),
      url: editNoteUrl.value.trim(),
      tags: editNoteTags.value.trim() ? editNoteTags.value.trim().split(/[,;\s]+/).filter(tag => tag) : [],
      status: editNoteStatus.value,
      priority: editNotePriority.value,
      creationDate: allNotes.find(n => n.id === noteId).creationDate,
      timestamp: new Date().toISOString()
    };
    
    // Update in storage
    chrome.storage.local.get(['notes'], function(result) {
      const notes = result.notes || [];
      const index = notes.findIndex(n => n.id === noteId);
      if (index !== -1) {
        notes[index] = updatedNote;
        chrome.storage.local.set({ notes: notes }, function() {
          allNotes = notes;
          exitEditMode();
          filterNotes();
        });
      }
    });
  });

  // Cancel edit button
  cancelEditBtn.addEventListener('click', function() {
    exitEditMode();
  });

  function exitEditMode() {
    // Hide edit mode
    mainTabs.style.display = 'flex';
    editMode.style.display = 'none';
    editTab.style.display = 'none';
    
    // Restore previous tab state
    const queryTab = document.querySelector('[data-tab="query"]');
    const queryContent = document.getElementById('query-tab');
    queryTab.classList.add('active');
    queryContent.style.display = 'block';
  }

  // Settings functionality
  function loadSettings() {
    chrome.storage.local.get(['settings'], function(result) {
      const settings = result.settings || {
        theme: 'light',
        defaultView: 'popup',
        userName: '',
        userNickname: ''
      };
      
      // Apply theme
      if (settings.theme === 'dark') {
        document.body.classList.add('dark-theme');
      }
      themeSelect.value = settings.theme;
      
      // Apply default view
      defaultViewSelect.value = settings.defaultView || 'popup';
      
      // Apply user info
      userName.value = settings.userName || '';
      userNickname.value = settings.userNickname || '';
      
      // Apply database URL
      databaseUrl.value = settings.databaseUrl || '';
      if (settings.databaseUrl) {
        initializeDatabase(settings.databaseUrl);
      }
    });
  }

  // Save settings
  saveSettingsBtn.addEventListener('click', function() {
    const settings = {
      theme: themeSelect.value,
      defaultView: defaultViewSelect.value,
      userName: userName.value.trim(),
      userNickname: userNickname.value.trim(),
      databaseUrl: databaseUrl.value.trim()
    };
    
    chrome.storage.local.set({ settings: settings }, function() {
      // Apply theme immediately
      if (settings.theme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      
      // Show confirmation briefly
      const originalText = saveSettingsBtn.textContent;
      saveSettingsBtn.textContent = 'Saved!';
      
      // Check if default view changed to a different view type
      const currentView = 'browser-tab'; // We're in browser-tab view
      if (settings.defaultView !== currentView) {
        // Switch to the new default view after a short delay
        setTimeout(() => {
          switch (settings.defaultView) {
            case 'sidebar':
              chrome.runtime.sendMessage({ action: 'openSidePanel' }, (response) => {
                if (chrome.runtime.lastError) {
                  console.log('Could not open side panel:', chrome.runtime.lastError.message);
                }
              });
              window.close();
              break;
              
            case 'popup':
              // Close the current tab
              chrome.tabs.getCurrent(function(tab) {
                chrome.tabs.remove(tab.id);
              });
              break;
          }
        }, 500);
      } else {
        // Return to previous tab after a short delay
        setTimeout(() => {
          saveSettingsBtn.textContent = originalText;
          
          // Show all tab buttons again
          tabButtons.forEach(btn => {
            btn.style.display = '';
            btn.classList.remove('active');
          });
          
          // Switch back to previous tab
          tabContents.forEach(content => {
            content.classList.remove('active');
            // Remove inline styles to let CSS handle display
            content.style.display = '';
          });
          
          const prevTabBtn = document.querySelector(`[data-tab="${previousTab}"]`);
          const prevTabContent = document.getElementById(`${previousTab}-tab`);
          
          if (prevTabBtn && prevTabContent) {
            prevTabBtn.classList.add('active');
            prevTabContent.classList.add('active');
            activeTab = previousTab;
          }
        }, 1000);
      }
    });
  });

  // Theme change handler for immediate preview
  themeSelect.addEventListener('change', function() {
    if (themeSelect.value === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  });

  // Message listener for background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'handleContextMenu') {
      checkContextMenuData();
      sendResponse({ success: true });
    } else {
      // For any unhandled action, send empty response
      sendResponse({});
    }
    return false; // Synchronous response
  });

  // Check for context menu data
  function checkContextMenuData() {
    chrome.storage.local.get(['pendingNote', 'contextMenuTarget', 'editNoteId'], function(result) {
      if (result.pendingNote) {
        const noteData = result.pendingNote;
        const targetView = result.contextMenuTarget || 'add';
        const editNoteId = result.editNoteId;
        
        // Clear the pending note data
        chrome.storage.local.remove(['pendingNote', 'contextMenuTarget', 'editNoteId']);
        
        // If we need to edit an existing note
        if (targetView === 'edit' && editNoteId) {
          // Find the note and switch to edit mode
          chrome.storage.local.get(['notes'], function(data) {
            const notes = data.notes || [];
            const noteToEdit = notes.find(n => n.id === editNoteId);
            if (noteToEdit) {
              // Switch to edit mode
              editNote(noteToEdit);
            }
          });
        } else {
          // Normal add mode
          // If we have selected text, populate the fields
          if (noteData.selectedText) {
            noteText.value = noteData.selectedText;
            
            // Auto-generate title from page title or first 40 chars of selected text
            const autoTitle = noteData.pageTitle || noteData.selectedText.substring(0, 40) + 
                            (noteData.selectedText.length > 40 ? '...' : '');
            noteTitle.value = autoTitle;
          }
          
          // Override the URL with the page where right-click happened
          if (noteData.pageUrl) {
            noteUrl.value = noteData.pageUrl;
            // Expand details section if URL is provided
            if (detailsSection && detailsSection.style.display === 'none') {
              detailsSection.style.display = 'block';
              const toggleIcon = detailsToggle.querySelector('.toggle-icon');
              if (toggleIcon) {
                toggleIcon.textContent = '▼';
              }
            }
          }
          
          // Switch to the appropriate tab
          setTimeout(() => {
            switchToTab(targetView);
          }, 150);
        }
      }
    });
  }

  // Helper function to switch to a specific tab
  function switchToTab(tabName) {
    // Find the tab button and content
    const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(`${tabName}-tab`);
    
    if (tabButton && tabContent) {
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = '';
      });
      
      // Activate the target tab
      tabButton.classList.add('active');
      tabContent.classList.add('active');
      activeTab = tabName;
    }
  }

  // Database functions
  async function initializeDatabase(url) {
    if (!url) {
      updateDbStatus('disconnected', 'No database URL configured');
      return;
    }

    updateDbStatus('connecting', 'Connecting to database...');
    
    // Load the database module dynamically
    try {
      const module = await import('./database.js');
      const DatabaseClient = module.default || window.DatabaseClient;
      
      dbClient = new DatabaseClient(url);
      const connected = await dbClient.testConnection();
      
      if (connected) {
        updateDbStatus('connected', 'Connected to database');
        // Optionally sync notes on connection
        // syncNotesToDatabase();
      } else {
        updateDbStatus('disconnected', 'Failed to connect to database');
      }
    } catch (error) {
      console.error('Database initialization error:', error);
      updateDbStatus('disconnected', 'Database connection error');
    }
  }

  function updateDbStatus(status, message) {
    dbStatus.className = 'db-status ' + status;
    dbStatus.textContent = message;
  }

  // Add database ID tracking to notes
  function updateNoteWithDbId(localId, dbId) {
    chrome.storage.local.get(['notes'], function(result) {
      const notes = result.notes || [];
      const note = notes.find(n => n.id === localId);
      if (note) {
        note.db_id = dbId;
        chrome.storage.local.set({ notes: notes });
      }
    });
  }

  // Override addNote to sync with database
  const originalAddNote = addNote;
  window.addNote = async function(title, text, url, tags, status, priority, date, callback) {
    // First add locally
    originalAddNote(title, text, url, tags, status, priority, date, callback);
    
    // Then sync to database if connected
    if (dbClient && dbClient.connected) {
      const tagArray = tags ? tags.split(/[,;\s]+/).map(tag => tag.trim()).filter(tag => tag) : [];
      const finalTitle = title || (text.length > 40 ? text.substring(0, 40) + '...' : text);
      
      const note = {
        title: finalTitle,
        text: text,
        url: url,
        tags: tagArray,
        status: status || 'open',
        priority: priority || 'medium',
        creationDate: date || new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
      
      const result = await dbClient.insertNote(note);
      if (result.success && result.db_id) {
        // Update the local note with the database ID
        chrome.storage.local.get(['notes'], function(data) {
          const notes = data.notes || [];
          const lastNote = notes[0]; // Notes are unshifted, so newest is first
          if (lastNote) {
            updateNoteWithDbId(lastNote.id, result.db_id);
          }
        });
      }
    }
  };

  // Override deleteNote to sync with database
  const originalDeleteNote = deleteNote;
  window.deleteNote = async function(noteId) {
    // Get the note before deleting to check for db_id
    chrome.storage.local.get(['notes'], async function(result) {
      const notes = result.notes || [];
      const note = notes.find(n => n.id === noteId);
      
      if (note && note.db_id && dbClient && dbClient.connected) {
        await dbClient.deleteNote(noteId, note.db_id);
      }
      
      // Delete locally
      originalDeleteNote(noteId);
    });
  };

  // Handle database URL change
  databaseUrl.addEventListener('change', function() {
    const url = databaseUrl.value.trim();
    if (url) {
      initializeDatabase(url);
    } else {
      dbClient = null;
      updateDbStatus('disconnected', 'No database URL configured');
    }
  });
});