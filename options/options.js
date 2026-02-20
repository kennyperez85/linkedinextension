async function loadSettings() {
  const { settings } = await chrome.storage.sync.get(["settings"]);
  if (!settings) return;

  document.getElementById("keywords").value = settings.keywords.join(", ");
  document.getElementById("minFollowers").value = settings.minFollowers;
  document.getElementById("weeklyTarget").value = settings.weeklyTarget;
  document.getElementById("dailyCap").value = settings.dailyCap;
}

async function saveSettings() {
  const keywords = document
    .getElementById("keywords")
    .value
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  const settings = {
    keywords,
    minFollowers: Number(document.getElementById("minFollowers").value || 0),
    weeklyTarget: Number(document.getElementById("weeklyTarget").value || 1),
    dailyCap: Number(document.getElementById("dailyCap").value || 1),
    requireManualSend: true
  };

  await chrome.storage.sync.set({ settings });
  document.getElementById("status").textContent = "Saved.";
}

document.getElementById("saveBtn").addEventListener("click", saveSettings);
loadSettings();
