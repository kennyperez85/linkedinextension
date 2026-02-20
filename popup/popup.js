async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendCommand(command) {
  const tab = await getCurrentTab();
  if (!tab?.id) {
    return null;
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, command);
  } catch {
    return null;
  }
}

function renderStats(data) {
  const stats = document.getElementById("stats");
  if (!data) {
    stats.textContent = "Open LinkedIn and try again.";
    return;
  }

  stats.innerHTML = `
    <strong>Matched on page:</strong> ${data.matches}<br />
    <strong>Queued this week:</strong> ${data.weeklyQueued}/${data.weeklyTarget}<br />
    <strong>Daily reviewed:</strong> ${data.dailyReviewed}/${data.dailyCap}
    ${data.message ? `<br /><em>${data.message}</em>` : ""}
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
