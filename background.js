// Note: chrome.action.onClicked doesn't work when default_popup is set
// The default view handling is now done in popup.js when the popup loads

// Function to find and switch to existing Post-it tab
async function findAndSwitchToPostItTab() {
  const tabs = await chrome.tabs.query({});
  const postItTab = tabs.find(tab => 
    tab.url && tab.url.includes(chrome.runtime.getURL('tab.html'))
  );
  
  if (postItTab) {
    // Switch to the existing tab
    await chrome.tabs.update(postItTab.id, { active: true });
    await chrome.windows.update(postItTab.windowId, { focused: true });
    return true;
  }
  return false;
}

// Check if sidebar is open
async function isSidebarOpen() {
  try {
    // Get the current window
    const window = await chrome.windows.getCurrent();
    // Try to get sidebar info - this is a workaround since Chrome doesn't have direct API
    // We'll check if sidepanel.html is loaded in any tab/frame
    const tabs = await chrome.tabs.query({});
    return tabs.some(tab => 
      tab.url && tab.url.includes(chrome.runtime.getURL('sidepanel.html'))
    );
  } catch (error) {
    return false;
  }
}

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "postit-add",
    title: "Post-it",
    contexts: ["selection", "page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Store the selected text and current URL in storage
  const noteData = {
    selectedText: info.selectionText || '',
    pageUrl: tab.url || '',
    pageTitle: tab.title || ''
  };
  
  // Check if a note with the same text already exists
  chrome.storage.local.get(['notes'], async (result) => {
    const notes = result.notes || [];
    let existingNote = null;
    
    if (noteData.selectedText) {
      existingNote = notes.find(note => note.text === noteData.selectedText);
    }
    
    if (existingNote) {
      // If duplicate found, prepare for edit mode
      chrome.storage.local.set({ 
        pendingNote: noteData,
        editNoteId: existingNote.id,
        contextMenuTarget: 'edit'
      });
    } else {
      // No duplicate, proceed with normal add/query
      chrome.storage.local.set({ 
        pendingNote: noteData,
        editNoteId: null,
        contextMenuTarget: info.selectionText ? 'add' : 'query'
      });
    }
    
    // Now proceed with the rest of the logic
    // First check if sidebar is open
    const sidebarCheck = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          // No listener available, sidebar not open
          resolve(false);
        } else {
          resolve(response && response.source === 'sidebar');
        }
      });
    });
    
    if (sidebarCheck) {
      // If sidebar is open, get the target view from storage
      chrome.storage.local.get(['contextMenuTarget'], (data) => {
        const targetView = data.contextMenuTarget || 'query';
        chrome.runtime.sendMessage({ action: 'switchToTab', tab: targetView }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Could not switch tab:', chrome.runtime.lastError.message);
          }
        });
      });
      return;
    }
    
    // Then check if Post-it is already open in a tab
    const foundTab = await findAndSwitchToPostItTab();
    if (foundTab) {
      // Send a message to the tab to handle the context menu data
      const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('tab.html') });
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'handleContextMenu' });
      }
      return;
    }
    
    // If no existing tab, open based on preferences
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      const defaultView = settings.defaultView || 'popup';
      // Open based on default view preference
      switch (defaultView) {
        case 'browser-tab':
          chrome.tabs.create({ url: 'tab.html' });
          break;
        case 'sidebar':
        case 'popup':
        default:
          // For popup and sidebar, we'll open popup and let it handle the view
          chrome.action.openPopup();
          break;
      }
    });
  });
});

// Listen for messages from popup to open side panel or check for existing tabs
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ windowId: tabs[0].windowId })
          .then(() => {
            console.log('Side panel opened successfully');
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error('Error opening side panel:', error);
            sendResponse({ success: false, error: error.message });
          });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'checkForExistingTab') {
    const found = await findAndSwitchToPostItTab();
    sendResponse({ found: found });
    return true; // Keep message channel open for async response
  } else if (request.action === 'checkForSidebar') {
    // Check if we can communicate with the sidebar
    chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
      if (chrome.runtime.lastError) {
        // No listener available
        sendResponse({ sidebarOpen: false });
      } else {
        sendResponse({ sidebarOpen: response && response.source === 'sidebar' });
      }
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'switchToAddTab') {
    // Broadcast to all extension views to switch to Add tab
    chrome.runtime.sendMessage({ action: 'switchToTab', tab: 'add' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Could not switch to add tab:', chrome.runtime.lastError.message);
      }
    });
    sendResponse({ success: true });
    return false; // Synchronous response
  } else if (request.action === 'showToastAfterClose') {
    // Show toast notification in the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // First inject the content script
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['toast-content.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.log('Could not inject toast script:', chrome.runtime.lastError.message);
            sendResponse({ success: false });
          } else {
            // Then send message to show toast
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'showToast',
              message: request.message
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log('Could not show toast:', chrome.runtime.lastError.message);
                sendResponse({ success: false });
              } else {
                sendResponse({ success: true });
              }
            });
          }
        });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true; // Keep channel open for async response
  }
  
  // Default response for unhandled actions
  sendResponse({});
  return false;
});