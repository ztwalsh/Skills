/* Logo viewer. Reads window.LOGO (from data.js) and never writes anything.
   Plain script, no modules and no dependencies, so it runs from file:// as well as any server.
   Routes:  #/  ·  #/mark  ·  #/r<n>  ·  #/r<n>-<nnn>   (old links #r2-017, #017 and #/type still work) */
(function () {
  'use strict'

  var L = window.LOGO
  var $main = document.getElementById('main')
  var $app = document.getElementById('app')
  var $panel = document.getElementById('panel')
  var $scrim = document.getElementById('scrim')
  var $measure = document.getElementById('measure')
  var $selbar = document.getElementById('selbar')
  var $selcount = document.getElementById('selcount')
  var $selcopy = document.getElementById('selcopy')
  var $selclear = document.getElementById('selclear')

  /* ---------- helpers ---------- */

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('logo-viewer.' + k); return v == null ? d : v } catch (e) { return d } },
    set: function (k, v) { try { localStorage.setItem('logo-viewer.' + k, v) } catch (e) {} }
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }
  function arr(v) { return Array.isArray(v) ? v : [] }
  function pad(n) { n = String(n); return n.length >= 3 ? n : ('00' + n).slice(-3) }
  function num(v) { return +(+v).toFixed(2) }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many) }
  function reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) }
  function narrow() { return !!(window.matchMedia && matchMedia('(max-width: 899px)').matches) }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&') }
  function slug(s) { return String(s || 'logo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'logo' }
  function color(v, d) { v = String(v || '').trim(); return /^#[0-9a-f]{3,8}$/i.test(v) || /^rgba?\([\d\s.,%]+\)$/i.test(v) ? v : d }

  /* agent-written mark markup: trusted, but scripts and handlers are stripped all the same */
  function sanitize(s) {
    return String(s || '')
      .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<\/?(script|foreignObject|iframe|object|embed)[^>]*>/gi, '')
      .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s(href|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '')
  }

  var ICON = {
    sun: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" stroke-linecap="round"/></svg>',
    moon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z" stroke-linejoin="round"/></svg>',
    prev: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/></svg>',
    down: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    side: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5"/><path d="M10 2.75v10.5"/></svg>',
    tick: '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M2.5 6.2 5 8.6l4.5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"/></svg>',
    save: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 13.5h11" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  }

  /* ---------- data ---------- */

  var ok = !!(L && Array.isArray(L.rounds) && L.rounds.length)
  var NAME = ok ? String(L.name || 'logo') : 'logo'
  var C = { ink: color(ok && L.colors && L.colors.ink, '#131312'), paper: color(ok && L.colors && L.colors.paper, '#FAF8F5') }
  var ROUNDS = ok ? L.rounds.slice().sort(function (a, b) { return (a.n || 0) - (b.n || 0) }) : []
  var MARKS = {}      // id -> { m, r }
  var LED = {}        // id -> ids that list it as a parent
  var PICKS = ok && L.picks && typeof L.picks === 'object' ? L.picks : {}
  ROUNDS.forEach(function (r) {
    r.all = []
    arr(r.families).forEach(function (fam) {
      fam.marks = arr(fam.marks)
      fam.marks.forEach(function (m) {
        m._svg = sanitize(m.svg)
        r.all.push(m)
        MARKS[m.id] = { m: m, r: r }
      })
    })
  })
  ROUNDS.forEach(function (r) { r.all.forEach(function (m) { arr(m.parents).forEach(function (p) { (LED[p] = LED[p] || []).push(m.id) }) }) })
  var OUT = ok && L.outcome && L.outcome.mark && MARKS[L.outcome.mark] ? L.outcome : null
  var DECIDED = ok && L.status === 'decided' && !!OUT
  var WPARTS = ok && L.wordmark && arr(L.wordmark.parts).length ? arr(L.wordmark.parts).slice(0, 2).map(String) : [NAME]
  var TWO = WPARTS.length === 2
  var SMALL = OUT && OUT.smallCut && OUT.smallCut.svg
    ? { id: 'small-cut', n: 0, name: OUT.smallCut.name || 'Small cut', _svg: sanitize(OUT.smallCut.svg), fixed: OUT.smallCut.fixed !== false }
    : null

  function pickOf(id) { var p = PICKS[id]; return p === 'chosen' || p === 'final' || p === 'dropped' ? p : '' }
  /* the mark that stands for the project: the final one, else the latest chosen, else the first */
  function leadMark() {
    if (OUT) return MARKS[OUT.mark].m
    var best = null
    Object.keys(PICKS).forEach(function (id) {
      if (!MARKS[id]) return
      if (PICKS[id] === 'final') best = { id: id, w: 1e9 }
      else if (PICKS[id] === 'chosen') {
        var e = MARKS[id], w = e.r.n * 1000 + e.m.n
        if (!best || w > best.w) best = { id: id, w: w }
      }
    })
    if (best) return MARKS[best.id].m
    return ROUNDS[0].all[0]
  }

  /* ---------- marks: fit once, cache the transform ---------- */

  var FIT = 128
  var fitCache = {}
  var seq = 0
  function tok() { return 'u' + (++seq).toString(36) }
  function clean(m, t) { return m._svg.replace(/§/g, t || tok()) }
  function fitAll(list) {
    var todo = list.filter(function (m) { return m && !m.fixed && fitCache[m.id] === undefined })
    if (!todo.length) return
    $measure.innerHTML = todo.map(function (m, i) { return '<g>' + clean(m, 'fm' + i) + '</g>' }).join('')
    var gs = $measure.children
    for (var i = 0; i < todo.length; i++) {
      var m = todo[i], b
      try { b = gs[i].getBBox() } catch (e) { b = null }
      if (!b || (!b.width && !b.height)) { fitCache[m.id] = ''; continue }
      var k = (m.noFit ? 1 : Math.min(1, FIT / Math.max(b.width, b.height))) * (m.s != null ? +m.s : 1)
      var cx = b.x + b.width / 2, cy = b.y + b.height / 2
      fitCache[m.id] = 'translate(' + num(70 + (+m.dx || 0)) + ' ' + num(70 + (+m.dy || 0)) + ') scale(' + (+k).toFixed(4) + ') translate(' + num(-cx) + ' ' + num(-cy) + ')'
    }
    $measure.innerHTML = ''
  }
  function fitOf(m) {
    if (m.fixed) return ''
    if (fitCache[m.id] === undefined) fitAll([m])
    return fitCache[m.id]
  }
  /* a mark's content in its 140 box */
  function markG(m, t) {
    var tr = fitOf(m)
    return '<g' + (tr ? ' transform="' + tr + '"' : '') + '>' + clean(m, t) + '</g>'
  }
  function swapG(m) { return '<g class="swap"><g class="mk-swap">' + markG(m) + '</g></g>' }
  function markSvg(m, size, cls, swap, label) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 140 140"' + (size ? ' width="' + size + '" height="' + size + '"' : '') +
      ' fill="currentColor"' + (label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true"') + '>' + (swap ? swapG(m) : markG(m)) + '</svg>'
  }

  /* ---------- wordmarks ---------- */
  /* Two kinds: outlines (supplied artwork, or a font that has been outlined) and live fonts drawn as
     SVG text. Both become the same geometry: ink box per word, baseline, x-height top, ascender top. */

  var OPTS = []
  ;(function () {
    var w = (ok && L.wordmark) || {}
    if (w.supplied && arr(w.supplied.parts).length) OPTS.push({ id: 'supplied', label: 'Supplied', outline: w.supplied })
    arr(w.fonts).forEach(function (f) {
      if (!f || !f.id || !f.family) return
      OPTS.push({ id: String(f.id), label: String(f.family), font: f, outline: f.outline && arr(f.outline.parts).length ? f.outline : null })
    })
    if (!OPTS.length) OPTS.push({ id: 'system', label: 'System', font: { family: 'system-ui', weight: 500, tracking: -0.02, system: true } })
  })()
  function optById(id) { for (var i = 0; i < OPTS.length; i++) if (OPTS[i].id === id) return OPTS[i]; return null }
  var dataActive = ok && L.wordmark && optById(String(L.wordmark.active)) ? String(L.wordmark.active) : OPTS[0].id
  var current = optById(store.get('wordmark', '')) ? store.get('wordmark', '') : dataActive
  function curOpt() { return optById(current) || OPTS[0] }
  function optWeight(o) { return o.font ? (o.font.weight || 400) + (o.font.italic ? ' italic' : '') : '' }
  function exportable(o) { return !!o.outline }

  var GEO = {}
  var fontState = {}      // id -> loading | ready | failed
  var F = 200             // live fonts are set at 200 units
  function famCss(f) { return f.system ? 'system-ui, sans-serif' : '"' + String(f.family).replace(/["\\]/g, '') + '", system-ui, sans-serif' }
  function txf(f) {
    return function (s) { return f.transform === 'uppercase' ? s.toUpperCase() : f.transform === 'lowercase' ? s.toLowerCase() : s }
  }

  function outlineGeo(o) {
    var parts = arr(o.parts).slice(0, WPARTS.length)
    $measure.innerHTML = parts.map(function (p) { return '<path d="' + esc(p.d) + '"/>' }).join('')
    var ink = [].map.call($measure.children, function (el) {
      var b = el.getBBox(); return { x0: b.x, x1: b.x + b.width, y0: b.y, y1: b.y + b.height }
    })
    $measure.innerHTML = ''
    var join = +o.joinShift || 0
    var j = ink.length === 2
      ? { x0: ink[0].x0, x1: ink[1].x1 + join, y0: Math.min(ink[0].y0, ink[1].y0), y1: Math.max(ink[0].y1, ink[1].y1) }
      : ink[0]
    return { kind: 'outline', d: parts.map(function (p) { return String(p.d) }), n: parts.length, ink: ink, jInk: j, join: join,
      baseline: +o.baseline, xTop: +o.xTop, ascTop: +o.ascTop }
  }
  function fontGeo(f) {
    var t = txf(f), parts = WPARTS.map(t), joined = parts.join('')
    var c = document.createElement('canvas').getContext('2d')
    c.font = (f.italic ? 'italic ' : '') + (f.weight || 400) + ' ' + F + 'px ' + famCss(f)
    var ls = (+f.tracking || 0) * F
    if ('letterSpacing' in c) c.letterSpacing = ls + 'px'
    var caps = f.transform === 'uppercase'
    var xh = c.measureText(caps ? 'H' : 'x').actualBoundingBoxAscent
    function box(s) { var m = c.measureText(s); return { x0: -m.actualBoundingBoxLeft, x1: m.actualBoundingBoxRight, y0: -m.actualBoundingBoxAscent, y1: m.actualBoundingBoxDescent } }
    var ink = parts.map(box), j = box(joined)
    var asc = Math.max(xh, -j.y0)
    return { kind: 'font', f: f, parts: parts, joined: joined, ls: ls, n: parts.length, ink: ink, jInk: j,
      baseline: 0, xTop: -xh, ascTop: -asc }
  }
  function geoOf(o) {
    if (GEO[o.id]) return GEO[o.id]
    if (o.outline) return (GEO[o.id] = outlineGeo(o.outline))
    var st = fontState[o.id]
    if (o.font.system) st = fontState[o.id] = 'ready'
    if (st !== 'ready') { loadFont(o); return null }
    return (GEO[o.id] = fontGeo(o.font))
  }
  function loadFont(o) {
    if (fontState[o.id]) return
    var f = o.font, fam = String(f.family || '').trim()
    if (!/^[A-Za-z0-9 \-]+$/.test(fam)) { fontState[o.id] = 'failed'; return }
    fontState[o.id] = 'loading'
    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + fam.replace(/ /g, '+') + ':' + (f.italic ? 'ital,wght@1,' : 'wght@') + (parseInt(f.weight, 10) || 400) + '&display=swap'
    var sheet = new Promise(function (res) { link.onload = function () { res(true) }; link.onerror = function () { res(false) } })
    document.head.appendChild(link)
    var spec = (f.italic ? 'italic ' : '') + (parseInt(f.weight, 10) || 400) + ' 100px "' + fam + '"'
    var timeout = new Promise(function (res) { setTimeout(function () { res(null) }, 8000) })
    Promise.race([sheet.then(function (okSheet) { return okSheet && document.fonts ? document.fonts.load(spec, WPARTS.join('') + 'xhH') : [] }), timeout])
      .then(function (faces) { fontState[o.id] = faces && faces.length ? 'ready' : 'failed' }, function () { fontState[o.id] = 'failed' })
      .then(function () { delete GEO[o.id]; refreshLockups() })
  }

  /* lockup geometry, from the movethink board generalised by the x-height (xh = baseline - xTop):
     box side 1.707 xh, centred on the x-height; inline gaps 0.207 xh; mark first at 0.8 of that box,
     centred on ascender-to-baseline, 0.418 xh before the word; stacked at 1.7, 0.415 xh above the ascenders */
  var K_BOX = 1.707, K_GAP = 0.207, K_FIRST = 0.8, K_FIRST_GAP = 0.418, K_STACK = 1.7, K_STACK_GAP = 0.415
  function kindFor(kind) { return kind === 'inline' && !TWO ? 'first' : kind }
  function wordEl(g, i, dx) {
    if (g.kind === 'outline') return '<path d="' + esc(g.d[i]) + '"' + (dx ? ' transform="translate(' + num(dx) + ' 0)"' : '') + '/>'
    return textEl(g, g.parts[i], dx)
  }
  function textEl(g, s, dx) {
    var f = g.f
    return '<text x="' + num(dx || 0) + '" y="0" font-family="' + esc(famCss(f)) + '" font-size="' + F + '" font-weight="' + (parseInt(f.weight, 10) || 400) + '"' +
      (f.italic ? ' font-style="italic"' : '') + (g.ls ? ' letter-spacing="' + num(g.ls) + '"' : '') + '>' + esc(s) + '</text>'
  }
  function compose(kind, g, markHtml) {
    kind = kindFor(kind)
    var xh = g.baseline - g.xTop, box = K_BOX * xh, k = box / 140
    var words, bx, by, bk, inks
    if (kind === 'inline') {
      var gap = K_GAP * xh, i0 = g.ink[0], i1 = g.ink[1]
      bk = k; bx = i0.x1 + gap; by = (g.xTop + g.baseline) / 2 - box / 2
      var dx = bx + box + gap - i1.x0
      words = wordEl(g, 0, 0) + wordEl(g, 1, dx)
      inks = [i0, { x0: i1.x0 + dx, x1: i1.x1 + dx, y0: i1.y0, y1: i1.y1 }]
    } else {
      var j = g.jInk
      words = g.kind === 'outline' ? wordEl(g, 0, 0) + (g.n === 2 ? wordEl(g, 1, g.join) : '') : textEl(g, g.joined, 0)
      inks = [j]
      if (kind === 'stacked') { bk = K_STACK * k; var bs = 140 * bk; bx = (j.x0 + j.x1) / 2 - bs / 2; by = g.ascTop - K_STACK_GAP * xh - bs }
      else { bk = K_FIRST * k; var bf = 140 * bk; by = (g.ascTop + g.baseline) / 2 - bf / 2; bx = j.x0 - K_FIRST_GAP * xh - bf }
    }
    var side = 140 * bk
    var x0 = bx, x1 = bx + side, y0 = by, y1 = by + side
    inks.forEach(function (i) { x0 = Math.min(x0, i.x0); x1 = Math.max(x1, i.x1); y0 = Math.min(y0, i.y0); y1 = Math.max(y1, i.y1) })
    var mg = 0.12 * xh
    return {
      body: words + '<g transform="translate(' + num(bx) + ' ' + num(by) + ') scale(' + bk.toFixed(5) + ')">' + markHtml + '</g>',
      vb: [x0 - mg, y0 - mg, x1 - x0 + 2 * mg, y1 - y0 + 2 * mg]
    }
  }
  function lockupSvg(m, kind, opt, cls, swap) {
    opt = opt || curOpt()
    var g = geoOf(opt)
    var label = kind === 'inline' && TWO ? WPARTS[0] + ' ' + (m.id || '') + ' ' + WPARTS[1] : NAME + ', ' + (kindFor(kind) === 'stacked' ? 'stacked' : 'mark first')
    if (!g) {
      var st = fontState[opt.id]
      return '<span class="lockup-fb ' + (cls || '') + '" role="img" aria-label="' + esc(opt.label + (st === 'failed' ? ', font not loaded' : ', loading')) + '">' +
        '<span class="lockup-fb__name">' + esc(opt.label) + '</span><span class="lockup-fb__note">' + (st === 'failed' ? 'font not loaded' : 'loading font') + '</span></span>'
    }
    var c = compose(kind, g, swap ? swapG(m) : markG(m))
    return '<svg class="lockup ' + (cls || '') + '" viewBox="' + c.vb.map(num).join(' ') + '" fill="currentColor" role="img" aria-label="' + esc(label) + '">' + c.body + '</svg>'
  }
  /* re-draw every lockup after a font arrives or the wordmark changes */
  function refreshLockups() {
    // a font arriving redraws everything; keep the keyboard on the wordmark picker if it was there
    var a = document.activeElement, where = a && a.classList && a.classList.contains('wm__opt') ? (a.closest('.panel') ? 'p' : 'a') : null
    render(true)
    if (where) { var b = (where === 'p' ? $panel : $main).querySelector('.wm__opt[aria-checked="true"]'); if (b) b.focus({ preventScroll: true }) }
  }

  /* ---------- state ---------- */

  var ui = (function () {
    var d = { open: true, frac: 0.33 }
    try { var v = JSON.parse(store.get('ui', '{}')); return { open: typeof v.open === 'boolean' ? v.open : d.open, frac: typeof v.frac === 'number' ? v.frac : d.frac } } catch (e) { return d }
  })()
  if (narrow()) ui.open = false
  function saveUi() { store.set('ui', JSON.stringify({ open: narrow() ? readOpen() : ui.open, frac: ui.frac })) }
  function readOpen() { try { var v = JSON.parse(store.get('ui', '{}')); return typeof v.open === 'boolean' ? v.open : true } catch (e) { return true } }
  var MIN_PX = 320, MAX_FRAC = 0.6, DEF_FRAC = 0.33
  function clampFrac(f) { return Math.min(MAX_FRAC, Math.max(MIN_PX / window.innerWidth, f)) }

  var state = {
    page: null,        // 'mark' | 'round' | 'missing'
    r: null,           // round object on a round page
    sel: null,         // selected mark id on a round page
    sel2: new Set(),   // the shortlist (not saved)
    keys: [],          // shortlist keys in display order
    artMode: 'light',  // artwork section: light or dark
    cols: 8
  }

  /* ---------- shared chrome ---------- */

  function themeBtn() {
    var light = document.documentElement.getAttribute('data-theme') === 'light'
    return '<button type="button" class="iconbtn iconbtn--ring" data-act="theme" aria-label="' + (light ? 'Switch to dark mode' : 'Switch to light mode') + ' (D)" title="Light / dark (D)">' + (light ? ICON.moon : ICON.sun) + '</button>'
  }
  function pageSelect(value) {
    var o = ''
    if (DECIDED) o += '<option value="mark"' + (value === 'mark' ? ' selected' : '') + '>The mark</option>'
    ROUNDS.slice().reverse().forEach(function (r) { o += '<option value="r' + r.n + '"' + (value === 'r' + r.n ? ' selected' : '') + '>Round ' + esc(r.n) + '</option>' })
    return '<label class="select"><span class="vh">Page</span><select data-act="page">' + o + '</select>' + ICON.down + '</label>'
  }
  function headerMark() { return leadMark() }
  function top(value) {
    var lm = headerMark()
    return '<header class="top"><a class="top__home" href="#/" aria-label="' + esc(NAME) + ', home">' + lockupSvg(lm, 'inline', null, 'top__lockup') + '</a>' +
      '<div class="top__right">' + pageSelect(value) + themeBtn() + '</div></header>'
  }
  function markLink(id) {
    var e = MARKS[id]
    return e ? '<a class="idlink" href="#/' + esc(id) + '">' + esc(id) + '</a>' : '<span class="idlink">' + esc(id) + '</span>'
  }
  function links(ids) { return arr(ids).map(markLink).join('<span class="sep">, </span>') }
  function pickChip(p) {
    if (p === 'final') return '<span class="chip chip--final">Final</span>'
    if (p === 'chosen') return '<span class="chip chip--chosen">Chosen</span>'
    if (p === 'dropped') return '<span class="chip chip--quiet">Dropped</span>'
    return ''
  }
  function check(key, label) {
    return '<label class="check"><input type="checkbox" data-sel="' + esc(key) + '"' + (state.sel2.has(key) ? ' checked' : '') + '>' +
      '<span class="check__box" aria-hidden="true">' + ICON.tick + '</span><span class="vh">' + esc(label) + '</span></label>'
  }
  function iconTile(m, s, dark, swap) {
    var bg = dark ? C.ink : C.paper, fg = dark ? C.paper : C.ink
    return '<span class="icon' + (dark ? ' icon--dark' : ' icon--light') + '" style="width:' + s + 'px;height:' + s + 'px;border-radius:' + num(s * 0.225) + 'px;background:' + bg + ';color:' + fg + '">' +
      markSvg(m, Math.round(s * 0.66), '', swap) + '</span>'
  }

  /* ---------- round page ---------- */

  function pageRound(r) {
    fitAll(r.all)
    var meta = '<span>' + plural(r.all.length, 'mark', 'marks') + '</span>'
    if (arr(r.from).length) meta += '<span class="dot" aria-hidden="true"></span><span>Grew from ' + links(r.from) + '</span>'
    var cells = '', i = 0
    arr(r.families).forEach(function (fam) {
      if (!fam.marks.length) return
      var a = fam.marks[0].n, b = fam.marks[fam.marks.length - 1].n
      cells += '<div class="fam" style="--i:' + (i++) + '"><span class="fam__range">' + pad(a) + (b !== a ? '–' + pad(b) : '') + '</span>' +
        '<span class="fam__name">' + esc(fam.name || '') + '</span>' + (fam.note ? '<span class="fam__note">' + esc(fam.note) + '</span>' : '') + '</div>'
      fam.marks.forEach(function (m) {
        var p = pickOf(m.id)
        cells += '<div class="cell' + (state.sel2.has(m.id) ? ' is-selected' : '') + '" data-id="' + esc(m.id) + '" style="--i:' + (i++) + '">' +
          '<button type="button" class="cell__btn" data-mark="' + esc(m.id) + '" aria-pressed="' + (m.id === state.sel) + '" aria-controls="panel" aria-label="' + esc(pad(m.n) + ' ' + (m.name || '') + (p ? ', ' + p : '')) + '">' +
          markSvg(m, 0, 'cell__mark') + '<span class="cell__num">' + pad(m.n) + '</span><span class="cell__name">' + esc(m.name || '') + '</span></button>' +
          (p ? '<span class="cell__pick">' + pickChip(p) + '</span>' : '') + check(m.id, 'Shortlist ' + m.id) + '</div>'
      })
    })
    var sm = MARKS[state.sel] ? MARKS[state.sel].m : r.all[0]
    return top('r' + r.n) +
      '<div class="head head--row"><div><h1>Round ' + esc(r.n) + '</h1><p class="head__meta">' + meta + '</p></div>' +
      '<button type="button" class="pill toggle" data-act="panel" aria-expanded="' + ui.open + '" aria-controls="panel">' + ICON.side +
      '<span class="toggle__num num">' + (sm ? pad(sm.n) : '') + '</span><span class="vh">' + (ui.open ? 'Close preview' : 'Open preview') + '</span></button></div>' +
      '<section class="grid" id="grid" aria-label="Marks, round ' + esc(r.n) + '" style="--cols:' + state.cols + '">' + cells + '</section>'
  }

  var ro = null
  function watchGrid() {
    var el = document.getElementById('grid')
    if (ro) { ro.disconnect(); ro = null }
    if (!el || typeof ResizeObserver !== 'function') return
    ro = new ResizeObserver(function (en) {
      var w = en[0].contentRect.width, c = Math.max(2, Math.min(8, Math.floor(w / 160)))
      if (c !== state.cols) {
        state.cols = c
        el.style.setProperty('--cols', c)
        if (!dragging && !reduced() && el.animate) el.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 220, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' })
        lastChip = chipRect()
      }
    })
    ro.observe(el)
  }

  /* selection: the chip glides from the old cell to the new one (transform only) */
  var lastChip = null
  function chipEl(id) { var b = $main.querySelector('.cell[data-id="' + cssEsc(id || '') + '"] .cell__num'); return b }
  function chipRect() { var c = chipEl(state.sel); return c ? c.getBoundingClientRect() : null }
  function select(id, opts) {
    opts = opts || {}
    if (!MARKS[id] || state.page !== 'round' || MARKS[id].r !== state.r) return
    if (id === state.sel && !opts.force) return
    var before = chipRect()
    var old = $main.querySelector('.cell__btn[aria-pressed="true"]')
    if (old) old.setAttribute('aria-pressed', 'false')
    state.sel = id
    var btn = $main.querySelector('.cell__btn[data-mark="' + cssEsc(id) + '"]')
    if (btn) btn.setAttribute('aria-pressed', 'true')
    var chip = chipEl(id), now = chip ? chip.getBoundingClientRect() : null
    if (before && now && !reduced() && chip.animate) {
      var dx = before.left - now.left, dy = before.top - now.top
      if ((dx || dy) && Math.hypot(dx, dy) < 900) chip.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' })
    }
    var tn = $main.querySelector('.toggle__num'); if (tn) tn.textContent = pad(MARKS[id].m.n)
    if (location.hash !== '#/' + id) history.replaceState(null, '', '#/' + id)
    panelShow(MARKS[id].m)
    if (opts.scroll && btn) btn.scrollIntoView({ block: 'nearest' })
  }
  function step(d) {
    if (state.page !== 'round') return
    var all = state.r.all, k = -1
    for (var i = 0; i < all.length; i++) if (all[i].id === state.sel) k = i
    var to = all[Math.min(all.length - 1, Math.max(0, k + d))]
    if (to && to.id !== state.sel) select(to.id, { scroll: true })
  }

  /* ---------- panel ---------- */

  var panelFor = null   // { round, opt } the panel body was built for
  function panelBody(m) {
    var o = '', opt = curOpt()
    if (OPTS.length > 1) o += '<section class="wmsec">' + wmPicker('p', m) + '</section>'
    o += '<div class="panel__lineage" id="lineage">' + lineage(m) + '</div>'
    if (TWO) o += '<section><h3 class="label">Inline</h3><div class="sw">' + lockupSvg(m, 'inline', opt, '', true) + '</div></section>'
    o += '<section><h3 class="label">Mark first</h3><div class="sw">' + lockupSvg(m, 'first', opt, '', true) + '</div></section>'
    o += '<section><h3 class="label">Stacked</h3><div class="sw sw--tall">' + lockupSvg(m, 'stacked', opt, '', true) + '</div></section>'
    o += '<section><h3 class="label">App icon</h3><div class="icons">' + [120, 60, 29].map(function (s) {
      return '<div class="icons__set">' + iconTile(m, s, true, true) + iconTile(m, s, false, true) + '<span class="size">' + s + '</span></div>'
    }).join('') + '</div></section>'
    o += '<section><h3 class="label">Sizes</h3><div class="scale">' + [16, 24, 32, 48, 64, 96, 128].map(function (s) {
      return '<div class="scale__item">' + markSvg(m, s, '', true) + '<span class="size">' + s + '</span></div>'
    }).join('') + '</div><div class="lockscale">' + [16, 24, 40, 64].map(function (s) {
      return '<div class="lockscale__item" style="--h:' + s + 'px">' + lockupSvg(m, 'inline', opt, '', true) + '<span class="size">h ' + s + '</span></div>'
    }).join('') + '</div></section>'
    return o
  }
  function lineage(m) {
    var o = '', p = pickOf(m.id), led = LED[m.id] || []
    if (p) o += pickChip(p)
    if (arr(m.parents).length) o += '<span>Grew from ' + links(m.parents) + '</span>'
    if (led.length > 8) o += '<span class="led">Led to ' + links(led.slice(0, 6)) + '<span class="sep">, </span><button type="button" class="more" data-act="more" aria-label="Show all ' + led.length + ' marks it led to">and ' + (led.length - 6) + ' more</button><span class="led__rest" hidden>' + '<span class="sep">, </span>' + links(led.slice(6)) + '</span></span>'
    else if (led.length) o += '<span>Led to ' + links(led) + '</span>'
    return o
  }
  function panelHead(m, r) {
    var all = r.all, k = all.indexOf(m)
    return '<div class="handle" role="separator" tabindex="0" aria-orientation="vertical" aria-label="Resize preview panel" aria-valuemin="' + Math.round(MIN_PX / window.innerWidth * 100) +
      '" aria-valuemax="' + MAX_FRAC * 100 + '" aria-valuenow="' + Math.round(ui.frac * 100) + '" title="Drag to resize, double-click to reset"></div>' +
      '<header class="panel__head"><div class="panel__id" aria-live="polite"><span class="panel__num num" id="pnum">' + pad(m.n) + '</span><span class="panel__name" id="pname">' + esc(m.name || '') + '</span></div>' +
      '<div class="panel__nav"><button type="button" class="iconbtn" data-act="prev" aria-label="Previous mark"' + (k <= 0 ? ' disabled' : '') + '>' + ICON.prev + '</button>' +
      '<button type="button" class="iconbtn" data-act="next" aria-label="Next mark"' + (k >= all.length - 1 ? ' disabled' : '') + '>' + ICON.next + '</button>' +
      '<button type="button" class="iconbtn" data-act="close" aria-label="Close panel">' + ICON.close + '</button></div></header>' +
      '<div class="panel__body" id="pbody">' + panelBody(m) + '</div>'
  }
  function panelBuild(m) {
    $panel.innerHTML = panelHead(m, state.r)
    $panel.setAttribute('aria-label', 'Round ' + state.r.n + ', mark ' + pad(m.n) + ' preview')
    panelFor = { r: state.r, opt: current }
  }
  /* stepping swaps the mark in place: the old one leaves up the house angle, the new one arrives */
  function panelShow(m) {
    if (!panelFor || panelFor.r !== state.r || panelFor.opt !== current) { panelBuild(m); return }
    var swaps = $panel.querySelectorAll('.swap'), rm = reduced()
    for (var i = 0; i < swaps.length; i++) {
      var s = swaps[i], cur = s.lastElementChild
      while (s.firstElementChild && s.firstElementChild !== cur) s.removeChild(s.firstElementChild)
      if (rm || !cur) { s.innerHTML = '<g class="mk-swap">' + markG(m) + '</g>'; continue }
      cur.setAttribute('class', 'mk-swap mk-swap--out')
      cur.addEventListener('animationend', function () { if (this.parentNode) this.parentNode.removeChild(this) })
      s.insertAdjacentHTML('beforeend', '<g class="mk-swap mk-swap--in">' + markG(m) + '</g>')
    }
    var all = state.r.all, k = all.indexOf(m)
    var n = document.getElementById('pnum'), nm = document.getElementById('pname'), lin = document.getElementById('lineage')
    if (n) { n.textContent = pad(m.n); restartAnim(n, 'tick') }
    if (nm) { nm.textContent = m.name || ''; restartAnim(nm, 'fade') }
    if (lin) lin.innerHTML = lineage(m)
    var pv = $panel.querySelector('[data-act="prev"]'), nx = $panel.querySelector('[data-act="next"]')
    if (pv) pv.disabled = k <= 0
    if (nx) nx.disabled = k >= all.length - 1
    var labels = $panel.querySelectorAll('svg.lockup')
    for (var j = 0; j < labels.length; j++) { var lb = labels[j].getAttribute('aria-label') || ''; if (TWO && /^\S+ r\d+-\d+ /.test(lb)) labels[j].setAttribute('aria-label', WPARTS[0] + ' ' + m.id + ' ' + WPARTS[1]) }
    $panel.setAttribute('aria-label', 'Round ' + state.r.n + ', mark ' + pad(m.n) + ' preview')
  }
  function restartAnim(el, name) { el.classList.remove('is-' + name); void el.offsetWidth; el.classList.add('is-' + name) }

  function setPanel(open, focus) {
    ui.open = open
    $app.classList.toggle('is-open', open)
    if (open) $panel.removeAttribute('inert'); else $panel.setAttribute('inert', '')
    var t = $main.querySelector('[data-act="panel"]')
    if (t) { t.setAttribute('aria-expanded', String(open)); var v = t.querySelector('.vh'); if (v) v.textContent = open ? 'Close preview' : 'Open preview' }
    saveUi()
    if (open && focus) requestAnimationFrame(function () { $panel.focus({ preventScroll: true }) })
    lastChip = null
  }
  function closePanel() {
    setPanel(false)
    var b = $main.querySelector('.cell__btn[data-mark="' + cssEsc(state.sel || '') + '"]') || $main.querySelector('[data-act="panel"]')
    if (b) requestAnimationFrame(function () { b.focus() })
  }
  function applyFrac() { document.documentElement.style.setProperty('--panel', 'max(' + MIN_PX + 'px, ' + (ui.frac * 100).toFixed(2) + 'vw)') }

  /* resize: pointer capture on the handle; width kept as a fraction of the window */
  var dragging = false
  $panel.addEventListener('pointerdown', function (e) {
    if (!e.target.classList.contains('handle') || narrow()) return
    e.preventDefault(); e.target.setPointerCapture(e.pointerId); dragging = true; $app.classList.add('is-dragging')
  })
  $panel.addEventListener('pointermove', function (e) {
    if (!dragging) return
    ui.frac = clampFrac((window.innerWidth - e.clientX) / window.innerWidth); applyFrac(); handleValue()
  })
  function endDrag(e) {
    if (!dragging) return
    dragging = false; $app.classList.remove('is-dragging')
    try { e.target.releasePointerCapture(e.pointerId) } catch (x) {}
    saveUi()
  }
  $panel.addEventListener('pointerup', endDrag)
  $panel.addEventListener('pointercancel', endDrag)
  $panel.addEventListener('dblclick', function (e) { if (e.target.classList.contains('handle')) { ui.frac = DEF_FRAC; applyFrac(); handleValue(); saveUi() } })
  function handleValue() { var h = $panel.querySelector('.handle'); if (h) { h.setAttribute('aria-valuenow', Math.round(ui.frac * 100)); h.setAttribute('aria-valuetext', Math.round(ui.frac * 100) + '% of the window') } }
  $panel.addEventListener('keydown', function (e) {
    if (e.target.classList && e.target.classList.contains('handle')) {
      var d = { ArrowLeft: 0.02, ArrowRight: -0.02 }[e.key]
      if (d) ui.frac = clampFrac(ui.frac + d)
      else if (e.key === 'Home') ui.frac = clampFrac(0)
      else if (e.key === 'End') ui.frac = MAX_FRAC
      else if (e.key === 'Enter') ui.frac = DEF_FRAC
      else return
      e.preventDefault(); applyFrac(); handleValue(); saveUi(); return
    }
    var tag = (e.target.tagName || '').toLowerCase()
    if (tag === 'select' || tag === 'input') return
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1) }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1) }
  })
  $scrim.addEventListener('click', closePanel)
  window.addEventListener('resize', function () { var f = clampFrac(ui.frac); if (f !== ui.frac) { ui.frac = f; applyFrac() } })

  /* ---------- wordmark picker ---------- */
  /* one single-choice row of pills, used in the panel and in the summary's Artwork section.
     The project's recorded choice (wordmark.active) carries a small dot. */

  function optName(o) { return o.font ? o.label + ' ' + optWeight(o) : o.label }
  function optFull(o) {
    if (!o.font) return 'Supplied artwork'
    if (o.outline && o.outline.source && o.outline.source.name) return String(o.outline.source.name)
    return optName(o) + (o.outline ? '' : ', live text')
  }
  function wmPicker(ctx, m) {
    var cur = curOpt(), lid = 'wm-' + ctx
    var copy = m ? '<button type="button" class="wm__copy" data-act="copywm" data-mark="' + esc(m.id) + '" aria-label="Copy mark and wordmark, for the agent" title="Copy for the agent"><span>Copy</span></button>' : ''
    var head = ctx === 'a' ? '' : '<div class="wm__head"><span class="label" id="' + lid + '">Wordmark</span>' + wmKeyHtml() + copy + '</div>'
    return head +
      '<div class="wm" role="radiogroup" ' + (ctx === 'a' ? 'aria-label="Wordmark to export"' : 'aria-labelledby="' + lid + '"') + '>' + OPTS.map(function (o) {
        var on = o.id === cur.id, rec = o.id === dataActive
        return '<button type="button" class="wm__opt" role="radio" data-act="wm" data-opt="' + esc(o.id) + '" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" title="' + esc(optFull(o) + ' (' + o.id + ')') + '">' +
          (rec ? '<span class="wm__dot" aria-hidden="true"></span>' : '') + '<span>' + esc(optName(o)) + '</span>' +
          (o.font && !o.outline ? '<span class="wm__live">live</span>' : '') +
          (rec ? '<span class="vh">, recorded choice</span>' : '') + '</button>'
      }).join('') + '</div>'
  }
  /* the picked option stays visible inside its own scrolling row */
  function revealPicked() {
    var rows = document.querySelectorAll('.wm')
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i], b = row.querySelector('.wm__opt[aria-checked="true"]')
      if (!b) continue
      if (b.offsetTop < row.scrollTop || b.offsetTop + b.offsetHeight > row.scrollTop + row.clientHeight) row.scrollTop = b.offsetTop - 4
    }
  }
  function wmKeyHtml() { return '<span class="wm__key"><span class="wm__dot" aria-hidden="true"></span>recorded</span>' }
  function wmCopyText(markId) { return markId + ' with ' + curOpt().id }

  /* ---------- summary page ---------- */

  var MARK_SIZES = [128, 96, 64, 48, 32, 24, 16]
  function pageMark() {
    var m = MARKS[OUT.mark].m, opt = curOpt()
    fitAll([m])
    var minSize = +OUT.minSize || 16
    var o = top('mark')
    var e = MARKS[OUT.mark]
    o += '<section class="hero"><div class="hero__art">' + markSvg(m, 0, 'hero__mark', false, NAME + ' mark') + '</div>' +
      '<div class="hero__text"><p class="hero__id">The mark. Round ' + esc(e.r.n) + ', ' + pad(m.n) + '.</p>' +
      (OUT.headline ? '<h1>' + esc(OUT.headline) + '</h1>' : '<h1>' + esc(m.name || NAME) + '</h1>') +
      (OUT.idea ? '<p class="hero__idea">' + esc(OUT.idea) + '</p>' : '') + '</div></section>'
    if (arr(OUT.reads).length) {
      o += '<section class="sec"><h2 class="label">How it reads</h2><div class="read">' + markSvg(m, 0, 'read__mark') +
        '<ol class="read__scale read__scale--' + OUT.reads.length + '" style="--n:' + Math.min(4, OUT.reads.length) + '">' + OUT.reads.map(function (x) {
          return '<li><strong>' + esc(x && x.title) + '</strong><span>' + esc(x && x.text) + '</span></li>'
        }).join('') + '</ol></div></section>'
    }
    var wide = TWO ? 'inline' : 'first'
    o += '<section class="sec"><h2 class="label">With the wordmark</h2><div class="tiles">' +
      '<figure class="tile tile--wide">' + lockupSvg(m, wide, opt) + '<figcaption>' + (TWO ? 'Inline' : 'Mark first') + '</figcaption></figure>' +
      '<figure class="tile tile--wide tile--flip">' + lockupSvg(m, wide, opt) + '<figcaption>' + (TWO ? 'Inline, reversed' : 'Mark first, reversed') + '</figcaption></figure>' +
      (TWO ? '<figure class="tile">' + lockupSvg(m, 'first', opt) + '<figcaption>Mark first</figcaption></figure>' : '') +
      '<figure class="tile tile--tall">' + lockupSvg(m, 'stacked', opt) + '<figcaption>Stacked</figcaption></figure></div></section>'
    o += '<section class="sec"><h2 class="label">App icon</h2><div class="icons icons--lg">' + [144, 96, 60].map(function (s) {
      var use = SMALL && s * 0.62 <= (+OUT.smallCut.maxSize || 32) * 1.25 ? SMALL : m
      return '<div class="icons__set">' + iconTile(use, s, true) + iconTile(use, s, false) + '<span class="size">' + s + '</span></div>'
    }).join('') + '</div></section>'
    var full = MARK_SIZES.filter(function (s) { return s >= minSize })
    o += '<section class="sec"><h2 class="label">Sizes</h2><div class="sizes' + (SMALL ? '' : ' sizes--one') + '"><div><div class="scale">' +
      full.map(function (s) { return '<div class="scale__item">' + markSvg(m, s) + '<span class="size">' + s + '</span></div>' }).join('') +
      '</div><p class="cap">Full mark. Use at ' + minSize + ' and up.</p></div>'
    if (SMALL) {
      var mx = +OUT.smallCut.maxSize || 32
      o += '<div><div class="scale">' + MARK_SIZES.filter(function (s) { return s <= mx }).map(function (s) {
        return '<div class="scale__item">' + markSvg(SMALL, s) + '<span class="size">' + s + '</span></div>'
      }).join('') + '</div><p class="cap">' + esc(SMALL.name) + (OUT.smallCut.note ? '. ' + esc(OUT.smallCut.note) : '') + '</p></div>'
    }
    o += '</div></section>'
    o += '<section class="sec"><h2 class="label">Colour</h2><div class="colours">' +
      '<div class="swatch" style="background:' + C.ink + ';color:' + C.paper + '"><span>Ink</span><code>' + esc(C.ink.toUpperCase()) + '</code></div>' +
      '<div class="swatch swatch--paper" style="background:' + C.paper + ';color:' + C.ink + '"><span>Paper</span><code>' + esc(C.paper.toUpperCase()) + '</code></div>' +
      '</div><p class="cap">The mark is one colour, ink on paper or paper on ink.</p></section>'
    o += '<section class="sec" id="artwork" aria-labelledby="h-art"><div class="sec__head"><h2 class="label" id="h-art">Artwork</h2>' +
      '<div class="art__tools"><div class="seg" role="group" aria-label="Artwork colours">' +
      '<button type="button" data-act="artmode" data-mode="light" aria-pressed="' + (state.artMode === 'light') + '">Light</button>' +
      '<button type="button" data-act="artmode" data-mode="dark" aria-pressed="' + (state.artMode === 'dark') + '">Dark</button></div>' +
      '<button type="button" class="pill pill--solid" data-act="zip">' + ICON.save + '<span>Download all</span></button></div></div>' +
      '<div class="art__wm"><p class="art__using">Wordmark: <strong>' + esc(optFull(curOpt())) + '</strong>' + (OPTS.length > 1 ? wmKeyHtml() : '') + '</p>' + (OPTS.length > 1 ? wmPicker('a') : '') + '</div>' +
      '<p class="cap art__note" id="artnote" role="status" aria-live="polite">' + artNote() + '</p>' +
      '<ul class="art" role="list" id="artlist">' + artRows() + '</ul></section>'
    return '<div class="sum">' + o + '</div>'
  }
  function artNote() {
    var mode = state.artMode === 'light' ? 'ink on paper' : 'paper on ink'
    return 'Light is ' + (state.artMode === 'light' ? mode : 'ink on paper') + ', dark is paper on ink. SVG and PNG are transparent, except the app icon; JPG has the solid ground.'
  }
  function assets() {
    var m = MARKS[OUT.mark].m, list = [{ key: 'mark', label: 'Mark', kind: 'mark', m: m }]
    if (SMALL) list.push({ key: 'mark-small', label: SMALL.name, kind: 'mark', m: SMALL })
    if (TWO) list.push({ key: 'lockup-inline', label: 'Inline lockup', kind: 'inline', m: m })
    list.push({ key: 'lockup-first', label: 'Mark first lockup', kind: 'first', m: m })
    list.push({ key: 'lockup-stacked', label: 'Stacked lockup', kind: 'stacked', m: m })
    list.push({ key: 'app-icon', label: 'App icon', kind: 'icon', m: m })
    return list
  }
  function artRows() {
    var mode = state.artMode, dark = mode === 'dark', canLock = exportable(curOpt())
    return assets().map(function (a) {
      var isLock = a.kind !== 'mark' && a.kind !== 'icon'
      var prev
      if (a.kind === 'icon') prev = iconTile(a.m, 56, dark)
      else prev = '<span class="art__prev" style="background:' + (dark ? C.ink : C.paper) + ';color:' + (dark ? C.paper : C.ink) + '">' +
        (a.kind === 'mark' ? markSvg(a.m, 0, 'art__svg') : lockupSvg(a.m, a.kind, curOpt(), 'art__svg')) + '</span>'
      var file = slug(NAME) + '-' + a.key + '-' + mode
      var actions = isLock && !canLock
        ? '<p class="art__off">Outline the wordmark to export lockups: <code>node logo/viewer/outline.mjs</code></p>'
        : '<div class="art__btns">' + ['svg', 'png', 'jpg'].map(function (x) {
            return '<button type="button" class="pill pill--sm" data-act="dl" data-asset="' + a.key + '" data-fmt="' + x + '" aria-label="Download ' + esc(a.label) + ', ' + mode + ', ' + x.toUpperCase() + '">' + x.toUpperCase() + '</button>'
          }).join('') + '<button type="button" class="pill pill--sm pill--quiet" data-act="copysvg" data-asset="' + a.key + '">' + ICON.copy + '<span>Copy SVG</span></button></div>'
      return '<li class="art__row' + (isLock && !canLock ? ' is-off' : '') + '"><div class="art__thumb">' + prev + '</div>' +
        '<div class="art__text"><span class="art__name">' + esc(a.label) + '</span>' + (isLock && !canLock ? '' : '<span class="art__file">' + esc(file) + '</span>') + '</div>' + actions + '</li>'
    }).join('')
  }

  /* ---------- exports ---------- */
  /* Clean standalone files: real colours instead of currentColor, the fit baked in as a transform,
     § replaced, and a viewBox tight to the ink (strokes included) with a small even margin. */

  function tightBox(content) {
    $measure.innerHTML = '<g>' + content + '</g>'
    var root = $measure.firstChild, els = root.querySelectorAll('path,circle,rect,ellipse,line,polyline,polygon,text,use')
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (var i = 0; i < els.length; i++) {
      var el = els[i]
      if (el.closest('defs,mask,clipPath,pattern,symbol,marker')) continue
      var b; try { b = el.getBBox() } catch (e) { continue }
      if (!b.width && !b.height) continue
      var cs = getComputedStyle(el), sw = cs.stroke && cs.stroke !== 'none' ? parseFloat(cs.strokeWidth) || 0 : 0
      var h = sw / 2, m = el.getCTM(), base = $measure.getCTM()
      if (base && m) m = base.inverse().multiply(m)
      var pts = [[b.x - h, b.y - h], [b.x + b.width + h, b.y - h], [b.x - h, b.y + b.height + h], [b.x + b.width + h, b.y + b.height + h]]
      pts.forEach(function (p) {
        var x = m ? m.a * p[0] + m.c * p[1] + m.e : p[0], y = m ? m.b * p[0] + m.d * p[1] + m.f : p[1]
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
      })
    }
    $measure.innerHTML = ''
    if (!isFinite(x0)) return { x: 0, y: 0, w: 140, h: 140 }
    var w = x1 - x0, hh = y1 - y0, mg = Math.max(w, hh) * 0.04
    return { x: x0 - mg, y: y0 - mg, w: w + 2 * mg, h: hh + 2 * mg }
  }
  /* currentColor resolved against the colour in force at each element */
  function resolveColours(svg, fg) {
    var doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
    var root = doc.documentElement
    if (!root || root.nodeName !== 'svg' || doc.getElementsByTagName('parsererror').length) return svg.replace(/currentColor/g, fg)
    ;(function walk(el, col) {
      var st = el.getAttribute('style') || '', mc = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(st)
      if (el.getAttribute('color')) col = el.getAttribute('color')
      if (mc) col = mc[1].trim()
      ;['fill', 'stroke', 'stop-color', 'flood-color'].forEach(function (a) { if (el.getAttribute(a) === 'currentColor') el.setAttribute(a, col) })
      if (st) {
        var ns = st.replace(/currentColor/g, col).replace(/(?:^|;)\s*color\s*:[^;]+;?/i, '').trim()
        if (ns) el.setAttribute('style', ns); else el.removeAttribute('style')
      }
      el.removeAttribute('color')
      el.removeAttribute('class')
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) walk(c, col)
    })(root, fg)
    return new XMLSerializer().serializeToString(root)
  }
  function exportSvg(a, mode) {
    var fg = mode === 'light' ? C.ink : C.paper, bg = mode === 'light' ? C.paper : C.ink
    var t = slug(NAME).replace(/-/g, '') + a.key.replace(/\W/g, '')
    var NS = 'xmlns="http://www.w3.org/2000/svg"'
    if (a.kind === 'icon') {
      var S = 1024, ms = S * 0.62, k = ms / 140
      return resolveColours('<svg ' + NS + ' viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '"><rect width="' + S + '" height="' + S + '" rx="' + num(S * 0.225) + '" fill="' + bg + '"/>' +
        '<g fill="' + fg + '" color="' + fg + '" transform="translate(' + num((S - ms) / 2) + ' ' + num((S - ms) / 2) + ') scale(' + k.toFixed(5) + ')">' + markG(a.m, t) + '</g></svg>', fg)
    }
    var content = a.kind === 'mark' ? markG(a.m, t) : compose(a.kind, geoOf(curOpt()), markG(a.m, t)).body
    var b = tightBox(content)
    var vb = [b.x, b.y, b.w, b.h].map(function (v) { return +v.toFixed(2) })
    return resolveColours('<svg ' + NS + ' viewBox="' + vb.join(' ') + '" fill="' + fg + '" color="' + fg + '">' + content + '</svg>', fg)
  }
  function rasterSize(svg, icon) {
    if (icon) return [1024, 1024]
    var m = /viewBox="([^"]+)"/.exec(svg), v = m ? m[1].split(/[\s,]+/).map(Number) : [0, 0, 1, 1]
    var w = v[2], h = v[3], s = 2048 / Math.max(w, h)
    return [Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))]
  }
  function raster(svg, fmt, icon, mode) {
    var wh = rasterSize(svg, icon), w = wh[0], h = wh[1]
    var sized = svg.replace(/<svg\b([^>]*?)\s(width|height)="[^"]*"/g, '<svg$1').replace(/<svg\b([^>]*?)\s(width|height)="[^"]*"/g, '<svg$1').replace(/^<svg\b/, '<svg width="' + w + '" height="' + h + '"')
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }))
      var img = new Image()
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = w; c.height = h
        var x = c.getContext('2d')
        if (fmt === 'jpg') { x.fillStyle = mode === 'light' ? C.paper : C.ink; x.fillRect(0, 0, w, h) }
        x.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        c.toBlob(function (bl) { bl ? res(bl) : rej(new Error('Could not encode the image')) }, fmt === 'jpg' ? 'image/jpeg' : 'image/png', fmt === 'jpg' ? 0.92 : undefined)
      }
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Could not draw the SVG')) }
      img.src = url
    })
  }
  function assetBlob(a, fmt, mode) {
    var svg = exportSvg(a, mode)
    if (fmt === 'svg') return Promise.resolve(new Blob([svg], { type: 'image/svg+xml' }))
    return raster(svg, fmt, a.kind === 'icon', mode)
  }
  function fileName(a, mode, fmt) { return slug(NAME) + '-' + a.key + '-' + mode + '.' + fmt }
  function save(blob, name) {
    var url = URL.createObjectURL(blob), link = document.createElement('a')
    link.href = url; link.download = name; link.rel = 'noopener'
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
    setTimeout(function () { URL.revokeObjectURL(url) }, 4000)
  }

  /* a store-only zip: local headers, data, central directory, end record. CRC-32 per file. */
  var CRC = (function () {
    var t = new Uint32Array(256)
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
    return t
  })()
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0 }
  function zip(files) {
    var enc = new TextEncoder(), out = [], dir = [], off = 0, d = new Date()
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length
      var h = new DataView(new ArrayBuffer(30))
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true)
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true)
      h.setUint32(18, size, true); h.setUint32(22, size, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true)
      out.push(new Uint8Array(h.buffer), name, f.data)
      var c = new DataView(new ArrayBuffer(46))
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true)
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true)
      c.setUint16(28, name.length, true); c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true)
      c.setUint32(38, 0, true); c.setUint32(42, off, true)
      dir.push(new Uint8Array(c.buffer), name)
      off += 30 + name.length + size
    })
    var dsize = dir.reduce(function (s, a) { return s + a.length }, 0)
    var e = new DataView(new ArrayBuffer(22))
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true)
    e.setUint32(12, dsize, true); e.setUint32(16, off, true)
    return new Blob(out.concat(dir, [new Uint8Array(e.buffer)]), { type: 'application/zip' })
  }
  function downloadAll(btn) {
    var list = assets().filter(function (a) { return a.kind === 'mark' || a.kind === 'icon' || exportable(curOpt()) })
    var jobs = []
    ;['light', 'dark'].forEach(function (mode) { list.forEach(function (a) { ['svg', 'png', 'jpg'].forEach(function (fmt) { jobs.push({ a: a, mode: mode, fmt: fmt }) }) }) })
    var label = btn.querySelector('span'), was = label ? label.textContent : ''
    btn.disabled = true
    var files = [], i = 0
    function next() {
      if (i >= jobs.length) {
        save(zip(files), slug(NAME) + '-logo.zip')
        btn.disabled = false; if (label) label.textContent = was
        note('Saved ' + files.length + ' files as ' + slug(NAME) + '-logo.zip.')
        return
      }
      var j = jobs[i++]
      if (label) label.textContent = 'Preparing ' + i + ' of ' + jobs.length
      assetBlob(j.a, j.fmt, j.mode).then(function (b) { return b.arrayBuffer() }).then(function (buf) {
        files.push({ name: fileName(j.a, j.mode, j.fmt), data: new Uint8Array(buf) }); next()
      }, function (err) { btn.disabled = false; if (label) label.textContent = was; note('Could not prepare ' + fileName(j.a, j.mode, j.fmt) + ': ' + err.message) })
    }
    next()
  }
  function note(t) { var n = document.getElementById('artnote'); if (n) n.textContent = t }
  function findAsset(key) { var l = assets(); for (var i = 0; i < l.length; i++) if (l[i].key === key) return l[i]; return null }

  function copyText(text, btn) {
    function done(ok2) {
      if (!btn) return
      var sp = btn.querySelector('span') || btn, was = sp.getAttribute('data-was') || sp.textContent
      sp.setAttribute('data-was', was); sp.textContent = ok2 ? 'Copied' : 'Copy failed'
      clearTimeout(btn._t); btn._t = setTimeout(function () { sp.textContent = was }, 1400)
    }
    function fallback() {
      var ta = document.createElement('textarea')
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select()
      var r = false; try { r = document.execCommand('copy') } catch (e) {}
      document.body.removeChild(ta); done(r)
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true) }, fallback)
    else fallback()
  }

  /* the hero arrives: every shape grows in, left to right */
  function arrive() {
    var svg = $main.querySelector('.hero__mark')
    if (!svg || reduced()) return
    var els = [].filter.call(svg.querySelectorAll('path,circle,rect,ellipse,polygon,polyline,line'), function (el) { return !el.closest('defs,mask,clipPath,pattern') })
    if (!els.length) return
    var xs = els.map(function (el) { try { var b = el.getBBox(); return b.x + b.width / 2 } catch (e) { return 0 } })
    var lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs), span = hi - lo || 1
    els.forEach(function (el, i) {
      el.style.animationDelay = Math.round((xs[i] - lo) / span * 640) + 'ms'
      el.classList.add(el.hasAttribute('transform') ? 'arrive-fade' : 'arrive')
    })
  }

  /* ---------- routing ---------- */

  function parse() {
    var h = location.hash.replace(/^#\/?/, '')
    if (!h) return DECIDED ? { page: 'mark' } : { page: 'round', r: ROUNDS[ROUNDS.length - 1] }
    if (h === 'mark') return DECIDED || OUT ? { page: 'mark' } : { page: 'round', r: ROUNDS[ROUNDS.length - 1] }
    if (h === 'type') { history.replaceState(null, '', '#/'); return parse() }
    var m = /^r(\d+)(?:-(\d{1,3}))?$/.exec(h) || /^()(\d{1,3})$/.exec(h)
    if (m) {
      var n = m[1] ? +m[1] : 1, r = null
      ROUNDS.forEach(function (x) { if (x.n === n) r = x })
      if (!r) return { page: 'missing', what: 'Round ' + n }
      var id = m[2] ? 'r' + n + '-' + pad(+m[2]) : null
      return { page: 'round', r: r, id: id && MARKS[id] ? id : null }
    }
    return { page: 'missing', what: '“' + h + '”' }
  }

  function render(keep) {
    if (!ok) { $main.innerHTML = '<section class="blank"><h1>No logo yet</h1><p>Run <code>node logo/viewer/sync.mjs</code> to build <code>data.js</code>, then reload.</p></section>'; return }
    var p = parse(), y = window.scrollY
    var same = keep && p.page === state.page && p.r === state.r
    state.page = p.page
    $app.classList.toggle('on-round', p.page === 'round')
    if (p.page !== 'round') { $app.classList.remove('is-open'); $panel.setAttribute('inert', ''); panelFor = null }
    if (!same) { state.sel2.clear(); state.keys = [] }
    if (p.page === 'round') {
      var newRound = state.r !== p.r
      state.r = p.r
      if (!state.sel || !MARKS[state.sel] || MARKS[state.sel].r !== p.r || p.id) state.sel = p.id || (newRound || !state.sel ? p.r.all[0].id : state.sel)
      state.keys = p.r.all.map(function (m) { return m.id })
      document.title = 'Round ' + p.r.n + ' / ' + NAME
      $main.innerHTML = pageRound(p.r)
      watchGrid()
      panelFor = null
      panelBuild(MARKS[state.sel].m)
      if (p.id && !keep && !narrow()) ui.open = true
      $app.classList.toggle('is-open', ui.open)
      if (ui.open) $panel.removeAttribute('inert'); else $panel.setAttribute('inert', '')
      lastChip = null
      if (p.id && !keep) requestAnimationFrame(function () { var b = $main.querySelector('.cell__btn[aria-pressed="true"]'); if (b) b.scrollIntoView({ block: 'center' }) })
    } else if (p.page === 'mark') {
      document.title = NAME + ', the mark'
      $main.innerHTML = pageMark()
      if (!keep) arrive()
    } else {
      document.title = 'Not found / ' + NAME
      $main.innerHTML = top('') + '<section class="blank"><h1>Not found</h1><p>' + esc(p.what) + ' is not in <code>data.js</code>.</p><p><a class="idlink" href="#/">Back to the start</a></p></section>'
    }
    if (keep) window.scrollTo(0, y)
    else if (!(p.page === 'round' && p.id)) window.scrollTo(0, 0)
    revealPicked()
    updateBar()
  }
  window.addEventListener('hashchange', function () {
    var p = parse()
    // within the same round, a mark link only moves the selection
    if (p.page === 'round' && state.page === 'round' && p.r === state.r && p.id) {
      select(p.id, { scroll: true })
      if (!ui.open && !narrow()) setPanel(true)
      return
    }
    render(false)
  })

  /* ---------- shortlist ---------- */

  function updateBar() {
    var n = state.sel2.size
    $selcount.textContent = n ? n + ' selected' : ''
    $selbar.classList.toggle('is-on', n > 0)
    if (n) $selbar.removeAttribute('inert'); else $selbar.setAttribute('inert', '')
    $main.classList.toggle('has-selection', n > 0)
  }
  function toggleSel(key, on) {
    if (on) state.sel2.add(key); else state.sel2.delete(key)
    var boxes = $main.querySelectorAll('input[data-sel="' + cssEsc(key) + '"]')
    for (var i = 0; i < boxes.length; i++) { boxes[i].checked = on; var h = boxes[i].closest('.cell'); if (h) h.classList.toggle('is-selected', on) }
    updateBar()
  }
  $selcopy.addEventListener('click', function () { copyText(state.keys.filter(function (k) { return state.sel2.has(k) }).join(', '), $selcopy) })
  $selclear.addEventListener('click', function () { [].slice.call(state.sel2).forEach(function (k) { toggleSel(k, false) }) })

  /* ---------- events ---------- */

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]')
    if (t && t.tagName !== 'SELECT') {
      var a = t.getAttribute('data-act')
      if (a === 'theme') toggleTheme()
      else if (a === 'panel') setPanel(!ui.open, !ui.open)
      else if (a === 'close') closePanel()
      else if (a === 'prev') step(-1)
      else if (a === 'next') step(1)
      else if (a === 'wm') setWordmark(t.getAttribute('data-opt'), t.closest('.panel') ? 'p' : 'a')
      else if (a === 'copywm') copyText(wmCopyText(t.getAttribute('data-mark')), t)
      else if (a === 'more') { var rest = t.parentNode.querySelector('.led__rest'); if (rest) { rest.hidden = false; t.remove() } }
      else if (a === 'artmode') { state.artMode = t.getAttribute('data-mode') === 'dark' ? 'dark' : 'light'; var segs = $main.querySelectorAll('[data-act="artmode"]'); for (var i = 0; i < segs.length; i++) segs[i].setAttribute('aria-pressed', String(segs[i].getAttribute('data-mode') === state.artMode)); document.getElementById('artlist').innerHTML = artRows(); note(artNote()) }
      else if (a === 'dl') {
        var as = findAsset(t.getAttribute('data-asset')), fmt = t.getAttribute('data-fmt'), mode = state.artMode
        if (!as) return
        assetBlob(as, fmt, mode).then(function (b) { save(b, fileName(as, mode, fmt)); note('Saved ' + fileName(as, mode, fmt) + '.') }, function (err) { note('Could not prepare ' + fileName(as, mode, fmt) + ': ' + err.message) })
      } else if (a === 'copysvg') { var a2 = findAsset(t.getAttribute('data-asset')); if (a2) copyText(exportSvg(a2, state.artMode), t) }
      else if (a === 'zip') downloadAll(t)
      return
    }
    var cb = e.target.closest('.cell__btn')
    if (cb) {
      select(cb.getAttribute('data-mark'))
      if (!ui.open) setPanel(true, narrow())
      else if (narrow()) requestAnimationFrame(function () { $panel.focus({ preventScroll: true }) })
    }
  })
  document.addEventListener('change', function (e) {
    var t = e.target
    if (t.matches('input[data-sel]')) { toggleSel(t.getAttribute('data-sel'), t.checked); return }
    var a = t.getAttribute('data-act')
    if (a === 'page') location.hash = '#/' + t.value
  })
  document.addEventListener('focusin', function (e) {
    var cb = e.target.closest && e.target.closest('.cell__btn')
    if (cb && !dragging) select(cb.getAttribute('data-mark'))   // focus alone selects; it never opens the panel
  })
  document.addEventListener('keydown', function (e) {
    var t = e.target, tag = (t.tagName || '').toLowerCase()
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable
    if (e.key === 'Escape' && state.page === 'round' && ui.open) { closePanel(); return }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'd' || e.key === 'D') { toggleTheme(); return }
    var cb = t.closest && t.closest('.cell__btn')
    if (cb) {
      var id = cb.getAttribute('data-mark')
      if (e.key === 'x' || e.key === 'X') { e.preventDefault(); toggleSel(id, !state.sel2.has(id)); return }
      var d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: state.cols, ArrowUp: -state.cols }[e.key]
      if (!d) return
      e.preventDefault()
      var all = state.r.all, k = -1
      for (var i = 0; i < all.length; i++) if (all[i].id === id) k = i
      var to = all[Math.min(all.length - 1, Math.max(0, k + d))]
      var b = to && $main.querySelector('.cell__btn[data-mark="' + cssEsc(to.id) + '"]')
      if (b) b.focus()
    }
  })

  function toggleTheme() {
    var light = document.documentElement.getAttribute('data-theme') !== 'light'
    document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark')
    store.set('theme', light ? 'light' : 'dark')
    var bs = document.querySelectorAll('[data-act="theme"]')
    for (var i = 0; i < bs.length; i++) bs[i].outerHTML = themeBtn()
  }
  function setWordmark(id, where) {
    if (!optById(id) || id === current) return
    current = id
    store.set('wordmark', id)
    render(true)
    // keep the keyboard on the picked option
    var root = where === 'p' ? $panel : $main
    var b = root.querySelector('.wm__opt[aria-checked="true"]')
    if (b) b.focus({ preventScroll: true })
  }
  /* radio keys: arrows move and pick, Home and End jump */
  function wmKey(e) {
    var t = e.target
    if (!t.classList || !t.classList.contains('wm__opt')) return false
    var opts = [].slice.call(t.parentNode.querySelectorAll('.wm__opt')), k = opts.indexOf(t), to = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (k + 1) % opts.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (k - 1 + opts.length) % opts.length
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = opts.length - 1
    else return false
    e.preventDefault(); e.stopPropagation()
    setWordmark(opts[to].getAttribute('data-opt'), t.closest('.panel') ? 'p' : 'a')
    return true
  }
  document.addEventListener('keydown', wmKey, true)

  /* ---------- start ---------- */

  applyFrac()
  if (ok) OPTS.forEach(function (o) { if (o.font && !o.outline && o.id === current) loadFont(o) })
  render(false)
})()
