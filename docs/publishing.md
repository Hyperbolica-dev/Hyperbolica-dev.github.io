# Publishing

The private content repository is the writing workspace. This public repository accepts only deliberate, reviewed exports. Do not scan, mirror, or automatically import private notes.

1. Select and edit the article privately until it stands on its own.
2. Remove credentials, private links and hostnames, personal-state traces, identifying metadata, and unapproved third-party material.
3. Export only the approved Markdown or MDX and its public assets to `src/content/docs/`.
4. Set `contentType: article`, a stable slug, one category from `cognition`, `systems`, `science`, or `frontier`, a concise description, normalized tags, and an ISO `publishedAt` date. Use `updatedAt` only for meaningful revisions. A series needs a stable kebab-case ID, title, and positive order.
5. Check the article's links, claims, heading hierarchy, and privacy. Explain any LaTeX notation in prose. Leave reading time out of frontmatter because the renderer derives it.
6. Run `npm run quality`, inspect the English and Chinese navigation as relevant, and submit a PR. Deployment follows the approved merge through GitHub Pages.

Unapproved drafts, raw inventories, and private traces stay outside this repository.
