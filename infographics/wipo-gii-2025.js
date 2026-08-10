/* ═══════════════════════════════════════════════════════════════════════
     EUREKA · 001 · wipo-gii-2025 · v12
     Innovation Geography — WIPO GII 2025 choropleth.
     Requires eureka.js + eureka.css v0.3.10, D3 v7 and TopoJSON in the head.

     HEAD CODE (Site Settings → Custom Code → Head) — all four lines:
       <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.10/eureka.css">
       <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"></script>
       <script src="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.10/eureka.js"></script>
     The jsDelivr tag is pinned and immutable — bump it to release, never
     point at a branch.

     v11 → v12
     ─────────
     · Cycle, tooltip, placement and interrupt → EUREKA.cycle.
       Fixes: the phase-1 index advance that silently skipped a country when
       you hovered during a fade; the absent container interrupt (the map is
       now interruptible over ocean, not only over a country); `mouseleave`
       clearing `paused` while the pointer was still on the map; the stuck
       highlight when moving between adjacent countries.
     · Floating HUD → bar chrome, matching Nighthawk. Eyebrow and stats in
       the top bar, scale and credit in the bottom bar, canvas between.
     · mapZoom 0.75 → 0.70 so whole countries read.
     · Tooltip element opacity 0.88 → 1. The old value compounded with the
       0.88 background and dimmed the text to 88%.
     · Cycle now runs under prefers-reduced-motion — it is the aria-live
       tour. Entrance and pulse rings are what get suppressed.
     · Projection, GII data, hubs, the three-fallback ISO lookup and the
       pulse rings are unchanged.

     Set height on the PARENT section in the Designer; this fills it.
     ═══════════════════════════════════════════════════════════════════════ */

(function () {
'use strict';

var SLUG = 'wipo-gii-2025';

if (typeof EUREKA === 'undefined' || !EUREKA.boot) {
  console.error('[eureka] eureka.js is not loaded. Add the library <script> and '
    + '<link> tags to Site Settings \u2192 Custom Code \u2192 Head.');
  return;
}

var CSS   = "/* \u2500\u2500 \u00a73 TOKENS \u00b7 Tier 2 locals \u2500\u2500 */\n.eureka--wipo-gii {\n  --gii-border:    rgba(0,100,145,0.16);\n  --gii-seam:      rgba(0,18,38,0.5);\n  --gii-domain-lo: 14;\n  --gii-domain-hi: 66;\n}";
var INNER = "<div class=\"eureka-bar\">\n    <div class=\"eureka-row\">\n      <span class=\"eureka-eyebrow\">\n        <span class=\"eureka-dot\" aria-hidden=\"true\"></span>\n        Innovation Geography &middot; WIPO GII 2025\n      </span>\n      <span class=\"eureka-stats\">\n        <span class=\"eureka-stat\">Economies <b>139</b></span>\n        <span class=\"eureka-stat\">Peak score <b>66.0</b></span>\n      </span>\n    </div>\n  </div>\n\n  <div class=\"eureka-canvas\">\n    <div class=\"eureka-loader\">Loading&hellip;</div>\n    <!-- No <title> element: browsers render SVG <title> as a native hover\n         tooltip, which fought the real one. aria-label carries the accessible\n         name; the description lives in the .eureka-sr block below. -->\n    <svg role=\"img\"\n         aria-label=\"Innovation Geography \u2014 WIPO Global Innovation Index 2025\"\n         aria-describedby=\"gii-desc-wipo-gii\"></svg>\n  </div>\n\n  <div class=\"eureka-bar\">\n    <div class=\"eureka-row eureka-row--tight\">\n      <div class=\"eureka-scale\">\n        <div class=\"eureka-scale-label\">Innovation score</div>\n        <div class=\"eureka-scale-ramp\"></div>\n      </div>\n      <span class=\"eureka-credit\">Source: WIPO GII 2025</span>\n    </div>\n  </div>\n\n  <div class=\"eureka-sr\">\n    <p id=\"gii-desc-wipo-gii\">World choropleth of 139 economies coloured by their\n      WIPO Global Innovation Index 2025 score. Deep navy is lower, electric cyan\n      higher. Pulse rings mark the top ten. Hover a country for its rank and score.</p>\n    <p>Top ten innovation economies by WIPO GII 2025 score:</p>\n    <ol>\n      <li>Switzerland \u2014 66.0</li><li>Sweden \u2014 62.6</li>\n      <li>United States \u2014 61.7</li><li>Republic of Korea \u2014 60.0</li>\n      <li>Singapore \u2014 59.9</li><li>United Kingdom \u2014 59.1</li>\n      <li>Finland \u2014 57.7</li><li>Netherlands \u2014 57.0</li>\n      <li>Denmark \u2014 56.9</li><li>China \u2014 56.6</li>\n    </ol>\n  </div>";
var CLASSES = ["eureka", "eureka--wipo-gii"];

function injectCSS() {
  var id = 'eureka-css-' + SLUG;
  if (document.getElementById(id)) return;
  var el = document.createElement('style');
  el.id = id;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* The MOUNT POINT becomes the .eureka root — no wrapper is inserted, because
   an intermediate auto-height div collapses `height:100%` to the min-height.
   classList.add rather than className, so any class set in the Designer
   survives. Everything is scoped to `host`, so two instances do not collide. */
function build(host) {
  CLASSES.forEach(function (c) { host.classList.add(c); });
  host.setAttribute('data-cycling', 'false');
  host.innerHTML = INNER;


  /* ═══ §1 CONFIG ═══════════════════════════════════════════════════════════ */
  var CFG = {
    mapZoom:   0.70,   /* 1 = fill the frame. Lower shows more of the globe. */
    scaleW:    6.3,
    scaleH:    3.25,
    graticule: 30,
    enterMs:   1500,
    pulseMs:   2700,
    pulseGap:  1000,
    topoUrl:  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
  };

  /* ═══ §2 STRINGS ══════════════════════════════════════════════════════════ */
  var STR = {
    rank:  'GII rank',
    score: 'Score\u00a0/\u00a0100',
    suffix:'\u00a0/ 139',
    fail:  'Map data unavailable.'
  };

  /* ═══ §5 DATA — ISO 3166-1 numeric, no leading zeros ══════════════════════ */
  var GII = {
  "756":{n:"Switzerland",s:66.0,r:1},"752":{n:"Sweden",s:62.6,r:2},
  "840":{n:"United States",s:61.7,r:3},"410":{n:"Republic of Korea",s:60.0,r:4},
  "702":{n:"Singapore",s:59.9,r:5},"826":{n:"United Kingdom",s:59.1,r:6},
  "246":{n:"Finland",s:57.7,r:7},"528":{n:"Netherlands",s:57.0,r:8},
  "208":{n:"Denmark",s:56.9,r:9},"156":{n:"China",s:56.6,r:10},
  "276":{n:"Germany",s:55.5,r:11},"392":{n:"Japan",s:53.6,r:12},
  "250":{n:"France",s:53.4,r:13},"376":{n:"Israel",s:52.3,r:14},
  "344":{n:"Hong Kong, China",s:51.5,r:15},"233":{n:"Estonia",s:51.1,r:16},
  "124":{n:"Canada",s:51.1,r:17},"372":{n:"Ireland",s:50.4,r:18},
  "40":{n:"Austria",s:50.1,r:19},"578":{n:"Norway",s:49.2,r:20},
  "56":{n:"Belgium",s:48.5,r:21},"36":{n:"Australia",s:48.0,r:22},
  "442":{n:"Luxembourg",s:47.3,r:23},"352":{n:"Iceland",s:47.0,r:24},
  "196":{n:"Cyprus",s:45.5,r:25},"554":{n:"New Zealand",s:45.5,r:26},
  "470":{n:"Malta",s:45.4,r:27},"380":{n:"Italy",s:44.9,r:28},
  "724":{n:"Spain",s:44.6,r:29},"784":{n:"UAE",s:44.2,r:30},
  "620":{n:"Portugal",s:43.9,r:31},"203":{n:"Czech Republic",s:42.0,r:32},
  "440":{n:"Lithuania",s:40.8,r:33},"458":{n:"Malaysia",s:40.6,r:34},
  "705":{n:"Slovenia",s:40.1,r:35},"348":{n:"Hungary",s:40.0,r:36},
  "100":{n:"Bulgaria",s:39.1,r:37},"356":{n:"India",s:38.2,r:38},
  "616":{n:"Poland",s:37.7,r:39},"191":{n:"Croatia",s:37.7,r:40},
  "428":{n:"Latvia",s:37.5,r:41},"300":{n:"Greece",s:37.4,r:42},
  "792":{n:"T\u00fcrkiye",s:37.2,r:43},"704":{n:"Viet Nam",s:37.1,r:44},
  "764":{n:"Thailand",s:36.7,r:45},"682":{n:"Saudi Arabia",s:36.0,r:46},
  "703":{n:"Slovakia",s:35.5,r:47},"634":{n:"Qatar",s:34.6,r:48},
  "642":{n:"Romania",s:34.3,r:49},"608":{n:"Philippines",s:33.6,r:50},
  "152":{n:"Chile",s:33.1,r:51},"76":{n:"Brazil",s:32.9,r:52},
  "480":{n:"Mauritius",s:32.5,r:53},"688":{n:"Serbia",s:31.7,r:54},
  "360":{n:"Indonesia",s:31.3,r:55},"268":{n:"Georgia",s:31.2,r:56},
  "504":{n:"Morocco",s:31.1,r:57},"484":{n:"Mexico",s:30.5,r:58},
  "51":{n:"Armenia",s:30.5,r:59},"643":{n:"Russia",s:30.3,r:60},
  "710":{n:"South Africa",s:30.1,r:61},"48":{n:"Bahrain",s:30.0,r:62},
  "807":{n:"North Macedonia",s:29.8,r:63},"499":{n:"Montenegro",s:29.8,r:64},
  "400":{n:"Jordan",s:29.7,r:65},"804":{n:"Ukraine",s:29.7,r:66},
  "8":{n:"Albania",s:29.6,r:67},"858":{n:"Uruguay",s:28.8,r:68},
  "512":{n:"Oman",s:28.7,r:69},"364":{n:"Iran",s:28.5,r:70},
  "170":{n:"Colombia",s:28.5,r:71},"188":{n:"Costa Rica",s:28.4,r:72},
  "414":{n:"Kuwait",s:28.2,r:73},"498":{n:"Moldova",s:27.4,r:74},
  "690":{n:"Seychelles",s:27.2,r:75},"788":{n:"Tunisia",s:27.0,r:76},
  "32":{n:"Argentina",s:26.8,r:77},"496":{n:"Mongolia",s:26.7,r:78},
  "860":{n:"Uzbekistan",s:26.5,r:79},"604":{n:"Peru",s:26.5,r:80},
  "398":{n:"Kazakhstan",s:26.3,r:81},"591":{n:"Panama",s:25.9,r:82},
  "388":{n:"Jamaica",s:25.2,r:83},"52":{n:"Barbados",s:25.1,r:84},
  "112":{n:"Belarus",s:25.1,r:85},"818":{n:"Egypt",s:24.7,r:86},
  "72":{n:"Botswana",s:24.6,r:87},"96":{n:"Brunei Darussalam",s:24.5,r:88},
  "686":{n:"Senegal",s:23.8,r:89},"422":{n:"Lebanon",s:23.6,r:90},
  "516":{n:"Namibia",s:23.5,r:91},"70":{n:"Bosnia & Herz.",s:23.4,r:92},
  "144":{n:"Sri Lanka",s:22.9,r:93},"31":{n:"Azerbaijan",s:22.9,r:94},
  "132":{n:"Cabo Verde",s:22.6,r:95},"417":{n:"Kyrgyzstan",s:22.6,r:96},
  "214":{n:"Dominican Republic",s:22.6,r:97},"222":{n:"El Salvador",s:22.2,r:98},
  "586":{n:"Pakistan",s:22.1,r:99},"116":{n:"Cambodia",s:22.0,r:100},
  "68":{n:"Bolivia",s:21.7,r:101},"218":{n:"Ecuador",s:21.5,r:102},
  "231":{n:"Ethiopia",s:21.4,r:103},"646":{n:"Rwanda",s:21.0,r:104},
  "566":{n:"Nigeria",s:20.8,r:105},"404":{n:"Kenya",s:20.4,r:106},
  "320":{n:"Guatemala",s:20.1,r:107},"558":{n:"Nicaragua",s:20.0,r:108},
  "288":{n:"Ghana",s:19.8,r:109},"50":{n:"Bangladesh",s:19.5,r:110},
  "340":{n:"Honduras",s:19.2,r:111},"600":{n:"Paraguay",s:19.0,r:112},
  "524":{n:"Nepal",s:18.5,r:113},"800":{n:"Uganda",s:18.2,r:114},
  "418":{n:"Laos",s:17.9,r:115},"104":{n:"Myanmar",s:17.6,r:116},
  "834":{n:"Tanzania",s:17.2,r:117},"716":{n:"Zimbabwe",s:16.9,r:118},
  "466":{n:"Mali",s:16.2,r:119},"368":{n:"Iraq",s:15.8,r:120},
  "694":{n:"Sierra Leone",s:15.5,r:121},"454":{n:"Malawi",s:15.0,r:122}
  };

  var HUBS = [
    [8.23,46.82],[18.00,59.33],[-98.0,39.50],[127.8,36.50],[103.8,1.35],
    [-2.00,54.00],[25.00,62.00],[5.30,52.10],[10.00,56.00],[104.0,35.00]
  ];

  /* ═══ §6 HELPERS ══════════════════════════════════════════════════════════
     world-atlas returns ids as 36, "36" or "036", unpredictably. Without the
     third branch every ISO code below 100 — Australia included — renders as
     no-data. */
  function lookup(id){
    if (id == null) return null;
    var s = String(id);
    return GII[s] || GII[s.padStart(3,'0')] || GII[String(parseInt(s,10))] || null;
  }
  function titleCase(s){
    return String(s).replace(/\b([a-z])/g, function(m,c){ return c.toUpperCase(); });
  }

  /* ═══ §9 BOOT ═════════════════════════════════════════════════════════════ */

  var root = host;
  var pane   = root.querySelector('.eureka-canvas');
  var svgEl  = pane.querySelector('svg');
  var loader = pane.querySelector('.eureka-loader');

  var frame = EUREKA.frame(pane, svgEl);

  var tip = EUREKA.tip(pane, [
    { type:'head',  field:function(d){ return titleCase(d.data.n); } },
    { type:'pair',  key:STR.rank,  field:function(d){ return '#' + d.data.r + STR.suffix; } },
    { type:'pair',  key:STR.score, field:function(d){ return d.data.s.toFixed(1); } },
    { type:'meter', field:function(d){ return d.data.s; }, max:66 }
  ]);

  var cycle = EUREKA.cycle({
    preset: 'choropleth',
    host: pane, tip: tip, frame: frame, items: [],
    dwell: 2000,          /* dense cadence — 122 marks */
    geom: function (it) { return { x: it.cx, y: it.cy, w: 0, h: 0 }; },
    onEnter: function (it) { hi(it.node); },
    onExit:  function (it) { lo(it && it.node); }
  });

  var T = {}, focus = null;

  function hi(node){
    if (!node) return;
    focus = node;
    d3.select(node).raise()
      .attr('stroke', T.hiStroke).attr('stroke-width', 1.0)
      .attr('filter', 'brightness(1.3)');
  }
  function lo(node){
    node = node || focus;
    if (!node) return;
    d3.select(node)
      .attr('stroke', T.border).attr('stroke-width', 0.4).attr('filter', null);
    if (node === focus) focus = null;
  }

  function render(){
    frame.invalidate();
    var W = Math.round(pane.clientWidth  || pane.getBoundingClientRect().width);
    var H = Math.round(pane.clientHeight || pane.getBoundingClientRect().height);
    if (!W || !H || isNaN(W) || isNaN(H)) {
      console.warn('[gii] canvas not measurable yet — set the section height in '
        + 'the Webflow Designer, not in the embed.');
      return;
    }

    var cs = getComputedStyle(root);
    T.border   = cs.getPropertyValue('--gii-border').trim();
    T.seam     = cs.getPropertyValue('--gii-seam').trim();
    T.ocean    = cs.getPropertyValue('--eureka-canvas').trim()     || '#08111F';
    T.empty    = cs.getPropertyValue('--eureka-land-empty').trim() || '#0B1D30';
    T.lo       = cs.getPropertyValue('--eureka-choro-lo').trim()   || '#0B2D52';
    T.hi       = cs.getPropertyValue('--eureka-choro-hi').trim()   || '#00B8E0';
    T.grid     = cs.getPropertyValue('--eureka-grid').trim();
    T.hiStroke = T.hi;

    var lo_ = parseFloat(cs.getPropertyValue('--gii-domain-lo')) || 14;
    var hi_ = parseFloat(cs.getPropertyValue('--gii-domain-hi')) || 66;
    var colour = d3.scaleSequential().domain([lo_, hi_])
                   .interpolator(d3.interpolate(T.lo, T.hi));

    /* Natural Earth, cover-scaled. Math.max fills both dimensions and clips;
       Math.min would letterbox. mapZoom scales within the frame. */
    var proj = d3.geoNaturalEarth1()
      .scale(Math.max(W/CFG.scaleW, H/CFG.scaleH) * CFG.mapZoom)
      .translate([W/2, H/2]);
    var path = d3.geoPath().projection(proj);

    /* Raw pixels, NO viewBox — a viewBox locks a coordinate system the
       browser then rescales, overriding reprojection on resize. */
    var svg = d3.select(svgEl)
      .attr('width', W).attr('height', H)
      .attr('viewBox', null).attr('preserveAspectRatio', null);

    d3.json(CFG.topoUrl).then(function (world) {
      var features = topojson.feature(world, world.objects.countries).features;
      var seams = topojson.mesh(world, world.objects.countries,
                                function(a,b){ return a !== b; });

      svg.selectAll('*').remove();

      /* 7a Ground — none. The chart used to paint an ocean rect across the
         whole canvas, which is why the map read as a blue slab rather than
         landmasses over the page. The section background now shows through.
         To restore a painted sea:
           svg.append('rect').attr('width',W).attr('height',H)
              .attr('fill',T.ocean).attr('aria-hidden','true');
      */

      /* 7b Grid */
      svg.append('path')
         .datum(d3.geoGraticule().step([CFG.graticule,CFG.graticule])())
         .attr('d',path).attr('fill','none')
         .attr('stroke',T.grid).attr('stroke-width',0.5).attr('aria-hidden','true');

      /* 7c Marks. byNode maps a rendered path back to its queue entry, so a
         hover hands the engine the same object it is cycling — without that,
         indexOf fails and the tour cannot resume at the successor. */
      var byIdx = {}, byNode = new Map();
      var marks = svg.append('g').attr('aria-hidden','true');
      marks.selectAll('path').data(features).join('path')
        .attr('d', path)
        .attr('fill', function(d){ var e=lookup(d.id); return e?colour(e.s):T.empty; })
        .attr('stroke', T.border).attr('stroke-width', 0.4)
        .attr('cursor', function(d){ return lookup(d.id)?'pointer':'default'; })
        .each(function(d,i){ byIdx[i] = this; })
        .on('mouseenter', function(event,d){
          var it = byNode.get(this);
          if (!it) return;
          cycle.hoverIn(it, event);
        })
        .on('mousemove', function(event,d){
          if (lookup(d.id)) cycle.hoverMove(event);
        })
        .on('mouseleave', function(){ cycle.hoverOut(); });

      /* 7d Seams */
      svg.append('path').datum(seams).attr('d',path).attr('fill','none')
         .attr('stroke',T.seam).attr('stroke-width',0.35).attr('aria-hidden','true');

      /* 7e Pulse — decorative, suppressed under reduced motion */
      var pulses = svg.append('g').attr('aria-hidden','true');
      HUBS.forEach(function(coord){
        var pt = proj(coord); if (!pt || isNaN(pt[0])) return;
        if (!EUREKA.reduced) {
          [0,1].forEach(function(wave){
            var ring = pulses.append('circle')
              .attr('cx',pt[0]).attr('cy',pt[1]).attr('r',2)
              .attr('fill','none').attr('stroke',T.hi)
              .attr('stroke-width',0.65).attr('opacity',0);
            (function loop(){
              ring.attr('r',2).attr('opacity',0.8).transition()
                .delay(wave*CFG.pulseGap).duration(CFG.pulseMs).ease(d3.easeCubicOut)
                .attr('r',14).attr('opacity',0).on('end',loop);
            })();
          });
        }
        pulses.append('circle').attr('cx',pt[0]).attr('cy',pt[1])
              .attr('r',2.2).attr('fill',T.hi).attr('opacity',0.9);
      });

      /* 7f Entrance — decorative */
      if (!EUREKA.reduced) {
        marks.style('opacity',0).transition()
          .duration(CFG.enterMs).ease(d3.easeCubicOut).style('opacity',1);
      }
      loader.hidden = true;

      /* §8 Queue — all 122, rank-ordered, so the top ten lead. */
      var queue = [];
      features.forEach(function(d,i){
        var e = lookup(d.id); if (!e) return;
        var c = path.centroid(d);
        if (!c || isNaN(c[0]) || isNaN(c[1])) return;
        queue.push({
          data: e, node: byIdx[i],
          cx: Math.max(10, Math.min(W-10, c[0])),
          cy: Math.max(10, Math.min(H-10, c[1]))
        });
      });
      queue.sort(function(a,b){ return a.data.r - b.data.r; });
      queue.forEach(function(it){ byNode.set(it.node, it); });

      cycle.adopt(queue);
      cycle.bind(pane).start();

    }).catch(function (err) {
      console.error('[gii] topology fetch failed:', err);
      if (loader) loader.textContent = STR.fail;
    });
  }

  render();

  var raf = null;
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { cycle.stop(); render(); });
    }).observe(pane);
  }

}

EUREKA.boot(["d3", "topojson", "EUREKA.cycle"], function () {
  var hosts = document.querySelectorAll('[data-eureka="' + SLUG + '"]');
  if (!hosts.length) {
    console.error('[eureka] no mount point found. Add '
      + '<div data-eureka="' + SLUG + '"></div> to the page.');
    return;
  }
  injectCSS();
  Array.prototype.forEach.call(hosts, build);
});

})();
