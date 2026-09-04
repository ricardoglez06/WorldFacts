# World Facts

An immersive, cinema-style journey through the most fascinating places on Earth.

Every screen shows a real photograph of a remarkable place — from ancient stone circles and surreal salt deserts to remote islands and restless volcanoes — paired with a single curious, eerie, or rare fact about it. No maps, no diagrams: just the place itself and the story that makes it worth remembering.

The experience is built as an endless carousel. Use the left and right arrows (or your keyboard's arrow keys) to drift from one wonder to the next, in any direction, forever. Each fact is chosen to be the most interesting piece of the place's story — the ghostly legend, the impossible scale, the strange isolation — not just a dry introduction.

Whether you have a minute or an hour, World Facts is a quiet, full-screen escape into the weird and beautiful corners of our world.

---

## How it works

World Facts is a **single-page web application** built with [Angular](https://angular.dev) (v20). It runs entirely in the browser — there is no backend of its own. Instead, it stitches together a few public, keyless web APIs at runtime to assemble each slide on demand. The result feels like a curated documentary, but every fact and photo is fetched live.

### The pieces and how they connect

**1. The catalog (`FactsService`)**
Everything starts with a small, hand-picked list of photogenic places in `public/data/places.json`. Each entry carries a title, a category (curious / eerie / rare), and keyword hints used later to find a good photo. `FactsService` owns this catalog and turns it into an *effectively endless* stream: as you approach the end of what's loaded, it asks Wikipedia for the members of themed categories (volcanoes, islands, mountains, …), merges the new titles in, and keeps the carousel circular. Results are cached so revisiting a place never triggers a duplicate request.

**2. The story (`WikipediaService` → `FactsService.pickInteresting`)**
For each place, `WikipediaService` calls Wikipedia's action API to pull an extract — not just the opening line, but a wider slice of the article (up to 25 sentences). `FactsService` then runs `pickInteresting()`, which scores every sentence against the place's category (e.g. eerie places are boosted for death, abandonment, or curse language) and keeps the top three. Section headings and stray zero-width characters are stripped, so what you read is clean, relevant, and genuinely intriguing.

**3. The image (`PhotoService`)**
To honor the "no maps" rule, `PhotoService` searches **Wikimedia Commons** for a real photograph of the place, filtering out SVGs, diagrams, coats of arms, flags, and anything with "map" or "location" in the name. If an Unsplash access key is supplied through the `UNSPLASH_ACCESS_KEY` injection token, the app prefers Unsplash's higher-quality photography instead — but the app works fully without one.

**4. The presentation (`FactViewer` + `FactCard`)**
`FactViewer` is the carousel: it tracks the current index with Angular **Signals**, renders the active `FactCard`, and pre-fetches the neighbours so navigation feels instant. `FactCard` lays the photo full-screen and floats a readable text bar along the bottom (no ellipsis, no clipping — long facts simply scroll). If a photo fails to load, a moody gradient fallback keeps the cinema mood intact. Navigation arrows, loading states, and category badges are small shared components reused across the app.

**5. The glue**
A single `ErrorInterceptor` watches every HTTP call and surfaces failures gracefully instead of breaking the screen. Global SCSS design tokens (colors, fonts, spacing) keep the dark, cinematic look consistent, and Angular's animation system adds the soft cross-fades between places.

### Data flow in one line

`places.json` → `FactsService` (catalog + endless growth) → `WikipediaService` (facts) + `PhotoService` (photos) → `FactViewer` (Signals-driven carousel) → `FactCard` (cinema layout) → your screen.

---

## Running it locally

You'll need [Node.js](https://nodejs.org) (v20 or newer) and the Angular CLI.

```bash
npm install
npm start          # or: ng serve
```

Then open `http://localhost:4200/`. Use the on-screen arrows or your keyboard's left/right keys to explore.

> Optional: to use Unsplash photos instead of Wikimedia Commons, provide a key via the `UNSPLASH_ACCESS_KEY` injection token (e.g. in your environment providers). Without it, the app falls back to Wikimedia automatically.
