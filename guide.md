# Reference 1 — Complete Template Guide

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [File Tree](#2-file-tree)
3. [Boot Sequence & Data Flow](#3-boot-sequence--data-flow)
4. [Site Config (`site.json` / inline `<script type="application/json">`)](#4-site-config)
5. [Header Configuration](#5-header-configuration)
6. [Section Types & Full Data Schemas](#6-section-types--full-data-schemas)
7. [Media System (`sectionMedia()`)](#7-media-system)
8. [Text Formatting Syntax](#8-text-formatting-syntax)
9. [Available Social Icons (45 icons)](#9-available-social-icons)
10. [CV Functionality](#10-cv-functionality)
11. [Theme System](#11-theme-system)
12. [Header Scroll Behavior](#12-header-scroll-behavior)
13. [CSS Variables & Dark Mode](#13-css-variables--dark-mode)
14. [JavaScript Functions Reference](#14-javascript-functions-reference)

---

## 1. Architecture Overview

**Type:** Vanilla JS single-page application (no build tools, no framework)
**Data-driven:** All content comes from JSON files
**Rendering:** 5 built-in section renderers inject HTML into `<main id="app">`

### Key Design Decisions
- Site data is inlined as `<script id="siteData" type="application/json">` in `index.html` (primary) OR loaded from `data/site.json` (fallback)
- Section JSON files are preloaded via `fetch()` in a blocking inline script before deferred JS runs
- Each section JSON has a `"type"` field that maps to a renderer function in `renderers.js`
- All images are lazy-loaded (`loading="lazy"`) except the header profile image (`fetchpriority="high"`)

---

## 2. File Tree

```
Reference 1/
├── index.html                          # Shell: header, footer, theme toggle, CV button, inline site data
├── guide.md                            # This file
├── data/
│   ├── site.json                       # Master configuration (title, favicon, CV, header, sections list)
│   ├── about.json                      # Section: "about"
│   ├── education.json                  # Section: "education"
│   ├── publications.json               # Section: "publications"
│   ├── research.json                   # Section: "research"
│   ├── contact.json                    # Section: "contact"
│   └── examples.json                   # Demo section showing all features (type "about")
├── js/
│   ├── helpers.js                      # Theme toggle, scroll header, formatText, escapeHTML
│   ├── api.js                          # fetchJSON()
│   ├── renderers.js                    # 5 renderers + sectionMedia() + imgCard() + renderGallery() etc.
│   └── main.js                         # Boot sequence: loads site data, fetches sections, renders
├── pages/
│   └── cv.html                         # PDF.js viewer (renders PDF as canvas pages)
├── assets/
│   ├── cv.pdf                          # Sample CV PDF
│   ├── icons/
│   │   ├── academic social icons/      # 45 SVG social icons (see section 9)
│   │   └── system icons/               # dark_mode.svg, light_mode.svg
│   ├── images/
│   │   ├── logo.png                    # Favicon
│   │   ├── profile/
│   │   │   └── profile1x1.jpg          # Header profile photo
│   │   ├── about/                      # (empty, placeholder)
│   │   ├── connect/                    # (empty, placeholder)
│   │   ├── education/                  # (empty, placeholder)
│   │   ├── other/                      # 6 sample .webp images (1.webp - 6.webp)
│   │   ├── publications/              # (empty, placeholder)
│   │   └── research/                   # (empty, placeholder)
│   └── models/
│       └── model.glb                   # Sample 3D model
└── .git/
```

---

## 3. Boot Sequence & Data Flow

### Step-by-step execution:

1. **Inline blocking script** (index.html lines 4-9): Reads `localStorage.getItem('theme')`, sets `data-theme` attribute on `<html>` — prevents flash of wrong theme.

2. **Inline blocking script** (index.html lines 121-123):
   - Finds `<script id="siteData">` and parses JSON
   - Populates header (name, subtitle, institution, image)
   - Sets `<title>` from site data
   - **Preloads** each section file via `fetch()` into `window.__preloaded{}` — this starts fetching before deferred scripts load

3. **Deferred scripts** load in order:
   - `js/helpers.js` — defines global functions: `setTheme()`, `toggleTheme()`, `formatText()`, `escapeHTML()`, `nl2br()`, plus scroll listener and theme click listener
   - `js/api.js` — defines `fetchJSON()`
   - `js/renderers.js` — defines all renderer functions + media helpers
   - `js/main.js` — IIFE that runs `init()`

4. **`init()` in main.js:**
   - Calls `getSiteData()` — checks for inline `#siteData` first, falls back to `fetchJSON('data/site.json')`
   - Calls `setMeta(siteData)` — sets `<title>`, `<meta name="description">`, favicon
   - Sets `--hl-color` CSS variable if `siteData.highlight_color` exists
   - Calls `setHeader(siteData.header)` — populates name/subtitle/institution/image
   - Calls `initCV(siteData)` — configures the CV button
   - Iterates `siteData.sections`, fetches each (from `window.__preloaded` if available, else fresh fetch)
   - Each section JSON is passed to `renderers[sectionData.type]()`
   - HTML strings are joined and injected into `<main id="app">`
   - Footer visibility is set to `visible`

---

## 4. Site Config

Can be either:
- **Inline** in `index.html` inside `<script id="siteData" type="application/json">` (higher priority)
- **External** at `data/site.json` (fallback)

### Full schema:

```json
{
  "title": "Coffee Bean",
  "favicon": "assets/images/logo.png",
  "description": "SEO meta description text.",
  "cv": {
    "enabled": true,
    "path": "assets/cv.pdf",
    "viewer": "pages/cv.html",
    "mode": "view",
    "label": "View CV"
  },
  "highlight_color": "#ffff00",
  "header": {
    "name": "Coffee Bean",
    "subtitle": "PhD Candidate in Coffee Science",
    "institution": "Caffeine Tech",
    "image": "assets/images/profile/profile1x1.jpg",
    "image_alt": "Coffee Bean",
    "image_width": 70,
    "image_height": 70,
    "name_color": "#ff6600",
    "subtitle_color": "#888888"
  },
  "sections": [
    { "file": "data/about.json", "enabled": true },
    { "file": "data/education.json", "enabled": true },
    { "file": "data/publications.json", "enabled": true },
    { "file": "data/research.json", "enabled": true },
    { "file": "data/contact.json", "enabled": true }
  ]
}
```

### Field details:

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Browser tab title |
| `favicon` | string | No | Path to favicon PNG |
| `description` | string | No | Meta description for SEO |
| `cv` | object | No | CV button config |
| `cv.enabled` | boolean | Yes | Show/hide CV button |
| `cv.path` | string | If enabled | Path to PDF file |
| `cv.viewer` | string | If mode="view" | Path to viewer page (typically `pages/cv.html`) |
| `cv.mode` | string | If enabled | `"view"` (opens PDF.js viewer) or `"download"` (direct download) |
| `cv.label` | string | No | Button text (default: "CV") |
| `highlight_color` | string | No | CSS color for `==highlight==` markup (default `#ffff00`) |
| `header` | object | Yes | See header section below |
| `sections` | array | Yes | Ordered list of section references |

---

## 5. Header Configuration

```json
"header": {
  "name": "Coffee Bean",
  "subtitle": "PhD Candidate in Coffee Science",
  "institution": "Caffeine Tech",
  "image": "assets/images/profile/profile1x1.jpg",
  "image_alt": "Coffee Bean",
  "image_width": 70,
  "image_height": 70,
  "name_color": "#ff6600",
  "subtitle_color": "#888888"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Large heading (h1) |
| `subtitle` | string | No | Smaller line below name (h2) |
| `institution` | string | No | Institution line (small, muted) |
| `image` | string | No | Path to square profile photo |
| `image_alt` | string | No | Alt text for profile image |
| `image_width` | number | No | Width in px (default: natural) |
| `image_height` | number | No | Height in px (default: natural) |
| `name_color` | string | No | CSS color for name text |
| `subtitle_color` | string | No | CSS color for subtitle text |

**Layout:** CSS Grid with two columns: `1fr 70px`, gap 30px. Profile image on the right, text on the left, aligned to bottom (`align-items: flex-end`).

**Note:** `name_color` and `subtitle_color` are supported in `main.js` `setHeader()` but NOT documented in the sample `site.json`. They exist in the `main.js:11-14` if-check logic.

---

## 6. Section Types & Full Data Schemas

### 6.1 "about"

**Renderer:** `renderers.about`

```json
{
  "type": "about",
  "data": {
    "label": "ABOUT",
    "label_color": "#ff6600",
    "paragraphs": [
      "First paragraph with **bold** and {link text|url}.",
      "Second paragraph."
    ],
    "buttons": [
      {
        "label": "View Guide",
        "url": "https://example.com",
        "style": "primary",
        "align": "left"
      }
    ],
    "image": "path/to/image.jpg",
    "image_alt": "Alt text",
    "caption": "Caption below image",
    "credit": "Credit overlay",
    "w": 800,
    "h": 400,
    "ar": true,
    "embed": { ... },
    "video": { ... },
    "model": { ... },
    "images": [ ... ],
    "gallery": { ... },
    "image_groups": [ ... ]
  }
}
```

| Field | Type | Description |
|---|---|---|
| `label` | string | Section heading (shown uppercase via CSS) |
| `label_color` | string | Optional CSS color for the label |
| `paragraphs` | array of strings | Body paragraphs with formatText markup |
| `buttons` | array of objects | See renderButtons() below |
| `image` | string or object | Single image (see imgCard) |

Note: `paragraphs` content does NOT go through `escapeHTML` — it goes directly through `formatText()`. This means raw HTML-like content could be injected. Content authors must be trusted.

---

### 6.2 "education"

**Renderer:** `renderers.education`

```json
{
  "type": "education",
  "data": {
    "label": "EDUCATION",
    "items": [
      {
        "degree": "PhD Candidate in Coffee Science",
        "institution": "Department of Coffee Science, Caffeine Tech",
        "year": "2022 — Present",
        "description": "Dissertation on how temperature, water pressure, and grind size affect taste and strength."
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `degree` | string | Yes | Degree name (bold) |
| `institution` | string | No | School/uni name |
| `year` | string | No | Year or date range |
| `description` | string | No | Details paragraph |

**Rendering:** If both `institution` and `year` exist, they're joined with ` — `. `degree`, `institution`, `year`, and `description` all go through `escapeHTML()` first, then `formatText()`.

---

### 6.3 "publications"

**Renderer:** `renderers.publications`

```json
{
  "type": "publications",
  "data": {
    "label": "PUBLICATIONS",
    "numbered": true,
    "papers": [
      {
        "title": "Paper Title",
        "authors": "Author1, A. & Author2, B.",
        "url": "https://doi.org/...",
        "meta": "Journal Name, 2024",
        "text": "Additional paragraph about this paper.",
        "image": "path/to/thumbnail.jpg",
        "image_alt": "Figure 1",
        "caption": "Paper figure caption",
        "credit": "Author Name"
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `numbered` | boolean | No | If `true`, prepends "1.", "2.", etc. before each entry |
| `papers` | array | Yes | List of papers |
| `title` | string | Yes | Paper title (linked via `url`) |
| `authors` | string | No | Author list (shown in muted color) |
| `url` | string | Yes | Link URL for the title |
| `meta` | string | No | Journal/year info (italic, muted) |
| `text` | string | No | Extra paragraph below the paper entry |
| `image` | string | No | Thumbnail image path |
| `image_alt` | string | No | Alt text for thumbnail |
| `caption` | string | No | Caption for thumbnail |
| `credit` | string | No | Credit overlay for thumbnail |

**Rendering structure per paper:**
```
[number.] Title (linked) + authors + meta
[optional: extra text paragraph]
[optional: thumbnail image with caption/credit]
[24px spacer between papers]
```

---

### 6.4 "research"

**Renderer:** `renderers.research`

Three possible content formats (checked in order):

```json
{
  "type": "research",
  "data": {
    "label": "RESEARCH",
    "paragraphs": [
      "**Primary:** Field One, Field Two",
      "**Secondary:** Field Three"
    ],
    "model": {
      "src": "assets/models/model.glb",
      "ratio": "1/1",
      "rotate": true,
      "caption": "Drag to interact"
    }
  }
}
```

Alternative formats for `data`:

| Format | Code path | Example |
|---|---|---|
| `paragraphs[]` | Each item → `<p>` via `formatText()` | `["Line 1", "Line 2"]` |
| `texts[]` | Each item → `<p>` via `formatText()` | Same as paragraphs |
| `items[]` | Each `{label, value}` → `<li>` via `escapeHTML` + `formatText` | `[{"label":"Primary","value":"Macro"}]` |

Only the **first** matching format is used (priority: `paragraphs` > `texts` > `items`).

Accepts the same media fields as other sections (`model`, `embed`, `video`, `images`, `gallery`, `image_groups`, `buttons`).

---

### 6.5 "contact"

**Renderer:** `renderers.contact`

```json
{
  "type": "contact",
  "data": {
    "label": "CONNECT",
    "text": "Let's connect!",
    "address": "Department of Economics, King's College London",
    "extra_line": "Office 3.12, Bush House",
    "icons": [
      { "name": "googlescholar-old", "url": "https://scholar.google.com/", "label": "Google Scholar" },
      { "name": "orcid", "url": "https://orcid.org/", "label": "ORCID" },
      { "name": "github", "url": "https://github.com/", "label": "GitHub" },
      { "name": "linkedin", "url": "https://linkedin.com/", "label": "LinkedIn" },
      { "name": "mail", "url": "mailto:email@example.com", "label": "Email" }
    ]
  }
}
```

| Field | Type | Description |
|---|---|---|
| `label` | string | Section heading |
| `text` | string | Intro text paragraph |
| `address` | string | Address line (muted, small) |
| `extra_line` | string | Extra line (muted, small) |
| `icons` | array | Social link icons |

Each icon entry:
| Field | Type | Description |
|---|---|---|
| `name` | string | SVG filename (without `.svg`) from `assets/icons/academic social icons/` |
| `url` | string | Link target |
| `label` | string | Tooltip text and alt attribute |

Icons are rendered as 24x24 `<img>` tags with `opacity: 0.7`, scale-up hover effect.

Accepts all media fields too.

---

## 7. Media System

### 7.1 Entry Points

Media can appear in **every section type**. The function `sectionMedia(d)` is called at the bottom of each renderer. It checks these fields in order:

1. **Inline single media** (top-level section data fields):
   - `d.embed` / `d.embed_html` → `renderEmbed(d)`
   - `d.video` → `renderVideo(d)`
   - `d.model` → `renderModel(d)`
   - `d.buttons[]` → `renderButtons(d)`

2. **`d.groups` or `d.image_groups`** (array of group items) — each group can be:

#### 7.1.1 Gallery (Grid)

```json
{
  "label": "Grid Gallery",
  "gallery": {
    "layout": "grid",
    "ratio": "3x2",
    "cols": 3
  },
  "images": [
    { "src": "path.jpg", "alt": "desc", "caption": "Caption", "credit": "Credit" }
  ]
}
```

No `type` field — detected by presence of `images` + `gallery`.

| Gallery field | Type | Default | Description |
|---|---|---|---|
| `layout` | string | `"grid"` | `"grid"` or `"masonry"` |
| `ratio` | string | none | Aspect ratio like `"3x2"`, `"1x1"`, `"16x9"` |
| `cols` | number | `3` | Number of columns |

Per-image fields:
| Field | Type | Description |
|---|---|---|
| `src` | string | Image path/URL |
| `alt` | string | Alt text |
| `caption` | string | Shown below image (small, muted) |
| `credit` | string | Overlay badge top-right (black bg, white text) |

#### 7.1.2 Gallery (Masonry)

```json
{
  "label": "Masonry Gallery",
  "gallery": {
    "layout": "masonry",
    "cols": 3
  },
  "images": [ ... ]
}
```
Uses CSS `columns` layout. Images may have different heights. No ratio enforced.

#### 7.1.3 Video (type: "video")

```json
{
  "label": "My Video",
  "type": "video",
  "src": "https://youtu.be/dQw4w9WgXcQ",
  "ratio": "16/9",
  "caption": "Video description"
}
```

URL patterns automatically detected and converted:
- `youtube.com/watch?v=ID` → `youtube.com/embed/ID`
- `youtu.be/ID` → `youtube.com/embed/ID`
- `vimeo.com/NUMBER` → `player.vimeo.com/video/NUMBER`

Ratio format: `"16/9"` or `"16x9"` (both accepted via `toCSSRatio()`).

#### 7.1.4 Embed (type: "embed")

```json
{
  "label": "Google Map",
  "type": "embed",
  "src": "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "ratio": "16/9",
  "caption": "Embed description"
}
```

Direct iframe URL — no URL transformation. Useful for Google Maps, Drive previews, etc.

#### 7.1.5 3D Model (type: "model" or "3d")

```json
{
  "label": "3D Model",
  "type": "model",
  "src": "https://example.com/model.glb",
  "ratio": "1/1",
  "caption": "Drag to rotate",
  "rotate": true
}
```

Uses `<model-viewer>` Web Component (v4.1.0 from Google CDN). Loaded on first use via dynamic `<script>` injection.

| Field | Type | Default | Description |
|---|---|---|---|
| `src` | string | required | URL to `.glb` file |
| `ratio` | string | `"1/1"` | Aspect ratio |
| `rotate` | boolean | `true` | Auto-rotate the model |
| `caption` | string | none | Text below viewer |

#### 7.1.6 Button (type: "button")

```json
{
  "type": "button",
  "label": "Download Paper",
  "url": "#",
  "btn_style": "primary",
  "align": "center"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `label` | string | "Button" | Button text |
| `url` | string | "#" | Link target (opens in new tab) |
| `btn_style` | string | `"primary"` | `"primary"` = filled black, `"outline"` = bordered |
| `align` | string | `"center"` | `"left"` or `"center"` |

---

### 7.2 Top-level single media fields (not inside `image_groups`)

These are checked by `sectionMedia()` before `image_groups`:

#### `d.embed`
```json
"embed": {
  "src": "https://...",
  "type": "video" | "map",
  "ratio": "16/9",
  "height": "350px",
  "caption": "...",
  "scale": 0.8,
  "scaleWidth": 800
}
```
The `scale` field creates a scaled-down iframe with negative margin-bottom. Used for showing smaller previews of embeds.

Alternatively, `d.embed` can be a plain string URL.

#### `d.embed_html`
Raw HTML string injected directly. No iframe wrapping.

#### `d.video`
```json
"video": {
  "src": "https://youtu.be/...",
  "ratio": "16/9",
  "caption": "..."
}
```
OR `"video": "https://youtu.be/..."` (string shorthand).

#### `d.model`
```json
"model": {
  "src": "assets/models/model.glb",
  "ratio": "1/1",
  "rotate": true,
  "caption": "..."
}
```
OR `"model": "path/to/model.glb"` (string shorthand).

#### `d.buttons[]`
```json
"buttons": [
  { "label": "View Guide", "url": "#", "style": "primary", "align": "left" }
]
```

| Field | Type | Default | Description |
|---|---|---|---|
| `label` | string | "Button" | Button text |
| `url` | string | "#" | Link URL |
| `style` | string | `"primary"` | `"primary"` or `"outline"` |
| `align` | string | `"center"` | `"left"` or `"center"` |

#### `d.images[]` + `d.gallery`
If `d.images` exists (as a flat array) but `d.image_groups` does not, it's rendered as a gallery using `d.gallery` config (or defaults to grid, 3 cols, no ratio).

#### `d.image` (single image)
```json
"image": {
  "src": "path.jpg",
  "alt": "Alt",
  "caption": "Caption below",
  "credit": "Credit overlay",
  "w": 600,
  "h": 400,
  "ar": true
}
```
OR `"image": "path.jpg"` (string shorthand, uses defaults 600x400).

---

### 7.3 `imgCard()` rendering details

Each image card is a CSS grid with two areas: `img` (stacked) and `cap` (caption).

- The image and credit overlay share `grid-area: stack` — credit overlays top-right
- If `item.ar` is true, aspect-ratio CSS is applied as `w/h`
- Width defaults: 600px (single), 400px (gallery)
- Height defaults: 400px (single), 300px (gallery)

### 7.4 Processing order in `sectionMedia()`

```js
html = renderEmbed(d) + renderVideo(d) + renderModel(d) + renderButtons(d)

if (groups exist) {
  for each group:
    if type="video"   → render video iframe
    if type="button"  → render button link
    if type="model|3d" → render model-viewer
    if type="embed"   → render iframe
    if group.embed    → render iframe (legacy path)
    if group.images   → render label + renderGallery()
} else if (d.images) {
    renderGallery(d.gallery, d.images)
} else if (d.image) {
    render imgCard (single)
}
```

---

## 8. Text Formatting Syntax

Defined in `helpers.js:formatText()`. Processing order (priority matters):

| Syntax | Output | Order |
|---|---|---|
| `\\X` | `X` (literal escape) | 1st (placeholder substitution, restored last) |
| `` `code` `` | `<code>code</code>` | 2nd |
| `++underline++` | `<u>underline</u>` | 3rd |
| `~~strikethrough~~` | `<del>strikethrough</del>` | 4th |
| `==highlight==` | `<mark class="hl">highlight</mark>` | 5th (color from `--hl-color`) |
| `***bold+italic***` | `<strong><em>bold+italic</em></strong>` | 6th |
| `**bold**` | `<strong>bold</strong>` | 7th |
| `*italic*` | `<em>italic</em>` | 8th |
| `^superscript^` | `<sup>superscript</sup>` | 9th |
| `~subscript~` | `<sub>subscript</sub>` | 10th |
| `{text\|url}` | `<a href="url"><strong>text</strong></a>` | 11th |
| `\n` | `<br>` | 12th |

**Important notes:**
- `paragraphs` content in "about" renderer does NOT go through `escapeHTML()` — it goes directly to `formatText()`. This means you can use raw `{text|url}` links etc. directly.
- In "education", "publications", "research", "contact" renderers, text content goes through `escapeHTML()` first, then `formatText()`. This means HTML entities like `&amp;` will display literally, and you must use the `{text|url}` syntax for links instead of raw HTML.
- Exception: `item.description` in education DOES go through `escapeHTML()` first.
- Exception: `papers[].text` and `papers[].meta` in publications DO go through `escapeHTML()` first.

**Summary of which fields get escapeHTML + formatText vs formatText only:**

| Section | Field | Processing |
|---|---|---|
| about | `paragraphs[]` | `formatText()` only (no escape) |
| about | `buttons[].label` | `escapeHTML()` then wrapped in `<a>` |
| education | `degree`, `institution`, `year`, `description` | `escapeHTML()` then `formatText()` |
| publications | `title`, `authors`, `meta`, `text` | `escapeHTML()` then `formatText()` |
| research | `paragraphs[]`, `texts[]` | `formatText()` only (no escape) |
| research | `items[].label`, `items[].value` | `escapeHTML()` then `formatText()` |
| contact | `text`, `address`, `extra_line` | `escapeHTML()` then `formatText()` |
| contact | `icons[].label` | `escapeHTML()` only |
| All | `label` | `escapeHTML()` only |
| All | `image.*`, `caption`, `credit` | `escapeHTML()` only |

---

## 9. Available Social Icons

Located in `assets/icons/academic social icons/`. 45 SVG files:

| Filename (without .svg) | Purpose |
|---|---|
| `academia` | Academia.edu |
| `acm` | ACM |
| `artstation` | ArtStation |
| `arxiv` | arXiv |
| `behance` | Behance |
| `bluesky` | Bluesky |
| `dribbble` | Dribbble |
| `facebook` | Facebook |
| `figshare` | figshare |
| `github` | GitHub |
| `githubpages` | GitHub Pages |
| `gitlab` | GitLab |
| `globe` | General website |
| `googlescholar-new` | Google Scholar (newer logo) |
| `googlescholar-old` | Google Scholar (older logo) |
| `graduation-cap` | Graduation cap |
| `hal` | HAL (open archive) |
| `ieee` | IEEE |
| `instagram` | Instagram |
| `internetarchive` | Internet Archive |
| `linkedin` | LinkedIn |
| `mail` | Email |
| `mastodon` | Mastodon |
| `medium` | Medium |
| `orcid` | ORCID |
| `osf` | OSF |
| `pinterest` | Pinterest |
| `profile-female1` | Female profile 1 |
| `profile-female2` | Female profile 2 |
| `profile-male1` | Male profile 1 |
| `profile-male2` | Male profile 2 |
| `publons` | Publons |
| `pubmed` | PubMed |
| `reddit` | Reddit |
| `refinedgithub` | Refined GitHub |
| `researchgate` | ResearchGate |
| `scopus` | Scopus |
| `semanticscholar` | Semantic Scholar |
| `substack` | Substack |
| `university` | University/Institution |
| `web-of-science` | Web of Science |
| `whatsapp` | WhatsApp |
| `x` | X/Twitter |
| `youtube` | YouTube |
| `zenodo` | Zenodo |

System icons (in `assets/icons/system icons/`):
| Filename | Purpose |
|---|---|
| `dark_mode.svg` | Moon icon for dark mode toggle |
| `light_mode.svg` | Sun icon for light mode toggle |

---

## 10. CV Functionality

Controlled by `cv` object in `site.json`:

### "view" mode (default)
```json
"cv": { "enabled": true, "path": "assets/cv.pdf", "viewer": "pages/cv.html", "mode": "view", "label": "View CV" }
```
- Opens `pages/cv.html?url=../assets/cv.pdf` in a new tab
- The `?url=` parameter tells the PDF viewer which PDF to load
- The path is encoded with `encodeURIComponent()` and prepended with `../`

### "download" mode
```json
"cv": { "enabled": true, "path": "assets/cv.pdf", "mode": "download", "label": "Download CV" }
```
- Creates a temporary `<a>` element, clicks it to trigger download, removes it

### Disabled
```json
"cv": { "enabled": false }
```
- The CV button element gets `display: none`

### CV Viewer Page (`pages/cv.html`)

A standalone PDF.js viewer:
- Renders PDF pages as `<canvas>` elements with devicePixelRatio scaling
- Toolbar: "Back" link (to `../`), page count, "Download" button
- Dark mode support with `filter: grayscale(100%) brightness(0.85)` on pages
- Uses PDF.js v3.11.174 from CDN
- Scale factor: 1.3

---

## 11. Theme System

### Initialization
- Inline script sets `data-theme` on `<html>` from `localStorage` before any rendering
- Default: `"light"`

### Toggle
- Button with `[data-toggle-theme]` attribute (bottom-right corner)
- Click event delegated on `document` in `helpers.js`
- Toggles between `"light"` and `"dark"`
- Persisted to `localStorage.theme`

### Visual
- Dark mode button: white background + black icon
- Light mode button: black background + white icon
- Icons alternate visibility via CSS: `[data-theme="dark"] .theme-icon-dark { display: none }` / `[data-theme="light"] .theme-icon-light { display: none }`
- CSS custom properties change, causing smooth recoloring

---

## 12. Header Scroll Behavior

Defined in `helpers.js`:
- Tracks `lastScroll` position
- On scroll, calculates `delta = currentScroll - lastScroll`
- If `|delta| >= 5px`:
  - Scrolling **down** (`delta > 0`): `transform: translateY(-100%)` (hides header)
  - Scrolling **up** (`delta < 0`): `transform: translateY(0)` (shows header)
- Uses `transition: transform .3s ease`
- Listener is `{ passive: true }` for performance

---

## 13. CSS Variables & Dark Mode

### Light mode (`:root` or `[data-theme="light"]`)
```css
--bg: #ffffff;
--text: #111111;
--text-muted: #666666;
--border: #000000;
--section-border: #eaeaea;
--header-h: 220px;
--hl-color: #ffff00;
```

### Dark mode (`[data-theme="dark"]`)
```css
--bg: #0a0a0a;
--text: #f0f0f0;
--text-muted: #a3a3a3;
--border: #555555;
--section-border: #2a2a2a;
```

### Dark mode image adjustments
- Profile image: `filter: grayscale(100%) contrast(1.1); opacity: 0.9`
- Section `<a>` images: `filter: brightness(0) invert(1)` (icon inversion)
- `.section-media img`, lazy-loaded images: `filter: grayscale(100%)`

### Layout
- Container: `max-width: 650px`, centered (`margin: 0 auto`)
- Header: CSS Grid fixed positioning, same max-width, z-index: 999
- Spacer div: `height: var(--header-h)` (220px desktop, 250px on mobile <640px)
- Section spacing: `padding-bottom: 30px; margin-bottom: 30px; border-bottom: 1px solid var(--section-border)`
- Footer min-height: 120px, starts `visibility: hidden`, set to `visible` after all sections render

---

## 14. JavaScript Functions Reference

### `helpers.js`

| Function | Parameters | Description |
|---|---|---|
| `setTheme(theme)` | `"light"` or `"dark"` | Sets `data-theme` attribute + localStorage |
| `toggleTheme()` | none | Flips current theme |
| `formatText(str)` | string | Converts markup syntax to HTML (see section 8) |
| `escapeHTML(str)` | string | HTML-entity-encodes `&<>"'` |
| `nl2br(str)` | string | Converts `\n` to `<br>` |

### `api.js`

| Function | Parameters | Description |
|---|---|---|
| `fetchJSON(path)` | string (URL) | Fetches and parses JSON, returns Promise |

### `renderers.js`

| Function | Parameters | Description |
|---|---|---|
| `labelStyle(d)` | data object | Returns `style="color:..."` if `d.label_color` exists |
| `imgCard(item, single)` | item obj, boolean | Returns HTML for one image card |
| `toCSSRatio(r)` | string like `"3x2"` | Converts to `"3/2"` |
| `parseRatio(r)` | string like `"3x2"` | Returns `{w:3, h:2}` object |
| `renderGallery(gl, items)` | gallery config, image array | Returns grid or masonry gallery HTML |
| `renderEmbed(d)` | data object | Returns iframe HTML from `d.embed` / `d.embed_html` |
| `renderButtons(d)` | data object | Returns button link HTML from `d.buttons` |
| `renderVideo(d)` | data object | Returns video iframe HTML from `d.video` |
| `renderModel(d)` | data object | Returns model-viewer HTML from `d.model` |
| `sectionMedia(d)` | data object | Master function: assembles all media sections |

### Renderers (stored in `renderers{}` object)

| Renderer | Expects `data.type` | Key data fields |
|---|---|---|
| `renderers.about` | `"about"` | `paragraphs`, `buttons`, `image`, `image_groups` |
| `renderers.education` | `"education"` | `items[]` (degree, institution, year, description) |
| `renderers.publications` | `"publications"` | `numbered`, `papers[]` (title, authors, url, meta) |
| `renderers.research` | `"research"` | `paragraphs` / `texts` / `items`, `model` |
| `renderers.contact` | `"contact"` | `text`, `address`, `extra_line`, `icons[]` |

### `main.js`

| Function | Description |
|---|---|
| `setHeader(header)` | Populates name, subtitle, institution, image, colors |
| `setMeta(siteData)` | Sets title, meta description, favicon |
| `initCV(siteData)` | Configures CV button (view/download/disabled) |
| `getSiteData()` | Returns Promise resolving to site config (inline or fetch) |
| `init()` | Boot function: loads data, renders all sections |

### Window globals exposed:

```js
// helpers.js
window.setTheme
window.toggleTheme
window.formatText
window.escapeHTML
window.nl2br

// api.js
window.fetchJSON

// renderers.js
window.renderers       // { about, education, publications, research, contact }
window.imgCard
window.renderGallery
window.renderEmbed
window.renderButtons
window.renderVideo
window.renderModel
window.sectionMedia

// main.js
window.__preloaded     // { "data/about.json": Promise<json>, ... }
```

---

## Quick Reference: Adding a New Section

1. Create a JSON file in `data/` (e.g., `data/teaching.json`)
2. Add `{ "file": "data/teaching.json", "enabled": true }` to `sections[]` in site config
3. The JSON must have a `"type"` field matching one of the 5 renderers
4. Or add a new renderer in `renderers.js`: `renderers.teaching = function(data) { ... }`
5. Reorder `sections[]` to control display order; set `"enabled": false` to hide without deleting
