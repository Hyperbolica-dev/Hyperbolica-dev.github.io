# Hyperbolica

Personal blog built with Astro and Starlight.

LLMQ is maintained in [its own repository](https://github.com/Hyperbolica-dev/llmq), pinned here as the `llmq/` submodule. Clone with `git clone --recurse-submodules`, or run `git submodule update --init` before the commands below. Quiz changes and contributions belong upstream; this blog keeps the published routes stable.

## Commands

```sh
npm run dev
npm run quality
npm run build
npm run preview
```

The site deploys to `https://hyperbolica-dev.github.io`. The public repository renders approved Markdown and MDX exports under `src/content/docs/`.

See [architecture](docs/architecture.md) and [publishing](docs/publishing.md).
