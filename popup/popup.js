async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isLinkedInPeopleSearch(url = "") {
  return /^https:\/\/www\.linkedin\.com\/search\/results\/people\//.test(url);
}

async function ensureContentScript(tab) {
  if (!tab?.id) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content/content.js"]
  });
}

async function sendCommand(command) {
  const tab = await getCurrentTab();
  if (!tab?.id) {
    return { error: "No active tab found." };
  }

  if (!isLinkedInPeopleSearch(tab.url)) {
    return { error: "Open a LinkedIn people search results page first." };
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, command);
  } catch (_error) {
    // If the content script is not present yet (e.g. page opened before install), inject and retry.
    await ensureContentScript(tab);
    return chrome.tabs.sendMessage(tab.id, command);
  }
}

function renderStats(data) {
  const stats = document.getElementById("stats");
  if (!data) {
    stats.textContent = "Open a LinkedIn people search results page.";
    return;
  }

  if (data.error) {
    stats.textContent = data.error;
    return;
  }

  stats.innerHTML = `
    <strong>Matched on page:</strong> ${data.matches}<br />
    <strong>Queued this week:</strong> ${data.weeklyQueued}/${data.weeklyTarget}<br />
    <strong>Daily reviewed:</strong> ${data.dailyReviewed}/${data.dailyCap}
  `;
}

document.getElementById("scanBtn").addEventListener("click", async () => {
  const result = await sendCommand({ type: "SCAN_PAGE" });
  renderStats(result);
});

document.getElementById("nextBtn").addEventListener("click", async () => {
  const result = await sendCommand({ type: "OPEN_NEXT" });
  renderStats(result);
});
