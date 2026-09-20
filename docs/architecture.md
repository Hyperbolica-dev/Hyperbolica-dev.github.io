# Architecture

## Phase 0 decisions

Hyperbolica is a static personal blog. Astro provides the build system and Starlight provides the documentation-oriented shell: responsive navigation, article table of contents, light/dark mode, and a Pagefind search integration.

The repository deliberately has no database, online CMS, or runtime backend. Markdown and MDX files are the source of truth and are built into static files for GitHub Pages.

## Directory layout

```text
.
├── .github/workflows/deploy.yml   # GitHub Pages build and deployment
├── docs/architecture.md           # Project decisions and boundaries
├── public/                        # Static files served as-is
├── src/
│   ├── content/i18n/en.json    # Starlight English UI translation collection
│   ├── content/docs/              # Markdown/MDX pages and articles
│   │   ├── 404.md
│   │   ├── cognition/
│   │   ├── systems/
│   │   ├── science/
│   │   └── frontier/
│   ├── styles/site.css            # Site tokens and layout hooks
│   └── content.config.ts          # Starlight content collection
├── astro.config.mjs               # Astro, Starlight, KaTeX, and Pagefind config
└── package.json                   # Local development and build commands
```

## Content and categories

The four top-level categories are fixed as `cognition`, `systems`, `science`, and `frontier`. Category entry pages already exist so future articles can be added without changing the navigation model. The Phase 0 article is a pipeline placeholder, not real blog content.

Starlight’s optional `i18n` collection is declared explicitly with an empty English override file so the default UI translations remain available without a missing-collection warning. The `404.md` document provides the GitHub Pages fallback page; Starlight’s injected 404 route is disabled to avoid a route conflict with that document.

## Layout

Starlight supplies the desktop shell: left navigation, central content, and a right table of contents. Its responsive breakpoint changes the page to a single-column mobile layout and exposes the navigation through the mobile menu.

`src/styles/site.css` defines `--blog-sidebar-width` as the width contract for future sidebar collapse and drag-resize behavior. Future interaction code should update this token rather than hard-coding a second width value. The Phase 0 shell keeps Starlight's built-in mobile navigation behavior.

## Search and language

Pagefind is enabled through Starlight and is generated during the production build. The content pipeline remains compatible with Chinese and English text; future content should keep titles, descriptions, and article prose in the language intended for search. Pagefind assets stay generated under `dist/` and are not committed.

## Mathematics

`remark-math` parses LaTeX syntax and `rehype-katex` renders it during the Astro build. `src/styles/site.css` imports KaTeX's stylesheet and is loaded through Starlight's `customCss` configuration. A future article can use inline or display math without introducing a runtime service.

## Theme

Starlight's built-in theme selector provides day/night mode. The initial accent colors and the future theme-color switch contract live in `src/styles/site.css`, so later color choices do not need to be spread across pages or articles.

## Deployment

The repository is named `Hyperbolica-dev.github.io`, so it is configured as a root GitHub Pages site with `site: https://hyperbolica-dev.github.io` and no sub-path base. The workflow runs `npm ci`, builds `dist/`, uploads the artifact, and deploys it through GitHub Pages.
