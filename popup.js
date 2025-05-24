document.addEventListener('DOMContentLoaded', function() {
  const noteText = document.getElementById('noteText');
  const addNoteBtn = document.getElementById('addNote');
  const notesList = document.getElementById('notesList');

  loadNotes();

  addNoteBtn.addEventListener('click', function() {
    const text = noteText.value.trim();
    if (text) {
      addNote(text);
      noteText.value = '';
    }
  });

  noteText.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNoteBtn.click();
    }
  });

  function addNote(text) {
    chrome.storage.local.get(['notes'], function(result) {
      const notes = result.notes || [];
      const newNote = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toISOString()
      };
      notes.unshift(newNote);
      chrome.storage.local.set({ notes: notes }, function() {
        displayNotes(notes);
      });
    });
  }

  function loadNotes() {
    chrome.storage.local.get(['notes'], function(result) {
      const notes = result.notes || [];
      displayNotes(notes);
    });
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
    noteDiv.appendChild(noteActions);

    return noteDiv;
  }

  function deleteNote(noteId) {
    chrome.storage.local.get(['notes'], function(result) {
      const notes = result.notes || [];
      const updatedNotes = notes.filter(note => note.id !== noteId);
      chrome.storage.local.set({ notes: updatedNotes }, function() {
        displayNotes(updatedNotes);
      });
    });
  }
});