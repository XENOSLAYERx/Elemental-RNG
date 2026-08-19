# Elemental RNG

A weapon gacha forge that runs by double-clicking `index.html`. No build step, no
dependencies, no frameworks, no network calls. 117 weapons across 9 elements and
13 rarity tiers, with the rarest sitting at a genuine 1 in 10,000,000.

- `index.html` — the game. Open it directly in a browser.
- `artifact.html` — the same page with the `<!doctype>/<html>/<head>/<body>`
  wrapper stripped, for publishing as a Claude Artifact. Generated, never edited
  by hand: run `node tools/build-artifact.js` after changing `index.html`.

---

## Scope: the three features that need a server

Trading, server-wide announcements and global leaderboards cannot exist in a
static file. **Resolution (A) — simulated**, as recommended in the brief:

- **40 simulated forgers** roll in the background at plausible rates
  (`tickSims`, index.html:1449), producing Broadcast entries and populating the
  Ranks the player competes against.
- **Trading** is an NPC Collector offering duplicate-for-duplicate swaps
  (`rollDeals`, index.html:1512).
- Nothing leaves the browser. The footer and the in-page help both say so.

---

## Corrections made to the original spec

**The rarity table summed to 100.06111%.** Common through Celestial already
totalled exactly 100%, so Transcendent through Impossible could never roll. Fixed
by dropping Common to 44.93889% and using integer weights out of 10,000,000 with
a single cumulative-sum lookup. Every intended rarity is preserved.

**The weapon roster contradicted itself.** The brief requires every tier to hold
at least 3 weapons, but also calls Omniverse Edge "the sole Impossible weapon" —
which needs exactly 1. The ≥3 rule is stated as a hard requirement, so it wins:
the roster is the full 9 × 13 = 117 grid the brief names as full coverage, which
also matches its own ~350-byte save-size math. Consequence, stated plainly:
**Omniverse Edge is the Cosmic capstone at 1 in 90,000,000, not the sole
Impossible at 1 in 10,000,000.** The tier itself is still 1 in 10,000,000, and
the takeover screen prints both numbers.

**Rebirth keeps one-time unlocks.** The brief says "currency and upgrades reset".
Taken literally that would confiscate Auto Forge at 1,000 rolls and nobody would
ever press the button. Currency and the three levelled upgrades reset; unlocks,
collection, titles, achievements, favourites and streak persist.

---

## Numbers

### Rarity table — sums to exactly 10,000,000

| Tier | Weight /1e7 | Percent | Odds | Weapons |
|---|---:|---:|---|---:|
| Common | 4,493,889 | 44.93889% | 1 in 2.2 | 9 |
| Uncommon | 2,500,000 | 25% | 1 in 4 | 9 |
| Rare | 1,500,000 | 15% | 1 in 6.7 | 9 |
| Epic | 800,000 | 8% | 1 in 12.5 | 9 |
| Legendary | 400,000 | 4% | 1 in 25 | 9 |
| Mythic | 200,000 | 2% | 1 in 50 | 9 |
| Divine | 80,000 | 0.8% | 1 in 125 | 9 |
| Celestial | 20,000 | 0.2% | 1 in 500 | 9 |
| Transcendent | 5,000 | 0.05% | 1 in 2,000 | 9 |
| Eternal | 1,000 | 0.01% | 1 in 10,000 | 9 |
| Omega | 100 | 0.001% | 1 in 100,000 | 9 |
| Secret | 10 | 0.0001% | 1 in 1,000,000 | 9 |
| Impossible | 1 | 0.00001% | 1 in 10,000,000 | 9 |

Rolling is two-stage: draw a tier from the weight table, then pick uniformly from
that tier's nine weapons (`rollOnce`, index.html:1230).

### Weapon IDs

`id === elementIndex * 13 + tierIndex`, assigned once and never reordered
(index.html:832). Base block 0–116. Reserved blocks: **800–803** rebirth-only,
**900–903** limited-time event (index.html:839). Neither reserved block enters a
roll pool, so adding event weapons cannot disturb the weight table or the
9-per-tier invariant.

### Luck formula and its cap

Luck multiplies every tier Rare and above; the surplus is subtracted from Common
and the array is rebuilt to exactly 10,000,000 by construction, then re-asserted
(`buildWeights`, index.html:1187).

Rare-and-above sums to 3,006,111. A multiplier of `1 + 4,493,889 / 3,006,111 =
×2.4949` would empty Common entirely, so **MAX_LUCK is ×2.40** (index.html:1184),
leaving Common at 285,334 (2.85%). Luck comes from Fortune Sigil (+0.07 × 20
levels) plus +0.10 per rebirth, clamped to the cap.

Impossible is held at a floor of 1 rather than rounding to zero, so the tier
never disappears; note that at low luck values `round(1 × L)` still yields 1, so
small luck bonuses do not move the Impossible weight.

### Economy — costs and curves

Shards per pull by tier: 1 / 3 / 8 / 25 / 80 / 250 / 900 / 3,000 / 12,000 /
60,000 / 400,000 / 3,000,000 / 25,000,000. First copy of any weapon pays **10×**.
Expected yield at base luck: **≈47.3 shards per roll**.

Levelled upgrades are **geometric**, `cost(n) = base × ratio^n`:

| Upgrade | Levels | Base | Ratio | Effect per level |
|---|---:|---:|---:|---|
| Fortune Sigil | 20 | 500 | **×1.45** | +0.07 luck |
| Chrono Core | 12 | 400 | **×1.60** | ×0.94 cooldown, floored at 200 ms |
| Shard Magnet | 15 | 750 | **×1.50** | +15% shards, additive |

One-time unlocks: Fast Forge 5,000 · Skip Animation 15,000 · Auto Forge 40,000 ·
Batch ×100 120,000 · Batch ×1000 750,000 (×1000 requires ×100 first).

### Rebirth — exactly what resets

At **1,000 / 10,000 / 100,000 / 1,000,000** forges since the last rebirth.

| Resets | Never resets |
|---|---|
| Shards | The collection and every count in it |
| Fortune Sigil, Chrono Core, Shard Magnet levels | All five one-time unlocks |
| The rebirth forge counter | Titles, achievements, favourites |
| | Login streak, lifetime forge and shard totals |

Each grants +0.10 permanent luck, a title, and an exclusive weapon
(`doRebirth`, index.html:1306).

---

## Self-check

Seven assertions run for real at load and are reported in the **Self-Check** tab.
Nothing is hard-coded to pass; each recomputes its claim from live data, and a
failure throws where the brief says to throw.

| # | Claim | Proven by |
|---|---|---|
| 1 | Weights sum to exactly 10,000,000 | `buildWeights` throws on mismatch — index.html:1187; asserted at ×1.00 and ×2.40 in index.html:2694 |
| 2 | Every tier holds ≥3 weapons | `TIER_POOL` built at index.html:857; minimum verified at index.html:2704 (actual: 9 per tier) |
| 3 | No weapon id duplicated or skipped | id formula at index.html:832; contiguity, reserved-block and unique-name checks at index.html:2713 |
| 4 | A ×1000 batch fits one frame | `doRoll` aggregates in one loop with no DOM work inside — index.html:2365; timed at index.html:2734 |
| 5 | Save round-trips; a corrupt save does not wipe | `exportSave`/`importSave` index.html:1143–1150; corrupt path keeps the blob and suspends auto-save at index.html:1121; asserted at index.html:2745 |
| 6 | Max luck keeps every weight positive | cap at index.html:1184, throw at index.html:1187, ceiling proof at index.html:2758 |
| 7 | No `setInterval` drives gameplay | `window.setInterval` counted from the first line of the script (index.html:758) and asserted zero at index.html:2772; `loop()` at index.html:2585 holds the only `requestAnimationFrame` |

Measured: 1,000 draws in ~0.1 ms; worst frame **1.6 ms** across a 21,000-roll
session, against a 16.7 ms budget at 60 fps. The Self-Check tab shows the live
worst frame for the current session.

Check 7 is deliberately behavioural rather than a source grep — an earlier
version grepped the script text and failed on its own explanatory comments.

---

## Performance notes

- **×1000 never runs 1000 animations.** All results are computed in one loop,
  aggregated into a per-tier summary, rendered as **one** panel, and only the
  single highest-rarity pull in the batch plays the full reveal.
- **The collection grid is built once** (125 nodes, under the ~200 threshold
  where virtualising would be needed) and patched cell by cell from a dirty set
  (`paintCell`, index.html:1675). Filtering hides with `display`; sorting
  reorders with CSS `order`. The DOM tree is never rebuilt.
- **One `requestAnimationFrame`** drives everything (index.html:2585). Cooldowns,
  auto-roll, the 30-second autosave, the simulated forgers, the leaderboard
  recompute and the Collector refresh are all `performance.now()` accumulators,
  so none of them drift or double-fire when the tab is throttled. Frame deltas
  are clamped at 250 ms so a backgrounded tab cannot fast-forward on return.
- **Auto-roll pauses on tab blur** and resumes on focus (index.html:2662).
- Roll history and the Broadcast feed are both **ring buffers capped at 50**
  (index.html:1731, index.html:1470).
- The AudioContext is built on the first user gesture, not inside a reveal —
  constructing it mid-roll cost 60 ms of frame time.
- `--tint` is set on the stage subtree, not `:root`. On `:root` it invalidated
  every inheriting element and forced a whole-document style recalc on each rung
  of the reveal ladder.
- Animation is transform and opacity only. Cooldown bars are `scaleX`, the shake
  is `translate3d`, shockwaves are `scale`; nothing animates `width`, `top` or
  `box-shadow`. `prefers-reduced-motion` collapses the reveal to its result.

## Save system

`localStorage`, single key `elemental-rng.save`, JSON, schema-versioned. Counts
live in a fixed-length array indexed by weapon id — not name-keyed objects — so a
full save is well under a kilobyte.

`migrate(save)` is keyed on `save.v` from day one (index.html:1045) and
`sanitize` repairs shape without discarding recognisable progress
(index.html:1069). Auto-save every 30 s (index.html:2634), plus on
`visibilitychange` and `beforeunload`.

**A corrupt save is never silently wiped.** The damaged blob is left untouched on
disk, auto-save is suspended, the session runs from a fresh in-memory state, and
the status line says what happened. Only an explicit typed `RESET` erases
anything. Export/import moves a save between browsers as a base64 string.

There is no cloud save. Progress is per-browser and is lost if site data is
cleared — the Save tab says so in as many words. If `localStorage` is
unavailable (private mode, sandboxed frame), the game falls back to in-memory
state and tells you it will not persist.

---

## Manual test checklist

1. **Reload persistence** — forge a few times, note shards and collection %,
   reload. Both survive. Then corrupt the value under `elemental-rng.save` in
   devtools and reload: the status line reports the damaged save, the blob is
   still on disk, and waiting past the 30-second autosave does not clobber it.
2. **×1000 batching** — unlock Batch ×1000, forge, and confirm you get one
   summary panel and one reveal rather than a thousand of either. The Self-Check
   tab's live worst-frame readout should stay well under 16 ms.
3. **Auto-roll on tab blur** — unlock Auto Forge, switch on, change browser tab
   for several seconds, come back. The forge count does not advance while hidden
   and the status line reads "Auto paused — tab is in the background."
4. **Rebirth reset behaviour** — reach 1,000 forges, note your collection %,
   upgrade levels and unlocks, then rebirth. Shards and the three upgrade levels
   are zero; the collection %, unlocks, titles and streak are unchanged; luck
   shows a permanent +0.10.

## Controls

Space forges · `1`–`4` set batch size · `A` auto · `M` mute · `S` skip ·
`Esc` closes overlays.
