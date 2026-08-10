# Changelog

## v0.3.8 — 10 August 2026

Fixes a deploy mistake from v0.3.7's select rebuild — no engine or chrome
changes of its own.

**Nighthawk shipped the old select under the new select's CSS.** v0.3.7
replaced the native `<select>` with a proper listbox (see below), but the
updated chart module was uploaded to the repo root instead of
`infographics/`, which is the path the README, manifest and every Webflow
embed actually reference. The shipped file kept the native `<select
class="eureka-select">`, which then inherited the new button/listbox
styling (flex layout, no `appearance` reset, no `color-scheme: dark`) and
rendered oversized and misaligned next to the mode buttons. The correct
module now lives only at `infographics/nighthawk-trade-secrets.js`; the
stray root-level copy is removed.

Re-rendered the flowchart and both infographics headlessly against the
real `eureka.css`/`eureka.js` — all three clean, no console errors.

### v0.3.7 — carried in, previously untagged

**Select rebuilt as a custom listbox.** A native `<option>` list is drawn
by the platform outside the document, so `color-scheme: dark` was the only
thing v0.3.4's scoped `.eureka-select` rule could actually reach — font,
tracking, casing, padding and hover colour never crossed into the open
menu. `EUREKA.select(host, opts)` in `eureka.js` now builds the popup from
ordinary DOM (`<button>` + `<ul role="listbox">`), following the APG
listbox keyboard pattern. `.eureka-select` is the closed button,
`.eureka-listbox` / `.eureka-option` the panel — both on the same tokens
as `.eureka-control`, so a filter and a mode button read as one family.

## v0.3.4 — 4 August 2026

Supersedes the v0.3.2 and v0.3.3 packages, which were produced but never
tagged. Numbers are not reused, so those two are spent.

### Engine and chrome

**Bottom bar had no divider.** The rule was `.eureka-bar:last-of-type`, but
`:last-of-type` matches on element *type*, not class — every child of
`.eureka` is a div, so it resolved to `.eureka-sr` and never applied. Now
`.eureka-canvas ~ .eureka-bar`: any bar after the canvas is a bottom bar.

**The dot stopped on hover.** `.eureka[data-cycling="false"] .eureka-dot` set
`animation: none`, so pausing the cycle froze it. That followed from treating
the dot as a playback indicator; it is a liveness indicator for the chart, and
runs continuously. `data-cycling` remains on the root as a state hook with no
visual binding.

**Tooltip blocked node dragging.** A draggable tooltip must accept pointer
events, so it swallows any drag beginning underneath it — fine where marks are
static, wrong on a force graph. `draggable` is now per-preset; `network` sets
it false, and the engine publishes `data-draggable` for CSS to match.

**Select rendered as a native control.** `.eureka-select` lost to more specific
form rules in the host stylesheet. Scoped to `.eureka .eureka-select`, with
`color-scheme: dark` — the only reliable way to darken a native option list.

### Project Nighthawk

- Eyebrow reads `PROJECT NIGHTHAWK · TRADE SECRETS NETWORK`; the SVG
  accessible name matches.
- `REGISTER` mode relabelled **`TRADE SECRETS`** — button, status readout and
  header comment. Internal `data-m="register"` unchanged.
- Application filter moved to the end of the controls and relabelled
  `APPLICATION`.
- **Drift restored.** `clampAll()` zeroed velocity on wall contact, which was
  survivable at 13 nodes and fatal at 36 — far more nodes rest against an edge
  at any moment, so drift was cancelled faster than it accumulated. Nodes now
  reflect at `CFG.bounce` (0.35). `driftAmp` .070 → .095.
- **Core secrets render identically to every other secret.** `core` stays in
  the data but must not change how a node looks: a register is a register, not
  a ranking. Legend entry removed.

### WIPO GII

- **The scale legend was unstyled and had no ramp.** Two causes. The three
  parts were authored as `<span>`, and an inline box ignores width, height and
  vertical margin — so the ramp had no size at all and never painted. And
  `.eureka-scale-label` was missing from the label base selector, so it
  rendered as default body text rather than Label 2. Markup returned to
  `<div>` (as v11 had it) and `display` is now declared explicitly on all
  three, so the rule holds whichever element is used.
- **The map painted its own ocean.** A `<rect>` filled with `Graph/Ocean`
  covered the canvas before anything else drew, so transparent CSS beneath it
  could never show through. Removed — landmasses now sit on the section
  background. The two lines are retained, commented, under `7a Ground`.

## v0.3.3 — 4 August 2026 (superseded, never tagged)

Styling regressions from the v8 / v0.3.x work.

**Force graph stopped drifting.** `clampAll()` zeroed a node's velocity on
contact with the wall. That was fine at 13 nodes; at 36 far more nodes rest
against an edge at any moment, so the drift was being cancelled faster than it
accumulated. Nodes now reflect off the wall at `CFG.bounce` (0.35) and turn
back into the field. `driftAmp` also raised .070 → .095.

**Tooltip blocked node dragging.** A draggable tooltip must accept pointer
events, so it swallows any drag beginning underneath it. Harmless where marks
are static; wrong on a force graph, where the tooltip sits over the node you
are reaching for. `draggable` is now a per-preset decision and `network` sets
it false. The engine publishes `data-draggable` so CSS can set
`pointer-events: none` to match.

**Dropdown rendered as a native control.** `.eureka-select` lost to more
specific rules in the host stylesheet. Scoped to `.eureka .eureka-select`, and
`color-scheme: dark` added — the only reliable way to make a native option
list render dark.

**Core secrets no longer look different.** `core` remains in the data but must
not change how a node renders: a register is a register, not a ranking. Node
size, stroke weight and label colour are now identical across all 29. The
"Core asset" legend entry is removed.

**Application filter** moved to the end of the control group and relabelled
`APPLICATION`.

## v0.3.2 — 4 August 2026

**Charts filled only the top half of their section.** The v0.3.0 migration
inserted `<div data-eureka>` between the Code Embed and the `.eureka` root.
That div has no CSS, so `height: auto` — and `.eureka { height: 100% }`
resolving against an auto-height parent collapses to its `min-height: 420px`.
On a taller section that is roughly half.

Fixed by removing the wrapper rather than styling it: the mount point now
*becomes* the `.eureka` root. `classList.add` preserves any class set in the
Designer. DOM depth now matches what the CSS was always written for.

Also added `.w-embed:has(> [data-eureka]) { height: 100% }` — Webflow's own
Code Embed wrapper is height:auto and sits in the same chain. Harmless where
the parent is auto; the chart falls back to min-height as before.

No other change.

## v0.3.0 — 4 August 2026

**Delivery changed.** Charts are now self-mounting JS modules served from
jsDelivr rather than 20–27 KB pastes into Webflow. A Code Embed is two lines:

```html
<div data-eureka="nighthawk"></div>
<script src="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.0/infographics/nighthawk-trade-secrets.js"></script>
```

Each module injects its own scoped `<style>` once and builds its markup into
every `[data-eureka="{slug}"]` on the page. Because everything is scoped to the
mount element rather than found by `document.querySelector`, two instances of
the same chart can coexist without an instance counter.

Releasing is now: commit, tag, change the tag in Webflow.

**No behavioural change** from v0.2.1 — same engine, same charts.

---

## v0.2.1 — 31 July 2026

- **Dot fixed.** `data-cycling` was written to the canvas div; the CSS keys off
  `.eureka[data-cycling]` on the root, so the root stayed at the markup default
  of `false` and the animation never ran.
- **Eyebrow** no longer overrides weight to 500 — inherits site Label 2 at 300.
- **Controls** have one active treatment. The former hi/mid/lo variants used
  `#0050AA`, not a Graph token, and implied a hierarchy the buttons lack.
- **Scale** returned to label-above-ramp with no tick numbers.
- **Backgrounds** on root and canvas are transparent; only bars carry a fill,
  so a chart merges into the page rather than sitting on its own slab.
- **Jitter fixed.** Sub-pixel positioning (rounding was the jitter), cached
  tooltip measurement, and the flip decision locked per item — a node near the
  threshold had been flipping side every frame as it drifted.
- **Hover resumes at the successor** of the hovered mark.
- **Focus ring** suppressed for pointer, kept for keyboard.
- Timings: dot 3000 · entrance 1500 · dense dwell 2000 · enter delay 3000 ·
  pulse stagger 1000 · fade 500 · step 250.
- GII zoom 0.70. Native SVG `<title>` tooltip removed.
- Guard when the library is absent, instead of a bare `ReferenceError`.

## v0.2.0 — 30 July 2026

First release of the shared engine — `frame`, `tip`, `cycle` — extracted from
the AU patent process flowchart, with Nighthawk's container-level pointer
interrupt and GII's dependency guard folded in.
