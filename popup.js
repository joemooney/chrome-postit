document.addEventListener('DOMContentLoaded', function() {
  // Tab elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Add tab fields
  const noteTitle = document.getElementById('noteTitle');
  const noteText = document.getElementById('noteText');
  const noteTags = document.getElementById('noteTags');
  const noteUrl = document.getElementById('noteUrl');
  const creationDate = document.getElementById('creationDate');
  const noteStatus = document.getElementById('noteStatus');
  const notePriority = document.getElementById('notePriority');
  
  // Expandable details elements
  const toggleDetailsBtn = document.getElementById('toggleDetails');
  const detailsSection = document.getElementById('detailsSection');
  const toggleIcon = toggleDetailsBtn.querySelector('.toggle-icon');
  
  // Edit tab fields
  const editNoteId = document.getElementById('editNoteId');
  const editNoteTitle = document.getElementById('editNoteTitle');
  const editNoteText = document.getElementById('editNoteText');
  const editNoteUrl = document.getElementById('editNoteUrl');
  const editCreationDate = document.getElementById('editCreationDate');
  const editLastUpdated = document.getElementById('editLastUpdated');
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
  const syncDatabaseBtn = document.getElementById('syncDatabaseBtn');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const cancelSettingsBtn = document.getElementById('cancelSettings');
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
  getCurrentPageUrl();
  setCurrentDate();
  
  // Get selected text immediately
  getSelectedTextFromPage();
  
  // Check default view after a small delay to allow selected text to be captured
  setTimeout(() => {
    checkDefaultView();
  }, 100);
  
  
  // Handle expandable details toggle
  toggleDetailsBtn.addEventListener('click', function() {
    const isExpanded = detailsSection.style.display !== 'none';
    
    if (isExpanded) {
      detailsSection.style.display = 'none';
      toggleIcon.classList.remove('expanded');
      toggleIcon.textContent = '▶';
    } else {
      detailsSection.style.display = 'block';
      toggleIcon.classList.add('expanded');
      toggleIcon.textContent = '▼';
    }
  });
  
  // Handle sidebar button
  const openSidePanelBtn = document.getElementById('openSidePanel');
  if (openSidePanelBtn) {
    openSidePanelBtn.addEventListener('click', function() {
      chrome.runtime.sendMessage({ action: 'openSidePanel' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Could not open side panel:', chrome.runtime.lastError.message);
        }
      });
      window.close(); // Close the popup
    });
  }
  
  // Handle open in tab button
  const openTabBtn = document.getElementById('openTab');
  if (openTabBtn) {
    openTabBtn.addEventListener('click', function() {
      chrome.tabs.create({ url: 'tab.html' });
      window.close(); // Close the popup
    });
  }
  
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
      
      // Refresh notes when switching to query tab
      if (targetTab === 'query') {
        filterNotes(); // Refresh the display when switching to query tab
      }
    });
  });

  // Add note from Add tab
  addNoteBtn.addEventListener('click', function() {
    const title = noteTitle.value.trim();
    const text = noteText.value.trim();
    const tags = noteTags.value.trim();
    
    if (text) {
      const url = noteUrl.value.trim();
      const status = noteStatus.value;
      const priority = notePriority.value;
      const date = creationDate.value || new Date().toISOString();
      
      addNote(title, text, url, tags, status, priority, date, function(success) {
        if (success) {
          clearForm();
          
          // Close popup immediately if we're in popup view
          if (!window.location.href.includes('sidepanel.html') && 
              !window.location.href.includes('tab.html')) {
            // Send message to background to show toast after popup closes
            chrome.runtime.sendMessage({ 
              action: 'showToastAfterClose', 
              message: 'Post-it Added Successfully' 
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log('Could not show toast:', chrome.runtime.lastError.message);
              }
              window.close();
            });
          } else {
            // Show toast only in sidebar and tab views
            showToast('Post-it Added Successfully');
          }
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
    getCurrentPageUrl();
    setCurrentDate();
    
    // Collapse details section after adding note
    detailsSection.style.display = 'none';
    toggleIcon.classList.remove('expanded');
    toggleIcon.textContent = '▶';
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

  async function addNote(title, text, url, tags, status, priority, date, callback) {
    chrome.storage.local.get(['notes', 'settings'], async function(result) {
      const notes = result.notes || [];
      const settings = result.settings || {};
      // Split by comma, semicolon, or whitespace
      const tagArray = tags ? tags.split(/[,;\s]+/).map(tag => tag.trim()).filter(tag => tag) : [];
      
      // Generate title from text if not provided
      const finalTitle = title || (text.length > 40 ? text.substring(0, 40) + '...' : text);
      
      // Check for duplicate title
      const duplicateNote = notes.find(note => note.title === finalTitle);
      if (duplicateNote) {
        console.error('Note with this title already exists:', finalTitle);
        showToast('A note with this title already exists!', 'error');
        if (callback) callback(false);
        return;
      }
      
      const newNote = {
        id: Date.now(),
        title: finalTitle,
        text: text,
        url: url,
        tags: tagArray,
        status: status || 'open',
        priority: priority || 'medium',
        creationDate: date || new Date().toISOString(),
        timestamp: new Date().toISOString(),
        userName: settings.userName || '',
        createdBy: settings.userName || ''
      };
      
      // If database is connected, sync to database
      if (dbClient && dbClient.connected) {
        try {
          const result = await dbClient.insertNote(newNote);
          if (result.success && result.db_id) {
            newNote.db_id = result.db_id;
          } else if (result.message && result.message.includes('UNIQUE constraint')) {
            console.error('Database: Note with this title already exists');
            showToast('A note with this title already exists in the database!', 'error');
            if (callback) callback(false);
            return;
          }
        } catch (error) {
          console.error('Failed to sync note to database:', error);
          if (error.message && error.message.includes('UNIQUE constraint')) {
            showToast('A note with this title already exists in the database!', 'error');
            if (callback) callback(false);
            return;
          }
        }
      }
      
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
    
    // Format dates
    const dateStr = new Date(note.creationDate || note.timestamp).toLocaleDateString();
    const lastUpdatedStr = note.lastUpdated ? new Date(note.lastUpdated).toLocaleDateString() : dateStr;
    const showUpdated = note.lastUpdated && note.lastUpdated !== note.creationDate && lastUpdatedStr !== dateStr;
    
    metaDiv.innerHTML = `
      <span class="meta-date">${dateStr}</span>
      ${showUpdated ? `<span class="meta-updated">Updated: ${lastUpdatedStr}</span>` : ''}
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
          // Switch to Query tab and set filter
          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          
          const queryTab = document.querySelector('[data-tab="query"]');
          const queryContent = document.getElementById('query-tab');
          queryTab.classList.add('active');
          queryContent.classList.add('active');
          
          activeTab = 'query';
          
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

  async function deleteNote(noteId) {
    chrome.storage.local.get(['notes'], async function(result) {
      const notes = result.notes || [];
      const noteToDelete = notes.find(note => note.id === noteId);
      
      console.log('Delete note called:', {
        noteId,
        noteToDelete,
        dbClient: !!dbClient,
        connected: dbClient?.connected,
        db_id: noteToDelete?.db_id
      });
      
      // If database is connected and note has db_id, delete from database
      if (dbClient && dbClient.connected && noteToDelete?.db_id) {
        console.log('Attempting to delete from database...');
        try {
          const result = await dbClient.deleteNote(noteToDelete.id, noteToDelete.db_id);
          console.log('Database delete result:', result);
          if (!result.success) {
            console.error('Failed to delete note from database:', result.message);
          }
        } catch (error) {
          console.error('Failed to delete note from database:', error);
        }
      } else {
        console.log('Skipping database delete:', {
          hasDbClient: !!dbClient,
          isConnected: dbClient?.connected,
          hasDbId: !!noteToDelete?.db_id
        });
      }
      
      const updatedNotes = notes.filter(note => note.id !== noteId);
      chrome.storage.local.set({ notes: updatedNotes }, function() {
        allNotes = updatedNotes;
        filterNotes();
      });
    });
  }

  function getSelectedTextFromPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        return;
      }
      if (tabs[0] && tabs[0].id && tabs[0].url && 
          !tabs[0].url.startsWith('chrome://') && 
          !tabs[0].url.startsWith('chrome-extension://') &&
          !tabs[0].url.startsWith('about:')) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => window.getSelection().toString().trim()
        }, (results) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting selected text:', chrome.runtime.lastError);
            return;
          }
          if (results && results[0] && results[0].result) {
            const selectedText = results[0].result;
            
            // Check if a note with this text already exists
            chrome.storage.local.get(['notes'], function(data) {
              const notes = data.notes || [];
              const existingNote = notes.find(note => note.text === selectedText);
              
              if (existingNote) {
                // If duplicate found, switch to edit mode
                editNote(existingNote);
              } else {
                // Only populate if fields are empty
                if (!noteText.value.trim()) {
                  noteText.value = selectedText;
                }
                // Focus on the field
                if (activeTab === 'add') {
                  noteText.focus();
                }
              }
            });
          }
        });
      }
    });
  }

  function getCurrentPageUrl() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url) {
        noteUrl.value = tabs[0].url;
      }
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
    
    // Always show notes in edit mode (for context)
    
    // Populate edit fields
    editNoteId.value = note.id;
    editNoteTitle.value = note.title || '';
    editNoteText.value = note.text || '';
    editNoteUrl.value = note.url || '';
    editCreationDate.value = new Date(note.creationDate || note.timestamp).toLocaleDateString() + ' ' + 
                            new Date(note.creationDate || note.timestamp).toLocaleTimeString();
    editLastUpdated.value = note.lastUpdated ? 
                           new Date(note.lastUpdated).toLocaleDateString() + ' ' + 
                           new Date(note.lastUpdated).toLocaleTimeString() : 
                           editCreationDate.value;
    editNoteStatus.value = note.status || 'open';
    editNotePriority.value = note.priority || 'medium';
    editNoteTags.value = note.tags ? note.tags.join(' ') : '';
    
    // Focus on text field
    editNoteText.focus();
  }

  // Apply edit button
  applyEditBtn.addEventListener('click', async function() {
    const noteId = parseInt(editNoteId.value);
    const originalNote = allNotes.find(n => n.id === noteId);
    const newTitle = editNoteTitle.value.trim() || (editNoteText.value.trim().length > 40 ? 
                     editNoteText.value.trim().substring(0, 40) + '...' : editNoteText.value.trim());
    
    // Check for duplicate title (excluding the note being edited)
    const duplicateNote = allNotes.find(note => note.title === newTitle && note.id !== noteId);
    if (duplicateNote) {
      showToast('A note with this title already exists!', 'error');
      return;
    }
    
    const updatedNote = {
      id: noteId,
      db_id: originalNote?.db_id,
      title: newTitle,
      text: editNoteText.value.trim(),
      url: editNoteUrl.value.trim(),
      tags: editNoteTags.value.trim() ? editNoteTags.value.trim().split(/[,;\s]+/).filter(tag => tag) : [],
      status: editNoteStatus.value,
      priority: editNotePriority.value,
      creationDate: originalNote?.creationDate,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      userName: originalNote?.userName,
      createdBy: originalNote?.createdBy
    };
    
    // If database is connected and note has db_id, sync to database
    if (dbClient && dbClient.connected && updatedNote.db_id) {
      try {
        const result = await dbClient.updateNote(updatedNote);
        if (!result.success) {
          console.error('Failed to update note in database:', result.message);
          if (result.message && result.message.includes('UNIQUE constraint')) {
            showToast('A note with this title already exists in the database!', 'error');
            return;
          }
        }
      } catch (error) {
        console.error('Failed to sync updated note to database:', error);
        if (error.message && error.message.includes('UNIQUE constraint')) {
          showToast('A note with this title already exists in the database!', 'error');
          return;
        }
      }
    }
    
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
    
    // Keep notes visible since we're going to Query tab
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

  // Check if we should redirect to a different view based on settings
  function checkDefaultView() {
    // First check if sidebar is open
    chrome.runtime.sendMessage({ action: 'checkForSidebar' }, (response) => {
      if (chrome.runtime.lastError) {
        // Error in communication, proceed with normal flow
        console.log('Could not check for sidebar:', chrome.runtime.lastError.message);
      } else if (response && response.sidebarOpen) {
        // Switch sidebar to Add tab and close popup
        chrome.runtime.sendMessage({ action: 'switchToAddTab' }, () => {
          if (chrome.runtime.lastError) {
            console.log('Could not switch tab:', chrome.runtime.lastError.message);
          }
        });
        window.close();
        return;
      }
      
      // Then check if there's already a browser tab open
      chrome.runtime.sendMessage({ action: 'checkForExistingTab' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Could not check for existing tab:', chrome.runtime.lastError.message);
          return;
        }
        if (response && response.found) {
          // If found, close the popup
          window.close();
          return;
        }
        
        // Otherwise, check default view settings
        chrome.storage.local.get(['settings'], function(result) {
          const settings = result.settings || {};
          const defaultView = settings.defaultView || 'popup';
          
          // Only redirect if not already in popup view and default is not popup
          if (defaultView !== 'popup') {
            switch (defaultView) {
              case 'sidebar':
                // Can't auto-open sidebar due to Chrome restrictions
                // Show a message instead
                showSidebarMessage();
                break;
                
              case 'browser-tab':
                // Open in new tab and close popup
                chrome.tabs.create({ url: 'tab.html' });
                window.close();
                break;
            }
          }
        });
      });
    });
  }
  
  // Show message when sidebar is the default but can't auto-open
  function showSidebarMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      background: #4285f4;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    messageDiv.textContent = 'Click the sidebar button (⎘) to open in sidebar view';
    document.body.appendChild(messageDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  // Show toast notification
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') {
      toast.classList.add('error');
    }
    
    // Create message text
    const messageText = document.createElement('span');
    messageText.textContent = message;
    toast.appendChild(messageText);
    
    // Add close button for error toasts
    if (type === 'error') {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = () => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      };
      toast.appendChild(closeBtn);
      
      // Error toasts don't auto-dismiss
    } else {
      // Success toasts auto-dismiss after 1.5 seconds
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, 1500);
    }
    
    document.body.appendChild(toast);
  }

  // Check if opened from context menu and handle accordingly
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
          }
          
          // Switch to the appropriate tab
          setTimeout(() => {
            switchToTab(targetView);
          }, 150);
        }
      }
    });
  }
  
  // Helper function to switch tabs
  function switchToTab(tabName) {
    // First, hide all tabs
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => {
      content.classList.remove('active');
      // Explicitly hide all tab contents
      content.style.display = 'none';
    });
    
    const targetTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const targetTabContent = document.getElementById(`${tabName}-tab`);
    
    if (targetTabBtn && targetTabContent) {
      targetTabBtn.classList.add('active');
      targetTabContent.classList.add('active');
      // Force display for sidebar compatibility
      targetTabContent.style.display = 'flex';
      activeTab = tabName;
      
      // Show/hide notes list based on tab
      if (tabName === 'query') {
        filterNotes();
      }
    }
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
      const currentView = 'popup'; // We're in popup view
      if (settings.defaultView !== currentView) {
        // Switch to the new default view after a short delay
        setTimeout(() => {
          switch (settings.defaultView) {
            case 'sidebar':
              // Can't auto-open sidebar, just show the popup with a message
              saveSettingsBtn.textContent = originalText;
              showSidebarMessage();
              
              // Return to previous tab UI
              tabButtons.forEach(btn => {
                btn.style.display = '';
                btn.classList.remove('active');
              });
              
              tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = '';
              });
              
              const prevTabBtn = document.querySelector(`[data-tab="${previousTab}"]`);
              const prevTabContent = document.getElementById(`${previousTab}-tab`);
              
              if (prevTabBtn && prevTabContent) {
                prevTabBtn.classList.add('active');
                prevTabContent.classList.add('active');
                activeTab = previousTab;
                
                if (previousTab === 'query') {
                  filterNotes();
                }
              }
              break;
              
            case 'browser-tab':
              chrome.tabs.create({ url: 'tab.html' });
              window.close();
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
            
            // Show notes if returning to query tab
            if (previousTab === 'query') {
              filterNotes();
            }
          }
        }, 1000);
      }
    });
  });

  // Cancel settings button handler
  cancelSettingsBtn.addEventListener('click', function() {
    // Reload settings to revert any changes
    loadSettings();
    
    // Return to previous tab
    tabButtons.forEach(btn => {
      btn.style.display = '';
      btn.classList.remove('active');
    });
    
    tabContents.forEach(content => {
      content.classList.remove('active');
      content.style.display = '';
    });
    
    const prevTabBtn = document.querySelector(`[data-tab="${previousTab}"]`);
    const prevTabContent = document.getElementById(`${previousTab}-tab`);
    
    if (prevTabBtn && prevTabContent) {
      prevTabBtn.classList.add('active');
      prevTabContent.classList.add('active');
      activeTab = previousTab;
      
      // Show notes if returning to query tab
      if (previousTab === 'query') {
        filterNotes();
      }
    }
  });

  // Theme change handler for immediate preview
  themeSelect.addEventListener('change', function() {
    if (themeSelect.value === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  });

  // Database functions
  async function initializeDatabase(url) {
    if (!url) {
      updateDbStatus('disconnected', 'No database URL configured');
      return;
    }

    updateDbStatus('connecting', 'Connecting to database...');
    
    // Load the database module dynamically
    try {
      // Try to get DatabaseClient from window first (loaded by module script)
      let DatabaseClient = window.DatabaseClient;
      
      // If not available, try dynamic import
      if (!DatabaseClient) {
        const module = await import('./database.js');
        DatabaseClient = module.default;
      }
      
      if (!DatabaseClient) {
        throw new Error('DatabaseClient not found');
      }
      
      dbClient = new DatabaseClient(url);
      const connected = await dbClient.testConnection();
      
      if (connected) {
        updateDbStatus('connected', 'Connected to database');
        // Perform full sync on connection
        try {
          await performFullSync();
          console.log('Initial sync completed on connection');
        } catch (error) {
          console.error('Initial sync failed:', error);
        }
      } else {
        updateDbStatus('disconnected', 'Failed to connect to database');
      }
    } catch (error) {
      console.error('Database initialization error:', error);
      updateDbStatus('disconnected', 'Database connection error: ' + error.message);
    }
  }

  function updateDbStatus(status, message) {
    if (dbStatus) {
      dbStatus.className = 'db-status ' + status;
      dbStatus.textContent = message;
    }
    
    // Show/hide sync button based on connection status
    if (syncDatabaseBtn) {
      syncDatabaseBtn.style.display = status === 'connected' ? 'block' : 'none';
    }
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
  
  // Sync notes from database
  async function syncNotesFromDatabase() {
    if (!dbClient || !dbClient.connected) return;
    
    try {
      const dbNotes = await dbClient.getNotes();
      
      // Get local notes
      chrome.storage.local.get(['notes'], async function(result) {
        const localNotes = result.notes || [];
        
        // Create a map of database notes by title for duplicate checking
        const dbNotesByTitle = {};
        dbNotes.forEach(dbNote => {
          if (dbNote.title) {
            dbNotesByTitle[dbNote.title] = dbNote;
          }
        });
        
        // First, sync local notes without db_id to database
        let notesUpdated = false;
        for (const note of localNotes) {
          if (!note.db_id) {
            // Check if a note with this title already exists in the database
            const existingDbNote = dbNotesByTitle[note.title];
            if (existingDbNote) {
              // Link the local note to the existing database note
              note.db_id = existingDbNote.db_id;
              notesUpdated = true;
              console.log('Linked local note to existing database note:', note.title);
            } else {
              // Try to insert new note
              console.log('Syncing local note to database:', note.title || note.text?.substring(0, 40));
              try {
                const insertResult = await dbClient.insertNote(note);
                if (insertResult.success && insertResult.db_id) {
                  note.db_id = insertResult.db_id;
                  notesUpdated = true;
                  console.log('Local note synced with db_id:', insertResult.db_id);
                }
              } catch (error) {
                console.error('Failed to sync local note to database:', error);
                // If it's a unique constraint error, try to find the existing note
                if (error.message && error.message.includes('UNIQUE constraint')) {
                  console.log('Note with this title already exists in database');
                }
              }
            }
          }
        }
        
        // Create a map of local notes by db_id for easier lookup
        const localNotesByDbId = {};
        localNotes.forEach(note => {
          if (note.db_id) {
            localNotesByDbId[note.db_id] = note;
          }
        });
        
        // Merge database notes with local notes
        dbNotes.forEach(dbNote => {
          const existingLocal = localNotesByDbId[dbNote.db_id];
          if (existingLocal) {
            // Update existing local note with database data
            Object.assign(existingLocal, dbNote);
          } else {
            // Add new note from database
            localNotes.push(dbNote);
          }
        });
        
        // Save merged notes
        chrome.storage.local.set({ notes: localNotes }, function() {
          allNotes = localNotes;
          filterNotes();
          console.log('Synced notes from database');
        });
      });
    } catch (error) {
      console.error('Failed to sync notes from database:', error);
    }
  }

  // Handle sync database button
  syncDatabaseBtn.addEventListener('click', async function() {
    if (!dbClient || !dbClient.connected) {
      showToast('Database not connected', 'error');
      return;
    }
    
    syncDatabaseBtn.disabled = true;
    syncDatabaseBtn.textContent = 'Syncing...';
    
    try {
      showToast('Starting database sync...');
      await performFullSync();
      showToast('Database sync completed successfully!');
    } catch (error) {
      console.error('Sync failed:', error);
      showToast('Database sync failed: ' + error.message, 'error');
    } finally {
      syncDatabaseBtn.disabled = false;
      syncDatabaseBtn.textContent = 'Sync Database';
    }
  });

  // Perform full synchronization
  async function performFullSync() {
    if (!dbClient || !dbClient.connected) {
      throw new Error('Database not connected');
    }
    
    console.log('Starting full database sync...');
    
    // Get all notes from database
    const dbNotes = await dbClient.getNotes();
    console.log(`Found ${dbNotes.length} notes in database`);
    
    // Get all local notes
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['notes'], async function(result) {
        try {
          const localNotes = result.notes || [];
          console.log(`Found ${localNotes.length} local notes`);
          
          // Create maps for easier lookup
          const dbNotesByTitle = {};
          const dbNotesById = {};
          const localNotesByTitle = {};
          const localNotesById = {};
          
          dbNotes.forEach(note => {
            if (note.title) dbNotesByTitle[note.title] = note;
            if (note.db_id) dbNotesById[note.db_id] = note;
          });
          
          localNotes.forEach(note => {
            if (note.title) localNotesByTitle[note.title] = note;
            if (note.db_id) localNotesById[note.db_id] = note;
          });
          
          let syncStats = {
            uploadedToDb: 0,
            downloadedFromDb: 0,
            updated: 0,
            conflicts: 0
          };
          
          // 1. Upload local notes that don't exist in database
          for (const localNote of localNotes) {
            if (!localNote.db_id) {
              // Check if a note with same title exists in DB
              const dbNote = dbNotesByTitle[localNote.title];
              if (dbNote) {
                // Link them
                localNote.db_id = dbNote.db_id;
                localNote.lastUpdated = dbNote.lastUpdated || localNote.lastUpdated;
                syncStats.updated++;
                console.log(`Linked local note "${localNote.title}" to existing DB note`);
              } else {
                // Upload to database
                try {
                  const result = await dbClient.insertNote(localNote);
                  if (result.success && result.db_id) {
                    localNote.db_id = result.db_id;
                    syncStats.uploadedToDb++;
                    console.log(`Uploaded note "${localNote.title}" to database`);
                  }
                } catch (error) {
                  console.error(`Failed to upload note "${localNote.title}":`, error);
                }
              }
            } else {
              // Check if it exists in database
              const dbNote = dbNotesById[localNote.db_id];
              if (dbNote) {
                // Compare timestamps to decide which is newer
                const localTime = new Date(localNote.lastUpdated || localNote.timestamp).getTime();
                const dbTime = new Date(dbNote.lastUpdated || dbNote.timestamp).getTime();
                
                if (localTime > dbTime) {
                  // Local is newer, update database
                  try {
                    await dbClient.updateNote(localNote);
                    syncStats.updated++;
                    console.log(`Updated database with newer local version of "${localNote.title}"`);
                  } catch (error) {
                    console.error(`Failed to update note "${localNote.title}":`, error);
                  }
                } else if (dbTime > localTime) {
                  // Database is newer, update local
                  Object.assign(localNote, dbNote);
                  syncStats.updated++;
                  console.log(`Updated local with newer database version of "${localNote.title}"`);
                }
              }
            }
          }
          
          // 2. Download notes from database that don't exist locally
          for (const dbNote of dbNotes) {
            const existingLocal = localNotesById[dbNote.db_id];
            if (!existingLocal) {
              // Check if a note with same title exists locally
              const localByTitle = localNotesByTitle[dbNote.title];
              if (localByTitle && !localByTitle.db_id) {
                // Link them
                localByTitle.db_id = dbNote.db_id;
                Object.assign(localByTitle, dbNote);
                syncStats.updated++;
                console.log(`Linked database note "${dbNote.title}" to existing local note`);
              } else {
                // Add new note from database
                localNotes.push(dbNote);
                syncStats.downloadedFromDb++;
                console.log(`Downloaded new note "${dbNote.title}" from database`);
              }
            }
          }
          
          // Save synced notes
          chrome.storage.local.set({ notes: localNotes }, function() {
            allNotes = localNotes;
            filterNotes();
            console.log('Sync completed:', syncStats);
            resolve(syncStats);
          });
          
        } catch (error) {
          reject(error);
        }
      });
    });
  }

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

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Check if we're in the sidebar
    const isSidebar = window.location.href.includes('sidepanel.html');
    
    if (request.action === 'ping') {
      // Respond to ping to identify as sidebar
      if (isSidebar) {
        sendResponse({ source: 'sidebar' });
      } else {
        sendResponse({ source: 'popup' });
      }
      return false; // Synchronous response
    } else if (request.action === 'switchToTab' && isSidebar) {
      // Switch to requested tab
      switchToTab(request.tab);
      // Also handle context menu data if switching to add
      if (request.tab === 'add' || request.tab === 'edit') {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          checkContextMenuData();
        }, 100);
      }
      sendResponse({ success: true });
      return false; // Synchronous response
    } else if (request.action === 'handleContextMenu' && isSidebar) {
      // Handle context menu data in sidebar
      checkContextMenuData();
      sendResponse({ success: true });
      return false; // Synchronous response
    }
    
    // For any unhandled action, send empty response
    sendResponse({});
    return false;
  });

  // Resize functionality (only for popup view)
  const resizeHandle = document.getElementById('resizeHandle');
  const isPopupView = !window.location.href.includes('sidepanel.html') && 
                      !window.location.href.includes('tab.html');
  
  if (!isPopupView && resizeHandle) {
    resizeHandle.style.display = 'none';
  }
  
  let isResizing = false;
  let startX, startY, startWidth, startHeight;

  // Load saved dimensions (only for popup view)
  if (isPopupView) {
    chrome.storage.local.get(['popupDimensions'], function(result) {
      if (result.popupDimensions) {
        const { width, height } = result.popupDimensions;
        document.body.style.width = width + 'px';
        document.body.style.height = height + 'px';
      }
    });
  }

  if (resizeHandle && isPopupView) {
    resizeHandle.addEventListener('mousedown', function(e) {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(document.defaultView.getComputedStyle(document.body).width, 10);
      startHeight = parseInt(document.defaultView.getComputedStyle(document.body).height, 10);
      
      // Prevent text selection while resizing
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'nwse-resize';
      e.preventDefault();
    });
  }

  document.addEventListener('mousemove', function(e) {
    if (!isResizing) return;
    
    // Calculate new dimensions based on mouse movement
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const newWidth = startWidth + deltaX;
    const newHeight = startHeight + deltaY;
    
    // Apply constraints - increased maximums and allow window size
    const maxWidth = Math.min(window.screen.availWidth * 0.9, 1200);
    const maxHeight = Math.min(window.screen.availHeight * 0.9, 900);
    
    const constrainedWidth = Math.min(Math.max(newWidth, 300), maxWidth);
    const constrainedHeight = Math.min(Math.max(newHeight, 400), maxHeight);
    
    document.body.style.width = constrainedWidth + 'px';
    document.body.style.height = constrainedHeight + 'px';
  });

  document.addEventListener('mouseup', function() {
    if (isResizing) {
      isResizing = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      // Save dimensions
      const width = parseInt(document.body.style.width, 10);
      const height = parseInt(document.body.style.height, 10);
      chrome.storage.local.set({ 
        popupDimensions: { width, height } 
      });
    }
  });
});