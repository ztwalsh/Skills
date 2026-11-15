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
      '<label class="field field--date"><span>From</span><input type="date" data-filter="from" value="' + esc(f.from) + '" aria-label="Modified from"></label>' +
      '<label class="field field--date"><span>To</span><input type="date" data-filter="to" value="' + esc(f.to) + '" aria-label="Modified to"></label>' +
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
        return '<li class="card' + cls(b.slug, b.status === 'archived') + '" data-key="' + esc(b.slug) + '" style="--i:' + k + '">' +
          '<a class="card__link" href="' + esc(hB(b.slug)) + '">' + tile(b.slug, fi) +
          '<span class="card__text"><span class="card__title">' + esc(b.title || b.slug) + '</span>' +
          (b.description ? '<span class="card__desc">' + esc(b.description) + '</span>' : '') +
          '<span class="card__meta">' + timeTag(b.modified) + mark(b.status) + '</span></span></a>' +
          check(b.slug, 'Select ' + (b.title || b.slug)) + '</li>'
      }).join('') + '</ul>'
    }
    return '<div class="tablewrap"><table class="table"><thead><tr><th class="c-check"><span class="vh">Select</span></th><th>Title</th><th class="c-wide">Description</th><th class="c-date">Modified</th><th class="c-status">Status</th></tr></thead><tbody>' +
      list.map(function (b) {
        return '<tr class="' + cls(b.slug, b.status === 'archived') + '" data-key="' + esc(b.slug) + '" data-href="' + esc(hB(b.slug)) + '">' +
          '<td class="c-check">' + check(b.slug, 'Select ' + (b.title || b.slug)) + '</td>' +
          '<td><a class="rowlink" href="' + esc(hB(b.slug)) + '">' + esc(b.title || b.slug) + '</a>' + (b.description ? '<span class="sub">' + esc(b.description) + '</span>' : '') + '</td>' +
          '<td class="c-wide muted">' + esc(b.description || '') + '</td>' +
          '<td class="c-date num">' + timeTag(b.modified) + '</td>' +
          '<td class="c-status">' + statusText(b.status) + '</td></tr>'
      }).join('') + '</tbody></table></div>'
  }
  function cls(key, dim) { return (state.sel.has(key) ? ' is-selected' : '') + (dim ? ' is-dim' : '') }

  function pageBrainstorm(b) {
    var I = info(b), title = b.title || b.slug
    document.title = title + ' / Playground'
    var out = top([{ label: 'Home', href: '#/' }, { label: title }]) +
      '<div class="head"><h1>' + esc(title) + '</h1>' +
      '<p class="head__meta">' + [timeTag(b.modified) ? '<span>Modified ' + timeTag(b.modified) + '</span>' : '', '<span>' + plural(I.passes.length, 'pass', 'passes') + '</span>'].filter(Boolean).join('<span class="dot" aria-hidden="true"></span>') + mark(b.status) + '</p>' +
      (b.description ? '<p class="head__desc">' + esc(b.description) + '</p>' : '') + '</div>'
    var bq = b.brief && b.brief.quote
    if (bq) out += '<section class="sec" aria-labelledby="h-brief"><h2 id="h-brief" class="label">Brief</h2>' + quote(bq, 'quote--brief', 'User' + (b.brief.date ? ', ' + timeTag(b.brief.date) : '')) + '</section>'
    var oc = b.outcome
    if (oc && oc.idea) {
      var hit = I.ideas[oc.idea]
      out += '<section class="sec outcome" aria-labelledby="h-outcome"><h2 id="h-outcome" class="label">Outcome</h2>' +
        '<p class="outcome__pick"><span class="mark mark--final">Final</span> ' + ideaLinks(b, [oc.idea]) + (hit && hit.idea.name ? ' <span class="outcome__name">' + esc(hit.idea.name) + '</span>' : '') +
        (oc.date ? '<span class="muted"> ' + timeTag(oc.date) + '</span>' : '') + '</p>' +
        (oc.summary ? '<p class="outcome__summary">' + esc(oc.summary) + '</p>' : '') + '</section>'
    }
    out += '<section class="sec" aria-labelledby="h-passes"><div class="sec__head"><h2 id="h-passes" class="label">Passes</h2>' + viewToggle() + '</div>' +
      '<div class="collection" id="collection"></div></section>'
    out += '<section class="sec" aria-labelledby="h-history"><h2 id="h-history" class="label">History</h2>' +
      (I.log.length ? entries(b, I.log) : empty('No history yet.')) + '</section>'
    return out
  }
  function passesCollection(b) {
    var ps = info(b).passes
    state.selKeys = []
    if (!ps.length) return empty('No passes yet.')
    if (state.view === 'grid') {
      return '<ul class="grid" role="list">' + ps.map(function (p, k) {
        var n = arr(p.ideas).length, c = chosenCount(p), fq = p.brief && p.brief.quote
        return '<li class="card" style="--i:' + k + '"><a class="card__link" href="' + esc(hP(b.slug, p.n)) + '">' + tile(b.slug, firstIdea(p)) +
          '<span class="card__text"><span class="card__title"><span>Pass ' + esc(p.n) + '</span><span class="card__date">' + timeTag(p.date) + '</span></span>' +
          '<span class="card__meta"><span>' + plural(n, 'idea', 'ideas') + ', ' + c + ' chosen</span></span>' +
          (fq ? '<span class="card__quote">“' + esc(fq) + '”</span>' : '') + '</span></a></li>'
      }).join('') + '</ul>'
    }
    return '<div class="tablewrap"><table class="table"><thead><tr><th class="c-num">Pass</th><th class="c-date">Date</th><th class="c-wide">Started from</th><th class="c-num">Ideas</th><th class="c-num">Chosen</th></tr></thead><tbody>' +
      ps.map(function (p) {
        var fq = p.brief && p.brief.quote
        return '<tr data-href="' + esc(hP(b.slug, p.n)) + '"><td class="c-num"><a class="rowlink" href="' + esc(hP(b.slug, p.n)) + '">Pass ' + esc(p.n) + '</a>' +
          (fq ? '<span class="sub">“' + esc(fq) + '”</span>' : '') + '</td>' +
          '<td class="c-date num">' + timeTag(p.date) + '</td>' +
          '<td class="c-wide">' + (fq ? '<span class="qtext">“' + esc(fq) + '”</span>' : '<span class="muted">No feedback recorded</span>') + '</td>' +
          '<td class="c-num num">' + arr(p.ideas).length + '</td><td class="c-num num">' + chosenCount(p) + '</td></tr>'
      }).join('') + '</tbody></table></div>'
  }

  function pagePass(b, p) {
    var title = b.title || b.slug, n = arr(p.ideas).length, f = filt()
    document.title = 'Pass ' + p.n + ' / ' + title + ' / Playground'
    var by = p.brief && p.brief.by === 'agent' ? 'Agent' : 'User'
    var fq = p.brief && p.brief.quote
    var out = top([{ label: 'Home', href: '#/' }, { label: title, href: hB(b.slug) }, { label: 'Pass ' + p.n }]) +
      '<div class="head"><h1>Pass ' + esc(p.n) + '</h1><p class="head__meta">' +
      [timeTag(p.date), '<span>' + plural(n, 'idea', 'ideas') + '</span>', '<span>' + chosenCount(p) + ' chosen</span>'].filter(Boolean).join('<span class="dot" aria-hidden="true"></span>') + '</p></div>'
    if (fq || arr(p.from).length || p.summary) {
      out += '<section class="sec sec--tight" aria-label="Where this pass came from">' +
        (fq ? (by === 'User' ? quote(fq, '', 'User') : agentNote(fq, 'Agent’s brief')) : '') +
        (arr(p.from).length ? '<p class="from"><span class="label">Grew from</span> ' + ideaLinks(b, p.from) + '</p>' : '') +
        agentNote(p.summary, 'Agent’s summary') + '</section>'
    }
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
    if (state.view === 'grid') {
      return '<ul class="grid grid--ideas" role="list">' + list.map(function (i, k) {
        return '<li class="cell' + cls(i.id, i.status === 'dropped') + act(i.id) + '" data-key="' + esc(i.id) + '" data-id="' + esc(i.id) + '" style="--i:' + k + '">' +
          '<a class="card__link" href="' + esc(hI(b, i.id)) + '"' + cur(i.id) + '>' + tile(b.slug, i) +
          '<span class="cell__text"><span class="cell__num">' + esc(ideaNum(i.id)) + '</span><span class="cell__name">' + esc(i.name || '') + '</span>' + mark(i.status) + '</span></a>' +
          check(i.id, 'Select ' + i.id) + '</li>'
      }).join('') + '</ul>'
    }
    return '<div class="tablewrap"><table class="table"><thead><tr><th class="c-check"><span class="vh">Select</span></th><th class="c-id">ID</th><th>Name</th><th class="c-wide">Bet</th><th class="c-status">Status</th><th class="c-num c-eval">Eval</th></tr></thead><tbody>' +
      list.map(function (i) {
        var score = i.eval && i.eval.score != null ? esc(i.eval.score) : '<span class="muted">·</span>'
        return '<tr class="' + cls(i.id, i.status === 'dropped') + act(i.id) + '" data-key="' + esc(i.id) + '" data-id="' + esc(i.id) + '" data-href="' + esc(hI(b, i.id)) + '">' +
          '<td class="c-check">' + check(i.id, 'Select ' + i.id) + '</td>' +
          '<td class="c-id num"><a class="rowlink" href="' + esc(hI(b, i.id)) + '"' + cur(i.id) + '>' + esc(i.id) + '</a></td>' +
          '<td>' + esc(i.name || '') + (i.bet ? '<span class="sub">' + esc(i.bet) + '</span>' : '') + '</td>' +
          '<td class="c-wide muted">' + esc(i.bet || '') + '</td>' +
          '<td class="c-status">' + statusText(i.status) + '</td>' +
          '<td class="c-num c-eval num">' + score + '</td></tr>'
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
    if (url) body += '<p class="panel__open"><a class="pill pill--solid" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Open idea ' + ICON.out + '</a></p>'
    body += '<dl class="facts">'
    body += fact('Status', idea.status ? esc(cap(idea.status)) : 'Open')
    body += fact('Grew from', arr(idea.parents).length ? ideaLinks(b, idea.parents) : '<span class="muted">Nothing, a first idea</span>')
    body += fact('Led to', led.length ? ideaLinks(b, led) : '<span class="muted">Nothing yet</span>')
    if (ev && (ev.score != null || ev.note)) body += fact('Eval', (ev.score != null ? '<span class="num">' + esc(ev.score) + '</span>' : '') + (ev.note ? '<span class="facts__note">' + esc(ev.note) + '</span>' : ''))
    if (idea.source) body += fact('Source', '<span class="source"><code>' + esc(idea.source) + '</code><button type="button" class="iconbtn iconbtn--sm" data-act="copy" data-copy="' + esc(idea.source) + '" aria-label="Copy source path">' + ICON.copy + '</button></span>')
    body += '</dl>'
    if (logs.length) body += '<section class="panel__sec" aria-label="History of this idea"><h3 class="label">History</h3>' + entries(b, logs) + '</section>'
    return '<div class="panel__head"><p class="panel__id"><span class="panel__num">' + esc(idea.id) + '</span><span class="vh"> of pass ' + esc(p.n) + '</span></p>' +
      '<div class="panel__nav">' +
      '<button type="button" class="iconbtn" data-act="step" data-to="' + esc(prev || '') + '" aria-label="Previous idea"' + (prev ? '' : ' disabled') + '>' + ICON.prev + '</button>' +
      '<button type="button" class="iconbtn" data-act="step" data-to="' + esc(next || '') + '" aria-label="Next idea"' + (next ? '' : ' disabled') + '>' + ICON.next + '</button>' +
      '<button type="button" class="iconbtn" data-act="close" aria-label="Close panel">' + ICON.close + '</button></div></div>' +
      '<div class="panel__body">' + body + '</div>'
  }
  function fact(k, v) { return '<div class="facts__row"><dt class="label">' + esc(k) + '</dt><dd>' + v + '</dd></div>' }
  function cap(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1) }
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

  /* ---------- routing ---------- */

  function parse() {
    var raw = location.hash.replace(/^#\/?/, '')
    var parts = raw.split('/').filter(Boolean).map(function (s) { try { return decodeURIComponent(s) } catch (e) { return s } })
    if (!parts.length) return { page: 'index', key: 'index' }
    var slug = parts[0]
    if (parts.length === 1) return { page: 'brainstorm', slug: slug, key: 'b:' + slug }
    var m = /^pass-(\d+)$/.exec(parts[1])
    if (!m) return { page: 'brainstorm', slug: slug, key: 'b:' + slug }
    return { page: 'pass', slug: slug, n: +m[1], id: parts[2] || null, key: 'p:' + slug + '/' + m[1] }
  }
  function go(hash, replace) {
    if (replace) { history.replaceState(null, '', hash); route() }
    else location.hash = hash
  }

  function route() {
    var prev = state.route, r = parse()
    var samePage = r.key === state.pageKey
    // a pushed open: the pass page without a panel, then the same page with one
    if (!r.id || !samePage) state.panelPushed = false
    else if (prev && !prev.id && !state.panelId) state.panelPushed = true
    state.route = r

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
      } else if (a === 'step') step(t.getAttribute('data-to'))
      else if (a === 'close') closePanel()
      else if (a === 'copy') copyText(t.getAttribute('data-copy') || '', t)
      return
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
