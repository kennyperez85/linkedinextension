async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendCommand(command) {
  const tab = await getCurrentTab();
  if (!tab?.id) {
    return null;
  }

  return chrome.tabs.sendMessage(tab.id, command);
}

function renderStats(data) {
  const stats = document.getElementById("stats");
  if (!data) {
    stats.textContent = "Open a LinkedIn people search results page.";
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
