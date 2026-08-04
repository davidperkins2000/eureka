/* ═══════════════════════════════════════════════════════════════════════════
   eureka.js — v0.2.1 · 31 July 2026
   Core engine: frame · tip · cycle

   Extracted from the AU Patent Process flowchart, which is the most complete
   of the three implementations. Adds Nighthawk's container-level pointer
   interrupt and GII's dependency guard.

   Companion: eureka.css v0.2.1 — keep the versions in step.

   ─── PARAMETERS ────────────────────────────────────────────────────────────
   dwell 3000 (sparse) · dense 2000 · fade 500 · step 250 · start 3000 · resume 1500 · settle 250
   overlap 0.2 · hang 0.5 · pad 8
   All in EUREKA.defaults. Override per chart only where genuinely different.

   ─── VERSION DISCIPLINE ────────────────────────────────────────────────────
   A version is assigned when a copy is WRITTEN OUT, not when the working file
   is edited. Edit freely; number it once, at the point it leaves for Drive or
   Webflow. eureka.css moves in step. A number is never reused.
   ═══════════════════════════════════════════════════════════════════════════ */

(function (global) {
'use strict';

var EUREKA = global.EUREKA = global.EUREKA || {};
EUREKA.version = '0.2.1';

EUREKA.reduced = (
  typeof global.matchMedia === 'function' &&
  global.matchMedia('(prefers-reduced-motion: reduce)').matches
);

/* ── DEFAULTS ──────────────────────────────────────────────────────────────
   Written once. A chart sets `items`, `geom` and `rows`; everything else
   only when it genuinely differs.
   ──────────────────────────────────────────────────────────────────────── */
EUREKA.defaults = {
  dwell:   3000,   /* held at full opacity                      */
  fade:     500,   /* appear / disappear                        */
  step:     250,   /* item-to-item swap                         */
  start:   3000,   /* quiet before the first step               */
  resume:  1500,   /* quiet before resuming after an interrupt  */
  settle:   250,   /* short release after a hover-out           */

  anchor:  'box',    /* box | centre | pointer  */
  prefer:  'auto',   /* auto | x | y            */
  track:   'static', /* static | live           */
  mode:    'step',   /* step | flow             */

  overlap:  0.2,
  hang:     0.5,
  flip:     true,
  pad:      8,

  spring:  { k: 0.085, damp: 0.62, eps: 0.4 },

  draggable:  true,
  gateScroll: true,
  gateTab:    true,
  watchdog:   2000
};

EUREKA.preset = {
  choropleth: { anchor: 'centre', track: 'static' },
  network:    { anchor: 'box',    track: 'live'   },
  flowchart:  { anchor: 'box',    track: 'static', prefer: 'y' },
  ranking:    { anchor: 'box',    track: 'static' },
  hierarchy:  { anchor: 'centre', track: 'static' }
};

/* ── FRAME ─────────────────────────────────────────────────────────────────
   The only thing that measures. Everything downstream reads it.

   `scale` is the value that silently breaks a viewBox'd SVG: geometry in
   user units must be multiplied before it becomes host pixels. Charts with
   no viewBox get scale === 1 and the same code path.
   ──────────────────────────────────────────────────────────────────────── */
function shapeOf(a) {
  return a < 0.70 ? 'column'
       : a < 0.95 ? 'portrait'
       : a < 1.15 ? 'square'
       : a < 2.20 ? 'landscape'
       : 'banner';
}

EUREKA.frame = function (host, svg) {
  var cache = null;
  return {
    invalidate: function () { cache = null; },
    get: function () {
      if (cache) return cache;
      var hr = host.getBoundingClientRect();
      var sr = svg ? svg.getBoundingClientRect() : hr;
      var vb = svg && svg.viewBox && svg.viewBox.baseVal;
      var userW = (vb && vb.width) || sr.width || 1;
      var aspect = hr.width / (hr.height || 1);
      cache = {
        w: hr.width, h: hr.height,
        sx: sr.left - hr.left, sy: sr.top - hr.top,
        sw: sr.width, sh: sr.height,
        scale: (sr.width || 1) / userW,
        aspect: aspect,
        shape: shapeOf(aspect)
      };
      return cache;
    }
  };
};

/* ── TIP ───────────────────────────────────────────────────────────────────
   Builds a stable skeleton from the row spec once. `when` toggles `hidden`,
   so aria-live fires on fixed nodes rather than a replaced subtree.

   Row types: head · name · body · pair · meter · meta
   ──────────────────────────────────────────────────────────────────────── */
function fmt(v, f) {
  if (v == null) return '';
  if (typeof f === 'function') return f(v);
  if (typeof f === 'string')   return f.replace('{v}', v);
  return String(v);
}

EUREKA.tip = function (host, rows) {
  rows = rows || [];

  var el = document.createElement('div');
  el.className = 'eureka-tip';
  el.setAttribute('role', 'tooltip');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.setAttribute('data-show', 'false');
  host.appendChild(el);

  var sizeCache = null;

  var nodes = rows.map(function (r) {
    var d = document.createElement('div');
    d.className = 'eureka-tip-' + r.type;
    if (r.type === 'pair') {
      d.innerHTML = '<span class="eureka-tip-key"></span>' +
                    '<span class="eureka-tip-value"></span>';
    } else if (r.type === 'meter') {
      d.innerHTML = '<div class="eureka-tip-meter-fill"></div>';
    }
    el.appendChild(d);
    return d;
  });

  var api = {
    el: el,

    fill: function (item) {
      rows.forEach(function (r, i) {
        var n = nodes[i];
        var on = r.when ? !!r.when(item) : true;
        n.hidden = !on;
        if (!on) return;
        var v = typeof r.field === 'function' ? r.field(item) : item[r.field];
        if (r.type === 'pair') {
          n.firstChild.textContent = r.key || '';
          n.lastChild.textContent  = fmt(v, r.format);
        } else if (r.type === 'meter') {
          var pct = Math.max(0, Math.min(1, (v || 0) / (r.max || 1))) * 100;
          n.firstChild.style.width = pct.toFixed(0) + '%';
        } else {
          n.textContent = (r.prefix || '') + fmt(v, r.format);
        }
      });
      sizeCache = null;          /* content changed — remeasure once */
      return api;
    },

    /* Sub-pixel. Rounding made a slowly-drifting node's tooltip snap between
       whole pixels — the jitter was the rounding, not the motion. */
    at: function (x, y) {
      el.style.left = x.toFixed(2) + 'px';
      el.style.top  = y.toFixed(2) + 'px';
      return api;
    },

    /* Cached. offsetWidth/offsetHeight force a synchronous layout, and live
       tracking calls this 60×/sec. Only content and resize change it. */
    size: function () {
      if (!sizeCache) {
        sizeCache = { w: el.offsetWidth || 220, h: el.offsetHeight || 120 };
      }
      return sizeCache;
    },
    remeasure: function () { sizeCache = null; return api; },

    show: function () { el.setAttribute('data-show', 'true');  return api; },
    hide: function () { el.setAttribute('data-show', 'false'); return api; },
    shown: function () { return el.getAttribute('data-show') === 'true'; },

    /* Fast transition while hopping between items; slow on arrive/leave. */
    stepping: function (on) {
      if (on) el.setAttribute('data-stepping', 'true');
      else    el.removeAttribute('data-stepping');
      return api;
    },

    dragging: function (on) {
      if (on) el.setAttribute('data-dragging', 'true');
      else    el.removeAttribute('data-dragging');
      return api;
    }
  };
  return api;
};

/* ── PLACEMENT ─────────────────────────────────────────────────────────────
   geom(item) → {x, y, w, h} in USER units. One signature covers a flowchart
   box, a force node (w = h = 2r) and a map centroid (w = h = 0).
   ──────────────────────────────────────────────────────────────────────── */
function placeFor(box, f, t, C, lock) {
  /* user units → host pixels */
  var bx = f.sx + box.x * f.scale,
      by = f.sy + box.y * f.scale,
      bw = (box.w || 0) * f.scale,
      bh = (box.h || 0) * f.scale;

  var prefer = C.prefer === 'auto'
    ? (f.shape === 'column' || f.shape === 'portrait' ? 'y' : 'x')
    : C.prefer;

  var p;
  if (C.anchor === 'centre') {
    p = { x: bx + 14, y: by - 18 };
  } else if (C.anchor === 'pointer') {
    p = { x: bx + 16, y: by - 16 };
  } else if (prefer === 'y') {
    /* Tooltip's bottom-right over the box's top-left, overlapping. */
    p = { x: bx - t.w * (1 - C.overlap), y: by - t.h * (1 - C.overlap) };
  } else {
    /* Clear of the box on the x axis, vertically centred on it. */
    p = { x: bx + bw + 14 - t.w * C.overlap, y: by + bh / 2 - t.h / 2 };
  }

  /* Flip rather than slide when the preferred side has no room — sliding
     would drag the tooltip across neighbouring marks.

     The decision is LOCKED for the life of an item. Recomputing it every
     frame let a node sitting near the threshold flip back and forth as it
     drifted, which was the larger half of the jitter. */
  var side = lock || {
    x: p.x + t.w + C.pad > f.w,
    y: p.y + t.h + C.pad > f.h
  };
  if (C.flip) {
    if (side.x) p.x = bx - t.w - 14 + t.w * C.overlap;
    if (side.y) p.y = by + bh - t.h + t.h * C.overlap;
  }

  /* Contain. `hang` lets the tooltip extend past the SVG edge — essential in
     a column canvas where there is no room inside — but never past the host. */
  var hangX = t.w * C.hang;
  var minX = Math.min(f.sx - hangX, f.w - t.w - C.pad);
  var maxX = Math.max(f.sx + f.sw - t.w + hangX, C.pad);
  var maxY = Math.max(f.h - t.h * (1 - C.hang), C.pad);

  return {
    x: Math.max(Math.min(minX, C.pad), Math.min(p.x, maxX)),
    y: Math.max(C.pad, Math.min(p.y, maxY)),
    side: side
  };
}

/* ── CYCLE ─────────────────────────────────────────────────────────────────
   States   idle → running ⇄ paused,  plus held (hover / drag)
   Phases   reveal → dwell → conceal → advance
   Timers   three named handles + one rAF. Never an array.
   Guard    `gen` invalidates any callback that outlives its transition.

   `held` never auto-resumes; it must be released. Ownership of the tooltip
   falls out of the state, so there is no separate owner flag.
   ──────────────────────────────────────────────────────────────────────── */
EUREKA.cycle = function (opts) {

  var C = Object.assign({}, EUREKA.defaults,
                        EUREKA.preset[opts.preset] || {}, opts);

  var host  = C.host;
  /* State attributes go on the .eureka root, not the canvas — the CSS keys off
     `.eureka[data-cycling]`. Writing them to the host left the root stuck on the
     markup default of "false", which killed the dot animation outright. */
  var stateEl = C.stateEl ||
                (host.closest && host.closest('.eureka')) ||
                host;
  var items = C.items || [];
  var tip   = C.tip;
  var frame = C.frame;

  var state = 'idle';      /* idle | running | paused | held */
  var phase = 'reveal';
  var idx   = 0;
  var cur   = null;
  var gen   = 0;
  var placed = false;      /* first show is instant */

  var tPhase = null, tResume = null, tWatch = null, raf = null;

  /* spring state, only used in mode:'flow' and during drag */
  var anchor = { x: 0, y: 0 }, pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 };
  var drag = null, onSettle = null, postDrag = false;
  var side = null;         /* locked flip decision for the current item */

  function clearPhase () { clearTimeout(tPhase); tPhase = null; }
  function clearResume () { clearTimeout(tResume); tResume = null; }

  /* ── placement ── */
  function anchorFor (item, keepSide) {
    var p = placeFor(C.geom(item), frame.get(), tip.size(), C,
                     keepSide ? side : null);
    side = p.side;
    return p;
  }

  function put (item, keepSide) {
    var p = anchorFor(item, keepSide);
    anchor = p; pos = { x: p.x, y: p.y }; vel = { x: 0, y: 0 };
    tip.at(p.x, p.y);
  }

  /* ── spring, for mode:'flow' and drag release ── */
  function tick () {
    if (drag) { raf = requestAnimationFrame(tick); return; }
    vel.x = (vel.x + (anchor.x - pos.x) * C.spring.k) * C.spring.damp;
    vel.y = (vel.y + (anchor.y - pos.y) * C.spring.k) * C.spring.damp;
    pos.x += vel.x; pos.y += vel.y;
    tip.at(pos.x, pos.y);
    var done = Math.abs(pos.x - anchor.x) < C.spring.eps &&
               Math.abs(pos.y - anchor.y) < C.spring.eps &&
               Math.abs(vel.x) < C.spring.eps && Math.abs(vel.y) < C.spring.eps;
    if (!done) { raf = requestAnimationFrame(tick); return; }
    pos = { x: anchor.x, y: anchor.y }; vel = { x: 0, y: 0 };
    tip.at(pos.x, pos.y);
    raf = null;
    if (onSettle) { var cb = onSettle; onSettle = null; cb(); }
  }

  function spring () {
    if (EUREKA.reduced) {
      pos = { x: anchor.x, y: anchor.y }; vel = { x: 0, y: 0 };
      tip.at(pos.x, pos.y);
      if (onSettle) { var cb = onSettle; onSettle = null; cb(); }
      return;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  /* ── paint ── */
  function paint (item) {
    tip.fill(item);
    if (C.onEnter) C.onEnter(item);
  }

  function unpaint (item) {
    if (item && C.onExit) C.onExit(item);
  }

  /* ── phase machine ── */
  function run (g) {
    if (g !== gen || state !== 'running') return;

    switch (phase) {

      case 'reveal':
        cur = items[idx % items.length];
        if (!cur) return;
        side = null;                 /* recompute the flip for a new item */
        if (!placed) {
          placed = true;
          tip.stepping(false);
          paint(cur); put(cur); tip.show();
        } else if (C.mode === 'flow') {
          tip.stepping(false);
          paint(cur);
          anchor = anchorFor(cur);
          spring(); tip.show();
        } else {
          tip.stepping(true);
          paint(cur); put(cur); tip.show();
          tPhase = setTimeout(function () { tip.stepping(false); }, C.step);
        }
        return wait(C.fade, 'dwell', g);

      case 'dwell':
        return wait(C.dwell, 'conceal', g);

      case 'conceal':
        if (C.mode === 'flow') { phase = 'advance'; return run(g); }
        tip.stepping(true);
        tip.hide();
        return wait(C.step, 'advance', g);

      case 'advance':
        unpaint(cur);
        idx = (idx + 1) % items.length;
        phase = 'reveal';
        return run(g);
    }
  }

  function wait (ms, next, g) {
    clearPhase();
    tPhase = setTimeout(function () { phase = next; run(g); }, ms);
  }

  /* ── transitions ── */
  function start (delay) {
    if (state === 'running' || !items.length) return api;
    state = 'running'; phase = 'reveal';
    stateEl.setAttribute('data-cycling', 'true');
    var g = ++gen;
    clearPhase();
    tPhase = setTimeout(function () { run(g); },
                        delay != null ? delay : C.start);
    return api;
  }

  function pause (hold) {
    if (state !== 'running' && state !== 'held') return api;
    /* Advance past an item the viewer actually saw; hold one still fading
       in, so it reappears rather than being silently skipped. */
    if (state === 'running' && (phase === 'dwell' || phase === 'conceal')) {
      idx = (idx + 1) % items.length;
    }
    state = hold ? 'held' : 'paused';
    gen++;
    clearPhase();
    stateEl.setAttribute('data-cycling', 'false');
    if (!hold) { unpaint(cur); tip.hide(); }
    return api;
  }

  function resume (delay) {
    if (state === 'running') return api;
    clearResume();
    tResume = setTimeout(function () {
      tResume = null;
      if (state === 'held') return;        /* pointer still down / on a mark */
      postDrag = false;
      state = 'idle';
      start(0);
    }, delay != null ? delay
       : (postDrag ? C.dwell : C.resume));
    return api;
  }

  function stop () {
    state = 'idle'; gen++;
    clearPhase(); clearResume();
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    unpaint(cur); tip.hide();
    stateEl.setAttribute('data-cycling', 'false');
    cur = null;
    return api;
  }

  /* ── hover ── */
  function hoverIn (item, evt) {
    pause(true);
    cur = item;
    side = null;
    /* Resume from the item AFTER the one hovered — hover Australia at #22 and
       the tour continues at #23. Without this the cycle resumed wherever it
       happened to be, which is not what the viewer just asked for. */
    var at = items.indexOf(item);
    if (at > -1) idx = (at + 1) % items.length;
    paint(item);
    if (evt) {
      var f = frame.get();
      var r = host.getBoundingClientRect();
      var t = tip.size();
      var p = placeFor(
        { x: (evt.clientX - r.left - f.sx) / f.scale,
          y: (evt.clientY - r.top  - f.sy) / f.scale, w: 0, h: 0 },
        f, t, Object.assign({}, C, { anchor: 'pointer' })
      );
      anchor = p; pos = { x: p.x, y: p.y }; tip.at(p.x, p.y);
    } else {
      put(item);
    }
    placed = true;
    tip.show();
    return api;
  }

  function hoverMove (evt) {
    if (state !== 'held' || drag) return api;
    var f = frame.get();
    var r = host.getBoundingClientRect();
    var t = tip.size();
    var p = placeFor(
      { x: (evt.clientX - r.left - f.sx) / f.scale,
        y: (evt.clientY - r.top  - f.sy) / f.scale, w: 0, h: 0 },
      f, t, Object.assign({}, C, { anchor: 'pointer' })
    );
    anchor = p; pos = { x: p.x, y: p.y }; tip.at(p.x, p.y);
    return api;
  }

  function hoverOut () {
    if (state !== 'held') return api;
    unpaint(cur);
    tip.hide();
    state = 'paused';
    resume(C.settle);
    return api;
  }

  /* ── live tracking — call from a force simulation tick ── */
  function reanchor () {
    if (state === 'held' && drag) return api;
    if (!cur || !tip.shown()) return api;
    if (C.track !== 'live') return api;
    /* No frame.invalidate() here — the frame only changes on resize, and
       re-measuring it 60×/sec was both wasteful and a jitter source.
       keepSide reuses the locked flip decision. */
    put(cur, true);
    return api;
  }

  /* ── binding ──
     Container-level pointer events, so movement anywhere over the chart
     interrupts — including empty space, which GII never handled.
     `focusin` is guarded against pointer-originated focus: a <g tabindex="0">
     fires focus after pointerup and would otherwise strand the cycle. */
  function bind (el) {
    el = el || host;
    var down = false;

    el.addEventListener('pointerdown', function () { down = true; });
    el.addEventListener('pointerup', function () {
      setTimeout(function () { down = false; }, 80);
    });
    el.addEventListener('pointermove', function () {
      if (state === 'held' || drag) return;
      pause(); resume();
    });
    el.addEventListener('pointerleave', function () {
      if (state === 'held') return;
      resume();
    });
    el.addEventListener('wheel', function () {
      if (state === 'held') return;
      pause(); resume();
    }, { passive: true });
    el.addEventListener('focusin', function () {
      if (down) return;
      pause(); resume();
    });

    if (C.draggable) bindDrag();
    if (C.gateScroll) gateScroll();
    if (C.gateTab)    gateTab();
    if (C.watchdog)   watch();
    return api;
  }

  /* ── drag ──
     Post-drag holds a full dwell before advancing, so the tooltip does not
     vanish the moment the pointer is released. */
  function bindDrag () {
    var el = tip.el;
    el.addEventListener('pointerdown', function (e) {
      if (!tip.shown()) return;
      e.preventDefault(); e.stopPropagation();
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      var r = host.getBoundingClientRect();
      drag = { dx: e.clientX - r.left - pos.x, dy: e.clientY - r.top - pos.y };
      tip.dragging(true);
      pause(true);
      clearResume();
    });
    el.addEventListener('pointermove', function (e) {
      if (!drag) return;
      e.preventDefault();
      var r = host.getBoundingClientRect();
      var f = frame.get(), t = tip.size();
      var x = e.clientX - r.left - drag.dx;
      var y = e.clientY - r.top  - drag.dy;
      var hangX = t.w * C.hang;
      pos.x = Math.max(Math.min(f.sx - hangX, f.w - t.w - C.pad),
                       Math.min(x, Math.max(f.sx + f.sw - t.w + hangX, C.pad)));
      pos.y = Math.max(C.pad, Math.min(y, Math.max(f.h - t.h * (1 - C.hang), C.pad)));
      tip.at(pos.x, pos.y);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      el.addEventListener(ev, function () {
        if (!drag) return;
        drag = null;
        tip.dragging(false);
        vel = { x: 0, y: 0 };
        postDrag = true;
        state = 'paused';
        onSettle = function () { resume(); };
        spring();
      });
    });
  }

  /* ── gating ── */
  function gateScroll () {
    if (typeof IntersectionObserver === 'undefined') return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { if (state === 'idle') start(C.settle); }
        else stop();
      });
    }, { threshold: 0 }).observe(host);
  }

  function gateTab () {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (state === 'idle') start(C.settle);
    });
  }

  /* Recovers a `held` state that never got released — a touch that never
     received pointerup, a focus that never blurred. */
  function watch () {
    tWatch = setInterval(function () {
      if (state === 'held' && !drag && !tResume) {
        state = 'paused'; tip.hide(); resume();
      }
    }, C.watchdog);
  }

  var api = {
    start: start, pause: pause, resume: resume, stop: stop,
    hoverIn: hoverIn, hoverMove: hoverMove, hoverOut: hoverOut,
    bind: bind, reanchor: reanchor,
    current: function () { return cur; },
    state:   function () { return state; },

    /* Swap the item list without losing position — used when a filter
       changes the visible set, or a resize rebuilds the chart. */
    adopt: function (next) {
      items = next || [];
      if (idx >= items.length) idx = 0;
      return api;
    },

    destroy: function () {
      stop();
      if (tWatch) clearInterval(tWatch);
      return api;
    }
  };
  return api;
};

/* ── BOOT ──────────────────────────────────────────────────────────────────
   Head-loaded script tags are not guaranteed resolved at DOMContentLoaded,
   and Chrome and Safari schedule it differently. Poll, then run.
   ──────────────────────────────────────────────────────────────────────── */
EUREKA.boot = function (deps, fn, onFail) {
  var waited = 0, STEP = 60, LIMIT = 10000;
  function have (d) {
    return d.split('.').reduce(function (o, k) {
      return o == null ? o : o[k];
    }, global) != null;
  }
  (function check () {
    if (deps.every(have)) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
      } else { fn(); }
      return;
    }
    waited += STEP;
    if (waited >= LIMIT) {
      var missing = deps.filter(function (d) { return !have(d); });
      console.error('[eureka] timed out waiting for: ' + missing.join(', '));
      if (onFail) onFail(missing);
      return;
    }
    setTimeout(check, STEP);
  })();
};

/* Fonts change text metrics, which changes measured tooltip size. Wait for
   them where layout depends on measurement, with a ceiling so a missing
   font never blocks the render. */
EUREKA.fonts = function (ms) {
  if (!document.fonts) return Promise.resolve();
  return Promise.race([
    document.fonts.ready,
    new Promise(function (r) { setTimeout(r, ms || 1500); })
  ]);
};

})(typeof window !== 'undefined' ? window : globalThis);
