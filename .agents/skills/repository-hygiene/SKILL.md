---
name: repository-hygiene
description: Maintain the Hyperbolica Astro blog by removing semantic duplication and dead code while preserving URLs, behavior, and content ownership. Use for repository refactors and maintenance.
---

# Repository hygiene

Before changing a feature, inspect its callers, neighboring components, content schema, locale strings, and current diff. Preserve existing user edits and stable public URLs.

Keep each fact with its owner: site identity in `src/lib/site.ts`, category metadata in `src/lib/taxonomy.ts`, short custom UI copy in `src/lib/locale.ts`, Starlight copy in its i18n collection, and page prose in `src/content/docs/`. Reuse existing logic before adding a component or helper. Avoid one-use wrappers and generic utility files.

After the change, remove obsolete components, exports, styles, and dependencies supported by the call graph. Keep the public article schema suitable for exported content; private authoring remains outside this repository.

Run `npm run quality` and inspect the affected English and Chinese routes. Resolve any new duplicate source of truth or unused-code finding before handing off.
