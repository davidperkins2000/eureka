/* ═══════════════════════════════════════════════════════════════════════
     EUREKA · 002 · nighthawk-trade-secrets · v8
     Requires eureka.js + eureka.css v0.3.7 and D3 v7 in the site head. 10 AUgust 2026
     HEAD CODE (Site Settings → Custom Code → Head) — all four lines:
       <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.4/eureka.css">
       <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"></script>
       <script src="https://cdn.jsdelivr.net/gh/davidperkins2000/eureka@v0.3.4/eureka.js"></script>
     The jsDelivr tag is pinned and immutable — bump it to release, never
     point at a branch.

     v7 → v8
     ───────
     · Full register: 29 secrets across 6 categories and 4 applications,
       with cross-dependencies, protection rationale and a `core` flag.
     · Application filter (dropdown) — orthogonal to the mode buttons.
     · Modes redesigned. v7 had four that overlapped:
         secrets = all minus cross-links, i.e. not a distinct view
         cross   = carried all 6 categories and 28 hierarchy links,
                   burying the coupling it existed to show
       Now three, each answering a different question:
         TRADE SECRETS root + categories + secrets, hierarchy only
         TAXONOMY      root + categories — how the program is organised
         DEPENDENCIES  secrets only, cross-links only — what couples to what
     · Forces retuned for 35 nodes rather than 13.
     · Core secrets carry a heavier stroke.
     · Tooltip unchanged in shape. Cross-links show acronyms rather than
       full codes, which at four dependencies each was unreadable.

     Set height on the PARENT section in the Designer; this fills it.
     Illustrative dataset — entities and asset records are fictional.
     ═══════════════════════════════════════════════════════════════════════ */

(function () {
'use strict';

var SLUG = 'nighthawk';

if (typeof EUREKA === 'undefined' || !EUREKA.boot) {
  console.error('[eureka] eureka.js is not loaded. Add the library <script> and '
    + '<link> tags to Site Settings \u2192 Custom Code \u2192 Head.');
  return;
}

var CSS   = "/* \u2500\u2500 \u00a73 TOKENS \u00b7 Tier 2 locals \u2500\u2500 */\n.eureka--nighthawk {\n  --nh-root-fill:#06182c; --nh-root-str:#3D8FD8;\n  --nh-cat-fill: #081D36; --nh-cat-str: #00B8E0;\n  --nh-sec-fill: #0B1E30; --nh-sec-str: #2E6E96;\n  --nh-cross:    #0083B5;\n}\n.eureka--nighthawk .eureka-e-ts  { stroke:#0B2D52; stroke-width:1;   stroke-opacity:.7 }\n.eureka--nighthawk .eureka-e-cat { stroke:#003B75; stroke-width:1.4; stroke-opacity:.75 }\n.eureka--nighthawk .eureka-e-x   { stroke:#0083B5; stroke-width:1.1; stroke-opacity:.55; stroke-dasharray:4,4 }";
var INNER = "<div class=\"eureka-bar\">\n    <div class=\"eureka-row\">\n      <span class=\"eureka-eyebrow\">\n        <span class=\"eureka-dot\" aria-hidden=\"true\"></span>\n        Project Nighthawk &middot; Trade Secrets Network\n      </span>\n      <span class=\"eureka-controls\">\n        <button class=\"eureka-control\" data-on=\"true\" data-m=\"register\">Trade Secrets</button>\n        <button class=\"eureka-control\" data-m=\"taxonomy\">Taxonomy</button>\n        <button class=\"eureka-control\" data-m=\"deps\">Dependencies</button>\n        <select class=\"eureka-select\" data-app aria-label=\"Filter by application\">\n          <option value=\"\">Application</option>\n        </select>\n      </span>\n    </div>\n    <div class=\"eureka-row\">\n      <span class=\"eureka-legend\">\n        <span class=\"eureka-leg\"><i class=\"eureka-swatch\" style=\"background:#3D8FD8\"></i>Program</span>\n        <span class=\"eureka-leg\"><i class=\"eureka-swatch\" style=\"background:#00B8E0\"></i>Taxonomy</span>\n        <span class=\"eureka-leg\"><i class=\"eureka-swatch eureka-swatch--ring\"></i>Trade secret</span>\n        <span class=\"eureka-leg\"><i class=\"eureka-swatch eureka-swatch--dash\"></i>Cross-dependency</span>\n      </span>\n    </div>\n  </div>\n\n  <div class=\"eureka-canvas\">\n    <svg role=\"img\" aria-label=\"Project Nighthawk \u2014 trade secrets network\"\n         aria-describedby=\"nh-desc\"></svg>\n  </div>\n\n  <div class=\"eureka-bar\">\n    <div class=\"eureka-row eureka-row--tight\">\n      <span class=\"eureka-stats\">\n        <span class=\"eureka-stat\">Secrets <b data-f=\"s\">&mdash;</b></span>\n        <span class=\"eureka-stat\">Links <b data-f=\"e\">&mdash;</b></span>\n        <span class=\"eureka-stat eureka-stat--mode\">View <b data-f=\"m\">TRADE SECRETS</b></span>\n      </span>\n      <span class=\"eureka-credit\">Source: supplied</span>\n    </div>\n  </div>\n\n  <div class=\"eureka-sr\">\n    <p id=\"nh-desc\">Force-directed register of 29 trade secrets across six\n      technology categories and four applications, showing cross-dependencies\n      between secrets. Illustrative dataset; entities are fictional.</p>\n  </div>";
var CLASSES = ["eureka", "eureka--nighthawk"];

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


  /* ═══ §1 CONFIG — layout physics only; cycle timing is in EUREKA.defaults ══ */
  var CFG = {
    dRoot:150, dCat:70, dCross:130,
    qRoot:-1400, qCat:-620, qSec:-190,
    fitRef:620, fitMin:.5, fitMax:1.1,
    pad:14, labelDrop:16,
    vDecay:.55, aDecay:.030,
    ambient:.018, dragAlpha:.25,
    driftAmp:.095, driftRate:.0050,
    bounce:.35,          /* wall rebound; 0 = stick, 1 = elastic */
    rRoot:26, rCat:15, rSec:12,
    collide:11
  };

  /* ═══ §5 DATA ═════════════════════════════════════════════════════════════ */
  var ROOT = { id:'root', type:'root', code:'HAWK-TS', name:'Project Nighthawk',
    desc:'Dual-use program: collaborative drone swarms for defence, emergency response, survey and maritime operations. IP strategy built predominantly around trade secrets.' };

  var WHY = {
    undetectable:'Undetectable in the product',
    disclosure:  'Disclosure exceeds protection',
    unpatentable:'Not patentable, high value',
    export:      'Export-sensitive'
  };

  var APPS = [
    ['HAWKEYE','Contested Airspace'],
    ['LIFELINE','Emergency Response'],
    ['MERIDIAN','Survey & Inspection'],
    ['TIDEWATER','Maritime & Vessel Protection']
  ].map(function(a){ return { id:a[0], name:a[1] }; });

  var CATS = [
    ['C','Control / Autonomy'],
    ['N','Networking / Meshing'],
    ['D','Drone Design / Acoustics'],
    ['A','AI / Threat Detection'],
    ['O','Operations / SOPs'],
    ['X','Operator UX / Overrides']
  ].map(function(c){ return { id:c[0], label:c[0], type:'cat', name:c[1] }; });

  /* id, cat, label, name, desc, cross[], w, why, apps[], core */
  var S = [
  ['C101','C','DWCP','Dynamic Swarm Consensus Protocol','Hybrid consensus blending time-windowed majority voting with priority-weighted nodes, resolving conflicting instructions and reassigning leadership within 100ms.',['N208','A450','X503','C134'],.97,'undetectable',['HAWKEYE','LIFELINE','MERIDIAN','TIDEWATER'],1],
  ['C134','C','GDCP','GPS-Denied Collaborative Positioning','Swarm members derive shared position from relative ranging and visual landmarks when satellite navigation is unavailable, holding formation inside structures and tunnels.',['C101','N221','O614'],.89,'undetectable',['LIFELINE','HAWKEYE'],0],
  ['C156','C','SASK','Sea-State Adaptive Station-Keeping','Control response curves that hold position above a moving sea surface across varying swell and gust conditions without operator retuning.',['O629','D341'],.71,'undetectable',['TIDEWATER'],0],
  ['C178','C','CFAB','Corridor-Following Autonomy Behaviours','Autonomous tracking of pipelines, conductors and haul roads at survey altitude, including junction handling and re-acquisition after occlusion.',['A491','O637'],.76,'undetectable',['MERIDIAN'],0],
  ['C192','C','IEMB','Interception Envelope Manoeuvre Behaviours','Coordinated approach and shadowing behaviours for closing on an uncooperative airborne target and holding relative position while classification is confirmed.',['A450','A473','X541'],.93,'export',['HAWKEYE','TIDEWATER'],0],
  ['N208','N','SSNR','Sub-second Node Recovery','Mesh re-routing and handshake compression enabling degraded-link node reintegration in under one second without mission interruption.',['C101','X503','N221'],.88,'undetectable',['HAWKEYE','LIFELINE','MERIDIAN','TIDEWATER'],1],
  ['N221','N','FAMH','Frequency-Agile Mesh Hopping','Coordinated channel agility that preserves swarm cohesion under broadband interference, with rejoin behaviour for members that lose the hopping schedule.',['N208','C134','X529'],.91,'export',['HAWKEYE'],0],
  ['N244','N','FRRB','First-Responder Radio Bridging','Interoperability layer that relays swarm telemetry onto incumbent emergency services radio networks without dedicated ground equipment.',['N208','O614'],.64,'disclosure',['LIFELINE'],0],
  ['N267','N','OWRC','Over-Water Relay Chain','Link budget and relay spacing method maintaining vessel-to-swarm connectivity beyond line of sight over open water.',['N208','O629'],.72,'disclosure',['TIDEWATER'],0],
  ['D312','D','SPGU','Silent Propulsion Geometry \u2014 Urban','Propeller blade geometry and housing configuration reducing acoustic signature below 40dB at 20m in urban canyon reflective environments.',['A450','D358'],.85,'disclosure',['HAWKEYE'],0],
  ['D341','D','MCCP','Marine Corrosion Coating Process','Coating chemistry and application sequence extending airframe and motor service life under continuous salt exposure and deck washdown.',['C156','D372'],.67,'disclosure',['TIDEWATER'],0],
  ['D358','D','TMEP','Thermal-Managed Endurance Pack','Cell arrangement and thermal path design sustaining long survey sorties in high ambient temperature without derating.',['D312','O637'],.79,'disclosure',['MERIDIAN','TIDEWATER'],0],
  ['D372','D','DTRG','Debris-Tolerant Rotor Guard','Guard geometry permitting contact with rubble, wiring and vegetation while preserving lift efficiency and controllability.',['D341','O614'],.62,'disclosure',['LIFELINE'],0],
  ['D389','D','LORP','Low-Observable Radar Profile','Airframe shaping and material stack reducing radar return of the platform across the bands used by common small-craft and shipborne sets.',['D312','C192'],.87,'export',['HAWKEYE','TIDEWATER'],0],
  ['A450','A','ATAA','Adaptive Threat-Avoidance AI','On-board inference classifying threats across RF, visual and acoustic channels, triggering evasion trajectories without ground control authorisation.',['C101','D312','X503','C192'],.96,'export',['HAWKEYE','TIDEWATER'],0],
  ['A462','A','VTSC','Victim Thermal Signature Classifier','Discriminates human thermal signatures from heated debris and residual fire in collapsed structures, prioritising search areas for ground teams.',['A518','O614'],.83,'unpatentable',['LIFELINE'],0],
  ['A473','A','HICM','Hostile Intent Classification Model','Behavioural model separating hostile approach patterns from routine traffic \u2014 closing geometry, speed profile and formation \u2014 for both airborne and surface contacts.',['A450','C192','A502','X541'],.94,'unpatentable',['HAWKEYE','TIDEWATER'],0],
  ['A491','A','SDRM','Structural Defect Recognition Model','Detects corrosion, conductor wear, insulator damage and ground encroachment from survey imagery, generating ranked inspection findings.',['C178','A518','O637'],.81,'unpatentable',['MERIDIAN'],0],
  ['A502','A','SCWD','Small-Craft Wake Discriminator','Identifies and tracks fast small craft against sea clutter by wake and motion signature at ranges where hull detection is unreliable.',['A473','A518','O652'],.90,'unpatentable',['TIDEWATER'],0],
  ['A518','A','STDP','Synthetic Training Data Pipeline','Generation and curation pipeline producing labelled training corpora for every on-board model, including rare-event and degraded-sensor cases.',['A462','A491','A502'],.95,'unpatentable',['HAWKEYE','LIFELINE','MERIDIAN','TIDEWATER'],1],
  ['O601','O','JWDP','Joint Swarm Deployment Protocols','Multi-domain sequencing for simultaneous activation of heterogeneous swarm elements across air, ground and communications assets.',['C101','X503'],.70,'unpatentable',['HAWKEYE'],0],
  ['O614','O','RDCS','Rapid Deploy \u2014 Collapsed Structure','Field procedure taking a swarm from vehicle to interior search in under four minutes, including void entry ordering and team handover points.',['C134','A462','D372','N244'],.75,'unpatentable',['LIFELINE'],0],
  ['O629','O','MDLR','Moving-Deck Launch & Recovery','Launch and recovery sequence for a pitching, rolling deck under way, including abort criteria and crew positioning.',['C156','N267'],.78,'unpatentable',['TIDEWATER'],0],
  ['O637','O','SMPH','Survey Mission Planning Heuristics','Planning rules balancing coverage, overlap, endurance and lighting to hit photogrammetric accuracy targets in a single sortie.',['C178','A491','D358'],.73,'unpatentable',['MERIDIAN'],0],
  ['O652','O','VPEP','Vessel Protection Escalation Procedure','Graduated response doctrine for an approaching unidentified craft \u2014 observation, illumination, hailing and audible warning \u2014 with master\u2019s authority gates at each step and incident logging.',['A502','A473','X541'],.86,'unpatentable',['TIDEWATER'],0],
  ['X503','X','ZLOO','Zero-Latency Operator Override Bridge','Interrupt architecture ensuring operator commands propagate to all swarm nodes within one radio frame, overriding any autonomous consensus state.',['C101','N208','A450','O601'],.92,'undetectable',['HAWKEYE','LIFELINE','MERIDIAN','TIDEWATER'],1],
  ['X516','X','SOMS','Single-Operator Multi-Swarm Interface','Attention-management model letting one operator supervise several swarms by surfacing only decisions that require human authority.',['X503','X529'],.84,'undetectable',['HAWKEYE','LIFELINE','MERIDIAN','TIDEWATER'],1],
  ['X529','X','DLOF','Degraded-Link Operator Feedback','Interface behaviour communicating swarm state and confidence when telemetry is intermittent, avoiding false certainty during link loss.',['N221','X516'],.69,'undetectable',['HAWKEYE','TIDEWATER'],0],
  ['X541','X','EAAG','Engagement Authority Gate','Authority model binding any deterrent action to an identified human decision-maker, with pre-action confirmation, immutable audit trail and hard interlocks against autonomous escalation.',['X503','C192','A473','O652'],.91,'export',['HAWKEYE','TIDEWATER'],0]
  ];

  var SECRETS = S.map(function (r) {
    return { id:r[0], cat:r[1], label:r[2], type:'secret',
             code:'HAWK-TS-'+r[0]+'-'+r[2], name:r[3], desc:r[4],
             cross:r[5], w:r[6], why:r[7], apps:r[8], core:!!r[9] };
  });

  var COL = {
    root:{ fill:'#06182c', str:'#3D8FD8' },
    cat: { fill:'#081D36', str:'#00B8E0' },
    sec: { fill:'#0B1E30', str:'#2E6E96' }
  };

  /* ═══ §6 HELPERS ══════════════════════════════════════════════════════════ */
  var byId = {};
  SECRETS.forEach(function(s){ byId[s.id] = s; });

  function rOf(d){
    return d.type==='root' ? CFG.rRoot : d.type==='cat' ? CFG.rCat : CFG.rSec;
  }
  function cOf(d){ return COL[d.type==='secret'?'sec':d.type]; }
  /* Every trade secret renders identically. `core` stays in the data and is
     available to the tooltip, but it must not change how a node looks — the
     register is a register, not a ranking. */
  function strOf(d){ return cOf(d).str; }
  function catName(id){
    var c = CATS.filter(function(x){ return x.id===id; })[0];
    return c ? c.name : '';
  }
  /* Acronyms, not full codes — four dependencies of HAWK-TS-N208-SSNR form is
     unreadable in a 292px tooltip. */
  function crossLabels(d){
    return (d.cross||[]).map(function(id){
      return byId[id] ? byId[id].label : '';
    }).filter(Boolean).join(' \u00b7 ');
  }
  function metaLine(d){
    if (d.type !== 'secret') return '';
    return 'Taxonomy \u00b7 ' + catName(d.cat) + '  \u2502  ' + (WHY[d.why] || '');
  }

  /* ═══ §9 BOOT ═════════════════════════════════════════════════════════════ */

  var root = host;
  var pane  = root.querySelector('.eureka-canvas');
  var svgEl = pane.querySelector('svg');
  var sel   = root.querySelector('[data-app]');
  var out   = {};
  root.querySelectorAll('[data-f]').forEach(function (el) { out[el.dataset.f] = el; });

  APPS.forEach(function (a) {
    var o = document.createElement('option');
    o.value = a.id;
    o.textContent = a.id.charAt(0) + a.id.slice(1).toLowerCase() + ' \u00b7 ' + a.name;
    sel.appendChild(o);
  });

  var frame = EUREKA.frame(pane, svgEl);

  var tip = EUREKA.tip(pane, [
    { type:'head',  field:function(d){ return d.code || d.id.toUpperCase(); } },
    { type:'meter', field:'w', max:1, when:function(d){ return d.w != null; } },
    { type:'name',  field:function(d){ return d.name || d.label; } },
    { type:'body',  field:'desc' },
    { type:'meta',  field:metaLine, when:function(d){ return d.type==='secret'; } },
    { type:'meta',  prefix:'\u27f7 ', field:crossLabels,
      when:function(d){ return (d.cross||[]).length > 0; } }
  ]);

  var svg = d3.select(svgEl), layer = svg.append('g');
  var sim, linkSel, nodeSel, nodes = [], mode = 'register', app = '';

  function W(){ return svgEl.clientWidth; }
  function H(){ return svgEl.clientHeight; }
  function K(){
    var s = Math.min(W(),H()) / CFG.fitRef;
    return Math.max(CFG.fitMin, Math.min(CFG.fitMax, s));
  }

  function limX(d,x){ var m=CFG.pad+rOf(d); return Math.max(m,Math.min(x,W()-m)); }
  function limY(d,y){
    var m=CFG.pad+rOf(d), drop=d.type==='cat'?CFG.labelDrop:0;
    return Math.max(m,Math.min(y,H()-m-drop));
  }
  /* Nodes are held inside the container. Zeroing velocity on contact — which
     v6 did with 13 nodes — kills the drift outright at 36, because far more
     nodes rest against a wall at any moment. Reflect instead, so a node that
     reaches the edge turns back into the field and keeps moving. */
  function clampAll(){
    for (var i=0;i<nodes.length;i++){
      var n=nodes[i], nx=limX(n,n.x), ny=limY(n,n.y);
      if(nx!==n.x){ n.x=nx; n.vx = -n.vx * CFG.bounce; }
      if(ny!==n.y){ n.y=ny; n.vy = -n.vy * CFG.bounce; }
    }
  }

  function forceDrift(){
    var ns, t=0, P=[];
    function f(){
      if (EUREKA.reduced) return;
      t += CFG.driftRate;
      for (var i=0;i<ns.length;i++){
        var n=ns[i]; if(n.fx!=null) continue;
        var p=P[i];
        n.vx += (Math.cos(t*p[0]+p[4])*.72 + Math.cos(t*p[1]+p[5])*.28) * CFG.driftAmp;
        n.vy += (Math.sin(t*p[2]+p[6])*.72 + Math.sin(t*p[3]+p[7])*.28) * CFG.driftAmp;
      }
    }
    f.initialize = function(n){
      ns = n;
      P = ns.map(function(_,i){
        var s = i*2.399963;
        return [.70+(i*7%5)*.11, 1.90+(i*3%4)*.17,
                .78+(i*5%5)*.09, 2.10+(i*11%4)*.13, s, s*1.7, s*2.3, s*.6];
      });
    };
    return f;
  }

  /* ── §7 Assembly ──────────────────────────────────────────────────────────
     Mode and application are orthogonal. Application narrows the secret set;
     mode decides which layers and which links are drawn. */
  function build(){
    var cp = function(d){ return Object.assign({},d); };
    var secs = SECRETS.filter(function(s){
      return !app || s.apps.indexOf(app) > -1;
    });

    var N=[], L=[];

    if (mode === 'deps') {
      /* Secrets only, cross-links only. No categories, no root — the whole
         point is to see coupling without the hierarchy on top of it. */
      N = secs.map(cp);
      var live = {};
      secs.forEach(function(s){ live[s.id] = 1; });
      secs.forEach(function(s){
        (s.cross||[]).forEach(function(t){
          if (live[t] && s.id < t) L.push({source:s.id,target:t,type:'cross'});
        });
      });
      return { nodes:N, links:L, secrets:secs.length };
    }

    /* Categories that still carry a secret under the current application. */
    var used = {};
    secs.forEach(function(s){ used[s.cat] = 1; });
    var cats = CATS.filter(function(c){ return !app || used[c.id]; });

    N.push(cp(ROOT));
    N = N.concat(cats.map(cp));
    cats.forEach(function(c){ L.push({source:'root',target:c.id,type:'cat'}); });

    if (mode === 'taxonomy') {
      return { nodes:N, links:L, secrets:0 };
    }

    N = N.concat(secs.map(cp));
    secs.forEach(function(s){ L.push({source:s.cat,target:s.id,type:'ts'}); });
    return { nodes:N, links:L, secrets:secs.length };
  }

  var cycle = EUREKA.cycle({
    preset: 'network',   /* network sets draggable:false — see below */
    host: pane, tip: tip, frame: frame, items: [],
    geom: function (n) {
      var r = rOf(n);
      return { x:n.x - r, y:n.y - r, w:r*2, h:r*2 };
    },
    onEnter: function (n) {
      if (nodeSel) nodeSel.classed('is-focus', function (d) { return d.id === n.id; });
    },
    onExit: function () {
      if (nodeSel) nodeSel.classed('is-focus', false);
    }
  });

  function render(){
    var d = build();
    nodes = d.nodes;
    out.s.textContent = d.secrets;
    out.e.textContent = d.links.length;
    out.m.textContent = mode==='deps' ? 'DEPENDENCIES'
                      : mode==='taxonomy' ? 'TAXONOMY' : 'TRADE SECRETS';

    layer.selectAll('*').remove();
    frame.invalidate();
    var k = K();

    sim = d3.forceSimulation(d.nodes)
      .force('link', d3.forceLink(d.links).id(function(n){ return n.id; })
        .distance(function(l){
          return (l.type==='cat'?CFG.dRoot : l.type==='cross'?CFG.dCross : CFG.dCat)*k; })
        .strength(function(l){ return l.type==='cross' ? .06 : .5; }))
      .force('charge', d3.forceManyBody().strength(function(n){
        return (n.type==='root'?CFG.qRoot : n.type==='cat'?CFG.qCat : CFG.qSec)*k; }))
      .force('center', d3.forceCenter(W()/2, H()/2).strength(.05))
      .force('collide', d3.forceCollide().radius(function(n){ return rOf(n)+CFG.collide*k; }))
      .force('drift', forceDrift())
      .velocityDecay(CFG.vDecay).alphaDecay(CFG.aDecay);

    linkSel = layer.append('g').selectAll('line').data(d.links).join('line')
      .attr('class', function(l){
        return l.type==='cross' ? 'eureka-e-x'
             : l.type==='cat'   ? 'eureka-e-cat' : 'eureka-e-ts'; });

    nodeSel = layer.append('g').selectAll('g').data(d.nodes).join('g')
      .attr('tabindex', 0).style('cursor','pointer')
      .call(d3.drag()
        .on('start', function(e,n){
          if(!e.active) sim.alphaTarget(CFG.dragAlpha).restart();
          n.fx=n.x; n.fy=n.y; cycle.pause(true);
        })
        .on('drag', function(e,n){ n.fx=limX(n,e.x); n.fy=limY(n,e.y); })
        .on('end', function(e,n){
          if(!e.active) sim.alphaTarget(CFG.ambient);
          n.fx=null; n.fy=null; cycle.hoverOut();
        }));

    /* Halo */
    nodeSel.append('circle')
      .attr('r', function(n){ return rOf(n)+8; }).attr('fill','none')
      .attr('stroke', strOf)
      .attr('stroke-width', function(n){ return n.type==='root'?1.5:1; })
      .attr('stroke-opacity', function(n){
        return n.type==='secret' ? .10 : .15; });

    /* Body */
    nodeSel.append('circle').attr('r', rOf)
      .attr('fill', function(n){ return cOf(n).fill; })
      .attr('stroke', strOf)
      .attr('stroke-width', function(n){
        return n.type==='root'?2 : n.type==='cat'?1.5 : 1; });

    /* Root — two lines */
    var rg = nodeSel.filter(function(n){ return n.type==='root'; });
    ['PROJECT','NIGHTHAWK'].forEach(function(w,i){
      rg.append('text').text(w).attr('text-anchor','middle').attr('y', i?6:-4)
        .attr('font-family','var(--eureka-mono)').attr('font-size',7)
        .attr('font-weight',500).attr('letter-spacing',1.4)
        .attr('fill','#8FC9F0').attr('pointer-events','none');
    });

    /* Category — letter inside, name beneath */
    var cg = nodeSel.filter(function(n){ return n.type==='cat'; });
    cg.append('text').text(function(n){ return n.label; })
      .attr('text-anchor','middle').attr('dominant-baseline','central')
      .attr('font-family','var(--eureka-mono)').attr('font-size',11)
      .attr('font-weight',500).attr('letter-spacing',1)
      .attr('fill',COL.cat.str).attr('pointer-events','none');
    cg.append('text').text(function(n){ return n.name; })
      .attr('text-anchor','middle').attr('y', function(n){ return rOf(n)+13; })
      .attr('font-family','var(--eureka-mono)').attr('font-size',7)
      .attr('font-weight',300).attr('letter-spacing',.4)
      .attr('fill',COL.cat.str).attr('fill-opacity',.6).attr('pointer-events','none');

    /* Secret — acronym only */
    nodeSel.filter(function(n){ return n.type==='secret'; })
      .append('text').text(function(n){ return n.label; })
      .attr('text-anchor','middle').attr('dominant-baseline','central')
      .attr('font-family','var(--eureka-mono)').attr('font-size',6.5)
      .attr('font-weight',500).attr('letter-spacing',.3)
      .attr('fill','#00B8E0').attr('pointer-events','none');

    nodeSel
      .on('mouseenter', function(e,n){ cycle.hoverIn(n, e); })
      .on('mousemove',  function(e){ cycle.hoverMove(e); })
      .on('mouseleave', function(){ cycle.hoverOut(); });

    sim.on('tick', function(){
      clampAll();
      linkSel.attr('x1',function(l){return l.source.x;}).attr('y1',function(l){return l.source.y;})
             .attr('x2',function(l){return l.target.x;}).attr('y2',function(l){return l.target.y;});
      nodeSel.attr('transform', function(n){ return 'translate('+n.x+','+n.y+')'; });
      cycle.reanchor();
    });

    sim.alpha(1).alphaTarget(CFG.ambient).restart();

    /* Cycle the secrets, best-protected first. Taxonomy mode walks categories. */
    var walk = d.nodes.filter(function(n){ return n.type==='secret'; })
                      .sort(function(a,b){ return b.w - a.w; });
    if (!walk.length) walk = d.nodes.filter(function(n){ return n.type==='cat'; });
    cycle.adopt(walk);
  }

  /* Controls */
  root.querySelectorAll('.eureka-control').forEach(function (btn) {
    btn.addEventListener('click', function () {
      root.querySelectorAll('.eureka-control').forEach(function(b){ b.removeAttribute('data-on'); });
      btn.setAttribute('data-on','true');
      mode = btn.dataset.m;
      render();
    });
  });
  sel.addEventListener('change', function () { app = sel.value; render(); });

  render();
  cycle.bind(pane).start();

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () {
      frame.invalidate();
      if (!sim) return;
      var k = K();
      sim.force('center', d3.forceCenter(W()/2, H()/2));
      sim.force('link').distance(function(l){
        return (l.type==='cat'?CFG.dRoot : l.type==='cross'?CFG.dCross : CFG.dCat)*k; });
      sim.force('charge').strength(function(n){
        return (n.type==='root'?CFG.qRoot : n.type==='cat'?CFG.qCat : CFG.qSec)*k; });
      sim.force('collide').radius(function(n){ return rOf(n)+CFG.collide*k; });
      sim.alpha(.3).alphaTarget(CFG.ambient).restart();
    }).observe(pane);
  }

}

EUREKA.boot(["d3", "EUREKA.cycle"], function () {
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
