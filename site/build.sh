#!/bin/sh
# Gathers the docs website's source into one folder, for Jekyll to build:
#
#   site/build.sh _site_src      (from the repository root; the Pages workflow runs it)
#
# The Markdown files stay exactly as they are on GitHub. Each page gets its title and its
# place in the menu added on top here, and a few links are adjusted for the website.
set -eu

out="$1"
rm -rf "$out"
mkdir -p "$out/docs/guides" "$out/docs/reference" "$out/docs/development" "$out/docs/data" "$out/docs/youtube"
cp site/_config.yml "$out/"
cp -R site/_sass site/_includes site/images "$out/"

# page <source> <destination> <title> <menu position> [parent]
page() {
  {
    printf -- '---\ntitle: "%s"\nnav_order: %s\n' "$3" "$4"
    if [ -n "${5:-}" ]; then printf 'parent: "%s"\n' "$5"; fi
    printf -- '---\n{%% raw %%}\n' # scripts and prompts are full of {braces}: Liquid must leave them alone
    # a folder's README is its index page on the website; the code stays on GitHub
    sed -e 's#](\([^)]*\)README\.md#](\1index.md#g' \
      -e 's#](\([./]*\)site/images/#](\1images/#g' \
      -e 's#](\(src\|scripts\|companion\|test\)/#](https://github.com/spiritpaper/outlier-lab/tree/main/\1/#g' "$1"
    printf '\n{%% endraw %%}\n'
  } >"$out/$2"
}

page README.md                        index.md                          "Home"                         1
page docs/getting-started.md          docs/getting-started.md           "Getting started"              2

page site/sections/guides.md          docs/guides/index.md              "Guides"                       3
page docs/guides/finding-outliers.md  docs/guides/finding-outliers.md   "Finding outliers"             1 "Guides"
page docs/guides/keyword-explorer.md  docs/guides/keyword-explorer.md   "Keyword explorer"             2 "Guides"
page docs/guides/video-web.md         docs/guides/video-web.md          "Video web"                    3 "Guides"
page docs/guides/channels.md          docs/guides/channels.md           "Channels, Radar and gaps"     4 "Guides"
page docs/guides/idea-board.md        docs/guides/idea-board.md         "Idea board and projects"      5 "Guides"
page docs/guides/scripts-and-titles.md docs/guides/scripts-and-titles.md "Scripts, hooks and titles"  6 "Guides"
page docs/guides/audience-lab.md      docs/guides/audience-lab.md       "Audience lab"                 7 "Guides"
page docs/guides/lab-notebook.md      docs/guides/lab-notebook.md       "Lab notebook"                 8 "Guides"
page docs/guides/my-channel.md        docs/guides/my-channel.md         "My channel"                   9 "Guides"
page docs/guides/ai-assistant.md      docs/guides/ai-assistant.md       "AI assistant"                 10 "Guides"
page docs/guides/local-ai.md          docs/guides/local-ai.md           "Local AI"                     11 "Guides"
page docs/guides/data-and-storage.md  docs/guides/data-and-storage.md   "Data and storage"             12 "Guides"
page docs/guides/video-downloads.md   docs/guides/video-downloads.md    "Video downloads"              13 "Guides"

page docs/data/README.md               docs/data/index.md                "Reading your data"            4
page docs/data/outliers.md             docs/data/outliers.md             "Reading an outlier score"     1 "Reading your data"
page docs/data/diagnose-a-video.md     docs/data/diagnose-a-video.md     "Why a video worked (or didn't)" 2 "Reading your data"
page docs/data/retention.md            docs/data/retention.md            "Reading retention curves"     3 "Reading your data"
page docs/data/growth.md               docs/data/growth.md               "Is the channel growing?"      4 "Reading your data"

page docs/youtube/README.md            docs/youtube/index.md             "How YouTube works"            5
page docs/youtube/recommendations.md   docs/youtube/recommendations.md   "How recommendations work"     1 "How YouTube works"
page docs/youtube/packaging.md         docs/youtube/packaging.md         "Ideas, titles and thumbnails" 2 "How YouTube works"
page docs/youtube/hooks-and-retention.md docs/youtube/hooks-and-retention.md "Hooks and keeping viewers" 3 "How YouTube works"
page docs/youtube/shorts.md            docs/youtube/shorts.md            "Shorts"                       4 "How YouTube works"
page docs/youtube/myths.md             docs/youtube/myths.md             "Myths"                        5 "How YouTube works"

page site/sections/reference.md       docs/reference/index.md           "Reference"                    6
page docs/reference/metrics.md        docs/reference/metrics.md         "How the numbers are calculated" 1 "Reference"
page docs/reference/quota.md          docs/reference/quota.md           "API quota and caching"        2 "Reference"
page docs/reference/privacy.md        docs/reference/privacy.md         "Privacy"                      3 "Reference"
page docs/reference/troubleshooting.md docs/reference/troubleshooting.md "Troubleshooting"            4 "Reference"

page site/sections/development.md     docs/development/index.md         "For developers"               7
page docs/development/architecture.md docs/development/architecture.md  "Architecture"                 1 "For developers"
page docs/development/testing.md      docs/development/testing.md       "Testing and contributing"     2 "For developers"
page docs/development/releasing.md    docs/development/releasing.md     "Releasing"                    3 "For developers"

page CHANGELOG.md                     CHANGELOG.md                      "Changelog"                    8

echo "site source in $out"
