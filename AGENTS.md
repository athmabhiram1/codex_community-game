# Working on Tidewater

An island fishing game on [Patch](https://patch.gg), on WebGPU and WGSL with its own small engine, bundled by Vite. It's Dan Greenheck's game (https://github.com/dgreenheck/tidewater): keep his licence and credit in anything made from it. What the person asks for comes first: nothing here says what to make.

## Run

`npm ci`, then:

- `npm run dev`: Vite on port 5188. It needs a browser with WebGPU.
- `npm run build`: makes `dist/`, the whole release. `npm run preview` serves it. `pch check --serve` serves it with the game host's headers.
- `README.md` lists the URL options and controls.

## Check

| Command | What it checks |
| --- | --- |
| `pch check` (after a build) | Patch's own look at the game, as its host serves it |
| `pch validate` | `patch.json`, its recipe and its files |
| `npm test` | Game logic and the engine in Node. More in `test/`: each `life-*` and `ocean-*` script runs on its own |

Any browser you script has to be muted and must not take the real mouse: fake pointer lock inside the page, and pass the flags your system needs for WebGPU.

## Change

- There's no three.js here: rendering is the engine in `src/engine/`, in WGSL.
- The first load compiles several hundred shaders. Patch's test wants the main thread free within 3 s at a time, so `src/App.js` and `TerrainData.createAsync()` yield between steps: keep long work split up. The changes the port made are marked `Patch port` in the code.
- Everything in `public/` ships as it is. It's the source of `dist/`, with `public/CREDITS.md` and `public/LICENSE`, and the top-level `CREDITS.md` and `LICENSE` are copies: change both.
- Each folder of assets has its own credits (`public/audio/CREDITS.md`, `public/models/debris/CREDITS.md`, `public/models/props/CREDITS.md`). Anything added has to be open enough to ship in a repo anyone can fork: CC0, CC-BY or a permissive licence, credited there and in `public/patch-credits.js`.
- `public/clouds/LICENSING.md` is the author's, and lists textures that aren't here. The cloud noise files are his, under this repo's MIT licence.
- `tools/` is how the sounds, characters and props were made; each has its README. `npm run build` doesn't need them, and they haven't been run from a clone.
- `src/core/Bench.js` isn't in the build: the port removed its import, since it posted timings to a local server.
- To publish: put the next version in `patch.json`, commit, then `pch publish`, which says what comes next. A fork's `patch.json` has to name the fork.

## Where things live

`README.md`, Project layout, has the map: the fishing game in `src/game/`, the world in `src/world/`, the ocean in `src/ocean/`, the sky in `src/sky/`, the player in `src/player/`, sound in `src/audio/`. `UPSTREAM.md` and `UPSTREAM.diff` say what the port changed.
