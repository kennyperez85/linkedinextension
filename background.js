chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(["settings"]);
  if (!current.settings) {
    await chrome.storage.sync.set({
      settings: {
        keywords: ["mental health", "business administration", "healthcare", "c-suite"],
        minFollowers: 500,
        weeklyTarget: 950,
        dailyCap: 25,
        requireManualSend: true
      }
    });
  }
});
