# LinkedIn Connection Assistant (Chrome Extension)

This repository contains a **review-first** Chrome extension for LinkedIn people-search workflows and My Network growth invites.

## What it does

- Scans LinkedIn people search results.
- Matches profiles by your keywords (default: mental health, business administration, healthcare, c-suite) or follower count threshold.
- Scans the LinkedIn **My Network > Grow** page for visible Connect/Invite candidates.
- Highlights matching results.
- Builds a local queue of candidates.
- Opens the next candidate profile for manual review from either search results or My Network > Grow matches.

> Note: this extension is designed for manual invite decisions after profile review.

## Setup

1. Open Chrome and navigate to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this repository folder.
4. Pin the extension.
5. Open LinkedIn.
6. Click the extension icon and use **Scan this page**.
   - If you are not on a supported page, the extension navigates to `https://www.linkedin.com/mynetwork/grow/`.
7. Click **Open next candidate profile** to process your queue.

## Configure

- Open extension settings via popup -> **Settings**.
- Set your keywords, minimum follower threshold, weekly target, and daily review cap.
- Invite sending is manual after reviewing opened profiles.

## Recommended safe operating pattern

- Keep daily reviews moderate.
- Personalize connection notes.
- Stop when LinkedIn displays invitation limits.
- Focus on relevance over volume.
