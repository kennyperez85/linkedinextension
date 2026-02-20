# LinkedIn Connection Assistant (Chrome Extension)

This repository contains a **review-first** Chrome extension for LinkedIn people-search workflows.

## What it does

- Scans LinkedIn people search results.
- Matches profiles by your keywords (default: mental health, business administration, healthcare, c-suite) or follower count threshold.
- Highlights matching results.
- Builds a local queue of candidates.
- Opens the next candidate profile for **manual review and manual invite sending**.

> Note: this extension intentionally does **not** auto-send invitations. Bulk auto-inviting can violate platform rules and risks account restrictions.

## Setup

1. Open Chrome and navigate to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this repository folder.
4. Pin the extension.
5. Open LinkedIn people search results page.
6. Click the extension icon and use **Scan this page**.
7. Click **Open next candidate profile** and review each profile manually before inviting.

## Configure

- Open extension settings via popup -> **Settings**.
- Set your keywords, minimum follower threshold, weekly target, and daily review cap.

## Recommended safe operating pattern

- Keep daily reviews moderate.
- Personalize connection notes.
- Stop when LinkedIn displays invitation limits.
- Focus on relevance over volume.
