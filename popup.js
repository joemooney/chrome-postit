document.addEventListener('DOMContentLoaded', function() {
  // Tab elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Simple tab fields
  const noteTitle = document.getElementById('noteTitle');
  const noteText = document.getElementById('noteText');
  const noteTags = document.getElementById('noteTags');
  
  // Details tab fields
  const noteTitle2 = document.getElementById('noteTitle2');
  const noteText2 = document.getElementById('noteText2');
  const noteUrl = document.getElementById('noteUrl');
  const creationDate = document.getElementById('creationDate');
  const noteStatus = document.getElementById('noteStatus');
  const notePriority = document.getElementById('notePriority');
  const noteTags2 = document.getElementById('noteTags2');
  
  // Other elements
  const addNoteBtn = document.getElementById('addNote');
  const notesList = document.getElementById('notesList');
  const filterTags = document.getElementById('filterTags');
  const filterStatus = document.getElementById('filterStatus');
  const clearFilterBtn = document.getElementById('clearFilter');
  
  let allNotes = [];
  let currentFilter = '';
  let currentStatusFilter = '';
  let activeTab = 'simple';

  loadNotes();
  getSelectedTextFromPage();
  getCurrentPageUrl();
  setCurrentDate();

  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      // Update active states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      this.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
      activeTab = targetTab;
      syncFields(targetTab);
    });
  });

  // Sync fields between tabs
  function syncFields(toTab) {
    if (toTab === 'details') {
      noteTitle2.value = noteTitle.value;
      noteText2.value = noteText.value;
      noteTags2.value = noteTags.value;
    } else {
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

  addNoteBtn.addEventListener('click', function() {
    const title = activeTab === 'simple' ? noteTitle.value.trim() : noteTitle2.value.trim();
    const text = activeTab === 'simple' ? noteText.value.trim() : noteText2.value.trim();
    const tags = activeTab === 'simple' ? noteTags.value.trim() : noteTags2.value.trim();
    
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
      const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      
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
          filterTags.value = tag;
          currentFilter = tag.toLowerCase();
          filterNotes();
        });
        tagsDiv.appendChild(tagSpan);
      });
    }

    const noteActions = document.createElement('div');
    noteActions.className = 'note-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', function() {
      deleteNote(note.id);
    });

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
          if (results && results[0] && results[0].result) {
            noteText.value = results[0].result;
            noteText2.value = results[0].result;
            noteText.focus();
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
});