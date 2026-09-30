# Editorial style

## Frontmatter

- Set `contentType: article` for every article. Structural pages omit it and default to `page`.
- Use exactly one category: `cognition`, `systems`, `science`, or `frontier`.
- Write tags as short concepts. Prefer lowercase kebab-case English or concise Chinese; equivalent spellings should share one tag.
- Use ISO dates (`YYYY-MM-DD`) for `publishedAt` and optional `updatedAt`. Only change `updatedAt` for meaningful revisions.
- Use a stable kebab-case series ID, a reader-facing series title, and a positive integer order.
- Do not add reading time to frontmatter; it is derived from the article body.

## Writing

- Use a specific title and a concise description that states what the article gives the reader.
- Keep paragraphs focused, define uncommon terms, and make the article understandable without private context.
- Use headings in a consistent hierarchy. Avoid skipping levels.
- Write mathematics in LaTeX with `$...$` or `$$...$$`; include prose that explains what the notation means.
- Check names, links, examples, and claims before publication. Distinguish observations from speculation.

## Privacy

Remove credentials, tokens, private hostnames, personal-state traces, identifying metadata, and material that is not approved for public release. If safe publication is uncertain, keep the text private.
