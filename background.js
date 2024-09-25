// Function to block downloads and notify content script
function blockDownload(downloadItem) {
  // Cancel the download
  chrome.downloads.cancel(downloadItem.id, () => {
    console.log(`Download blocked: ${downloadItem.filename}`);

    // Send a message to the content script to show the block message
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showBlockMessage' });
      }
    });
  });
}

// Listen for download events
chrome.downloads.onCreated.addListener((downloadItem) => {
  // Check if download blocking is enabled
  chrome.storage.sync.get('blockDownloads', ({ blockDownloads }) => {
    if (blockDownloads) {
      blockDownload(downloadItem);
    }
  });
});

// Listen for messages related to copy blocking and download blocking
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateCopyBlocking") {
    // Update copy blocking status in storage
    chrome.storage.sync.set({ blockCopy: request.state }, () => {
      // Refresh all tabs after copy blocking setting is updated
      refreshAllTabs();

      // Notify the active tab to update copy blocking status
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "updateCopyBlocking", state: request.state });
        }
      });
    });
  }

  if (request.action === "toggleDownloadBlocking") {
    // Update download blocking status in storage
    chrome.storage.sync.set({ blockDownloads: request.state }, () => {
      // Refresh all tabs after download blocking setting is updated
      refreshAllTabs();
    });
  }
});

// Function to refresh all tabs
function refreshAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      chrome.tabs.reload(tab.id);
    }
  });
}
