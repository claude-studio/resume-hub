export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('[resume-hub] content script loaded');
  },
});
