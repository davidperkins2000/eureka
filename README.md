# EUREKA visual system

D3 infographics, flowcharts and the shared engine behind them.
Served to [eurekaip.com.au](https://eurekaip.com.au) via jsDelivr.

```
eureka.js            core engine — frame · tip · cycle
eureka.css           Tier 1 chrome — tokens, bars, tooltip, dot
infographics/        one self-mounting module per chart
flowcharts/          process diagrams
data/                source datasets
docs/                changelog, manifest, visual language
```

## Using a chart in Webflow

Head, once per site:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.4/eureka.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.4/eureka.js"></script>
```

Code Embed, per chart — two lines:

```html
<div data-eureka="nighthawk"></div>
<script src="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.4/infographics/nighthawk-trade-secrets.js"></script>
```

Set the height on the **parent section** in the Designer; the chart fills it.

## Releasing

1. Commit the change
2. Tag it — `v0.3.1`, never reusing a number
3. Change the tag in the Webflow head and in each embed

jsDelivr caches a tag permanently, so a pinned URL can never shift under the
live site. Never point at `@main`: a push would silently change what visitors
load, which is the paste-drift problem relocated rather than solved.

`EUREKA.version` in the browser console should always match the tag in the URL.
If they disagree, something is stale.

## Version discipline

A version is assigned when a copy is **written out**, not when a working file
is edited. Edit freely; number it once, at the point it leaves for a tag.
`eureka.css` and `eureka.js` always move together.
