# Changelog

All notable changes to Outlier Lab (called YT Toolkit before 0.11.0). Each release's section becomes its GitHub Release notes.

## [0.12.2] - 2026-10-23

### Added
- **A note when a score mixes YouTube's old and new view counts.** From 24 August 2026, YouTube counts a view from the first frame, Home autoplay included. When a video counted the new way is scored against older videos counted the old way, the video panel says the score may read a little high, and links to [why](https://spiritpaper.site/outlier-lab/docs/data/outliers.html).
- More links to the [guide](https://spiritpaper.site/outlier-lab/): Saved outliers links to reading an outlier score, Compare to telling whether a channel is growing, and Content gaps to turning an outlier into your own idea.
- Outlier Lab is now under the [MIT license](LICENSE).

### Fixed
- Saved outliers showed leftover links in its header, one of them to the old "Creator studio".

### Changed
- The guide website follows your system's dark mode.

## [0.12.1] - 2026-10-23

### Added
- **A guide website: [spiritpaper.site/outlier-lab](https://spiritpaper.site/outlier-lab/).** Every guide and reference page, with screenshots and search, plus two new sections:
  - **Reading your data**: whether an outlier is real and what to learn from it, finding why a video worked or didn't (impressions, CTR or retention), reading retention curves, and telling growth from one good month.
  - **How YouTube works**: how recommendations work, ideas, titles and thumbnails, hooks and keeping viewers, Shorts, and common myths. Each claim says whether YouTube or experienced creators said it, with sources.
- A **Guide** link in the sidebar and the popup. My channel links its numbers and retention curves to the pages that explain them.

### Fixed
- **Sign-in failed with Google's "YouTube Data API v3 has not been used in project…" message** when the project holding your sign-in client only had the Analytics API on. Sign-in uses the Data API to find your channel, so the setup steps now say to enable both, and the error says which API to turn on.

## [0.12.0] - 2026-10-22

### Added
- **Views per day now.** YouTube only gives a video's total views, so "views per day" was the lifetime average, which hides whether a video is still picking up speed. Outlier Lab now notes a video's views each time it fetches them (badges, the video panel, saved ideas, the daily refresh of followed channels), at no extra quota, and two counts at least 3 hours apart give the views it's getting now. The video panel shows it next to the lifetime average, and **Following** shows it on each channel's latest uploads. See [how it's calculated](docs/reference/metrics.md).
- **The channel review can tell whether you're growing.** Besides this period vs the last, the AI now gets six 4-week blocks over about 6 months (views, watch hours, net subscribers, impressions, CTR, uploads), your channel's impressions and click-through rate, views by format, the share of views from non-subscribers, views from new uploads vs older ones, and traffic sources with their change. The review answers "Is it growing?" and names the bottleneck: reach, CTR, retention or upload pace. Parts your account's API doesn't return are left out.
- Settings shows, under each AI provider, what its terms allow it to do with what you send, and [Privacy](docs/reference/privacy.md) compares them. Gemini's free tier, for example, may use prompts to improve Google's products; Local AI never sends anything.

### Fixed
- **The update notice pointed at the zip file** and could outlive the update it announced, still showing an old version and its old link after you updated. It now links to the update steps and the release page, disappears once that version is installed, and updating clears it.
- Click-through rates in the channel review are read correctly whether YouTube reports them as a fraction or a percent.

### Changed
- The update steps lead with the update script. Updating by hand: close Chrome first, then unzip over the same folder.
- README and Privacy say it plainly: Outlier Lab is local, with no server or account, and your research is yours.

## [0.11.3] - 2026-10-19

### Fixed
- **The extension could vanish from `chrome://extensions` after restarting Chrome.** If Chrome can't read the extension's folder when it starts, it leaves Outlier Lab out of the list for that session (your data stays). The update scripts used to rewrite `manifest.json` in place, so a Chrome starting in that moment found it half-written; they now write the new manifest next to it and swap it in at once.

### Changed
- Docs: install into a folder that isn't synced by OneDrive, iCloud or Dropbox (for example `C:\Users\<you>\Outlier Lab`). On Windows, `Documents` and `Desktop` are often synced by OneDrive, and its Files On-Demand can leave the files online-only when Chrome starts. [Troubleshooting](docs/reference/troubleshooting.md) explains how to get the extension back without losing data.

## [0.11.2] - 2026-10-19

A stability release: safer updates, and fixes from a review of the whole extension.

### Fixed
- **Updating no longer risks breaking the extension.** The update scripts used to delete everything in the extension folder and then copy the new version in, so a failed copy (a locked file on Windows, a full disk) left the extension broken, and if its update check ran in that moment Chrome dropped it. Now the new files are copied over the old ones, files the new version no longer has are removed afterwards, and `manifest.json`, which makes the extension reload, is written last. The scripts also check that the folder really holds Outlier Lab and that the download is complete. The extension never reloads while its files can't be read.
- **YouTube tabs keep working after an update.** Open tabs used to keep a dead copy of Outlier Lab until reloaded: no badges, and a panel asking you to reload. They now get the new version right away. This needs the `scripting` permission (only on youtube.com, see [Privacy](docs/reference/privacy.md)).
- **Old test screenings were deleted.** Only the newest 60 saved results were kept, conversations and pitches included, so an active user lost old screenings and the Forecast vs reality results that calibrate new ones. Results checked against the real numbers are now always kept, and the rest are kept by last activity.
- **Restoring a backup skipped audience groups** if this browser already had one. They now merge group by group.
- The update notice's **Download** link pointed at the Mac companion app instead of the extension zip.
- Clicking **Sign in** while Outlier Lab was silently renewing the Google sign-in could fail with "session expired".
- Smaller robustness fixes: a request to the background can no longer go unanswered, and one failed write no longer stops the API quota counter.

### Changed
- Docs: keep **Developer mode** on in `chrome://extensions`. Chrome turns off extensions loaded with Load unpacked when it's off, which shows up after the next update. See [Troubleshooting](docs/reference/troubleshooting.md).

## [0.11.1] - 2026-10-18

### Fixed
- **Copy buttons.** "Copy report" on an Audience lab pitch, conversation or title test copied the word "undefined"; every result now copies as readable text. When Chrome refuses the normal way of copying, every copy button now falls back to another method, and it says "Copied ✓" or that copying failed instead of doing nothing.

### Added
- **Copy buttons in Ask your audience** for the latest pitch's answers and for the conversation.

## [0.11.0] - 2026-10-17

YT Toolkit is now **Outlier Lab**: same extension, same data, a name that fits what it has become.

### Changed
- **YT Toolkit is now Outlier Lab.** YouTube's branding rules don't allow "YouTube" or "YT" in the name of an app that uses its API, and "lab" fits what it has become. Your data, settings and installs carry over untouched. The repository moved to `spiritpaper/outlier-lab` (old links redirect), the release zip is now `outlier-lab-v….zip`, and the companion files are `outlier-lab-companion-…`.

### Fixed
- The update scripts picked the first zip in a release, which could be a companion archive; they now pick the extension zip by name.

## [0.10.0] - 2026-10-17

Run every AI feature on your own computer: free, private, no key.

### Added
- **Local AI**: run every AI feature on your own computer with Ollama, LM Studio or any OpenAI-compatible server, with no key, no daily limit, and nothing leaving your machine. Ollama works with no setup. Each request gets a context window sized to its prompt and answer (up to a limit you choose), with clear messages instead of silently cut-off prompts. Thinking is off by default for speed, and models that can see images are marked for thumbnail features. A new guide covers what to install on Windows, Mac and Linux and which model fits your memory.

## [0.9.0] - 2026-10-17

A lab that learns: ask your audience before you write, update your avatars from what real viewers did, and keep a notebook of what you noticed, learned and tested, which comes back to you while you write.

### Added
- **Lab notebook**: every note you took on videos in one place, grouped by video and filterable by #tags; lessons you write down, plus the ones forecast vs reality taught; and experiments that test an idea across videos against your other videos' real numbers (views at 7 days, watch time or click-through), with a careful verdict. While you write a project's outline or script, **From your notebook** shows the notes, lessons and experiments that match the paragraph you're on. Plain word matching on your device: no AI and no quota.
- **Avatars that learn from real viewers**: after checking a published video, **Update the audience from this video** (or **Update from real data** on any group) proposes changes to the avatars from your analytics, real comments and forecast-vs-reality lessons: field-by-field edits with the evidence, missing kinds of viewers to add, avatars to retire and new audience shares. You tick what to apply; locked avatars start unticked, and each group keeps a history of its updates.
- **Ask your audience**: pitch up to 4 one-line ideas to an avatar group before writing anything (who'd watch each, what they'd expect, what they'd rather see, who each idea wins over, and the group's takeaways), and ask follow-up questions in a chat, to everyone or one viewer. On every project and in the Audience lab.
- **Thumbnails in the video web**: hover a video for a card with its thumbnail, title, views and score; zoom in and the dots become thumbnails ringed in their outlier color. The web's layout is unchanged, and thumbnails load only when in view.

## [0.8.0] - 2026-10-17

The Audience lab: test a video on realistic viewers before you publish it, and see how close the forecast was afterwards.

### Added
- **Audience lab**: groups of avatars, realistic fictional viewers built from your real analytics (age, countries, devices, subscribers, how people find you), your top videos and recent comments, or from your channel description or a channel you follow. Lock, edit, add by hand, and regenerate the rest. Each avatar shows the data it reflects.
- **Test screenings**: run a project's title, opening and script past an avatar group. Each viewer decides whether to click in a realistic feed, whether to stay past the opening, and how they feel beat by beat, until they leave or reach the end (and what they'd comment). The report shows weighted click, retention and finish estimates, an attention curve, where and why viewers left, every viewer's reactions, and ranked changes. Viewers are anchored to real (or typical) watch times so the results stay honest, and every number shows how many viewers it rests on.
- **Title A/B, thumbnails and steadier numbers**: compare up to 4 titles on the same audience in one call (who'd click each, whose favorite it is, who each one wins over), include the thumbnail in the feed next to competitors' real thumbnails, and run a screening twice to see how steady its numbers are. A "What to expect" guide sits next to every screening.
- **Forecast vs reality**: once a screened video is published, compare the screening with its real watch time, opening, retention curve and drop-off (and click-through, for calibration), see a verdict, and have the AI explain what it got right and wrong, including which avatars to adjust. Every check corrects that audience's next screenings, and each group shows its track record.

### Fixed
- **Charts on every page**: a second line in a chart drew as a solid black block, and legends were unstyled, outside the My channel page.
- **After publishing** no longer breaks on a published project that has no tracking snapshot yet (for example after restoring a partial backup).

## [0.7.2] - 2026-10-17

### Added
- **Video downloads (optional add-on)**: a small companion app for Windows, Mac and Linux, attached to each release, lets YT Toolkit save videos, audio or just a clip: from a new Downloads page (any supported site, including X), a Download button in the YouTube panel, or **Download clip** on each suggested Short. It runs the downloader with a fixed, minimal set of options, verifies it before installing, and only talks to your copy of YT Toolkit. Nothing changes unless you turn it on. See the Video downloads guide.

## [0.7.1] - 2026-10-17

### Added
- **Updates without reinstalling**: Settings and Home show when a newer release is out, and the extension reloads itself when its files change, waiting until no YT Toolkit page is open, so updating keeps all your data.
- **Updaters for every system**, included in the zip: double-click `scripts\update.cmd` on Windows, or run `sh scripts/update.sh .` on macOS and Linux, inside the extension's folder.

## [0.7.0] - 2026-10-14

### Fixed
- **Phone layout**: the menu button no longer covers page titles.
- **Saving no longer stops after one failed write**: an error such as following a 16th keyword or editing a just-deleted project used to block every later save to the same data until Chrome restarted the extension.
- **AI answers render properly**: tables, nested lists, code blocks, quotes, links, strikethrough and numbered lists that continue after a paragraph now display as formatted text instead of raw Markdown, with the same styling on every page.

### Changed
- **Clearer empty and loading states**: empty pages (Saved outliers, Script lab, Compare, Radar) explain what to do and link to where it happens; every wait shows a spinner, Following shows placeholder cards while it loads, and AI actions on a project show progress next to the button.

### Added
- **Quick search** (Ctrl+K or / on any page) across projects, saved outliers, followed channels, your notes, rabbit holes, video webs and pages, opening each result in place.
- **Idea board filter and sorting**: filter cards by text, sort columns five ways (remembered), and a **Needs attention** view of cards untouched for two weeks.
- **Shorts from a long video** in the Script analyzer: candidate 25–58 second clips around the most replayed moments and the script's twists, and an AI plan for 3–5 Shorts (clip times, first-second hook, cuts, captions, loop ending). For other creators' videos it suggests your own take instead of a reupload.
- **Honest channel review (AI)** on My channel: built only on your analytics (totals, top videos, retention drop-offs with what you said there, traffic sources, followed channels), it lists every problem worst first with what, where, evidence, fix and the number to check. Reviews are saved with the data they used.
- **Your own notes on any video**: timestamped notes in the Script lab (with "+ note" on every transcript line) and an **Add note at 3:42** button in the panel on YouTube that uses the player's current time. Click a note's time to jump there; notes sync between both places, can be downloaded, and are backed up.
- **Archive for published videos**: 30 days after a video goes live it leaves the board for an Archive view with its final numbers (views, outlier score, 48-hour and 7-day results), search and sorting. Archive or restore by hand from the project page or the archive; the delay is set in Settings → Idea board.
- **Fuller backups**: followed channels now carry their last-known stats and uploads, plus your AI settings (without keys) and Google client ID. Restoring shows what the file holds first, then merges projects, followed channels (combining their growth history), the radar, keyword alerts and AI results item by item instead of skipping what you already have. Settings shows when you last backed up.
- **Following keeps working without quota**: if a channel can't be refreshed, its last-known numbers are shown with a note instead of an error.
- **Edit / Preview** switch on the project Outline and Shot list, so AI drafts read as formatted text and stay editable. The view you pick is remembered, and **Print** on the shot list prints the formatted version.

## [0.6.1] - 2026-10-13

### Added
- **Support the developer** link in the sidebar, popup and Settings, pointing to https://spiritpaper.github.io/#support.

## [0.6.0] - 2026-10-13

First public release.

### Added
- **Outlier scores on YouTube**: a badge on every thumbnail (views ÷ the channel's median, long-form and Shorts scored separately), a performance panel next to videos (stats, channel trend, "Most replayed" heatmap, transcript, follow, comments, video web) and a channel analysis.
- **Saved outliers** with a full stats snapshot, daily tracking history, notes, tags, AI breakdowns, CSV exports and outlier remix.
- **Keyword explorer**: rabbit holes from a broad keyword into sub-topics, with an opportunity score, small-channel hunt preset, keyword alerts and CSV export.
- **Video web**: a map of the videos YouTube suggests around any video, with hubs, topic clusters and AI ideas.
- **Following, Compare, Radar and Content gaps**: track channels you learn from or compete with, compare them with yours, get daily alerts for new outliers, and find topics competitors win with that you haven't covered.
- **Idea board**: your own videos from idea to published, each with a workspace for inspiration, titles, outline, script check, hook rewriter, re-hook planner, shot list, thumbnail mock-up and critique, and 30-day tracking after publishing.
- **Script analyzer, Hook library, Title lab and Audience questions**.
- **My channel** (optional Google sign-in): your retention curves, watch time and comparison with competitors.
- **Optional AI** with your own key: Gemini, OpenAI, Claude or OpenRouter.
- **Storage management**: usage, cleanup, automatic retention, backup and restore.
- Documentation in `docs/`.
