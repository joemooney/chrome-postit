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
  
  chrome.storage.local.set({ pendingNote: noteData }, async () => {
    // First check if Post-it is already open in a tab
    const foundTab = await findAndSwitchToPostItTab();
    if (foundTab) {
      // If we found a tab, just store the target view and let the tab handle it
      const targetView = info.selectionText ? 'add' : 'query';
      chrome.storage.local.set({ contextMenuTarget: targetView });
      
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

// Listen for messages from popup to open side panel or check for existing tabs
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
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
  } else if (request.action === 'checkForExistingTab') {
    const found = await findAndSwitchToPostItTab();
    sendResponse({ found: found });
    return true; // Keep message channel open for async response
  }
});