# How recommendations work

YouTube's recommendation system has two goals, in its own words: help each viewer find videos they want to watch, and "maximize long-term viewer satisfaction". It doesn't push videos because of their channel's size, upload schedule or tags. It shows a video to some people, watches how they respond, and shows it to more people if they respond well.

## What YouTube looks at

**YouTube says** (from its help pages on the recommendation system):

- **How the video performs when it's shown**: "whether they choose to click, watch, or positively engage". That's the click, the watch time and the reactions.
- **What each viewer has watched**: how long and how much of each video, plus likes, dislikes, shares, comments, "not interested", "don't recommend channel", and **survey responses**.
- **Interests**: the topics and formats a viewer likes, and patterns like "viewers of video A also watched video B".
- **Satisfaction surveys**: YouTube asks some viewers to rate videos they watched. It says this "helps the system understand satisfaction, not just watch time". In a 2021 Creator Insider Q&A, YouTube's VP of engineering Cristos Goodrow said: "After responsibility, the most important thing for the recommendation system is satisfaction."

What that means in practice: a click that ends in disappointment hurts you, because the viewer leaves early and is less likely to be shown your next video. A video people are glad they watched keeps getting shown.

## Where your views come from

Each place on YouTube works a little differently.

| Surface | How YouTube picks videos | What helps you there |
| --- | --- | --- |
| **Home** | "Primarily a personalized surface", based mostly on watch history. Most subscribers watch your new uploads from Home, not from the subscriptions feed (Rene Ritchie, YouTube). | A title and thumbnail that make people want to click, and a video that satisfies them. |
| **Suggested (Up Next)** | "The video you're currently watching" is the main signal. | Being a good next video for the videos your viewers already watch: related topics, series, end screens, playlists. |
| **Search** | Matches what people type. Search history also shapes future recommendations. | A title that uses the words people search for, and a video that answers the search. Search videos can keep getting views for years. |
| **Shorts feed** | Its own system, "personalized to reflect what we think you want to see next". | See [Shorts](shorts.md). |
| **Subscriptions and notifications** | Your subscribers, but they aren't guaranteed to see or be notified of every upload. | A small share of views on most channels. Growth comes mostly from Home and Suggested. |

On **My channel**, the traffic sources show which of these bring you views, and how that changed from the previous period. See [Why a video worked (or didn't)](../data/diagnose-a-video.md#traffic-sources-tell-you-where-it-worked).

## Every video gets its own chance

**YouTube says:** "The algorithm uses fresh performance data for each individual video, rather than relying on past results." Todd Beaupré: "If your last video wasn't so great and your next video is great, we want to realize the potential of each video." A single experiment that doesn't work "won't necessarily hinder your channel's potential".

There's a catch: YouTube also says that frequently posting videos that don't resonate "can, over time, affect your channel's overall performance". One flop is fine. A long run of videos your audience doesn't want isn't.

## What YouTube tells creators to do

From YouTube's help page on the recommendation system:

- **Know your audience.** Use the Audience tab in Analytics. (The [Audience lab](../guides/audience-lab.md) builds avatars from the same data, so you can test ideas on them.)
- **Quality over quantity.** "Prioritize consistent quality content over a high frequency of uploads." Breaks aren't penalized: "the algorithm doesn't penalize creators for doing so!" Tell your audience when you'll be away.
- **Be recognizable.** Consistent titles and thumbnails, so viewers know your videos at a glance.
- **Make series**, and use playlists, end screens and calls to action to lead viewers to the next video.
- **Keep experimenting** as your audience's interests change.

## In Outlier Lab

- **Outliers** show you what this system rewarded in your niche: videos that reached far beyond their channel's usual audience. See [Reading an outlier score](../data/outliers.md).
- **Video web** maps what YouTube suggests around a video, so you can see which videos are neighbours on Suggested. See the [guide](../guides/video-web.md).
- **Keyword explorer** shows what people search for, and how much competition each topic has. See the [guide](../guides/keyword-explorer.md).

## Sources

- YouTube Help, [YouTube's recommendation system](https://support.google.com/youtube/answer/16533387): goals, signals, "the algorithm follows the audience", breaks, each video judged on its own, advice for creators.
- YouTube Help, [How YouTube recommendations work](https://support.google.com/youtube/answer/16089387): signals, Home, Up Next, the Shorts feed, satisfaction surveys.
- YouTube Blog, [Rene's Top Five, 28 March 2024](https://blog.youtube/culture-and-trends/renes-top-five-on-youtube-march-28-2024-edition/): most subscribers watch from Home.
- Search Engine Journal, [YouTube algorithm myths debunked](https://www.searchenginejournal.com/youtube-algorithm-myths-debunked-insights-from-the-growth-team/510091/): Todd Beaupré on each video's potential.
- Tubefilter, [YouTube's VP of engineering answers recommendation FAQs](https://tubefilter.com/2021/09/15/youtube-creator-insider-recommendation-algorithm-faqs/) (2021): Cristos Goodrow on satisfaction.
