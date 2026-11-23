# Exclusive Hemp Farms — EU edition

A recreation of https://exclusivehempfarms.de/ with the redesigned product showcase. The rest of the site matches the original: the cinematic entrance film with ambience, the vape, pre-roll and edible collections, the flavour pages (blueberry, cherry, grape, mango), the interactive 3D product viewers, and the story, lab-report and privacy pages.

The showcase follows the product wheel concept. When you pick a product on the wheel, the stage changes to that strain's colours, a large kinetic product name animates in letter by letter (diagonally, vertically or horizontally, depending on the product and the direction you scrolled), and a product badge, description and arrow and dot navigation update to match.

## Technologies
- Plain HTML, CSS and native ES modules, with no build step
- three.js (stored in the repo under `public/vendor/three`) with GLB product models in `public/assets/models`
- MP4 films, WebP images, and self-hosted WOFF2 fonts (the original typefaces plus Anton, Bebas Neue and Changa One for the showcase)
- A static site on Netlify, with strict security headers in `public/_headers`

## Run locally
```bash
netlify dev --port 8889
# or serve ./public with any static file server
```
