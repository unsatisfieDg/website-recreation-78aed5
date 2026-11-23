# AGENTS.md

## What this is
A static recreation of https://exclusivehempfarms.de/, merged with the owner's redesigned product showcase from https://github.com/unsatisfieDg/exclusivehempfarms. That showcase uses "Henrietta" kinetic typography, a colour theme per strain, and directional enter and exit motion whenever a product is chosen on the mood wheel. Everything outside the showcase should stay faithful to the live site. Don't restyle it unless asked.

## Layout
- `public/` is the publish directory (set in `netlify.toml`). There is no build step.
  - `*.html`: the pages (index, collection, vapes, pre-rolls, edibles, the four flavour pages, story, lab-reports, privacy, 404, plus `pre-rolls-detail.html` and `gummies-detail.html` from the concept repo).
  - `app.js`: the entry module. It lazily imports the feature modules.
  - `mood-circle.js` / `mood-circle.css`: the product wheel and the showcase stage. Look for `henrietta-*` classes, `data-henrietta-*` hooks, and the `vapeThemes` colour map. The enter and exit animation classes are `enter|exit-{diagonal|vertical|horizontal}-{next|prev}`.
  - `assets/`: images, fonts, films (`flavour-cinema/`), 3D models (`models/*.glb` + `*.json`), and `vape-range/*-device.webp` (the wheel's small device thumbnails).
  - `assets/display-fonts/`: self-hosted Google Fonts used by the showcase.
  - `_headers`: CSP, robots and nosniff headers copied from the original server.

## Non-obvious decisions
- The CSP whitelists each inline `<script>` by its SHA-256 hash over the exact bytes. If you edit an inline script, or change a page's line endings, recompute the hashes in `_headers`, or the script is blocked.
- The CSP allows only same-origin fonts and styles, so never link external font or CSS CDNs. Self-host them instead.
- Asset URLs carry `?v=` cache busters. Static hosting ignores the query string, so files are stored without it.
- Many asset paths are built in JS (`assets/models/${id}.glb`, `assets/flavour-cinema/${film}-${mobile|desktop}.mp4`, `vape-range/${id}-device.webp`). If you add a product, add every file those paths produce.
- `robots.txt` and `X-Robots-Tag` block indexing on purpose, as on the original.
