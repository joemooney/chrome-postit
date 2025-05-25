document.addEventListener('DOMContentLoaded', function() {
  // Tab elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Add tab fields
  const noteTitle = document.getElementById('noteTitle');
  const noteText = document.getElementById('noteText');
  const noteTags = document.getElementById('noteTags');
  
  // Add+ tab fields
  const noteTitle2 = document.getElementById('noteTitle2');
  const noteText2 = document.getElementById('noteText2');
  const noteUrl = document.getElementById('noteUrl');
  const creationDate = document.getElementById('creationDate');
  const noteStatus = document.getElementById('noteStatus');
  const notePriority = document.getElementById('notePriority');
  const noteTags2 = document.getElementById('noteTags2');
  
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
  const addNoteBtn2 = document.getElementById('addNote2');
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
  const userName = document.getElementById('userName');
  const userNickname = document.getElementById('userNickname');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const settingsTab = document.getElementById('settings-tab');
  
  let allNotes = [];
  let currentFilter = '';
  let currentStatusFilter = '';
  let activeTab = 'add';
  let previousTab = 'add';

  loadNotes();
  loadSettings();
  getCurrentPageUrl();
  setCurrentDate();
  
  // Get selected text after a small delay to ensure page is ready
  setTimeout(() => {
    getSelectedTextFromPage();
  }, 100);
  
  // Initially hide notes list since we start on Add tab
  notesList.style.display = 'none';
  
  // Handle sidebar button
  const openSidePanelBtn = document.getElementById('openSidePanel');
  if (openSidePanelBtn) {
    openSidePanelBtn.addEventListener('click', function() {
      chrome.runtime.sendMessage({ action: 'openSidePanel' });
      window.close(); // Close the popup
    });
  }
  
  // Handle settings button
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', function() {
      // Save current tab before switching
      previousTab = activeTab;
      
      // Switch to settings tab
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = '';
      });
      
      const settingsTabBtn = document.querySelector('[data-tab="settings"]');
      settingsTabBtn.classList.add('active');
      settingsTab.classList.add('active');
      activeTab = 'settings';
      notesList.style.display = 'none';
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
      
      // Only sync between Add and Add+ tabs
      if (targetTab === 'add-plus' && activeTab !== 'query') {
        syncFields('add-plus');
      } else if (targetTab === 'add' && activeTab !== 'query') {
        syncFields('add');
      }
      
      // Show/hide notes list based on active tab
      if (targetTab === 'query') {
        notesList.style.display = 'block';
        filterNotes(); // Refresh the display when switching to query tab
      } else {
        notesList.style.display = 'none';
      }
    });
  });

  // Sync fields between tabs
  function syncFields(toTab) {
    if (toTab === 'add-plus') {
      noteTitle2.value = noteTitle.value;
      noteText2.value = noteText.value;
      noteTags2.value = noteTags.value;
    } else if (toTab === 'add') {
      noteTitle.value = noteTitle2.value;
      noteText.value = noteText2.value;
      noteTags.value = noteTags2.value;
    }
  }

  // Keep fields in sync
  noteTitle.addEventListener('input', () => noteTitle2.value = noteTitle.value);
  noteText.addEventListener('input', () => noteText2.value = noteText.value);
  noteTags.addEventListener('input', () => noteTags2.value = noteTags.value);
  noteTitle2.addEventListener('input', () => noteTitle.value = noteTitle2.value);
  noteText2.addEventListener('input', () => noteText.value = noteText2.value);
  noteTags2.addEventListener('input', () => noteTags.value = noteTags2.value);

  // Add note from Add tab
  addNoteBtn.addEventListener('click', function() {
    const title = noteTitle.value.trim();
    const text = noteText.value.trim();
    const tags = noteTags.value.trim();
    
    if (text) {
      // Use default values from Add+ tab
      const url = noteUrl.value.trim();
      const status = 'open';
      const priority = 'medium';
      const date = new Date().toISOString();
      
      addNote(title, text, url, tags, status, priority, date);
      clearForm();
    }
  });

  // Add note from Add+ tab
  addNoteBtn2.addEventListener('click', function() {
    const title = noteTitle2.value.trim();
    const text = noteText2.value.trim();
    const tags = noteTags2.value.trim();
    
    if (text) {
      const url = noteUrl.value.trim();
      const status = noteStatus.value;
      const priority = notePriority.value;
      const date = creationDate.value;
      
      addNote(title, text, url, tags, status, priority, date);
      clearForm();
    }
  });

  function clearForm() {
    noteTitle.value = '';
    noteText.value = '';
    noteTags.value = '';
    noteTitle2.value = '';
    noteText2.value = '';
    noteTags2.value = '';
    noteStatus.value = 'open';
    notePriority.value = 'medium';
    getCurrentPageUrl();
    setCurrentDate();
  }

  noteText.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNoteBtn.click();
    }
  });

  noteText2.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNoteBtn2.click();
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

  function addNote(title, text, url, tags, status, priority, date) {
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
          // Switch to Query tab and set filter
          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          
          const queryTab = document.querySelector('[data-tab="query"]');
          const queryContent = document.getElementById('query-tab');
          queryTab.classList.add('active');
          queryContent.classList.add('active');
          
          activeTab = 'query';
          notesList.style.display = 'block';
          
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

  function getSelectedTextFromPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].id && !tabs[0].url.startsWith('chrome://')) {
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
            // Only populate if fields are empty
            if (!noteText.value.trim()) {
              noteText.value = selectedText;
            }
            if (!noteText2.value.trim()) {
              noteText2.value = selectedText;
            }
            // Focus on the appropriate field based on active tab
            if (activeTab === 'add') {
              noteText.focus();
            } else if (activeTab === 'add-plus') {
              noteText2.focus();
            }
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
    notesList.style.display = 'block';
    
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
    
    // Keep notes visible since we're going to Query tab
    notesList.style.display = 'block';
  }

  // Settings functionality
  function loadSettings() {
    chrome.storage.local.get(['settings'], function(result) {
      const settings = result.settings || {
        theme: 'light',
        userName: '',
        userNickname: ''
      };
      
      // Apply theme
      if (settings.theme === 'dark') {
        document.body.classList.add('dark-theme');
      }
      themeSelect.value = settings.theme;
      
      // Apply user info
      userName.value = settings.userName || '';
      userNickname.value = settings.userNickname || '';
    });
  }

  // Save settings
  saveSettingsBtn.addEventListener('click', function() {
    const settings = {
      theme: themeSelect.value,
      userName: userName.value.trim(),
      userNickname: userNickname.value.trim()
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
      
      // Return to previous tab after a short delay
      setTimeout(() => {
        saveSettingsBtn.textContent = originalText;
        
        // Switch back to previous tab
        tabButtons.forEach(btn => btn.classList.remove('active'));
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
            notesList.style.display = 'block';
            filterNotes();
          } else {
            notesList.style.display = 'none';
          }
        }
      }, 1000);
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
});