# AGENTS.md

## Project scope

- This repository is a personal blog built with Astro and Starlight.
- Deployments target the root GitHub Pages site: `https://hyperbolica-dev.github.io`.
- Do not introduce Gatsby, a database, an online CMS, or a server-side content store.
- Blog content belongs in `src/content/docs/` as Markdown or MDX.
- The four top-level content categories are `cognition`, `systems`, `science`, and `frontier`.

## Content rules

- Phase 1 may extend the public content model and add manually approved public articles.
- Never scan, mirror, or automatically import a private notes repository. Only Markdown or MDX that has been deliberately selected, reviewed for privacy, and approved for publication may enter this repository.
- Keep category entry pages and article slugs stable once published.
- Use frontmatter for page titles and descriptions; keep prose concise and accessible.
- Math is authored with LaTeX in Markdown/MDX and rendered with KaTeX.

## Layout and UI direction

- Starlight owns the documentation shell, including light/dark mode, responsive navigation, table of contents, and Pagefind search.
- Keep the desktop information architecture as left navigation, central article content, and right table of contents.
- Use `--blog-sidebar-width` in `src/styles/site.css` as the single width hook for future sidebar resizing/collapse work.
- Keep mobile pages single-column; do not add fixed-width content that creates horizontal scrolling.
- Theme color tokens should remain centralized in `src/styles/site.css`.

## Local commands

Run from the repository root:

```sh
npm run dev
npm run build
npm run preview
```

The production build must pass before handing off a phase. GitHub Pages uses `.github/workflows/deploy.yml` and the `dist/` output.

## Change discipline

- Prefer small, focused changes that preserve the Astro/Starlight structure.
- Do not commit generated `dist/`, `.astro/`, or `node_modules/` output.
- When changing deployment settings, update `docs/architecture.md` in the same change.
