const STATE_KEY = "sessionState";
const GROW_URL = "https://www.linkedin.com/mynetwork/grow/";

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
    actionType: "profile_review",
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

function isGrowPage() {
  return location.pathname.startsWith("/mynetwork/grow");
}

function isPeopleSearchPage() {
  return location.pathname.startsWith("/search/results/people");
}

function normalizeProfileUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function extractGrowCandidates(settings) {
  const candidates = [];
  const seen = new Set();

  document.querySelectorAll("a[href*='/in/']").forEach((link) => {
    const profileUrl = normalizeProfileUrl(link.href || "");
    if (!profileUrl || seen.has(profileUrl)) {
      return;
    }

    const container = link.closest("li, article, section, div");
    if (!container) {
      return;
    }

    const actionButtons = [...container.querySelectorAll("button")];
    const inviteButton = actionButtons.find((button) => {
      const text = (button.textContent || "").trim().toLowerCase();
      const aria = (button.getAttribute("aria-label") || "").toLowerCase();
      return text === "connect" || text === "invite" || aria.includes("invite") || aria.includes("connect");
    });

    if (!inviteButton || inviteButton.disabled) {
      return;
    }

    const name = (link.textContent || "").trim() || "Unknown";
    const contextText = (container.textContent || "").replace(/\s+/g, " ").trim();
    const candidate = {
      actionType: "profile_review",
      source: "grow",
      name,
      headline: contextText,
      summary: contextText,
      followers: parseFollowers(contextText),
      profileUrl
    };

    if (matchesCriteria(candidate, settings)) {
      seen.add(profileUrl);
      candidates.push(candidate);
    }
  });

  return candidates;
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

function statsResponse(state, settings, matches, message = "") {
  return {
    matches,
    weeklyQueued: state.weeklyQueued,
    weeklyTarget: settings.weeklyTarget,
    dailyReviewed: state.dailyReviewed,
    dailyCap: settings.dailyCap,
    message
  };
}

function isDuplicateQueueItem(queueItem, profile) {
  return (
    normalizeProfileUrl(queueItem.profileUrl) === normalizeProfileUrl(profile.profileUrl) &&
    (queueItem.actionType || "profile_review") === profile.actionType
  );
}

async function scanPage() {
  const settings = await getSettings();
  const state = await getState();
  resetIfNeeded(state);

  if (!isPeopleSearchPage() && !isGrowPage()) {
    window.location.assign(GROW_URL);
    await setState(state);
    return statsResponse(state, settings, state.queue.length, "Navigating to My Network > Grow.");
  }

  const matched = isPeopleSearchPage()
    ? getResultCards()
        .map(readCardData)
        .filter((profile) => profile.profileUrl)
        .filter((profile) => matchesCriteria(profile, settings))
    : extractGrowCandidates(settings);

  const newItems = matched.filter((profile) => !state.queue.some((queued) => isDuplicateQueueItem(queued, profile)));

  state.queue.push(...newItems);
  state.weeklyQueued = state.queue.length;

  await setState(state);

  highlightMatches(matched);

  return statsResponse(state, settings, matched.length);
}

function highlightMatches(matched) {
  const matchUrls = new Set(matched.map((m) => normalizeProfileUrl(m.profileUrl)));
  document.querySelectorAll("a[href*='/in/']").forEach((linkEl) => {
    const normalized = normalizeProfileUrl(linkEl.href || "");
    if (normalized && matchUrls.has(normalized)) {
      const card = linkEl.closest("li, article, section, div");
      if (card) {
        card.style.outline = "2px solid #0a66c2";
        card.style.borderRadius = "8px";
        card.style.background = "#eef5ff";
      }
    }
  });
}

async function openNext() {
  const settings = await getSettings();
  const state = await getState();
  resetIfNeeded(state);

  if (state.dailyReviewed >= settings.dailyCap || state.queue.length === 0) {
    return statsResponse(state, settings, state.queue.length);
  }

  const next = state.queue.shift();
  state.dailyReviewed += 1;
  state.weeklyQueued = state.queue.length;
  await setState(state);

  if (next?.profileUrl) {
    window.open(next.profileUrl, "_blank", "noopener");
    return statsResponse(state, settings, state.queue.length, "Opened next candidate profile.");
  }

  return statsResponse(state, settings, state.queue.length);
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
