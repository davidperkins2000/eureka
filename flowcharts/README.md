# Flowcharts

The AU patent process flowchart is not yet in the repo. It runs standalone in
Webflow and has **not** been ported to `eureka.js`.

That is deliberate. The flowchart is the most complete of the three original
implementations, and `EUREKA.cycle` was extracted *from* it — its interrupt
model, spring travel, drag handling, scroll and tab gating, and touch path all
originated here. It works; porting it risks the one thing that is not broken.

Port it once the engine is proven on the two infographics. Its `--flow-*`
tokens (line art, no HUD, 1px stroke, ~0.4px tracking) should become Tier 1 in
`eureka.css` at that point rather than staying local — a flowchart is a
category, not a one-off, and the second one would otherwise duplicate them.
