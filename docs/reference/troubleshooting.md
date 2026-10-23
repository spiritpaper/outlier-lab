# Troubleshooting

## Setup

**"Add your YouTube Data API key in the extension popup."**
No key is saved. Click the Outlier Lab icon and paste your key ([getting started](../getting-started.md#2-add-a-youtube-data-api-key-free)).

**"Your YouTube API key is invalid."**
Copy the key again from [Credentials](https://console.cloud.google.com/apis/credentials). If you restricted the key, make sure **YouTube Data API v3** is allowed.

**"YouTube Data API v3 is not enabled for this key's Google Cloud project."**
Enable it on the [API page](https://console.cloud.google.com/apis/library/youtube.googleapis.com) for the same project as the key.

**"Daily YouTube API quota used up."**
The 10,000-unit daily limit resets at midnight Pacific time. Saved data keeps working meanwhile. See [what costs what](quota.md).

**No badges or panel on YouTube.**
Check the popup's **On YouTube** toggles. Open YouTube tabs pick up an install or update by themselves (from 0.11.2; before that, reload the tab). If a tab still shows "Extension was updated. Reload this tab.", reload it once.

**The extension disappeared, or is turned off after an update.**
Chrome only runs extensions loaded with **Load unpacked** while **Developer mode** is on (top right of `chrome://extensions`). With it off, Chrome turns Outlier Lab off the next time it reloads, which happens after every update, and may hide it from the list. Turn Developer mode on and keep it on, then switch Outlier Lab back on. If Chrome asks at startup whether to disable developer-mode extensions, keep them. Your data is safe as long as you don't click **Remove**: it stays in Chrome, tied to the extension.

**The extension is missing from `chrome://extensions` after restarting Chrome.**
Chrome couldn't read the extension's folder when it started, so it left Outlier Lab out for that session. Your data is still there. This happens when the folder sits in OneDrive, iCloud or Dropbox (on Windows, `Documents` and `Desktop` are often synced by OneDrive, and its "Files On-Demand" can leave files online-only), on a removable drive, or was moved or deleted.

1. Make the files available again: in OneDrive, right-click the folder and choose **Always keep on this device**, or put the folder back where it was. Then restart Chrome, or click **Load unpacked** and pick that same folder. The same folder brings back the same extension with your data.
2. Then move it out of the synced folder for good: **Settings → Storage & data → Download backup**, move the folder somewhere like `C:\Users\<you>\Outlier Lab`, load it from there, and restore the backup in Settings. A new folder gives the extension a new ID, so its storage starts empty until you restore.

## Transcripts

**"This video has no captions or transcript."**
The video has no captions, or the player hasn't offered them. Try playing the video for a few seconds, then click **Transcript** again.

**The transcript is auto-generated.**
Creator captions are preferred when they exist; otherwise YouTube's auto-generated captions are used (look for "auto-generated captions" in the button tooltip).

## Keyword explorer and video web

**The explorer used 100 units for one keyword.**
YouTube's search page couldn't be read (often a cookie-consent page), so it fell back to the official search API. Open youtube.com once and accept the consent prompt; later searches will use the free page.

**A video web looks different from last time.**
YouTube personalizes suggestions; webs are a snapshot of what it suggested at that moment.

## AI

**"… rejected the key"**: the key is wrong, expired or out of credit with that provider.
**"rate limit or credit limit reached"**: wait a minute (free tiers have low limits) or check your provider billing.
**"Couldn't reach …"**: network problem; the call is retried once automatically. Try again.
**AI buttons say "AI is optional…"**: no provider connected, or Chrome's permission was not granted. Open **Settings → AI assistant → Connect**.
**It takes a long time**: long transcripts and image critiques can take 1–2 minutes.

## Google sign-in

**"Add your Google OAuth client ID in Settings first."**
Follow the [My channel setup](../guides/my-channel.md#one-time-setup-about-5-minutes).

**`redirect_uri_mismatch` from Google.**
The redirect address in your Google Cloud client must exactly match the one on the My channel page (including the trailing `/`). If you moved the extension folder, the address changed.

**"Access blocked" / not a test user.**
Add your Google account as a **test user** under Google Auth Platform → Audience.

**"Enable the YouTube Analytics API in your Google Cloud project."**
Enable it [here](https://console.cloud.google.com/apis/library/youtubeanalytics.googleapis.com).

**"Enable the YouTube Data API v3 in the Google Cloud project of your sign-in client."**, or Google's "YouTube Data API v3 has not been used in project … or it is disabled" when you sign in.
Sign-in finds your channel through the Data API, billed to the project that holds your OAuth client. Enable [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) in that project, wait a minute, and sign in again.

**"Your Google session expired. Sign in again."**
Sign-in renews silently while you're signed in to Google in the browser; if you signed out of Google, sign in again on the My channel page.

## Data

**Everything disappeared after moving the extension folder.**
Chrome treats a moved unpacked extension as a new extension with empty storage. Move it back (your data is still there), download a backup, then move it and restore.

**A followed channel shows 1 subscriber / no uploads.**
The @handle belonged to a different channel. Unfollow (✕) and follow using the channel's link.
