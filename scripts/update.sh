#!/bin/sh
# Updates an unpacked Outlier Lab install to the latest GitHub release.
#   sh scripts/update.sh /path/to/your/outlier-lab-folder   (or `sh scripts/update.sh .` inside it)
# Downloads the release zip only when it's newer than the folder's version,
# then replaces the folder's files. Your data lives in Chrome, not in the
# folder, so it stays. The extension reloads itself within a few minutes,
# once no Outlier Lab page is open (or click reload in chrome://extensions).
set -eu
dir="${1:?usage: sh scripts/update.sh /path/to/extension-folder}"
[ -f "$dir/manifest.json" ] || { echo "No manifest.json in $dir: is that the extension folder?" >&2; exit 1; }
grep -qE '"name": *"(Outlier Lab|YT Toolkit)"' "$dir/manifest.json" || { echo "$dir doesn't hold Outlier Lab; nothing changed." >&2; exit 1; }
api="https://api.github.com/repos/spiritpaper/outlier-lab/releases/latest"
json=$(curl -fsSL "$api")
latest=$(printf '%s' "$json" | sed -n 's/.*"tag_name": *"v\{0,1\}\([^"]*\)".*/\1/p' | head -1)
# The extension zip (outlier-lab-v…, or youtube-toolkit-v… before the rename), not a companion archive.
url=$(printf '%s' "$json" | grep -oE '"browser_download_url": *"[^"]*/(outlier-lab|youtube-toolkit)-v[^"/]*\.zip"' | head -1 | sed 's/.*"\(http[^"]*\)"$/\1/')
current=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$dir/manifest.json" | head -1)
[ -n "$latest" ] && [ -n "$url" ] || { echo "Couldn't read the latest release from GitHub." >&2; exit 1; }
newer=$(printf '%s\n%s\n' "$current" "$latest" | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1)
if [ "$newer" = "$current" ]; then echo "Up to date ($current)."; exit 0; fi
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
curl -fsSL -o "$tmp/release.zip" "$url"
mkdir "$tmp/new"
unzip -q "$tmp/release.zip" -d "$tmp/new"
[ -f "$tmp/new/manifest.json" ] && [ -f "$tmp/new/src/background/index.js" ] || { echo "The download doesn't look like the extension; nothing changed." >&2; exit 1; }
# Copy the new files over the old ones, never emptying the folder, and the
# manifest last: the extension reloads itself when the manifest changes, so
# it must only see it once every other file is in place.
mv "$tmp/new/manifest.json" "$tmp/manifest.json"
cp -R "$tmp/new/." "$dir/"
# Then remove the files the new version no longer has.
(cd "$dir" && find . -type f ! -path './.git/*' ! -name manifest.json) | while IFS= read -r f; do
  [ -e "$tmp/new/$f" ] || rm -f "$dir/$f"
done
find "$dir" -mindepth 1 -type d -empty ! -path "$dir/.git*" -delete 2>/dev/null || true
# Written next to it and renamed over it, so Chrome never finds a half-written
# manifest: one it can't read at startup leaves the extension out of the list.
cp "$tmp/manifest.json" "$dir/manifest.json.new"
mv -f "$dir/manifest.json.new" "$dir/manifest.json"
echo "Updated $current -> $latest. The extension reloads itself shortly."
