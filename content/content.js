const STATE_KEY = "sessionState";

function parseFollowers(text) {
  const match = text.match(/([\d,.]+)\s+followers?/i);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, "")) || 0;
}

function readCardData(card) {
  const nameEl = card.querySelector("span[aria-hidden='true']");
  const headlineEl = card.querySelector("div.entity-result__primary-subtitle");
  const summaryEl = card.querySelector("div.entity-result__summary");
  const linkEl = card.querySelector("a.app-aware-link");

  const headline = headlineEl?.textContent?.trim() || "";
  const summary = summaryEl?.textContent?.trim() || "";

  return {
    name: nameEl?.textContent?.trim() || "Unknown",
    headline,
    summary,
    followers: parseFollowers(`${headline} ${summary}`),
    profileUrl: linkEl?.href || ""
  };
}

function matchesCriteria(profile, settings) {
  const text = `${profile.headline} ${profile.summary}`.toLowerCase();
  const keywordMatch = settings.keywords.some((k) => text.includes(k));
  const followerMatch = profile.followers >= settings.minFollowers;
  return keywordMatch || followerMatch;
}

function getResultCards() {
  return [...document.querySelectorAll("li.reusable-search__result-container")];
}

async function getSettings() {
  const { settings } = await chrome.storage.sync.get(["settings"]);
  return (
    settings || {
      keywords: ["mental health", "business administration", "healthcare", "c-suite"],
      minFollowers: 500,
      weeklyTarget: 950,
      dailyCap: 25,
      requireManualSend: true
    }
  );
}

async function getState() {
  const data = await chrome.storage.local.get([STATE_KEY]);
  return (
    data[STATE_KEY] || {
      queue: [],
      weeklyQueued: 0,
      dailyReviewed: 0,
      lastResetISO: new Date().toISOString().slice(0, 10)
    }
  );
}

async function setState(next) {
  await chrome.storage.local.set({ [STATE_KEY]: next });
}

function resetIfNeeded(state) {
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastResetISO !== today) {
    state.dailyReviewed = 0;
    state.lastResetISO = today;
  }
}

async function scanPage() {
  const settings = await getSettings();
  const state = await getState();
  resetIfNeeded(state);

  const cards = getResultCards();
  const matched = cards
    .map(readCardData)
    .filter((profile) => profile.profileUrl)
    .filter((profile) => matchesCriteria(profile, settings));

  const newItems = matched.filter(
    (profile) => !state.queue.some((queued) => queued.profileUrl === profile.profileUrl)
  );

  state.queue.push(...newItems);
  state.weeklyQueued = state.queue.length;

  await setState(state);

  highlightMatches(matched);

  return {
    matches: matched.length,
    weeklyQueued: state.weeklyQueued,
    weeklyTarget: settings.weeklyTarget,
    dailyReviewed: state.dailyReviewed,
    dailyCap: settings.dailyCap
  };
}

function highlightMatches(matched) {
  const matchUrls = new Set(matched.map((m) => m.profileUrl));
  getResultCards().forEach((card) => {
    const linkEl = card.querySelector("a.app-aware-link");
    if (linkEl?.href && matchUrls.has(linkEl.href)) {
      card.style.outline = "2px solid #0a66c2";
      card.style.borderRadius = "8px";
      card.style.background = "#eef5ff";
    }
  });
}

async function openNext() {
  const settings = await getSettings();
  const state = await getState();
  resetIfNeeded(state);

  if (state.dailyReviewed >= settings.dailyCap || state.queue.length === 0) {
    return {
      matches: state.queue.length,
      weeklyQueued: state.weeklyQueued,
      weeklyTarget: settings.weeklyTarget,
      dailyReviewed: state.dailyReviewed,
      dailyCap: settings.dailyCap
    };
  }

  const next = state.queue.shift();
  state.dailyReviewed += 1;
  state.weeklyQueued = state.queue.length;
  await setState(state);

  if (next?.profileUrl) {
    window.open(next.profileUrl, "_blank", "noopener");
  }

  return {
    matches: state.queue.length,
    weeklyQueued: state.weeklyQueued,
    weeklyTarget: settings.weeklyTarget,
    dailyReviewed: state.dailyReviewed,
    dailyCap: settings.dailyCap
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SCAN_PAGE") {
    scanPage().then(sendResponse);
    return true;
  }

  if (message.type === "OPEN_NEXT") {
    openNext().then(sendResponse);
    return true;
  }

  return false;
});
