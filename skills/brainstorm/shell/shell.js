/* Playground shell. Reads window.PLAYGROUND (from data.js) and never writes anything.
   Plain script, no modules, so it runs from file:// as well as any static server.
   Routes:  #/  ·  #/<slug>  ·  #/<slug>/pass-<n>  ·  #/<slug>/pass-<n>/<idea-id> */
(function () {
  'use strict'

  var DATA = window.PLAYGROUND
  var BRAINSTORMS = DATA && Array.isArray(DATA.brainstorms) ? DATA.brainstorms.filter(function (b) { return b && b.slug }) : []
  BRAINSTORMS.sort(function (a, b) { return String(b.modified || '').localeCompare(String(a.modified || '')) })

  var $main = document.getElementById('main')
  var $app = document.getElementById('app')
  var $panel = document.getElementById('panel')
  var $scrim = document.getElementById('scrim')
  var $selbar = document.getElementById('selbar')
  var $selcount = document.getElementById('selcount')
  var $selcopy = document.getElementById('selcopy')
  var $selclear = document.getElementById('selclear')

  /* ---------- small helpers ---------- */

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('playground.' + k); return v == null ? d : v } catch (e) { return d } },
    set: function (k, v) { try { localStorage.setItem('playground.' + k, v) } catch (e) {} }
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  function fmtDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''))
    if (!m || +m[2] < 1 || +m[2] > 12) return ''
    return +m[3] + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1]
  }
  function isoDay(s) { var m = /^\d{4}-\d{2}-\d{2}/.exec(String(s || '')); return m ? m[0] : '' }
  function timeTag(s) { var d = fmtDate(s); return d ? '<time datetime="' + esc(isoDay(s)) + '">' + d + '</time>' : '' }

  function arr(v) { return Array.isArray(v) ? v : [] }
  function ideaNum(id) { var m = /-(\d+)$/.exec(String(id || '')); return m ? m[1] : String(id || '') }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many) }

  /* only http(s) or relative links leave the shell */
  function safeUrl(u) {
    u = String(u || '').trim()
    if (!u) return ''
    if (/^https?:\/\//i.test(u)) return u
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ''
    return u
  }
  function encPath(p) { return String(p || '').split('/').map(encodeURIComponent).join('/') }
  function thumbSrc(slug, thumb) { return encPath(slug) + '/' + encPath(String(thumb).replace(/^\.?\//, '')) }

  var ICON = {
    search: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="7" cy="7" r="4.75"/><path d="M10.5 10.5 14 14" stroke-linecap="round"/></svg>',
    list: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" stroke-linecap="round"/></svg>',
    grid: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>',
    sun: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" stroke-linecap="round"/></svg>',
    moon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z" stroke-linejoin="round"/></svg>',
    prev: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/></svg>',
    tick: '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M2.5 6.2 5 8.6l4.5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"/></svg>',
    expand: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cal: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" stroke-linecap="round"/></svg>',
    out: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 11 11 5M6 4.5h5.5V10" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  }

  /* ---------- data lookups ---------- */

  var cache = typeof WeakMap === 'function' ? new WeakMap() : null
  function info(b) {
    var hit = cache && cache.get(b)
    if (hit) return hit
    var ideas = {}, ledTo = {}, passes = arr(b.passes).slice().sort(function (x, y) { return (x.n || 0) - (y.n || 0) })
    passes.forEach(function (p) {
      arr(p.ideas).forEach(function (i) { if (i && i.id) ideas[i.id] = { idea: i, pass: p } })
    })
    passes.forEach(function (p) {
      arr(p.ideas).forEach(function (i) {
        arr(i && i.parents).forEach(function (par) { (ledTo[par] = ledTo[par] || []).push(i.id) })
      })
    })
    var log = arr(b.log).map(function (e, k) { return { e: e || {}, k: k } })
    log.sort(function (x, y) { return String(x.e.date || '').localeCompare(String(y.e.date || '')) || x.k - y.k })
    hit = { passes: passes, ideas: ideas, ledTo: ledTo, log: log.map(function (x) { return x.e }) }
    if (cache) cache.set(b, hit)
    return hit
  }
  function findB(slug) { for (var i = 0; i < BRAINSTORMS.length; i++) if (BRAINSTORMS[i].slug === slug) return BRAINSTORMS[i]; return null }
  function findPass(b, n) { var ps = info(b).passes; for (var i = 0; i < ps.length; i++) if (ps[i].n === n) return ps[i]; return null }
  function firstIdea(p) { return p ? arr(p.ideas)[0] || null : null }
  function chosenCount(p) { return arr(p.ideas).filter(function (i) { return i.status === 'chosen' || i.status === 'final' }).length }

  /* ---------- links ---------- */

  function hB(slug) { return '#/' + encodeURIComponent(slug) }
  function hP(slug, n) { return hB(slug) + '/pass-' + n }
  function hI(b, id) {
    var hit = info(b).ideas[id]
    var n = hit ? hit.pass.n : (/^p(\d+)-/.exec(id) || [])[1]
    return n ? hP(b.slug, n) + '/' + encodeURIComponent(id) : ''
  }
  function hV(b, id) { var h = hI(b, id); return h ? h + '/view' : '' }
  function ideaLinks(b, ids) {
    return arr(ids).map(function (id) {
      var h = hI(b, id)
      return h ? '<a class="idlink" href="' + esc(h) + '">' + esc(id) + '</a>' : '<span class="idlink">' + esc(id) + '</span>'
    }).join('<span class="sep">, </span>')
  }

  /* ---------- state ---------- */

  var state = {
    view: store.get('view', 'grid') === 'list' ? 'list' : 'grid',
    pageKey: null,
    route: null,
    filters: {},          // per page: { q, from, to, chosen }
    sel: new Set(),       // not saved
    selKeys: [],          // every selectable key on this page, in display order
    visibleIds: [],       // ideas on screen on a pass page, in order
    panelId: null,
    panelPushed: false
  }
  function filt() { return state.filters[state.pageKey] || (state.filters[state.pageKey] = { q: '', from: '', to: '', chosen: false }) }

  /* ---------- shared markup ---------- */

  function themeBtn() {
    var light = document.documentElement.getAttribute('data-theme') === 'light'
    return '<button type="button" class="iconbtn" data-act="theme" aria-label="' + (light ? 'Switch to dark mode' : 'Switch to light mode') + '">' + (light ? ICON.moon : ICON.sun) + '</button>'
  }
  function top(crumbs) {
    var items = crumbs.map(function (c, k) {
      var last = k === crumbs.length - 1
      return '<li>' + (last ? '<span aria-current="page">' + esc(c.label) + '</span>' : '<a href="' + esc(c.href) + '">' + esc(c.label) + '</a>') + '</li>'
    }).join('')
    return '<header class="top"><nav class="crumbs" aria-label="Breadcrumb"><ol>' + items + '</ol></nav>' + themeBtn() + '</header>'
  }
  function viewToggle() {
    return '<div class="seg" role="group" aria-label="View">' +
      '<button type="button" data-act="view" data-view="list" aria-pressed="' + (state.view === 'list') + '">' + ICON.list + '<span>List</span></button>' +
      '<button type="button" data-act="view" data-view="grid" aria-pressed="' + (state.view === 'grid') + '">' + ICON.grid + '<span>Grid</span></button>' +
      '</div>'
  }
  function searchField(label, value) {
    return '<label class="field field--search">' + ICON.search + '<span class="vh">' + esc(label) + '</span>' +
      '<input type="search" data-filter="q" placeholder="Search" autocomplete="off" spellcheck="false" value="' + esc(value) + '"></label>'
  }
  function check(key, label) {
    return '<label class="check"><input type="checkbox" data-sel="' + esc(key) + '"' + (state.sel.has(key) ? ' checked' : '') + '>' +
      '<span class="check__box" aria-hidden="true">' + ICON.tick + '</span><span class="vh">' + esc(label) + '</span></label>'
  }
  function ph(big, small) {
    return '<span class="ph" aria-hidden="true">' + (big ? '<span class="ph__num">' + esc(big) + '</span>' : '') + (small ? '<span class="ph__name">' + esc(small) + '</span>' : '') + '</span>'
  }
  function tile(slug, idea, alt) {
    if (!idea) return '<span class="tile">' + ph('', 'No ideas yet') + '</span>'
    var num = ideaNum(idea.id)
    if (idea.thumb) {
      return '<span class="tile"><img src="' + esc(thumbSrc(slug, idea.thumb)) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async" data-ph-num="' + esc(num) + '" data-ph-name="' + esc(idea.name || '') + '"></span>'
    }
    return '<span class="tile">' + ph(num, idea.name) + '</span>'
  }
  function mark(status) {
    if (status === 'final') return '<span class="mark mark--final">Final</span>'
    if (status === 'chosen') return '<span class="mark mark--chosen">Chosen</span>'
    if (status === 'dropped') return '<span class="mark mark--quiet">Dropped</span>'
    if (status === 'decided') return '<span class="mark mark--final">Decided</span>'
    if (status === 'archived') return '<span class="mark mark--quiet">Archived</span>'
    return ''
  }
  function statusText(status) { return mark(status) || '<span class="muted">Open</span>' }
  function quote(text, cls, cite) {
    if (!text) return ''
    return '<figure class="quote ' + (cls || '') + '"><blockquote><p>' + esc(text) + '</p></blockquote>' + (cite ? '<figcaption>' + cite + '</figcaption>' : '') + '</figure>'
  }
  function agentNote(text, label) {
    if (!text) return ''
    return '<p class="agent"><span class="agent__label">' + esc(label || 'Agent’s note') + '</span><span class="agent__text">' + esc(text) + '</span></p>'
  }
  var TYPES = { brief: 'Brief', recommend: 'Recommended', chosen: 'Chosen', dropped: 'Dropped', feedback: 'Feedback', refined: 'Refined', final: 'Final pick', note: 'Note' }
  function entries(b, list) {
    return '<ol class="log">' + list.map(function (e) {
      var by = e.by === 'user' ? 'user' : 'agent'
      var body = ''
      if (by === 'user' && e.quote) body += quote(e.quote, 'quote--sm', 'User')
      if (by === 'agent' && e.quote) body += agentNote(e.quote)   // agents never get quote styling
      if (e.note) body += agentNote(e.note)
      if (!body) body = '<p class="muted">Nothing recorded.</p>'
      var ids = arr(e.ideas).length ? '<p class="log__ideas">' + ideaLinks(b, e.ideas) + '</p>' : ''
      return '<li class="log__item log__item--' + by + '"><div class="log__meta">' + timeTag(e.date) +
        '<span class="log__type">' + esc(TYPES[e.type] || e.type || 'Entry') + '</span>' +
        '<span class="log__by">' + (by === 'user' ? 'User' : 'Agent') + '</span></div>' +
        '<div class="log__body">' + body + ids + '</div></li>'
    }).join('') + '</ol>'
  }
  function empty(text) { return '<p class="none">' + esc(text) + '</p>' }

  /* ---------- pages ---------- */

  function pageEmpty() {
    document.title = 'Playground'
    return top([{ label: 'Playground' }]) +
      '<section class="blank"><h1>No brainstorms yet</h1><p>Run <code>node playground/shell/sync.mjs</code> to build <code>data.js</code>, then reload.</p></section>'
  }
  function pageMissing(what) {
    document.title = 'Not found / Playground'
    return top([{ label: 'Home', href: '#/' }, { label: 'Not found' }]) +
      '<section class="blank"><h1>Not found</h1><p>' + esc(what) + ' is not in <code>data.js</code>.</p><p><a href="#/">Back to all brainstorms</a></p></section>'
  }

  function pageIndex() {
    document.title = 'Playground'
    var f = filt()
    return top([{ label: 'Playground' }]) +
      '<div class="head"><h1>Brainstorms</h1><p class="head__meta">' + plural(BRAINSTORMS.length, 'brainstorm', 'brainstorms') + '</p></div>' +
      '<div class="controls">' + searchField('Search brainstorms', f.q) +
      rangePill() +
      '<span class="controls__end">' + viewToggle() + '</span></div>' +
      '<div class="collection" id="collection"></div>'
  }
  function indexItems() {
    var f = filt(), q = f.q.trim().toLowerCase()
    return BRAINSTORMS.filter(function (b) {
      if (q && (String(b.title || '') + ' ' + String(b.description || '') + ' ' + b.slug).toLowerCase().indexOf(q) === -1) return false
      var d = isoDay(b.modified)
      if (f.from && (!d || d < f.from)) return false
      if (f.to && (!d || d > f.to)) return false
      return true
    })
  }
  function indexCollection() {
    var list = indexItems()
    state.selKeys = BRAINSTORMS.map(function (b) { return b.slug })
    if (!list.length) return empty('No brainstorms match.')
    if (state.view === 'grid') {
      return '<ul class="grid" role="list">' + list.map(function (b, k) {
        var fi = firstIdea(info(b).passes[0])
        return '<li class="card' + cls(b.slug) + '" data-key="' + esc(b.slug) + '" style="--i:' + k + '">' +
          '<a class="card__link" href="' + esc(hB(b.slug)) + '">' + tile(b.slug, fi) +
          '<span class="card__text"><span class="card__title">' + esc(b.title || b.slug) + '</span>' +
          (b.description ? '<span class="card__desc">' + esc(b.description) + '</span>' : '') +
          '<span class="card__meta">' + timeTag(b.modified) + mark(b.status) + '</span></span></a>' +
          check(b.slug, 'Select ' + (b.title || b.slug)) + '</li>'
      }).join('') + '</ul>'
    }
    return '<div class="tablewrap"><table class="table"><thead><tr><th class="c-check"><span class="vh">Select</span></th><th>Title</th><th class="c-wide">Description</th><th class="c-date">Modified</th><th class="c-status">Status</th></tr></thead><tbody>' +
      list.map(function (b) {
        return '<tr class="' + cls(b.slug) + '" data-key="' + esc(b.slug) + '" data-href="' + esc(hB(b.slug)) + '">' +
          '<td class="c-check">' + check(b.slug, 'Select ' + (b.title || b.slug)) + '</td>' +
          '<td><a class="rowlink" href="' + esc(hB(b.slug)) + '">' + esc(b.title || b.slug) + '</a>' + (b.description ? '<span class="sub">' + esc(b.description) + '</span>' : '') + '</td>' +
          '<td class="c-wide muted">' + esc(b.description || '') + '</td>' +
          '<td class="c-date num">' + timeTag(b.modified) + '</td>' +
          '<td class="c-status">' + statusText(b.status) + '</td></tr>'
      }).join('') + '</tbody></table></div>'
  }
  function cls(key) { return state.sel.has(key) ? ' is-selected' : '' }

  function pageBrainstorm(b) {
    var I = info(b), title = b.title || b.slug
    document.title = title + ' / Playground'
    return top([{ label: 'Home', href: '#/' }, { label: title }]) +
      '<div class="head"><h1>' + esc(title) + '</h1>' +
      '<p class="head__meta"><span>' + plural(I.passes.length, 'pass', 'passes') + '</span>' + mark(b.status) + '</p></div>' +
      '<div class="controls">' +
      (I.log.length ? '<button type="button" class="pill" data-act="history" aria-expanded="false" aria-controls="history">History</button>' : '') +
      '<span class="controls__end">' + viewToggle() + '</span></div>' +
      '<div class="collection" id="collection"></div>' +
      (I.log.length ? '<section class="history" id="history" aria-labelledby="h-history" hidden><h2 id="h-history" class="vh">History</h2>' + entries(b, I.log) + '</section>' : '')
  }
  function passesCollection(b) {
    var ps = info(b).passes
    state.selKeys = []
    if (!ps.length) return empty('No passes yet.')
    if (state.view === 'grid') {
      return '<ul class="grid" role="list">' + ps.map(function (p, k) {
        var n = arr(p.ideas).length, c = chosenCount(p)
        return '<li class="card" style="--i:' + k + '"><a class="card__link" href="' + esc(hP(b.slug, p.n)) + '">' + tile(b.slug, firstIdea(p)) +
          '<span class="card__text"><span class="card__title"><span>Pass ' + esc(p.n) + '</span><span class="card__date">' + timeTag(p.date) + '</span></span>' +
          '<span class="card__meta"><span>' + plural(n, 'idea', 'ideas') + ', ' + c + ' chosen</span></span></span></a></li>'
      }).join('') + '</ul>'
    }
    return '<div class="tablewrap"><table class="table"><thead><tr><th class="c-num">Pass</th><th class="c-date">Date</th><th class="c-wide">Started from</th><th class="c-num">Ideas</th><th class="c-num">Chosen</th></tr></thead><tbody>' +
      ps.map(function (p) {
        var fq = p.brief && p.brief.quote
        return '<tr data-href="' + esc(hP(b.slug, p.n)) + '"><td class="c-num"><a class="rowlink" href="' + esc(hP(b.slug, p.n)) + '">Pass ' + esc(p.n) + '</a></td>' +
          '<td class="c-date num">' + timeTag(p.date) + '</td>' +
          '<td class="c-wide c-clip">' + (fq ? '<span class="clip" title="' + esc(fq) + '">“' + esc(fq) + '”</span>' : '<span class="muted">No feedback recorded</span>') + '</td>' +
          '<td class="c-num num">' + arr(p.ideas).length + '</td><td class="c-num num">' + chosenCount(p) + '</td></tr>'
      }).join('') + '</tbody></table></div>'
  }

  function pagePass(b, p) {
    var title = b.title || b.slug, n = arr(p.ideas).length, f = filt()
    document.title = 'Pass ' + p.n + ' / ' + title + ' / Playground'
    var out = top([{ label: 'Home', href: '#/' }, { label: title, href: hB(b.slug) }, { label: 'Pass ' + p.n }]) +
      '<div class="head"><h1>Pass ' + esc(p.n) + '</h1><p class="head__meta">' +
      ['<span>' + plural(n, 'idea', 'ideas') + '</span>', '<span>' + chosenCount(p) + ' chosen</span>',
        arr(p.from).length ? '<span class="from">Grew from ' + ideaLinks(b, p.from) + '</span>' : ''].filter(Boolean).join('<span class="dot" aria-hidden="true"></span>') + '</p></div>'
    out += '<div class="controls">' + searchField('Search ideas', f.q) +
      '<button type="button" class="pill" data-act="chosen" aria-pressed="' + !!f.chosen + '">Chosen only</button>' +
      '<span class="controls__end">' + viewToggle() + '</span></div>' +
      '<div class="collection" id="collection"></div>'
    return out
  }
  function passItems(p) {
    var f = filt(), q = f.q.trim().toLowerCase()
    return arr(p.ideas).filter(function (i) {
      if (f.chosen && i.status !== 'chosen' && i.status !== 'final') return false
      if (q && (String(i.id) + ' ' + String(i.name || '') + ' ' + String(i.bet || '')).toLowerCase().indexOf(q) === -1) return false
      return true
    })
  }
  function ideasCollection(b, p) {
    var list = passItems(p)
    state.selKeys = arr(p.ideas).map(function (i) { return i.id })
    state.visibleIds = list.map(function (i) { return i.id })
    if (!list.length) return empty(filt().chosen ? 'No chosen ideas match.' : 'No ideas match.')
    var hasEval = arr(p.ideas).some(function (i) { return i.eval && i.eval.score != null })
    if (state.view === 'grid') {
      return '<ul class="grid grid--ideas" role="list">' + list.map(function (i, k) {
        return '<li class="cell' + cls(i.id) + act(i.id) + '" data-key="' + esc(i.id) + '" data-id="' + esc(i.id) + '" style="--i:' + k + '">' +
          '<a class="card__link" href="' + esc(hI(b, i.id)) + '"' + cur(i.id) + '>' + tile(b.slug, i) +
          '<span class="cell__text"><span class="cell__num">' + esc(ideaNum(i.id)) + '</span><span class="cell__name">' + esc(i.name || '') + '</span>' + mark(i.status) + '</span></a>' +
          check(i.id, 'Select ' + i.id) +
          (safeUrl(i.url) ? '<a class="cell__view" href="' + esc(hV(b, i.id)) + '" aria-label="View ' + esc(i.id) + ' full screen">' + ICON.expand + '</a>' : '') + '</li>'
      }).join('') + '</ul>'
    }
    return '<div class="tablewrap"><table class="table"><thead><tr><th class="c-check"><span class="vh">Select</span></th><th class="c-id">ID</th><th>Name</th><th class="c-wide">Bet</th><th class="c-status">Status</th>' + (hasEval ? '<th class="c-num c-eval">Eval</th>' : '') + '<th class="c-view"><span class="vh">View</span></th></tr></thead><tbody>' +
      list.map(function (i) {
        var score = i.eval && i.eval.score != null ? esc(i.eval.score) : '<span class="muted">·</span>'
        return '<tr class="' + cls(i.id) + act(i.id) + '" data-key="' + esc(i.id) + '" data-id="' + esc(i.id) + '" data-href="' + esc(hI(b, i.id)) + '">' +
          '<td class="c-check">' + check(i.id, 'Select ' + i.id) + '</td>' +
          '<td class="c-id num"><a class="rowlink" href="' + esc(hI(b, i.id)) + '"' + cur(i.id) + '>' + esc(i.id) + '</a></td>' +
          '<td class="c-name">' + esc(i.name || '') + '</td>' +
          '<td class="c-wide c-clip muted">' + (i.bet ? '<span class="clip" title="' + esc(i.bet) + '">' + esc(i.bet) + '</span>' : '') + '</td>' +
          '<td class="c-status">' + statusText(i.status) + '</td>' +
          (hasEval ? '<td class="c-num c-eval num">' + score + '</td>' : '') +
          '<td class="c-view">' + (safeUrl(i.url) ? '<a class="viewlink" href="' + esc(hV(b, i.id)) + '" aria-label="View ' + esc(i.id) + ' full screen">View</a>' : '') + '</td></tr>'
      }).join('') + '</tbody></table></div>'
  }
  function act(id) { return state.panelId === id ? ' is-active' : '' }
  function cur(id) { return state.panelId === id ? ' aria-current="true"' : '' }

  /* ---------- panel ---------- */

  function panelHtml(b, p, idea) {
    var I = info(b), ids = stepList(p), k = ids.indexOf(idea.id)
    var prev = k > 0 ? ids[k - 1] : null, next = k >= 0 && k < ids.length - 1 ? ids[k + 1] : null
    var logs = I.log.filter(function (e) { return arr(e.ideas).indexOf(idea.id) !== -1 })
    var led = I.ledTo[idea.id] || []
    var url = safeUrl(idea.url)
    var ev = idea.eval
    var body = '<div class="panel__art">' + (idea.thumb
      ? '<img src="' + esc(thumbSrc(b.slug, idea.thumb)) + '" alt="Illustration of ' + esc(idea.name || idea.id) + '" data-ph-num="' + esc(ideaNum(idea.id)) + '" data-ph-name="' + esc(idea.name || '') + '">'
      : ph(ideaNum(idea.id), idea.name)) + '</div>'
    body += '<div class="panel__title"><h2>' + esc(idea.name || idea.id) + '</h2>' + mark(idea.status) + '</div>'
    if (idea.bet) body += '<p class="panel__bet">' + esc(idea.bet) + '</p>'
    if (url) body += '<p class="panel__open"><a class="pill pill--solid" href="' + esc(hV(b, idea.id)) + '">Open idea ' + ICON.expand + '</a></p>'
    var facts = ''
    if (arr(idea.parents).length) facts += fact('Grew from', ideaLinks(b, idea.parents))
    if (led.length) facts += fact('Led to', ideaLinks(b, led))
    if (ev && (ev.score != null || ev.note)) facts += fact('Eval', (ev.score != null ? '<span class="num">' + esc(ev.score) + '</span>' : '') + (ev.note ? '<span class="facts__note">' + esc(ev.note) + '</span>' : ''))
    if (facts) body += '<dl class="facts">' + facts + '</dl>'
    if (idea.source) body += '<p class="source panel__source"><code>' + esc(idea.source) + '</code><button type="button" class="iconbtn iconbtn--sm" data-act="copy" data-copy="' + esc(idea.source) + '" aria-label="Copy source path">' + ICON.copy + '</button></p>'
    if (logs.length) body += '<details class="panel__hist"><summary>History <span class="num muted">' + logs.length + '</span></summary>' + entries(b, logs) + '</details>'
    return '<div class="panel__head"><p class="panel__id"><span class="panel__num">' + esc(idea.id) + '</span><span class="vh"> of pass ' + esc(p.n) + '</span></p>' +
      '<div class="panel__nav">' +
      '<button type="button" class="iconbtn" data-act="step" data-to="' + esc(prev || '') + '" aria-label="Previous idea"' + (prev ? '' : ' disabled') + '>' + ICON.prev + '</button>' +
      '<button type="button" class="iconbtn" data-act="step" data-to="' + esc(next || '') + '" aria-label="Next idea"' + (next ? '' : ' disabled') + '>' + ICON.next + '</button>' +
      '<button type="button" class="iconbtn" data-act="close" aria-label="Close panel">' + ICON.close + '</button></div></div>' +
      '<div class="panel__body">' + body + '</div>'
  }
  function fact(k, v) { return '<div class="facts__row"><dt class="label">' + esc(k) + '</dt><dd>' + v + '</dd></div>' }
  function stepList(p) {
    var all = arr(p.ideas).map(function (i) { return i.id })
    return state.panelId && state.visibleIds.indexOf(state.panelId) !== -1 ? state.visibleIds : all
  }

  function openPanel(b, p, idea, focus) {
    var wasOpen = !!state.panelId
    state.panelId = idea.id
    $panel.innerHTML = panelHtml(b, p, idea)
    $panel.setAttribute('aria-label', 'Idea ' + idea.id + (idea.name ? ', ' + idea.name : ''))
    $panel.removeAttribute('inert')
    $app.classList.add('is-open')
    markActive()
    if (focus || !wasOpen) requestAnimationFrame(function () { $panel.focus({ preventScroll: true }) })
  }
  function closePanelUI() {
    if (!state.panelId) return
    var id = state.panelId, hadFocus = $panel.contains(document.activeElement)
    state.panelId = null
    $app.classList.remove('is-open')
    $panel.setAttribute('inert', '')
    markActive()
    if (hadFocus) {
      var el = $main.querySelector('[data-id="' + cssEsc(id) + '"] a')
      ;(el || $main).focus({ preventScroll: false })
    }
  }
  function markActive() {
    var nodes = $main.querySelectorAll('[data-id]')
    for (var i = 0; i < nodes.length; i++) {
      var on = nodes[i].getAttribute('data-id') === state.panelId
      nodes[i].classList.toggle('is-active', on)
      var a = nodes[i].querySelector('a')
      if (a) { if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current') }
    }
    if (state.panelId) {
      var el = $main.querySelector('[data-id="' + cssEsc(state.panelId) + '"]')
      if (el && el.scrollIntoView) {
        var r = el.getBoundingClientRect()
        if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' })
      }
    }
  }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&') }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches }

  function closePanel() {
    var r = state.route
    if (!r || !r.id) return
    if (state.panelPushed) { state.panelPushed = false; history.back() }
    else go(hP(r.slug, r.n), true)
  }
  function step(id) {
    if (!id || !state.route) return
    var b = findB(state.route.slug)
    if (b) go(hI(b, id), true)
  }

  /* ---------- date range picker (index toolbar) ----------
     Dates are local-calendar 'YYYY-MM-DD' strings throughout; arithmetic goes through Date.UTC
     so no timezone can shift a day. Filters on last modified, inclusive at both ends. */

  var LOCALE = 'en-GB'   // the shell's own dates read '16 Nov 2026'
  function pad(n) { return (n < 10 ? '0' : '') + n }
  function ymd(y, m, d) { var t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()) }
  function dparts(s) { return s.split('-').map(Number) }
  function addDays(s, n) { var p = dparts(s); return ymd(p[0], p[1], p[2] + n) }
  function addMonths(s, n) {
    var p = dparts(s), last = new Date(Date.UTC(p[0], p[1] - 1 + n + 1, 0)).getUTCDate()
    return ymd(p[0], p[1] + n, Math.min(p[2], last))
  }
  function dow(s) { var p = dparts(s); return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay() }
  function asUTC(s) { var p = dparts(s); return Date.UTC(p[0], p[1] - 1, p[2]) }
  function todayStr() { var t = new Date(); return ymd(t.getFullYear(), t.getMonth() + 1, t.getDate()) }
  var WEEK_START = (function () {   // 0 = Sunday, 1 = Monday; Monday unless the locale says otherwise
    try {
      var loc = new Intl.Locale(navigator.language || LOCALE)
      var wi = typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo
      if (wi && wi.firstDay) return wi.firstDay % 7
    } catch (e) {}
    return 1
  })()
  var fmtMonth = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  var fmtWd = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: 'UTC' })
  var fmtWdLong = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', timeZone: 'UTC' })
  var fmtFull = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

  var PRESETS = [
    ['7d', 'Last 7 days', function (t) { return [addDays(t, -6), t] }],
    ['30d', 'Last 30 days', function (t) { return [addDays(t, -29), t] }],
    ['3m', 'Last 3 months', function (t) { return [addMonths(t, -3), t] }],
    ['year', 'This year', function (t) { return [t.slice(0, 4) + '-01-01', t] }],
    ['any', 'Any date', function () { return ['', ''] }]
  ]

  var dp = { open: false, month: '', focus: '', anchor: '', hover: '' }
  var $dp = document.createElement('div')
  $dp.className = 'dp'; $dp.id = 'dp'; $dp.tabIndex = -1
  $dp.setAttribute('role', 'dialog'); $dp.setAttribute('aria-label', 'Filter by date modified'); $dp.setAttribute('inert', '')
  var $dpScrim = document.createElement('div')
  $dpScrim.className = 'dp-scrim'; $dpScrim.setAttribute('aria-hidden', 'true')
  document.body.appendChild($dpScrim); document.body.appendChild($dp)

  function rangeLabel(f) {
    if (!f.from && !f.to) return 'Any date'
    var a = f.from || f.to, b = f.to || f.from
    if (a === b) return fmtDate(a)
    var pa = dparts(a), pb = dparts(b)
    return (pa[0] === pb[0] ? pa[2] + ' ' + MONTHS[pa[1] - 1] : fmtDate(a)) + ' – ' + fmtDate(b)
  }
  function rangePill() {
    var f = filt(), set = !!(f.from || f.to)
    return '<span class="range' + (set ? ' is-set' : '') + '" id="range">' +
      '<button type="button" class="range__btn" data-act="range" aria-haspopup="dialog" aria-expanded="' + dp.open + '" aria-controls="dp">' +
      ICON.cal + '<span class="vh">Date modified: </span><span>' + esc(rangeLabel(f)) + '</span></button>' +
      (set ? '<button type="button" class="range__clear" data-act="range-clear" aria-label="Clear dates">' + ICON.close + '</button>' : '') + '</span>'
  }
  function refreshPill(focusIt) {
    var el = document.getElementById('range')
    if (!el) return
    el.outerHTML = rangePill()
    if (focusIt) { var b = document.querySelector('.range__btn'); if (b) b.focus() }
  }
  function setRange(a, b) { var f = filt(); f.from = a; f.to = b; fill() }

  function dpDays() {
    var y = +dp.month.slice(0, 4), m = +dp.month.slice(5, 7), n = new Date(Date.UTC(y, m, 0)).getUTCDate()
    var out = []; for (var d = 1; d <= n; d++) out.push(ymd(y, m, d))
    return out
  }
  function renderDp() {
    var f = filt(), t = todayStr(), days = dpDays(), lead = (dow(days[0]) - WEEK_START + 7) % 7
    var heads = '', cells = ''
    for (var i = 0; i < 7; i++) {
      var wd = addDays('2023-12-31', (WEEK_START + i) % 7)   // 31 Dec 2023 was a Sunday
      heads += '<span class="dp__wd" aria-hidden="true" title="' + esc(fmtWdLong.format(asUTC(wd))) + '">' + esc(fmtWd.format(asUTC(wd)).slice(0, 2)) + '</span>'
    }
    for (var j = 0; j < lead; j++) cells += '<span class="dp__blank"></span>'
    days.forEach(function (d) {
      cells += '<button type="button" class="dp__day" data-day="' + d + '" tabindex="' + (d === dp.focus ? 0 : -1) + '" aria-label="' +
        esc(fmtFull.format(asUTC(d)) + (d === t ? ', today' : '')) + '">' + +d.slice(8) + '</button>'
    })
    var presets = PRESETS.map(function (p) {
      var r = p[2](t), on = r[0] === (f.from || '') && r[1] === (f.to || '')
      return '<button type="button" class="dp__preset" data-preset="' + p[0] + '" aria-pressed="' + on + '">' + esc(p[1]) + '</button>'
    }).join('')
    $dp.innerHTML = '<div class="dp__presets" role="group" aria-label="Presets">' + presets + '</div>' +
      '<div class="dp__cal"><div class="dp__head">' +
      '<button type="button" class="iconbtn iconbtn--sm" data-month="-1" aria-label="Previous month">' + ICON.prev + '</button>' +
      '<span class="dp__title" aria-live="polite">' + esc(fmtMonth.format(asUTC(dp.month))) + '</span>' +
      '<button type="button" class="iconbtn iconbtn--sm" data-month="1" aria-label="Next month">' + ICON.next + '</button></div>' +
      '<div class="dp__grid">' + heads + cells + '</div>' +
      '<p class="dp__hint" aria-live="polite">' + (dp.anchor ? 'Pick the end date' : 'Pick a start date') + '</p></div>'
    paintRange()
  }
  function paintRange() {
    var f = filt(), a, b, t = todayStr()
    if (dp.anchor) { a = dp.anchor; b = dp.hover || dp.anchor } else { a = f.from || f.to; b = f.to || f.from }
    if (a && b && a > b) { var x = a; a = b; b = x }
    var els = $dp.querySelectorAll('.dp__day')
    for (var i = 0; i < els.length; i++) {
      var d = els[i].getAttribute('data-day'), inR = !!a && d >= a && d <= b, end = !!a && (d === a || d === b)
      els[i].classList.toggle('is-end', end)
      els[i].classList.toggle('is-in', inR && !end)
      els[i].classList.toggle('is-today', d === t)
      els[i].setAttribute('aria-pressed', String(inR))
    }
    var hint = $dp.querySelector('.dp__hint')
    if (hint) hint.textContent = dp.anchor ? 'Pick the end date' : 'Pick a start date'
  }
  function focusDay(d) {
    if (d) {
      if (d.slice(0, 7) !== dp.month.slice(0, 7)) { dp.focus = d; dp.month = d.slice(0, 8) + '01'; renderDp() }
      dp.focus = d
    }
    var els = $dp.querySelectorAll('.dp__day'), target = null
    for (var i = 0; i < els.length; i++) {
      var on = els[i].getAttribute('data-day') === dp.focus
      els[i].tabIndex = on ? 0 : -1
      if (on) target = els[i]
    }
    if (dp.anchor) { dp.hover = dp.focus; paintRange() }
    if (target) target.focus()
  }
  function openDp() {
    var f = filt()
    dp.open = true; dp.anchor = ''; dp.hover = ''
    dp.focus = f.to || f.from || todayStr()
    dp.month = dp.focus.slice(0, 8) + '01'
    renderDp()
    $dp.removeAttribute('inert')
    placeDp()
    $dp.classList.add('is-on'); $dpScrim.classList.add('is-on')
    var b = document.querySelector('.range__btn'); if (b) b.setAttribute('aria-expanded', 'true')
    focusDay()
  }
  function closeDp(returnFocus) {
    if (!dp.open) return
    dp.open = false; dp.anchor = ''; dp.hover = ''
    $dp.classList.remove('is-on'); $dpScrim.classList.remove('is-on'); $dp.setAttribute('inert', '')
    var b = document.querySelector('.range__btn')
    if (b) { b.setAttribute('aria-expanded', 'false'); if (returnFocus) b.focus() }
  }
  function placeDp() {
    if (!dp.open) return
    if (window.matchMedia && matchMedia('(max-width: 640px)').matches) { $dp.style.top = ''; $dp.style.left = ''; return }
    var host = document.getElementById('range'); if (!host) return
    var r = host.getBoundingClientRect(), w = $dp.offsetWidth, vw = document.documentElement.clientWidth
    $dp.style.top = (r.bottom + window.scrollY + 8) + 'px'
    $dp.style.left = (Math.max(16, Math.min(r.left, vw - w - 16)) + window.scrollX) + 'px'
  }
  function pick(a, b) { setRange(a, b); closeDp(false); refreshPill(true) }

  $dp.addEventListener('click', function (e) {
    var pr = e.target.closest('[data-preset]')
    if (pr) {
      for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i][0] === pr.getAttribute('data-preset')) { var r = PRESETS[i][2](todayStr()); pick(r[0], r[1]) }
      return
    }
    var mb = e.target.closest('[data-month]')
    if (mb) { dp.month = addMonths(dp.month, +mb.getAttribute('data-month')); dp.focus = dp.month; renderDp(); mb = $dp.querySelector('[data-month="' + mb.getAttribute('data-month') + '"]'); if (mb) mb.focus(); return }
    var day = e.target.closest('[data-day]')
    if (!day) return
    var d = day.getAttribute('data-day')
    if (!dp.anchor) { dp.anchor = d; dp.hover = d; dp.focus = d; paintRange(); focusDay() }
    else { var a = dp.anchor < d ? dp.anchor : d, b = dp.anchor < d ? d : dp.anchor; pick(a, b) }
  })
  $dp.addEventListener('mouseover', function (e) {
    var day = e.target.closest('[data-day]')
    if (day && dp.anchor) { dp.hover = day.getAttribute('data-day'); paintRange() }
  })
  $dp.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeDp(true); return }
    if (e.key === 'Tab') {   // Tab cycles inside the dialog: presets, month buttons, the current day
      var f = [].slice.call($dp.querySelectorAll('button')).filter(function (el) { return el.tabIndex >= 0 && !el.disabled })
      var i = f.indexOf(document.activeElement)
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus() }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus() }
      return
    }
    var day = e.target.closest && e.target.closest('[data-day]')
    if (!day) return
    var d = day.getAttribute('data-day'), to = null, k = e.key
    if (k === 'ArrowLeft') to = addDays(d, -1)
    else if (k === 'ArrowRight') to = addDays(d, 1)
    else if (k === 'ArrowUp') to = addDays(d, -7)
    else if (k === 'ArrowDown') to = addDays(d, 7)
    else if (k === 'Home') to = addDays(d, -((dow(d) - WEEK_START + 7) % 7))
    else if (k === 'End') to = addDays(d, 6 - ((dow(d) - WEEK_START + 7) % 7))
    else if (k === 'PageUp') to = addMonths(d, e.shiftKey ? -12 : -1)
    else if (k === 'PageDown') to = addMonths(d, e.shiftKey ? 12 : 1)
    if (to) { e.preventDefault(); e.stopPropagation(); focusDay(to) }
  })
  $dp.addEventListener('focusout', function (e) {
    var to = e.relatedTarget
    if (dp.open && to && !$dp.contains(to) && !(document.getElementById('range') || $dp).contains(to)) closeDp(false)
  })
  document.addEventListener('focusin', function (e) {
    var host = document.getElementById('range')
    if (dp.open && !$dp.contains(e.target) && !(host && host.contains(e.target))) closeDp(false)
  })
  document.addEventListener('mousedown', function (e) {
    if (!dp.open) return
    var host = document.getElementById('range')
    if ($dp.contains(e.target) || (host && host.contains(e.target))) return
    closeDp(false)
  })
  window.addEventListener('resize', placeDp)

  /* ---------- routing ---------- */

  function parse() {
    var raw = location.hash.replace(/^#\/?/, '')
    var parts = raw.split('/').filter(Boolean).map(function (s) { try { return decodeURIComponent(s) } catch (e) { return s } })
    if (!parts.length) return { page: 'index', key: 'index' }
    var slug = parts[0]
    if (parts.length === 1) return { page: 'brainstorm', slug: slug, key: 'b:' + slug }
    var m = /^pass-(\d+)$/.exec(parts[1])
    if (!m) return { page: 'brainstorm', slug: slug, key: 'b:' + slug }
    if (parts[2] && parts[3] === 'view') return { page: 'view', slug: slug, n: +m[1], id: parts[2], key: 'v:' + slug + '/' + m[1] }
    return { page: 'pass', slug: slug, n: +m[1], id: parts[2] || null, key: 'p:' + slug + '/' + m[1] }
  }
  function go(hash, replace) {
    if (replace) { history.replaceState(null, '', hash); route() }
    else location.hash = hash
  }

  function route() {
    closeDp(false)
    var prev = state.route, r = parse()
    var samePage = r.key === state.pageKey
    // a pushed open: the pass page without a panel, then the same page with one
    if (!r.id || !samePage) state.panelPushed = false
    else if (prev && !prev.id && !state.panelId) state.panelPushed = true
    state.route = r

    if (r.page === 'view') {
      state.pageKey = r.key
      state.sel.clear(); updateBar()
      state.panelId = null
      $app.classList.remove('is-open')
      $panel.setAttribute('inert', '')
      renderViewer(r, samePage)
      return
    }
    $app.classList.remove('is-viewer')
    if (!samePage) {
      state.pageKey = r.key
      state.sel.clear()
      state.panelId = null
      $app.classList.remove('is-open')
      $panel.setAttribute('inert', '')
      render(r)
      window.scrollTo(0, 0)
      updateBar()
    }
    if (r.page === 'pass' && r.id) {
      var b = findB(r.slug), p = b && findPass(b, r.n), hit = b && info(b).ideas[r.id]
      if (hit && hit.pass === p) openPanel(b, p, hit.idea, !samePage)
      else closePanelUI()
    } else closePanelUI()
  }

  /* ---------- viewer: the idea itself, full screen, with the pass around it ---------- */

  function renderViewer(r, samePage) {
    var b = findB(r.slug), p = b && findPass(b, r.n), hit = b && info(b).ideas[r.id]
    $app.classList.remove('is-viewer')
    if (!b || !p || !hit || hit.pass !== p) {
      $main.innerHTML = pageMissing(b ? 'The idea “' + r.id + '”' : 'The brainstorm “' + r.slug + '”')
      return
    }
    var idea = hit.idea, title = b.title || b.slug, url = safeUrl(idea.url)
    var ids = arr(p.ideas).map(function (i) { return i.id }), k = ids.indexOf(idea.id)
    var prev = k > 0 ? ids[k - 1] : null, next = k < ids.length - 1 ? ids[k + 1] : null
    var refocus = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-dir')
    document.title = idea.id + ' ' + (idea.name || '') + ' / Pass ' + p.n + ' / ' + title
    var crumbs = '<nav class="crumbs vbar__crumbs" aria-label="Breadcrumb"><ol>' +
      '<li class="crumb--far"><a href="#/">Home</a></li>' +
      '<li class="crumb--far"><a href="' + esc(hB(b.slug)) + '">' + esc(title) + '</a></li>' +
      '<li><a href="' + esc(hI(b, idea.id)) + '">Pass ' + esc(p.n) + '</a></li>' +
      '<li class="crumb--idea"><span aria-current="page"><span class="num">' + esc(idea.id) + '</span>' +
      (idea.name ? ' <span class="crumb__name">' + esc(idea.name) + '</span>' : '') + '</span></li></ol></nav>'
    var stepper = '<div class="vbar__step" role="group" aria-label="Ideas in pass ' + esc(p.n) + '">' +
      (prev ? '<a class="iconbtn" data-dir="prev" href="' + esc(hV(b, prev)) + '" aria-label="Previous idea, ' + esc(prev) + '">' + ICON.prev + '</a>'
            : '<span class="iconbtn is-off" aria-hidden="true">' + ICON.prev + '</span>') +
      '<span class="vbar__pos num" aria-live="polite">' + (k + 1) + ' of ' + ids.length + '</span>' +
      (next ? '<a class="iconbtn" data-dir="next" href="' + esc(hV(b, next)) + '" aria-label="Next idea, ' + esc(next) + '">' + ICON.next + '</a>'
            : '<span class="iconbtn is-off" aria-hidden="true">' + ICON.next + '</span>') + '</div>'
    var tools = '<div class="vbar__tools">' + (mark(idea.status) || '') + stepper +
      (url ? '<a class="iconbtn" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" aria-label="Open in new tab">' + ICON.out + '</a>' : '') +
      themeBtn() + '</div>'
    var frame = url
      ? '<iframe title="' + esc(idea.id + (idea.name ? ', ' + idea.name : '')) + '" src="' + esc(url) + '"></iframe>'
      : '<div class="vempty"><p class="vempty__title">No live view for this idea</p>' +
        (idea.source ? '<p class="vempty__src"><span class="label">Source</span><span class="source"><code>' + esc(idea.source) + '</code><button type="button" class="iconbtn iconbtn--sm" data-act="copy" data-copy="' + esc(idea.source) + '" aria-label="Copy source path">' + ICON.copy + '</button></span></p>' : '') +
        '<p><a class="idlink" href="' + esc(hI(b, idea.id)) + '">Back to pass ' + esc(p.n) + '</a></p></div>'
    $main.innerHTML = '<div class="viewer"><header class="vbar">' + crumbs + tools + '</header><div class="vframe">' + frame + '</div></div>'
    $app.classList.add('is-viewer')
    var ifr = $main.querySelector('iframe')
    if (ifr) ifr.addEventListener('load', function () { ifr.classList.add('is-loaded') })
    // keep the keyboard where it was, so stepping can carry on
    var again = refocus && $main.querySelector('[data-dir="' + refocus + '"]')
    if (again) again.focus()
    else if (!samePage) $main.focus({ preventScroll: true })
  }
  function leaveViewer() {
    var r = state.route, b = r && findB(r.slug)
    if (b && info(b).ideas[r.id]) go(hI(b, r.id), true)
    else go('#/', true)
  }

  function render(r) {
    if (!BRAINSTORMS.length) { $main.innerHTML = pageEmpty(); return }
    if (r.page === 'index') { $main.innerHTML = pageIndex(); fill(); return }
    var b = findB(r.slug)
    if (!b) { $main.innerHTML = pageMissing('The brainstorm “' + r.slug + '”'); return }
    if (r.page === 'brainstorm') { $main.innerHTML = pageBrainstorm(b); fill(); return }
    var p = findPass(b, r.n)
    if (!p) { $main.innerHTML = pageMissing('Pass ' + r.n + ' of “' + (b.title || b.slug) + '”'); return }
    $main.innerHTML = pagePass(b, p); fill()
  }

  /* re-render only the collection, so inputs keep focus */
  function fill() {
    var $c = document.getElementById('collection')
    if (!$c) return
    var r = state.route, b = r && r.slug ? findB(r.slug) : null
    if (r.page === 'index') $c.innerHTML = indexCollection()
    else if (r.page === 'brainstorm' && b) $c.innerHTML = passesCollection(b)
    else if (r.page === 'pass' && b) $c.innerHTML = ideasCollection(b, findPass(b, r.n))
    $c.setAttribute('data-view', state.view)
    $main.classList.toggle('has-selection', state.sel.size > 0)
  }

  /* ---------- selection ---------- */

  function updateBar() {
    var n = state.sel.size
    $selcount.textContent = n ? n + ' selected' : ''
    $selbar.classList.toggle('is-on', n > 0)
    if (n) $selbar.removeAttribute('inert'); else $selbar.setAttribute('inert', '')
    $main.classList.toggle('has-selection', n > 0)
  }
  function selectionText() {
    return state.selKeys.filter(function (k) { return state.sel.has(k) }).join(', ')
  }

  function copyText(text, btn) {
    function done(ok) {
      if (!btn) return
      var label = btn.getAttribute('data-label') || btn.innerHTML
      btn.setAttribute('data-label', label)
      if (btn.classList.contains('iconbtn')) btn.setAttribute('aria-label', ok ? 'Copied' : 'Copy failed')
      else btn.textContent = ok ? 'Copied' : 'Copy failed'
      clearTimeout(btn._t)
      btn._t = setTimeout(function () {
        if (btn.classList.contains('iconbtn')) btn.setAttribute('aria-label', 'Copy source path')
        else btn.innerHTML = label
      }, 1400)
      btn.classList.toggle('is-done', ok)
      setTimeout(function () { btn.classList.remove('is-done') }, 1400)
    }
    function fallback() {
      var ta = document.createElement('textarea')
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select()
      var ok = false
      try { ok = document.execCommand('copy') } catch (e) {}
      document.body.removeChild(ta)
      done(ok)
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true) }, fallback)
    else fallback()
  }

  /* ---------- events ---------- */

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]')
    if (t) {
      var a = t.getAttribute('data-act')
      if (a === 'theme') {
        var light = document.documentElement.getAttribute('data-theme') !== 'light'
        document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark')
        store.set('theme', light ? 'light' : 'dark')
        t.outerHTML = themeBtn()
        var nb = document.querySelector('[data-act="theme"]'); if (nb) nb.focus()
      } else if (a === 'view') {
        state.view = t.getAttribute('data-view') === 'list' ? 'list' : 'grid'
        store.set('view', state.view)
        var segs = document.querySelectorAll('[data-act="view"]')
        for (var i = 0; i < segs.length; i++) segs[i].setAttribute('aria-pressed', String(segs[i].getAttribute('data-view') === state.view))
        fill(); markActive()
      } else if (a === 'chosen') {
        var f = filt(); f.chosen = !f.chosen
        t.setAttribute('aria-pressed', String(f.chosen))
        fill(); markActive()
      } else if (a === 'range') {
        if (dp.open) closeDp(true); else openDp()
      } else if (a === 'range-clear') {
        setRange('', ''); refreshPill(true)
      } else if (a === 'history') {
        var hs = document.getElementById('history'), open = t.getAttribute('aria-expanded') !== 'true'
        t.setAttribute('aria-expanded', String(open))
        if (hs) hs.hidden = !open
      } else if (a === 'step') step(t.getAttribute('data-to'))
      else if (a === 'close') closePanel()
      else if (a === 'copy') copyText(t.getAttribute('data-copy') || '', t)
      return
    }
    var dir = e.target.closest('a[data-dir]')
    if (dir && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault(); go(dir.getAttribute('href'), true); return
    }
    // whole table row opens, except its own controls
    var tr = e.target.closest('tr[data-href]')
    if (tr && !e.target.closest('a, button, input, label')) { location.hash = tr.getAttribute('data-href') }
  })
  $scrim.addEventListener('click', closePanel)
  $selcopy.addEventListener('click', function () { copyText(selectionText(), $selcopy) })
  $selclear.addEventListener('click', function () {
    state.sel.clear()
    var boxes = $main.querySelectorAll('input[data-sel]')
    for (var i = 0; i < boxes.length; i++) { boxes[i].checked = false; var h = boxes[i].closest('[data-key]'); if (h) h.classList.remove('is-selected') }
    updateBar()
  })

  document.addEventListener('change', function (e) {
    var t = e.target
    if (t.matches && t.matches('input[data-sel]')) {
      var k = t.getAttribute('data-sel')
      if (t.checked) state.sel.add(k); else state.sel.delete(k)
      var h = t.closest('[data-key]'); if (h) h.classList.toggle('is-selected', t.checked)
      updateBar()
    } else if (t.matches && t.matches('input[type="date"][data-filter]')) {
      filt()[t.getAttribute('data-filter')] = t.value
      fill()
    }
  })
  document.addEventListener('input', function (e) {
    var t = e.target
    if (t.matches && t.matches('input[type="search"][data-filter]')) { filt().q = t.value; fill(); markActive() }
  })

  document.addEventListener('keydown', function (e) {
    if (state.route && state.route.page === 'view') {
      var vt = (e.target.tagName || '').toLowerCase()
      if (vt === 'input' || vt === 'textarea' || vt === 'select' || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') { e.preventDefault(); leaveViewer() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        var vb = findB(state.route.slug), vp = vb && findPass(vb, state.route.n)
        if (!vp) return
        var vids = arr(vp.ideas).map(function (i) { return i.id }), vk = vids.indexOf(state.route.id)
        var vto = vids[vk + (e.key === 'ArrowLeft' ? -1 : 1)]
        if (vto) { e.preventDefault(); go(hV(vb, vto), true) }
      }
      return
    }
    if (!state.panelId) return
    var tag = (e.target.tagName || '').toLowerCase()
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable
    if (e.key === 'Escape') { if (typing && e.target.value) return; e.preventDefault(); closePanel(); return }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      var b = findB(state.route.slug), p = b && findPass(b, state.route.n)
      if (!p) return
      var ids = stepList(p), k = ids.indexOf(state.panelId)
      var to = ids[k + (e.key === 'ArrowLeft' ? -1 : 1)]
      if (to) { e.preventDefault(); step(to) }
    }
  })

  // a thumbnail that fails to load becomes the typographic tile, never a broken image
  document.addEventListener('error', function (e) {
    var img = e.target
    if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-ph-num')) return
    img.outerHTML = ph(img.getAttribute('data-ph-num'), img.getAttribute('data-ph-name'))
  }, true)

  window.addEventListener('hashchange', route)
  route()
})()
