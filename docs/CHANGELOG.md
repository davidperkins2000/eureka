# Changelog

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
