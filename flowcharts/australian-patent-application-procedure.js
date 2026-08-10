/* ═══════════════════════════════════════════════════════════════════════
     EUREKA · flowcharts · australian-patent-application-procedure · v1
     Requires eureka.js + eureka.css v0.3.9 and D3 v7 in the site head.

     HEAD CODE (Site Settings → Custom Code → Head):
       <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.9/eureka.css">
       <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
       <script src="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.9/eureka.js"></script>

     CODE EMBED, per page — two lines:
       <div data-eureka="australian-patent-application-procedure"></div>
       <script src="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.9/flowcharts/australian-patent-application-procedure.js"></script>

     ─── WHAT THIS FILE OWNS ───────────────────────────────────────────
     The SPEC, and the layout that turns it into geometry. Nothing else.
     Tooltip construction, placement, the cycle, hover interrupt, drag,
     scroll/tab gating and the watchdog all come from EUREKA.cycle via
     the `flowchart` preset — which already anchors the tooltip's
     bottom-right over each box's top-left (anchor:'box', prefer:'y').

     ─── SPEC GRAMMAR ──────────────────────────────────────────────────
       Label | left annotation | right annotation
         >> Target Step @left|@right      forward skip from this step
         ? tooltip prose                  cycled + shown on hover
     Fields after the label are optional; blank means omitted.
     Indentation attaches a line to the step above it. Skip targets
     resolve FORWARD from their origin, so duplicate labels are safe.

     Nothing hardcodes a coordinate: box heights come from the measured,
     rendered font, so rewording a label re-lays-out the diagram.

     Height comes from the CONTENT, not the parent section — a process
     column has a natural length and letterboxing it into a fixed frame
     would either shrink the type below Label 2 or waste the page.
     ═══════════════════════════════════════════════════════════════════ */

(function () {
'use strict';

var SLUG = 'australian-patent-application-procedure';

if (typeof EUREKA === 'undefined' || !EUREKA.boot) {
  console.error('[eureka] eureka.js is not loaded. Add the library <script> and '
    + '<link> tags to Site Settings \u2192 Custom Code \u2192 Head.');
  return;
}

/* ═══ §1 SPEC ═══════════════════════════════════════════════════════ */

var SPEC = [
'Priority Patent Application | 0 months',
'  ? Establishes the earliest priority date. Everything downstream dates from here.',
'International Patent Application | 12 months | P1010\u2013P1030',
'  ? PCT filing preserves rights in member states for a further 18 months.',
'National Phase Entry in Australia | 30 months | P0214A',
'  ? Deadline to enter the Australian national phase from the priority date.',
'Request Examination | | P0205',
'  >> Acceptance of Patent Application @left',
'  ? Must be requested within five years of filing, or when directed by IP Australia.',
'Voluntary Amendments | | P0222',
'  ? Optional. Amendments may be filed at any time before acceptance.',
'Examination Report | | P0191',
'  >> File Response to Report @right',
'  ? Raises any objections to patentability. Twelve months to gain acceptance.',
'Excess Claims Fees (if applicable) | | P0203A',
'  ? Payable where the application carries more than twenty claims.',
'File Response to Report | | P0192',
'  ? Responds to objections by amendment, argument, or both.',
'Acceptance of Patent Application | | P0213(a)',
'  ? Acceptance is advertised, opening a three-month opposition period.',
'Excess Claims Fees (if applicable) | | P0213(b)',
'  ? Payable again on acceptance where claim numbers exceed the threshold.',
'Patent Granted \u2014 Certificate Issued',
'  ? Granted once the opposition period passes without a successful challenge.',
'Continuation / Renewal Fees Due Fourth Year | | P0211',
'  ? Renewal fees fall due annually from the fourth anniversary of filing.',
'Patent Term Expires \u2014 Maximum 20 Years',
'  ? Standard patents run twenty years from the filing date.'
].join('\n');

/* Layout physics only. Cycle timing lives in EUREKA.defaults. */
var CFG = {
  nodeW: 260, nodeMinH: 64, padX: 18, padY: 14, radius: 8,
  gapY: 28, laneW: 40, laneGap: 14, annoW: 76,
  arrowLen: 12, arrowHalfW: 2,
  mobileAt: 680,
  lineH: 12          /* resolved from the Label 2 token at build */
};

/* ═══ §2 TIER 2 LOCALS ══════════════════════════════════════════════
   Marks only. Chrome, tooltip and dot are Tier 1 in eureka.css.

   `overflow:visible` on the canvas is a FLOWCHART-FAMILY decision, the
   counterpart of `draggable:false` on network. A process column has a
   narrow left gutter, and the tooltip anchors to the outside of each
   box's top-left corner, so it must be allowed to hang past the canvas
   edge. Clipping it was the alternative and it is worse.

   The SVG is capped at its own natural width and centred, so it never
   scales ABOVE 1:1 — Label 2 means 10px on a wide screen, not 23px. */
var CSS = [
/* ── Tier 2 tokens ──────────────────────────────────────────────────
   A flowchart is line art and labels — it carries no data encoding, so
   it takes NOTHING from the Graph/* group. That matters: every Graph
   token is mode-blind (identical value in Base and Light mode, hardcoded
   rather than aliased), so a flowchart built on them would be pinned to
   dark forever and read as a foreign object on a light page.

   The primary tokens all alias into the Neutral ramp and flip with the
   mode, so the diagram inherits light/dark for free. Tone pair is
   64 → 88, both real steps on the site ladder:
     resting marks   Text - Label/Medium   Light 64 / Dark 64
     current step    Text - Label/Strong   Light 88 / Dark 88
   Graph/Label Muted (0.42) is deliberately unused — it is not a step on
   the ladder and is the reason the diagram read disconnected. */
'.eureka--flow {',
'  --flow-dim:  var(--_🎨-color--tokens---text-label--medium);',
'  --flow-ink:  var(--_🎨-color--tokens---text-label--strong);',
'  --flow-line: var(--_🎨-color--tokens---border--subtle);',
'  /* Rebind Tier 1 so the shared chrome follows the same tokens. The',
'     accent drives the eyebrow and tooltip head; a flowchart wants both',
'     in quiet register, not the infographic cyan. */',
'  --eureka-ink:      var(--flow-ink);',
'  --eureka-muted:    var(--flow-dim);',
'  --eureka-choro-hi: var(--flow-dim);',
'  --eureka-tip-bg:   var(--_🎨-color--tokens---background--lift-64-opacity);',
'  --eureka-tip-line: var(--flow-line);',
'  height: auto; min-height: 0; background: transparent;',
'  /* Dragging the tooltip across the diagram was selecting the node',
'     labels, leaving a blue highlight smeared over the boxes. */',
'  -webkit-user-select: none; user-select: none;',
'}',

/* ── Shell ── */
'.eureka--flow .eureka-canvas { flex: none; height: auto; overflow: visible; }',
'/* Top padding is HEADROOM for the first box\u2019s tooltip, which anchors',
'   above it. Too little and the kernel clamps it down the canvas, so the',
'   first step sits lower than every other one. */',
'.eureka--flow .eureka-flow-pad { padding: 124px 16px 32px; }',
'/* Eyebrow only, centred. Deliberately NOT .eureka-bar: that carries a',
'   fill, a blur and a hairline that would demarcate a footer the',
'   flowchart does not have. */',
'.eureka--flow .eureka-flow-foot {',
'  display: flex; justify-content: center; padding: 4px 16px 0;',
'  background: transparent; border: none;',
'}',
'.eureka--flow .eureka-flow-foot .eureka-eyebrow { color: var(--flow-dim); }',

/* ── Diagram ── */
'.eureka--flow .eureka-flow-pad > svg {',
'  display: block;   /* SVG defaults to inline, where margin:0 auto does',
'                       nothing \u2014 the diagram stayed hard left and the',
'                       tooltip had no gutter to sit in. */',
'  width: 100%; max-width: var(--flow-w, 520px); height: auto;',
'  margin: 0 auto; overflow: visible;',
'}',
'.eureka--flow .eureka-flow-pad > svg text {',
'  font-family: var(--eureka-mono); font-size: var(--eureka-l2);',
'  font-weight: 300; letter-spacing: .4px;',
'}',
'.eureka--flow .eureka-node { cursor: default; }',
'.eureka--flow .eureka-node-box {',
'  fill: transparent; stroke: var(--flow-dim); stroke-width: 1px;',
'  transition: stroke var(--eureka-hover) ease, fill var(--eureka-hover) ease;',
'}',
'.eureka--flow .eureka-node.is-on .eureka-node-box,',
'.eureka--flow .eureka-node:hover .eureka-node-box { stroke: var(--flow-ink); }',
'.eureka--flow .eureka-node:hover .eureka-node-box { fill: var(--_🎨-color--base---neutral--light-4); }',
'.eureka--flow .eureka-node-label {',
'  fill: var(--flow-dim); text-anchor: middle; text-transform: uppercase;',
'  /* SVG text is positioned by its BASELINE, so anchoring the baseline at',
'     the box centre left every label sitting 3.5px high. `central` makes',
'     the y coordinate refer to the glyphs\u2019 vertical centre instead, which',
'     is what the layout maths already assumes. Measured: 0px offset on',
'     one-line and two-line boxes alike. */',
'  dominant-baseline: central;',
'  transition: fill var(--eureka-hover) ease;',
'}',
'.eureka--flow .eureka-node.is-on .eureka-node-label,',
'.eureka--flow .eureka-node:hover .eureka-node-label { fill: var(--flow-ink); }',
'.eureka--flow .eureka-edge { stroke: var(--flow-dim); stroke-width: 1px; fill: none; }',
'.eureka--flow .eureka-edge-head { fill: var(--flow-dim); stroke: none; }',
'.eureka--flow .eureka-anno {',
'  fill: var(--flow-dim); text-transform: uppercase;',
'  dominant-baseline: central;      /* same baseline correction as the labels */',
'  transition: fill var(--eureka-hover) ease;',
'}',
'.eureka--flow .eureka-anno.is-on { fill: var(--flow-ink); }',
'.eureka--flow .eureka-anno--l { text-anchor: end; }',
'.eureka--flow .eureka-anno--r { text-anchor: start; }',
'.eureka--flow .eureka-node:focus { outline: none; }',
'.eureka--flow .eureka-node:focus-visible .eureka-node-box { stroke: var(--flow-ink); }',

/* ── Tooltip ── */
'/* Uppercase throughout \u2014 label register, not prose. Tier 1 sets',
'   text-transform:none on .eureka-tip, so it is turned back on here. */',
'.eureka--flow .eureka-tip { text-transform: uppercase; }',
'.eureka--flow .eureka-tip-head {',
'  font-weight: 300; margin-bottom: 6px; color: var(--flow-dim);',
'}',
'.eureka--flow .eureka-tip-body {',
'  text-transform: uppercase; letter-spacing: .4px; line-height: 1.7;',
'  color: var(--flow-ink);',
'}'
].join('\n');

var INNER = [
'<div class="eureka-canvas">',
'  <div class="eureka-flow-pad">',
'    <svg role="img" aria-label="Australian patent application process"',
'         aria-describedby="au-pat-desc"></svg>',
'  </div>',
'</div>',
'<div class="eureka-flow-foot">',
'  <span class="eureka-eyebrow">',
'    <span class="eureka-dot" aria-hidden="true"></span>',
'    Australian Patent Application Process',
'  </span>',
'</div>',
'<div class="eureka-sr">',
'  <p id="au-pat-desc">Procedural flowchart of a standard Australian patent',
'    application from priority filing through PCT and national phase entry to',
'    examination, acceptance, grant and expiry at twenty years.</p>',
'</div>'
].join('\n');

var CLASSES = ['eureka', 'eureka--flow', 'eureka--au-patent'];

function injectCSS() {
  var id = 'eureka-css-' + SLUG;
  if (document.getElementById(id)) return;
  var el = document.createElement('style');
  el.id = id;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ═══ §3 PARSE ══════════════════════════════════════════════════════ */

function parse(src) {
  var steps = [], skips = [];

  src.split('\n').filter(function (l) { return l.trim(); }).forEach(function (line) {
    var indented = /^\s+/.test(line);
    var t = line.trim();

    if (!indented) {
      var f = t.split('|').map(function (s) { return s.trim(); });
      steps.push({ label: f[0], left: f[1] || null, right: f[2] || null, note: null });
      return;
    }
    var cur = steps[steps.length - 1];
    if (!cur) return;

    if (t.charAt(0) === '?') {
      cur.note = t.slice(1).trim();
    } else if (t.slice(0, 2) === '>>') {
      var body = t.slice(2).trim();
      var m = body.match(/^(.*?)\s*@(left|right)\s*$/);
      skips.push({
        fromLabel: cur.label,
        toLabel: (m ? m[1] : body).trim(),
        side: m ? m[2] : 'right'
      });
    }
  });

  /* Forward search from the origin is what makes duplicate labels safe. */
  skips.forEach(function (s) {
    s.from = steps.findIndex(function (st) { return st.label === s.fromLabel; });
    s.to = steps.findIndex(function (st, i) {
      return i > s.from && st.label === s.toLabel;
    });
    if (s.to === -1) console.warn('[eureka] unresolved skip target: ' + s.toLabel);
  });

  return { steps: steps, skips: skips.filter(function (s) { return s.to > -1; }) };
}

/* ═══ §4 MEASURE ════════════════════════════════════════════════════ */

/* Wrap against a live <text> probe so box heights come from the RENDERED
   font — what hand-authored SVG and fixed-height CSS both get wrong. */
function makeMeasurer(svg) {
  var probe = svg.append('text')
    .attr('class', 'eureka-node-label')
    .style('visibility', 'hidden');

  var cjk = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/;

  return {
    wrap: function (text, maxW) {
      var parts = cjk.test(text) ? Array.from(text) : text.split(/\s+/);
      var j = cjk.test(text) ? '' : ' ';
      var lines = [], cur = '';
      parts.forEach(function (p) {
        var trial = cur ? cur + j + p : p;
        probe.text(trial);
        if (probe.node().getComputedTextLength() > maxW && cur) {
          lines.push(cur); cur = p;
        } else { cur = trial; }
      });
      if (cur) lines.push(cur);
      return lines;
    },
    destroy: function () { probe.remove(); }
  };
}

/* ═══ §5 LAYOUT ═════════════════════════════════════════════════════ */

/* Lane per skip; overlapping spans push outward. Shortest first, so tight
   skips sit closest to the column. */
function assignLanes(skips, side) {
  var mine = skips.filter(function (s) { return s.side === side; })
    .sort(function (a, b) { return (a.to - a.from) - (b.to - b.from); });
  var lanes = [];
  mine.forEach(function (s) {
    var lane = -1;
    for (var i = 0; i < lanes.length; i++) {
      var clash = lanes[i].some(function (o) {
        return s.from < o.to && o.from < s.to;
      });
      if (!clash) { lane = i; break; }
    }
    if (lane === -1) { lane = lanes.length; lanes.push([]); }
    lanes[lane].push(s);
    s.lane = lane;
  });
  return lanes.length;
}

function layout(spec, measure, width) {
  var steps = spec.steps, skips = spec.skips;
  var mobile = width < CFG.mobileAt;
  var nodeW = Math.min(CFG.nodeW, width - (mobile ? 32 : 0));

  var y = 0;
  steps.forEach(function (s) {
    s.lines = measure.wrap(s.label, nodeW - CFG.padX * 2);
    s.h = Math.max(CFG.nodeMinH, s.lines.length * CFG.lineH + CFG.padY * 2);
    s.y = y;
    y += s.h + CFG.gapY;
  });
  var contentH = y - CFG.gapY;

  var L = assignLanes(skips, 'left');
  var R = assignLanes(skips, 'right');
  var leftLane = CFG.laneW * L, rightLane = CFG.laneW * R;
  var showAnno = !mobile;
  var gutter = showAnno ? CFG.annoW + CFG.laneGap : 0;

  var originX = leftLane + gutter;
  var totalW = originX + nodeW + rightLane + gutter;

  steps.forEach(function (s) {
    s.x = originX; s.w = nodeW; s.cx = originX + nodeW / 2;
  });

  skips.forEach(function (s) {
    var a = steps[s.from], b = steps[s.to];
    var y0 = a.y + a.h / 2, y1 = b.y + b.h / 2, lx;
    if (s.side === 'left') {
      lx = originX - CFG.laneW * (s.lane + 1);
      s.path = 'M' + a.x + ',' + y0 + ' H' + lx + ' V' + y1 + ' H' + (b.x - CFG.arrowLen);
      s.tip = { x: b.x, y: y1, dir: 'right' };
    } else {
      lx = originX + nodeW + CFG.laneW * (s.lane + 1);
      s.path = 'M' + (a.x + a.w) + ',' + y0 + ' H' + lx + ' V' + y1 +
               ' H' + (b.x + b.w + CFG.arrowLen);
      s.tip = { x: b.x + b.w, y: y1, dir: 'left' };
    }
  });

  return {
    steps: steps, skips: skips, width: totalW, height: contentH,
    originX: originX, nodeW: nodeW,
    leftLane: leftLane, rightLane: rightLane, gutter: gutter, showAnno: showAnno
  };
}

/* ═══ §6 RENDER ═════════════════════════════════════════════════════ */

/* ASME 3:1 arrowhead. One geometry for every edge — all edges run forward. */
function arrowPath(x, y, dir) {
  var L = CFG.arrowLen, W = CFG.arrowHalfW;
  if (dir === 'down')  return 'M' + x + ',' + y + ' L' + (x - W) + ',' + (y - L) + ' L' + (x + W) + ',' + (y - L) + ' Z';
  if (dir === 'right') return 'M' + x + ',' + y + ' L' + (x - L) + ',' + (y - W) + ' L' + (x - L) + ',' + (y + W) + ' Z';
  return 'M' + x + ',' + y + ' L' + (x + L) + ',' + (y - W) + ' L' + (x + L) + ',' + (y + W) + ' Z';
}

function render(svg, lay) {
  svg.selectAll('*').remove();
  svg.attr('viewBox', '0 0 ' + lay.width + ' ' + lay.height);

  var edges = svg.append('g'),
      nodes = svg.append('g'),
      annos = svg.append('g');

  lay.steps.forEach(function (s, i) {
    if (i === lay.steps.length - 1) return;
    var n = lay.steps[i + 1];
    edges.append('path').attr('class', 'eureka-edge')
      .attr('d', 'M' + s.cx + ',' + (s.y + s.h) + ' V' + (n.y - CFG.arrowLen));
    edges.append('path').attr('class', 'eureka-edge-head')
      .attr('d', arrowPath(s.cx, n.y, 'down'));
  });

  lay.skips.forEach(function (s) {
    edges.append('path').attr('class', 'eureka-edge').attr('d', s.path);
    edges.append('path').attr('class', 'eureka-edge-head')
      .attr('d', arrowPath(s.tip.x, s.tip.y, s.tip.dir));
  });

  var g = nodes.selectAll('g').data(lay.steps).join('g')
    .attr('class', 'eureka-node')
    .attr('tabindex', 0)
    .attr('data-i', function (d, i) { return i; });

  g.append('rect').attr('class', 'eureka-node-box')
    .attr('x', function (d) { return d.x; })
    .attr('y', function (d) { return d.y; })
    .attr('width', function (d) { return d.w; })
    .attr('height', function (d) { return d.h; })
    .attr('rx', CFG.radius);

  g.each(function (d) {
    var t = d3.select(this).append('text').attr('class', 'eureka-node-label')
      .attr('x', d.cx)
      .attr('y', d.y + d.h / 2 - (d.lines.length - 1) * CFG.lineH / 2);
    d.lines.forEach(function (ln, i) {
      t.append('tspan').attr('x', d.cx).attr('dy', i ? CFG.lineH : 0).text(ln);
    });
  });

  if (lay.showAnno) {
    var lx = lay.originX - lay.leftLane - CFG.laneGap;
    var rx = lay.originX + lay.nodeW + lay.rightLane + CFG.laneGap;
    lay.steps.forEach(function (d, i) {
      if (d.left) {
        annos.append('text').attr('class', 'eureka-anno eureka-anno--l')
          .attr('data-i', i).attr('x', lx).attr('y', d.y + d.h / 2).text(d.left);
      }
      if (d.right) {
        var lines = d.right.split('\u2013');       /* form ranges wrap */
        var tx = annos.append('text').attr('class', 'eureka-anno eureka-anno--r')
          .attr('data-i', i).attr('x', rx)
          .attr('y', d.y + d.h / 2 - (lines.length - 1) * CFG.lineH / 2);
        lines.forEach(function (ln, j) {
          tx.append('tspan').attr('x', rx).attr('dy', j ? CFG.lineH : 0)
            .text(j === 0 && lines.length > 1 ? ln + '\u2013' : ln);
        });
      }
    });
  }
  return g;
}

/* ═══ §7 BUILD ══════════════════════════════════════════════════════ */

/* The MOUNT POINT becomes the .eureka root — no wrapper is inserted.
   classList.add rather than className, so any Designer class survives.
   Everything is scoped to `host`, so two instances do not collide. */
function build(host) {
  CLASSES.forEach(function (c) { host.classList.add(c); });
  host.setAttribute('data-cycling', 'false');
  host.innerHTML = INNER;

  var pane  = host.querySelector('.eureka-canvas');
  var svgEl = host.querySelector('svg');
  var svg   = d3.select(svgEl);

  var frame = EUREKA.frame(pane, svgEl);

  /* No `name` row: it repeated the step label that is already sitting in
     the box the tooltip is attached to. The head carries the timing and
     form numbers, the body carries the note — nothing is duplicated. */
  var tip = EUREKA.tip(pane, [
    { type: 'head', field: function (d) {
        return [d.left, d.right].filter(Boolean).join(' \u00b7 ');
      }, when: function (d) { return !!(d.left || d.right); } },
    { type: 'body', field: 'note' }
  ]);

  /* Parse ONCE. layout() mutates these same step objects in place, so the
     cycle's item identity survives a resize — re-parsing on every draw
     handed the kernel fresh objects while it still held a stale `cur`,
     and the cycle stalled on the first step. */
  var spec  = parse(SPEC);
  var items = spec.steps.filter(function (s) { return !!s.note; });

  var lay = null, cycle = null, sel = null;

  function draw() {
    /* Type-derived geometry from the live token: change the Label 2
       line-height and every box re-sizes with it. */
    CFG.lineH = parseFloat(getComputedStyle(host)
      .getPropertyValue('--eureka-lh2')) || 12;

    var width = pane.clientWidth || 520;

    var probeSvg = svg.append('svg')
      .style('position', 'absolute').style('visibility', 'hidden')
      .style('width', '1px').style('height', '1px');
    var measure = makeMeasurer(probeSvg);

    lay = layout(spec, measure, width);

    measure.destroy(); probeSvg.remove();

    /* Cap the SVG at its own natural width so it never scales above 1:1. */
    host.style.setProperty('--flow-w', lay.width + 'px');

    sel = render(svg, lay);

    /* Hover interrupt. No event is passed: with an event the kernel anchors
       to the POINTER, which is right for a force graph and wrong here — a
       flowchart tooltip belongs on the box corner, every time. */
    /* While the tooltip is being dragged the pointer travels over other
       boxes, and their mouseenter would hijack the tooltip — you would
       drag "Examination Report" across the column and watch its content
       change under your hand. The kernel already flags the drag on the
       tooltip element, so use that as the guard rather than tracking
       button state separately. */
    function dragging() {
      return tip.el.getAttribute('data-dragging') === 'true';
    }

    sel.on('mouseenter', function (e, d) { if (d.note && !dragging()) cycle.hoverIn(d); })
       .on('mouseleave', function ()      { if (!dragging()) cycle.hoverOut(); })
       .on('focus',      function (e, d) { if (d.note && !dragging()) cycle.hoverIn(d); })
       .on('blur',       function ()      { if (!dragging()) cycle.hoverOut(); });

    frame.invalidate();
    tip.remeasure();
  }

  function mark(d, on) {
    if (!sel) return;
    var i = lay.steps.indexOf(d);
    sel.classed('is-on', function (s) { return on && s === d; });
    svg.selectAll('.eureka-anno').classed('is-on', function () {
      return on && +this.getAttribute('data-i') === i;
    });
  }

  EUREKA.fonts(1500).then(function () {
    draw();

    cycle = EUREKA.cycle({
      preset: 'flowchart',      /* anchor:'box', prefer:'y', track:'static' */
      host:   pane,
      frame:  frame,
      tip:    tip,
      items:  items,
      /* USER units — the kernel multiplies by frame.scale itself. */
      /* `hang` is how far past the SVG the tooltip may sit, as a fraction
         of its own width — and the kernel uses it for the DRAG bounds as
         well as the resting position. At 0 the drag window collapsed to
         roughly the width of the tooltip itself, which felt nailed down.

         Desktop has a wide canvas either side of a 520px diagram, so it
         can be opened right up. A phone has no such room: the same value
         would let the RESTING tooltip sit most of the way off-screen, so
         it stays near 0 there.

         Read once, at creation. A resize across the 680px breakpoint
         re-lays-out the diagram but leaves this value stale — an
         acceptable trade for not tearing down and rebinding the cycle. */
      hang:   lay.showAnno ? 0.9 : 0.05,
      geom:   function (d) { return { x: d.x, y: d.y, w: d.w, h: d.h }; },
      onEnter: function (d) { mark(d, true); },
      onExit:  function (d) { mark(d, false); }
    });
    cycle.bind(pane).start();

    /* ResizeObserver fires once on observe; the first callback is the
       initial size we have already drawn for. */
    var first = true, t;
    new ResizeObserver(function () {
      if (first) { first = false; return; }
      clearTimeout(t);
      t = setTimeout(function () { draw(); cycle.reanchor(); }, 160);
    }).observe(pane);
  });

}

EUREKA.boot(['d3', 'EUREKA.cycle'], function () {
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
