// Handle extension icon click based on default view setting
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Get the default view setting
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || {};
    const defaultView = settings.defaultView || 'popup';
    
    switch (defaultView) {
      case 'sidebar':
        // Open side panel
        chrome.sidePanel.open({ windowId: tab.windowId });
        break;
        
      case 'browser-tab':
        // Open in new tab
        chrome.tabs.create({ url: 'tab.html' });
        break;
        
      case 'popup':
      default:
        // Open popup - need to use a workaround since we removed default_popup
        // Get current window to position popup relative to it
        chrome.windows.getCurrent((window) => {
          const width = 400;
          const height = 600;
          const left = Math.round(window.left + (window.width - width) / 2);
          const top = Math.round(window.top + (window.height - height) / 2);
          
          chrome.windows.create({
            url: chrome.runtime.getURL('popup.html'),
            type: 'popup',
            width: width,
            height: height,
            left: left,
            top: top
          });
        });
        break;
    }
  } catch (error) {
    console.error('Error handling action click:', error);
    // Fallback to popup
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 400,
      height: 600
    });
  }
});

// Listen for messages from popup to open side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ windowId: tabs[0].windowId });
      }
    });
  }
});