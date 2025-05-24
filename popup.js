document.addEventListener('DOMContentLoaded', function() {
  const noteText = document.getElementById('noteText');
  const noteTags = document.getElementById('noteTags');
  const addNoteBtn = document.getElementById('addNote');
  const notesList = document.getElementById('notesList');
  const filterTags = document.getElementById('filterTags');
  const clearFilterBtn = document.getElementById('clearFilter');
  
  let allNotes = [];
  let currentFilter = '';

  loadNotes();
  getSelectedTextFromPage();

  addNoteBtn.addEventListener('click', function() {
    const text = noteText.value.trim();
    const tags = noteTags.value.trim();
    if (text) {
      addNote(text, tags);
      noteText.value = '';
      noteTags.value = '';
    }
  });

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

  clearFilterBtn.addEventListener('click', function() {
    filterTags.value = '';
    currentFilter = '';
    displayNotes(allNotes);
  });

  function addNote(text, tags) {
    chrome.storage.local.get(['notes'], function(result) {
      const notes = result.notes || [];
      const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      const newNote = {
        id: Date.now(),
        text: text,
        tags: tagArray,
        timestamp: new Date().toISOString()
      };
      notes.unshift(newNote);
      chrome.storage.local.set({ notes: notes }, function() {
        allNotes = notes;
        if (currentFilter) {
          filterNotes();
        } else {
          displayNotes(notes);
        }
      });
    });
  }

  function loadNotes() {
    chrome.storage.local.get(['notes'], function(result) {
      allNotes = result.notes || [];
      displayNotes(allNotes);
    });
  }

  function filterNotes() {
    if (!currentFilter) {
      displayNotes(allNotes);
      return;
    }
    const filteredNotes = allNotes.filter(note => {
      return note.tags && note.tags.some(tag => 
        tag.toLowerCase().includes(currentFilter)
      );
    });
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

    const noteContent = document.createElement('div');
    noteContent.className = 'note-content';
    noteContent.textContent = note.text;

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
        if (currentFilter) {
          filterNotes();
        } else {
          displayNotes(updatedNotes);
        }
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
            noteText.focus();
          }
        });
      }
    });
  }
});