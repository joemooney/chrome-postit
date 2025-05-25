// Note: chrome.action.onClicked doesn't work when default_popup is set
// The default view handling is now done in popup.js when the popup loads

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "postit-add",
    title: "Post-it",
    contexts: ["selection", "page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Store the selected text and current URL in storage
  const noteData = {
    selectedText: info.selectionText || '',
    pageUrl: tab.url || '',
    pageTitle: tab.title || ''
  };
  
  chrome.storage.local.set({ pendingNote: noteData }, () => {
    // Open the popup with appropriate view
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      const defaultView = settings.defaultView || 'popup';
      
      // If text is selected, we want to show Add tab
      // If no text selected, we want to show Query tab
      const targetView = info.selectionText ? 'add' : 'query';
      
      // Store the target view
      chrome.storage.local.set({ contextMenuTarget: targetView }, () => {
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
});

// Listen for messages from popup to open side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ windowId: tabs[0].windowId })
          .then(() => {
            console.log('Side panel opened successfully');
          })
          .catch((error) => {
            console.error('Error opening side panel:', error);
          });
      }
    });
  }
});