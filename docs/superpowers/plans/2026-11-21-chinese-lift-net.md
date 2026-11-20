# Chinese Lift Net Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working Chinese lift-net fishing station as an optional second fishing method, isolated from rod fishing.

**Architecture:** Keep the interaction and catch-cycle rules in a small, GPU-free game module. Build the timber rig with the village's existing procedural geometry/material path and animate only the net panel. The existing Game controller owns proximity prompts and routes successful catches through `GameState.addFish` and the existing catch feedback.

**Tech Stack:** JavaScript ES modules, Vite, existing procedural WebGPU scene builder, Node's built-in test runner.

**Spec:** User-provided lift-net illustrations and photo; existing fishing, tide, habitat, inventory, and village interfaces.

## Global Constraints

- Implement only in the `feature/chinese-lift-net` worktree.
- Keep rod states and rod input behavior unchanged.
- Reuse current fish selection, weights, inventory, persistence, and feedback; do not introduce dependencies.
- Keep the lift net accessible on foot at the shoreline and leave enough clearance for the player and boat.
- Use one low-cost animated net mesh; do not simulate individual strands or add a per-frame physics system.
- Treat the supplied 2D sprite pack as a visual reference; build a 3D object instead of inserting a flat billboard into the world.
- Do not push or change GitHub remotes.

## Review Focus

- Repeated interaction while lowering, soaking, raising, or cooling down must not duplicate catches; pin each valid transition in the logic test.
- Empty or dry habitat must not create an invalid fish; test the no-catch result.
- A full cooler must record the fish while reporting that it was not kept, matching existing inventory behavior.
- Opening inventory, vendor UI, catch card, or the lighthouse offering must not also activate the net; verify the integration guard.
- The rig must not block the pier approach or intersect the normal walk path; inspect its placement in the running game.

---

### Task 1: Isolated lift-net fishing rules

**Files:**
- Create: `src/game/LiftNetFishing.js`
- Create: `test/lift-net.mjs`
- Modify: `package.json` to include the new logic test in `npm test`

**Interfaces:**
- Produces a deterministic state machine with `lower()`, `raise()`, and `update(dt)`; raising resolves one fish result from the existing `pickSpecies` / `rollWeight` functions and current habitat inputs.
- A successful cycle yields one `{ species, kg }` result; invalid transitions and barren habitat yield no result.

- [x] Write tests for valid cycle, invalid/repeated transitions, barren habitat, and no duplicate result.
- [x] Run `node test/lift-net.mjs` and confirm the expected missing-module failure.
- [x] Implement the pure state machine and pass those tests.
- [x] Add the new test to the package test script.

### Task 2: Procedural Chinese lift-net rig

**Files:**
- Create: `src/world/ChineseLiftNet.js`
- Modify: `src/world/Village.js`
- Modify: `src/world/WorldLayout.js` only if a named station position is needed

**Interfaces:**
- The rig exposes its world position, nearby check, cycle state, and an update method for animating the net mesh.
- The frame uses existing timber, rope, and net materials; only a compact collider marks the platform interaction area.

- [x] Build the four-point suspended net, long counterweighted lever, timber supports, braces, and rope details from the supplied references.
- [x] Place it just off the beach near the pier with foot access and no collision with the boat route.
- [x] Keep the moving net separate from the village's merged static geometry and animate it between raised and submerged positions.
- [x] Confirm the new object participates in the existing village disposal path and the per-frame game update path.

### Task 3: Player interaction and catch feedback

**Files:**
- Modify: `src/game/Game.js`
- Modify: `src/game/Guide.js` only if the interaction needs a contextual tip

- [x] Show a nearby `E` prompt to lower the net, then an actionable prompt to haul it after the soak period.
- [x] Respect existing busy states and prompt priority so the net cannot steal vendor, shrine, or catch-card input.
- [x] On lift, add any caught fish through `GameState.addFish`, show the existing catch card when available, and clearly report empty-net or full-cooler outcomes.
- [x] Keep rod fishing behavior unchanged.

### Task 4: Verify in isolation

**Files:**
- No additional files unless verification reveals a defect.

- [x] Run `node test/lift-net.mjs` and `node test/game-logic.mjs`.
- [x] Run `npm test`; all logic and engine smoke checks pass.
- [ ] Run the local game and visually inspect the rig raised and submerged; verify interaction, catch storage, and rod fishing remain usable. The browser UI helper failed Windows setup twice, so this visual pass remains unavailable in this session; the controller integration test and production build pass.
- [x] Confirm the base checkout remains untouched and do not push.

## Implementation notes

- The supplied pack is 2D sprite/reference art. The rig is procedural 3D and reuses the village materials; no external model or flat billboard was added.
- A soak timer was added so repeated input cannot bypass the wait or create duplicate catches.
- Browser automation was unavailable because both the `@oai/sky` and CUA Windows helpers exited during setup. The isolated Vite preview is on port 5190 for a later visual pass.
