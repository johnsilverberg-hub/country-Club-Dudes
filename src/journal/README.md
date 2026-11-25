# The Journal

Each article is one Markdown file in this folder. The file name becomes the address:
`best-55-plus-clubs-boca.md` → `countryclubdudes.com/journal/best-55-plus-clubs-boca/`.
Use lowercase words and hyphens.

Adding a file is all it takes: the build adds the article page, the Journal listing, the sitemap
entry, share previews and Google's article markup. Nothing to install.

## Template

```
---
title: Boca West vs. St. Andrews: which club fits you?
description: One or two sentences for Google results and share previews (about 150 characters).
date: 2026-12-01
author: Shawn Miller
topic: Club comparisons
image: journal/boca-west-vs-st-andrews.jpg
clubs: boca-west, st-andrews
---

Intro paragraph.

## A section heading

Paragraph text with **bold**, *italic* and [a link](/clubs/boca-west/).

- A bullet
- Another bullet
```

## Fields

| Field | Required | Notes |
|---|---|---|
| `title` | yes | The headline. Aim for under 65 characters so Google shows it in full. |
| `description` | yes | The summary under the headline and in Google results. |
| `date` | yes | `YYYY-MM-DD`. Newest articles show first. A post without a date isn't published. |
| `author` | no | Defaults to "The Country Club Dudes". |
| `topic` | no | Groups articles for the topic filter, e.g. Buying guide, Club comparisons, Costs & dues, 55+, Communities without a club. Defaults to "Buying guide". |
| `image` | no | A landscape photo saved in `src/images/journal/` (2000px wide, about 300 KB). Used at the top of the article, on its card and in share previews. |
| `clubs` | no | Club or community slugs (comma-separated). They appear as cards at the end of the article. |
| `draft` | no | `true` keeps the article off the site until you're ready. |

## Writing for search

- One clear topic per article, phrased the way people search ("Boca West membership cost", "55+ communities in Delray Beach").
- Put the main phrase in the title, the description and the first paragraph.
- Use `##` headings for each main section (three or more add a table of contents automatically).
- Link to the club and community pages you mention (`/clubs/<slug>/`, `/communities/<slug>/`) and list them in `clubs`.
- Only publish facts you've confirmed. Fees and membership terms change, so say when they were verified.

The home page shows a "From the Journal" row once there are three or more articles.
