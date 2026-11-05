# Architecture

Hyperbolic Space is a static Astro and Starlight blog deployed at the root GitHub Pages URL. Starlight renders public articles, supplies its own translations, and builds the Pagefind index; custom components own the visible navigation shell, theme controls, inline search, and right rail. The repository has no database or runtime content service.

## Ownership

- `src/lib/site.ts` owns the site title, URL, GitHub profile, author name, and avatar path. `astro.config.mjs` and the visible shell read these values.
- `src/lib/taxonomy.ts` owns the stable category IDs, icons, and English and Chinese labels and descriptions. The sidebar, homepage cards, category routes, article metadata, and content schema use it.
- `src/lib/locale.ts` owns short custom interface strings and locale URL handling. Starlight's own strings use its built-in translations and `src/content/i18n/` for supported overrides.
- `src/content/docs/` owns homepage prose, About pages, and exported public articles. Page copy stays with the page. The article schema lives in `src/content.config.ts`.
- Both About pages preserve the author's Chinese verse as a left-aligned Markdown blockquote using Starlight's native content styling.
- `src/lib/content.ts` owns article discovery, sorting, tags, and navigation data. `src/lib/tags.ts` owns tag normalization for both schema validation and lookups.
- `src/components/` owns the custom header, sidebar, article widgets, and controls. `src/components/overrides/` contains Starlight integration points. `src/styles/site.css` owns site tokens and cross-component layout rules.
- `SiteCopyright.astro` is included by the shared Starlight footer override, so existing and future content and generated landing pages receive one copyright notice at the end of the page. The holder is configured in `site.copyrightHolder`; the year is determined at build time. The global `--sl-text-h1` token controls the smaller responsive page-heading size.
- `src/pages/` contains generated category and tag landing routes. Category entry pages derive their metadata from the taxonomy; public URLs remain `/category/` and `/zh/category/`.
- `src/content/docs/fun.md` and `src/content/docs/zh/fun.md` own the bilingual Fun index for small tools and interactive quizzes. This section is separate from article categories; future entries belong under `/fun/` and `/zh/fun/`.

## Content contract

The public blog renders and validates exports from the private writing workspace. A published article is Markdown or MDX in `src/content/docs/` with `contentType: article`, a stable slug, a taxonomy category, a description, normalized tags, and a publication date. Optional update and series fields are validated by the same schema. Reading time is derived from the article body. This repository does not generate or import private drafts.

The homepage and About pages are structural content pages. English routes live at the root and Chinese routes under `/zh/`. Optional shared `translationKey` values connect published translations even when their slugs differ; absent counterparts fall back to the matching category rather than an invented article URL. KaTeX renders authored math at build time. The generated `dist/`, `.astro/`, and `node_modules/` directories are not committed.

## Quality and deployment

`npm run quality` runs Astro checks, lint and format validation, unused-code and dependency detection, and a production build. The build generates the Pagefind index. GitHub Actions runs the build and deploys `dist/` to GitHub Pages.
