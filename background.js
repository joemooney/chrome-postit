// Note: chrome.action.onClicked doesn't work when default_popup is set
// The default view handling is now done in popup.js when the popup loads

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