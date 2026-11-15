#!/usr/bin/env node
// Reads logo/logo.json and every logo/rounds/round-N.mjs, checks them, and writes:
//   logo/data.js                                          what the viewer loads
//   brain/decisions/brainstorms/<date>-logo-<name>.md     the readable history, when the repo has brain/
//   logo/HISTORY.md                                       the same history, when it does not
//
//   node logo/viewer/sync.mjs [--check]
//
// --check reports problems and writes nothing. Exits 1 on errors. No dependencies.
// Run it after every change to logo.json or a round file.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(root, '..')
const checkOnly = process.argv.includes('--check')

const LOG_TYPES = ['brief', 'recommend', 'chosen', 'dropped', 'feedback', 'refined', 'final', 'note']
const STATUS = ['chosen', 'dropped', 'final']
const DATE = /^\d{4}-\d{2}-\d{2}$/
const ID = /^r(\d+)-(\d{3})$/
const pad = (n) => String(n).padStart(3, '0')
const kebab = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

let markCount = 0
const errors = []
const written = []
const warnings = []
const err = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

let logo
try { logo = JSON.parse(readFileSync(join(root, 'logo.json'), 'utf8')) } catch (e) {
  console.log(`error    logo.json could not be read (${e.message})`)
  process.exit(1)
}

// ── logo.json ────────────────────────────────────────────────────────────────────
if (logo.schema !== 1) err(`"schema" must be 1`)
for (const k of ['name', 'created']) if (!logo[k]) err(`missing "${k}"`)
if (logo.created && !DATE.test(logo.created)) err(`"created" must be YYYY-MM-DD`)
if (!['open', 'decided', 'archived'].includes(logo.status)) err(`"status" must be open, decided or archived`)
if (!/^#[0-9a-f]{6}$/i.test(logo.colors?.ink ?? '') || !/^#[0-9a-f]{6}$/i.test(logo.colors?.paper ?? '')) err(`"colors" needs "ink" and "paper" as six-digit hex`)
if (!logo.brief?.quote) warn(`no brief quote: the user's opening ask should be recorded word for word`)

const wm = logo.wordmark ?? {}
if (!Array.isArray(wm.parts) || wm.parts.length < 1 || wm.parts.length > 2) err(`"wordmark.parts" must list one or two words`)
const options = new Set()
if (wm.supplied) {
  options.add('supplied')
  const s = wm.supplied
  if (!Array.isArray(s.parts) || s.parts.length !== wm.parts?.length || s.parts.some((p) => !p?.d)) err(`"wordmark.supplied.parts" needs one path ("d") per word`)
  for (const k of ['baseline', 'xTop', 'ascTop']) if (typeof s[k] !== 'number') err(`"wordmark.supplied.${k}" must be a number (the artwork's own coordinates)`)
  if (typeof s.baseline === 'number' && typeof s.xTop === 'number' && s.xTop >= s.baseline) err(`"wordmark.supplied.xTop" must be above the baseline (a smaller y)`)
  if (wm.parts?.length === 2 && typeof s.joinShift !== 'number') err(`"wordmark.supplied.joinShift" is needed for a two-word name: how far the second word moves to read as one word`)
}
for (const f of wm.fonts ?? []) {
  if (!f.id || !f.family) { err(`every font needs an "id" and a "family"`); continue }
  if (options.has(f.id)) err(`font id "${f.id}" is used twice`)
  options.add(f.id)
  if (f.outline) {
    if (!Array.isArray(f.outline.parts) || f.outline.parts.length !== wm.parts?.length) err(`font "${f.id}": "outline.parts" needs one path per word`)
  }
}
if (!options.size) err(`the wordmark needs supplied artwork or at least one font`)
if (wm.active && !options.has(wm.active)) err(`"wordmark.active" is "${wm.active}", which is not "supplied" or a font id`)
if (!wm.active) err(`"wordmark.active" must name the wordmark in use: "supplied" or a font id`)

// ── rounds ───────────────────────────────────────────────────────────────────────
if (!Array.isArray(logo.rounds)) err(`"rounds" must be a list`)
if (!Array.isArray(logo.log)) err(`"log" must be a list`)
if (errors.length) finish()

const marks = new Map() // id -> { round, family, mark }
const rounds = []
const files = existsSync(join(root, 'rounds')) ? readdirSync(join(root, 'rounds')).filter((f) => /^round-\d+\.mjs$/.test(f)) : []
for (const [i, meta] of logo.rounds.entries()) {
  const n = i + 1
  if (meta.n !== n) err(`round ${n} has "n": ${meta.n}; rounds are numbered in order and never removed`)
  if (!DATE.test(meta.date ?? '')) err(`round ${n}: "date" must be YYYY-MM-DD`)
  if (n > 1 && !meta.brief?.quote) warn(`round ${n}: no feedback quote recorded for what started it`)
  if (n > 1 && !(meta.from ?? []).length) warn(`round ${n}: "from" is empty, so its lineage is unknown`)
  const file = `round-${n}.mjs`
  if (!files.includes(file)) { err(`round ${n}: rounds/${file} is missing`); continue }
  let mod
  try { mod = (await import(pathToFileURL(join(root, 'rounds', file)).href + `?t=${Date.now()}`)).default } catch (e) { err(`rounds/${file} could not be loaded (${e.message})`); continue }
  if (!Array.isArray(mod?.families)) { err(`rounds/${file} must export default { families: [...] }`); continue }
  const seen = new Set()
  const families = []
  for (const fam of mod.families) {
    if (!fam.name) err(`round ${n}: a family has no "name"`)
    const out = []
    for (const m of fam.marks ?? []) {
      if (!Number.isInteger(m.n) || m.n < 1 || m.n > 999) { err(`round ${n}: mark number "${m.n}" must be 1 to 999`); continue }
      const id = `r${n}-${pad(m.n)}`
      if (seen.has(m.n)) err(`${id} is used twice`)
      seen.add(m.n)
      if (!m.name) err(`${id}: missing "name"`)
      if (typeof m.svg !== 'string' || !m.svg.trim()) { err(`${id}: missing "svg"`); continue }
      if (/<script|\son[a-z]+\s*=|javascript:/i.test(m.svg)) { err(`${id}: the svg contains script or an event handler`); continue }
      if (/(?:fill|stroke)="(?!currentColor|none|inherit|#?(?:000|fff|000000|ffffff)"|black"|white"|url\()[^"]+"/i.test(m.svg)) warn(`${id}: the svg sets its own colour; marks are one colour, drawn in currentColor`)
      const parents = m.parents ?? fam.parents ?? []
      const mark = { n: m.n, id, name: m.name, svg: m.svg, parents }
      for (const k of ['fixed', 'noFit', 's', 'dx', 'dy']) if (m[k] !== undefined) mark[k] = m[k]
      out.push(mark)
      marks.set(id, { round: n, family: fam.name, mark })
      markCount++
    }
    families.push({ name: fam.name, note: fam.note ?? '', marks: out })
  }
  rounds.push({ n, date: meta.date, brief: meta.brief ?? null, from: meta.from ?? [], summary: meta.summary ?? '', families })
}
for (const f of files) if (+f.match(/\d+/)[0] > logo.rounds.length) err(`rounds/${f} exists but logo.json has no round ${+f.match(/\d+/)[0]}`)

for (const [id, { round, mark }] of marks) for (const p of mark.parents) {
  if (!marks.has(p)) err(`${id}: parent "${p}" does not exist`)
  else if (marks.get(p).round >= round) err(`${id}: parent "${p}" is not from an earlier round`)
}
for (const r of rounds) for (const f of r.from) if (!marks.has(f)) err(`round ${r.n}: "from" names "${f}", which does not exist`)

// ── picks and log ────────────────────────────────────────────────────────────────
const picks = logo.picks ?? {}
for (const [id, s] of Object.entries(picks)) {
  if (!ID.test(id) || !marks.has(id)) err(`picks: "${id}" does not exist`)
  if (!STATUS.includes(s)) err(`picks: "${id}" must be chosen, dropped or final`)
}
const logged = { chosen: new Set(), dropped: new Set(), final: new Set() }
logo.log.forEach((e, i) => {
  const at = `log entry ${i + 1}`
  if (!LOG_TYPES.includes(e.type)) err(`${at}: "type" must be one of ${LOG_TYPES.join(', ')}`)
  if (!DATE.test(e.date ?? '')) err(`${at}: "date" must be YYYY-MM-DD`)
  if (!['user', 'agent'].includes(e.by)) err(`${at}: "by" must be user or agent`)
  if (e.by === 'agent' && e.quote) err(`${at}: an agent entry cannot carry a "quote"; use "note"`)
  if (!e.quote && !e.note) err(`${at}: needs a "quote" or a "note" ("No reason given." when the user gave none)`)
  for (const id of e.marks ?? []) {
    if (!marks.has(id)) err(`${at}: names "${id}", which does not exist`)
    else if (logged[e.type]) logged[e.type].add(id)
  }
})
for (const [id, s] of Object.entries(picks)) if (logged[s] && !logged[s].has(id)) warn(`${id} is "${s}" but no "${s}" log entry names it`)
const finals = Object.entries(picks).filter(([, s]) => s === 'final').map(([id]) => id)
if (finals.length > 1) err(`more than one mark is "final"`)
const out = logo.outcome
if (logo.status === 'decided') {
  if (!out?.mark) err(`"status" is decided but "outcome.mark" is empty`)
  else {
    if (!marks.has(out.mark)) err(`outcome names "${out.mark}", which does not exist`)
    if (finals[0] !== out.mark) err(`outcome names "${out.mark}" but picks marks "${finals[0] ?? 'nothing'}" as final`)
    if (!out.headline) warn(`outcome has no "headline": the summary page opens with the idea in one line`)
    if (!out.idea) warn(`outcome has no "idea": the summary page explains the mark in two or three sentences`)
    if (out.smallCut && (typeof out.smallCut.svg !== 'string' || !out.smallCut.svg.trim())) err(`outcome.smallCut needs an "svg"`)
    const active = (wm.fonts ?? []).find((f) => f.id === wm.active)
    if (active && !active.outline) warn(`the chosen wordmark "${active.id}" is live text, not outlines: artwork cannot be exported until it is outlined (see reference/type.md)`)
  }
}
if (errors.length) finish()

// ── history ──────────────────────────────────────────────────────────────────────
const day = (d) => {
  const [y, m, dd] = d.split('-').map(Number)
  return `${dd} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`
}
const quote = (s) => s.trim().split('\n').map((l) => `> ${l}`).join('\n')
const name = (id) => (marks.has(id) ? `${id} ${marks.get(id).mark.name}` : id)
const LABEL = { brief: 'Brief', recommend: 'Recommended', chosen: 'Chosen', dropped: 'Dropped', feedback: 'Feedback', refined: 'Refined', final: 'Final pick', note: 'Note' }

const dates = [logo.created, ...logo.rounds.map((r) => r.date), ...logo.log.map((e) => e.date)].filter((d) => DATE.test(d ?? ''))
const modified = dates.sort().at(-1)

function history() {
  const h = []
  h.push(`# ${logo.name}: logo`, '', `<!-- Generated by logo/viewer/sync.mjs from logo/logo.json and logo/rounds/. Do not edit: change those and run sync. -->`, '')
  h.push(`- **Status:** ${logo.status}`, `- **Started:** ${day(logo.created)}`, `- **Last change:** ${day(modified)}`)
  h.push(`- **Marks drawn:** ${marks.size} across ${rounds.length} ${rounds.length === 1 ? 'round' : 'rounds'}`)
  const wname = wm.active === 'supplied' ? 'supplied artwork' : (() => { const f = (wm.fonts ?? []).find((x) => x.id === wm.active); return f ? `${f.family}${f.weight ? ` ${f.weight}` : ''}` : wm.active })()
  h.push(`- **Wordmark:** "${wm.parts.join(' ')}", ${wname}`, '')
  if (out?.mark) {
    h.push('## Outcome', '', `**${name(out.mark)}**, picked ${day(out.date ?? modified)}.`, '')
    if (out.headline) h.push(`*${out.headline}*`, '')
    if (out.idea) h.push(out.idea, '')
    const chain = []
    const walk = (id, depth) => {
      const m = marks.get(id)
      if (!m || depth > 20) return
      chain.push(`${'  '.repeat(depth)}- ${name(id)} (${m.family})`)
      for (const p of m.mark.parents) walk(p, depth + 1)
    }
    walk(out.mark, 0)
    if (chain.length > 1) h.push('Where it came from (each line grew from the ones indented under it):', '', ...chain, '')
  }
  if (logo.brief?.quote) h.push('## Brief', '', quote(logo.brief.quote), '', `User, ${day(logo.brief.date ?? logo.created)}.`, '')
  h.push('## Rounds', '')
  for (const r of rounds) {
    const count = r.families.reduce((n, f) => n + f.marks.length, 0)
    h.push(`### Round ${r.n} · ${day(r.date)} · ${count} marks`, '')
    if (r.brief?.quote) h.push(quote(r.brief.quote), '')
    if (r.from.length) h.push(`Grew from: ${r.from.map(name).join('; ')}.`, '')
    if (r.summary) h.push(`${r.summary} *(agent's summary)*`, '')
    h.push('| Marks | Family | Idea |', '|---|---|---|')
    for (const f of r.families) if (f.marks.length) h.push(`| ${pad(f.marks[0].n)}–${pad(f.marks.at(-1).n)} | ${f.name} | ${String(f.note).replace(/\|/g, '\\|')} |`)
    const picked = r.families.flatMap((f) => f.marks).filter((m) => picks[m.id])
    if (picked.length) h.push('', `Picked from this round: ${picked.map((m) => `${m.id} ${m.name} (${picks[m.id]})`).join('; ')}.`)
    h.push('')
  }
  h.push('## Decision log', '', 'In order. Quoted text is the user, word for word. Text marked "agent" is the agent\'s reading.', '')
  for (const e of logo.log) {
    h.push(`**${day(e.date)} · ${LABEL[e.type] ?? e.type} · ${e.by}**${e.marks?.length ? ` · ${e.marks.map(name).join('; ')}` : ''}`, '')
    if (e.quote) h.push(quote(e.quote), '')
    if (e.note) h.push(e.by === 'user' ? `Agent's note: ${e.note}` : e.note, '')
  }
  return h.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

if (!checkOnly) {
  if (logo.modified !== modified) {
    logo.modified = modified
    writeFileSync(join(root, 'logo.json'), JSON.stringify(logo, null, 2) + '\n')
  }
  const brainDir = join(repo, 'brain')
  const useBrain = existsSync(brainDir) && statSync(brainDir).isDirectory()
  const local = join(root, 'HISTORY.md')
  let historyPath
  if (useBrain) {
    const dir = join(brainDir, 'decisions', 'brainstorms')
    mkdirSync(dir, { recursive: true })
    historyPath = join(dir, `${logo.created}-logo-${kebab(logo.name)}.md`)
    if (existsSync(local)) rmSync(local)
  } else historyPath = local
  writeFileSync(historyPath, history())
  written.push(relative(repo, historyPath))

  const data = { ...logo, modified, generated: new Date().toISOString(), history: relative(repo, historyPath), rounds }
  writeFileSync(
    join(root, 'data.js'),
    `// Generated by viewer/sync.mjs. Do not edit: change logo.json or a round file and run sync.\nwindow.LOGO = ${JSON.stringify(data).replace(/</g, '\\u003c')}\n`,
  )
}
finish()

function finish() {
  for (const w of warnings) console.log(`warning  ${w}`)
  for (const e of errors) console.log(`error    ${e}`)
  const n = markCount
  console.log(`${checkOnly ? 'checked' : errors.length ? 'not synced' : 'synced'}: ${n} marks; ${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`)
  if (!checkOnly && !errors.length) for (const w of written) console.log(`history  ${w}`)
  if (errors.length) { console.log('data.js is left as it was until the errors are fixed.'); process.exit(1) }
  process.exit(0)
}
