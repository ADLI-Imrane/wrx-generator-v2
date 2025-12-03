// Background service worker for the extension
// eslint-disable-next-line no-console
console.log('WRX Generator extension loaded');

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'wrx-shorten-url',
    title: 'Shorten this URL with WRX',
    contexts: ['link'],
  });

  chrome.contextMenus.create({
    id: 'wrx-generate-qr',
    title: 'Generate QR Code for this page',
    contexts: ['page'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (info.menuItemId === 'wrx-shorten-url' && info.linkUrl) {
    // Handle URL shortening
    // TODO: Implement URL shortening
  } else if (info.menuItemId === 'wrx-generate-qr') {
    // Handle QR code generation
    // TODO: Implement QR generation
  }
});
