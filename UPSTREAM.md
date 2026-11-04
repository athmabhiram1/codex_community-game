# Where this came from

- **Author:** Dan Greenheck (DRG Software Solutions LLC)
- **Repo:** https://github.com/dgreenheck/tidewater
- **Commit:** `4811ba48d795197de5621985f404e765c0b7c0ef`, 2026-09-24
- **Licence:** MIT for the code. The third-party assets keep their own licences, listed in `CREDITS.md`.

`UPSTREAM.diff` holds every change to the author's files, apart from binary font files.

## What the port changed

So that it runs on Patch, where nothing loads from other hosts and the main thread can't block for 3 s:

- **Fonts:** `index.html` loaded them from another host. They're now in `public/fonts/`, with their licences.
- **Benchmark:** `src/main.js` no longer imports `core/Bench.js`, which posted timings to a local server.
- **Loading:** `TerrainData.generate()` ran as one task of about 1.25 s. `generateSteps()` and `createAsync()` split it up with the same output, and `App.init` yields between its heavy stages.
- **Favicon:** an inline one, since a missing one shows as a console error.
- **Credits:** `public/patch-credits.js` is the "i" button. `public/CREDITS.md` is the author's `CREDITS.md`, with its paths pointed at the build's folders and the Fonts section updated. `public/LICENSE` is his licence.

## What the port left out

`docs/PORTING.md` and `.github/workflows/deploy.yml`, which are about the author's own work and his site.
