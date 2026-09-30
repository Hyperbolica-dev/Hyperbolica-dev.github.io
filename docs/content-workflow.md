# Content workflow

## Boundary

The public blog is a curated publication, not a mirror of private notes. Never scan or synchronize a private notes repository into this repository.

Only Markdown or MDX that has been deliberately selected, rewritten so it stands on its own, checked for privacy, and explicitly approved for publication may be copied into `src/content/docs/`.

## Publishing flow

1. Select a topic manually from private working material.
2. Draft and edit it outside the public repository when private context remains.
3. Remove personal state, credentials, private links, identifying metadata, and third-party confidential material.
4. Confirm the category, normalized tags, dates, description, and stable slug.
5. Approve the publication version, then add only that Markdown/MDX and its public assets to this repository.
6. Run `npm run build` and review the resulting page before publishing.

Private raw notes, inventories, traces, and unapproved drafts do not belong in the public repository. Reading time and similar presentation data are derived during the build and are never authored in frontmatter.
