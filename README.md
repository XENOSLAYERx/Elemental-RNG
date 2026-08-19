# Elemental RNG

A biome-driven weapon gacha forge that runs by double-clicking `index.html`.
No build step, no dependencies, no frameworks, no network calls. 129 weapons,
11 biomes, and a rarest tier at a genuine 1 in 10,000,000.

- `index.html` — the game. Open it directly in a browser.
- `artifact.html` — the same page with the wrapper tags stripped, for publishing
  as a Claude Artifact. Generated: run `node tools/build-artifact.js` after
  changing `index.html`.

---

## Biomes, and why they don't grant luck

Every 40 seconds the forge re-reads the sky. Most of the time nothing happens;
sometimes a biome arrives, repaints the whole page, changes the weather, and
runs for one to four minutes.

The obvious way to make a biome powerful is a luck multiplier. **That is
arithmetically impossible here.** Luck works by multiplying every tier Rare and
above and subtracting the surplus from Common. Rare-and-above sums to 3,006,111,
so a multiplier of `1 + 4,493,889 / 3,006,111 = ×2.4949` empties Common outright.
A "×5 biome luck" cannot exist against a table that must keep summing to exactly
10,000,000.

So biomes grant **Resonance** instead (index.html:1313). At Resonance *N* the
forge draws the rarity table *N* times and keeps the rarest result:

```
P(tier t or better)  =  1 − (1 − p)^N
P(exactly tier t)    =  F(t)^N − F(t−1)^N        ← tierChanceAt, index.html:1336
```

The table is never touched, the Codex odds stay exact, and the effect is
unbounded in feel. Measured: Celestial goes **1 in 500 → 1 in 84** at Resonance
×6, and Impossible **1 in 10,000,000 → 1 in 1,666,667**, purely from the formula.

| Biome | Chance per check | Resonance | Element bias | Exclusives |
|---|---:|---:|---|---|
| Calm | 54.3% | ×1 | — | — |
| Emberfall | 1 in 10 | ×2 | Fire | Cinderheart Maul |
| Verdant | 1 in 11 | ×2 | Earth | Worldroot Stave |
| Tempest | 1 in 12 | ×2 | Wind | Skybreaker Coil |
| Glacier | 1 in 13 | ×2 | Ice | Rimebound Sovereign |
| Abyss | 1 in 16 | ×2 | Water | Crown of the Drowned |
| Eclipse | 1 in 40 | ×3 | Shadow | Eclipse Herald |
| Starfall | 1 in 90 | ×3 | Cosmic | Starfall Regalia |
| Radiance | 1 in 180 | ×4 | Light | Dawnforged Diadem |
| Null | 1 in 700 | ×5 | — | Null Iterator, The Unwritten |
| Prismatic | 1 in 3,500 | ×6 | — | Prism Absolute, Spectral Zenith |

**Element bias** changes which weapon, never which tier: the biased element's
weapon in the drawn tier weighs `BIAS_WEIGHT` (5) against 1 for the other eight,
so its share goes from 11.1% to 38.5% (`drawWeapon`, index.html:1321).

**Biome exclusives** live at id 910+ and never enter a tier pool. Each resonant
draw gets its own shot at them, which is what makes a rare biome worth chasing —
Spectral Zenith is 1 in 900,000 per draw, so at Resonance ×6 inside Prismatic it
is effectively ~1 in 150,000, and Prismatic itself arrives roughly once every
39 hours of play.

---

## Corrections to the original spec

**The rarity table summed to 100.06111%.** Common through Celestial already
totalled exactly 100%, so Transcendent through Impossible could never roll.
Common drops to 44.93889%; weights are integers out of 10,000,000 read through
one cumulative-sum lookup, asserted at load.

**The roster contradicted itself:** "every tier ≥ 3 weapons" versus "Omniverse
Edge is the sole Impossible weapon", which needs exactly 1. The ≥ 3 rule wins,
so the base roster is the full 9 × 13 = 117 grid the brief calls full coverage.
Consequence, stated plainly: **Omniverse Edge is the Cosmic capstone at 1 in
90,000,000, not the sole Impossible at 1 in 10,000,000.** The tier is still
1 in 10,000,000 and the takeover screen prints both numbers.

**Rebirth keeps one-time unlocks.** Read literally, "currency and upgrades reset"
would confiscate Auto Forge at 1,000 rolls and nobody would press the button.

---

## Numbers

### Rarity table — sums to exactly 10,000,000

| Tier | Weight /1e7 | Odds | Weapons | Relics | Cutscene |
|---|---:|---|---:|---:|---:|
| Common | 4,493,889 | 1 in 2.2 | 9 | — | quick |
| Uncommon | 2,500,000 | 1 in 4 | 9 | — | quick |
| Rare | 1,500,000 | 1 in 6.7 | 9 | — | quick |
| Epic | 800,000 | 1 in 12.5 | 9 | — | quick |
| Legendary | 400,000 | 1 in 25 | 9 | — | quick |
| Mythic | 200,000 | 1 in 50 | 9 | — | flash |
| Divine | 80,000 | 1 in 125 | 9 | — | flash |
| Celestial | 20,000 | 1 in 500 | 9 | 1 | dim |
| Transcendent | 5,000 | 1 in 2,000 | 9 | 3 | dim |
| Eternal | 1,000 | 1 in 10,000 | 9 | 8 | letterbox |
| Omega | 100 | 1 in 100,000 | 9 | 25 | letterbox |
| Secret | 10 | 1 in 1,000,000 | 9 | 80 | takeover |
| Impossible | 1 | 1 in 10,000,000 | 9 | 250 | takeover |

### Weapon ids

`id === elementIndex * 13 + tierIndex`, assigned once and never reordered
(index.html:797 for the reserved blocks). Base 0–116. Reserved: **800–803**
rebirth, **900–903** the Smith's stock, **910–921** biome exclusives. Nothing in
a reserved block enters a roll pool.

The 900-block exists because schema v1 used those ids for seasonal weapons. They
were kept and repurposed as the Wandering Smith's rotating relic-priced stock, so
a v1 save carrying one does not silently lose it.

### Economy

Shards per pull by tier: 1 / 3 / 8 / 25 / 80 / 250 / 900 / 3,000 / 12,000 /
60,000 / 400,000 / 3,000,000 / 25,000,000. First copy pays **10×**. Expected
yield at base luck and Resonance ×1: **≈47.3 shards per forge**.

**Relics** drop only from Celestial and above (see the table) plus contracts and
the daily reward. They buy elixirs, lures and the Smith's weapons.

Levelled upgrades are **geometric**, `cost(n) = base × ratio^n`:

| Upgrade | Levels | Base | Ratio | Effect per level |
|---|---:|---:|---:|---|
| Fortune Sigil | 20 | 500 | **×1.45** | +0.07 luck |
| Chrono Core | 12 | 400 | **×1.60** | ×0.94 cooldown, floored at 200 ms |
| Shard Magnet | 15 | 750 | **×1.50** | +15% shards, additive |

One-time unlocks: Fast Forge 5,000 · Skip Animation 15,000 · Auto Forge 40,000 ·
Batch ×100 120,000 · Batch ×1000 750,000 (×1000 needs ×100 first).

Consumables (`usePotion`, index.html:1457) stack additively and are capped at
Resonance ×9 so the best-of-N loop can never become the frame budget:

| Item | Effect | Price |
|---|---|---|
| Fortune Elixir | +0.35 luck, 5 min | 180K shards |
| Greater Fortune Elixir | +0.80 luck, 5 min | 14 relics |
| Haste Draught | ×0.5 cooldown, 4 min | 120K shards |
| Resonance Vial | +1 Resonance, 3 min | 10 relics |
| Greater Resonance | +2 Resonance, 2 min | 26 relics |
| Biome Lure | re-roll the biome, rares ×10 | 8 relics |
| Prism Lure | force Eclipse-or-rarer now | 60 relics |

### Rebirth — exactly what resets

At **1,000 / 10,000 / 100,000 / 1,000,000** forges since the last rebirth
(`doRebirth`, index.html:1490).

| Resets | Never resets |
|---|---|
| Shards | The index and every count in it |
| Fortune Sigil, Chrono Core, Shard Magnet levels | All five one-time unlocks |
| The rebirth forge counter | Relics, potions, contracts |
| | Titles, achievements, favourites, streak, lifetime totals |

---

## Self-check

Eleven assertions run for real at load and are reported in the **Self-Check**
tab. Nothing is hard-coded to pass; each recomputes its claim from live data.

| # | Claim | Proven by |
|---|---|---|
| 1 | Weights sum to exactly 10,000,000 | `buildWeights` throws on mismatch — index.html:1274; asserted at ×1.00 and ×2.40 at index.html:3343 |
| 2 | Every tier holds ≥ 3 weapons | pools built at index.html:830; minimum verified at index.html:3352 (actual: 9) |
| 3 | No weapon id duplicated or skipped | id formula at index.html:788; contiguity and reserved-block checks at index.html:3360 |
| 4 | A ×1000 batch fits one frame | `doRoll` aggregates in one loop — index.html:2989; timed at maximum Resonance at index.html:3380 |
| 5 | Save round-trips; a corrupt save does not wipe | corrupt path keeps the blob and suspends auto-save at index.html:1208; asserted at index.html:3390 |
| 6 | Max luck keeps every weight positive | cap at index.html:1271, throw at index.html:1274, ceiling proof at index.html:3401 |
| 7 | No `setInterval` drives gameplay | `window.setInterval` counted from the script's first line (index.html:714), asserted zero at index.html:3412; `loop()` at index.html:3228 holds the only `requestAnimationFrame` |
| 8 | Biome chances sum below 1, so Calm is a real remainder | `pickBiome` at index.html:1590; asserted at index.html:3423 |
| 9 | Resonance never edits the weight table | 4,000 draws at ×9 leave all 13 weights identical, and `tierChanceAt` sums to 1 at every N — index.html:3432 |
| 10 | Biome exclusives never enter a roll pool | pools built from base weapons only; asserted at index.html:3448 |
| 11 | A v1 save migrates to v2 losslessly | `migrate` at index.html:1098; a full v1 blob is round-tripped and checked field by field at index.html:3464 |

### Measured, not asserted

Verified in Chromium against the live page:

- **Biome frequencies** — 400,000 picks; every one of the 11 biomes within 4σ of
  its declared 1-in-N (Prismatic: 111 observed vs 114 expected).
- **Resonance** — 300,000 forges each at N = 1, 3, 6, 9; empirical tier
  frequencies match the closed form with worst |z| = 2.7. P(tier or better) is
  non-decreasing in N for all 13 tiers.
- **Exclusives** — 0 in 200,000 forges leaked into Calm; 0 in 200,000 leaked
  across biomes.
- **Element bias** — 38.5% observed against 38.5% predicted by
  `BIAS_WEIGHT/(8+BIAS_WEIGHT)`; unbiased picks land at 1/9.
- **Frames** — 25,000 forges inside Prismatic at Resonance ×6 with full weather:
  worst frame **1.6 ms** against a 16.7 ms budget.

---

## Performance notes

- **×1000 never runs 1000 animations.** All results compute in one loop,
  aggregate into a per-tier summary, render as **one** panel, and only the single
  best pull plays the reveal — an exclusive outranks a same-tier normal pull.
- **The index grid is built once** (133 nodes, under the ~200 virtualising
  threshold) and patched from a dirty set (`paintCell`, index.html:2052).
  Filtering hides with `display`; sorting reorders with CSS `order`.
- **Panes render only when visible** (`flushDirty`, index.html:3289).
- **One `requestAnimationFrame`** drives everything (index.html:3228). Cooldowns,
  auto-roll, autosave, biome cycling, effect expiry, the simulated forgers, the
  leaderboard and the Smith are all `performance.now()` accumulators. Frame
  deltas are clamped at 250 ms so a backgrounded tab cannot fast-forward.
- **Auto-roll pauses on tab blur** and resumes on focus (index.html:3313).
- Two canvases share the loop: full-page biome weather (`stepWeather`,
  index.html:2626) and the stage, which also carries the equipped weapon's
  orbiting aura (`auraTick`, index.html:2542).
- The AudioContext is built on first gesture — constructing it mid-roll cost
  60 ms of frame time.
- `--tint` is written on the stage subtree, not `:root`. On `:root` it forced a
  whole-document style recalc on every rung of the reveal ladder. Biome palette
  *is* set on `:root`, which is fine because it changes at most every 40 s.
- Animation is transform and opacity only. Cooldown bars are `scaleX`, shake is
  `translate3d`, shockwaves are `scale`. `prefers-reduced-motion` collapses the
  reveal to its result.

## Save system

`localStorage`, single key, JSON, schema v2. Counts live in a fixed-length array
indexed by weapon id — not name-keyed objects.

`migrate(save)` is keyed on `save.v` from day one and only ever adds containers
(index.html:1098); `sanitize` repairs shape without discarding recognisable
progress (index.html:1140). Auto-save every 30 s, plus on `visibilitychange` and
`beforeunload`. Timed effects deliberately do not survive a reload.

**A corrupt save is never silently wiped.** The damaged blob is left byte-identical
on disk, auto-save is suspended, the session runs from a fresh in-memory state,
and the status line says so. Only a typed `RESET` erases anything.

There is no cloud save — progress is per-browser. If `localStorage` is blocked,
the game falls back to in-memory state and says it will not persist.

---

## Manual test checklist

1. **Reload persistence** — forge, note shards, relics and index, reload. All
   survive. Corrupt the `elemental-rng.save` value in devtools and reload: the
   damaged blob stays on disk and a 30-second autosave does not clobber it.
2. **×1000 batching** — unlock Batch ×1000 and forge: one summary panel and one
   reveal, never a thousand of either. The live frame readout stays under 16 ms.
3. **Auto-roll on tab blur** — switch browser tab for a few seconds. The forge
   count does not advance and the status line reads "Auto paused".
4. **Rebirth** — shards and the three upgrade levels go to zero; index, unlocks
   and relics do not.
5. **Resonance is honest** — drink a Resonance vial and watch the Codex. The
   "your odds" column moves; the weight column does not.

## Controls

Space forges · `1`–`4` batch size · `A` auto · `S` skip · `M` mute ·
`Esc` closes overlays · click a weapon to equip, shift-click to favourite.
