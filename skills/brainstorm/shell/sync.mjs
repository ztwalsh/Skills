#!/usr/bin/env node
// Reads every playground/<slug>/brainstorm.json, checks it, and writes:
//   playground/data.js                              what the shell loads
//   brain/decisions/brainstorms/<date>-<slug>.md    the readable history, when the repo has brain/
//   playground/<slug>/HISTORY.md                    the same history, when it does not
//
//   node playground/shell/sync.mjs [--check]
//
// --check reports problems and writes nothing. Exits 1 when a file has errors.
// No dependencies. Run it after every change to a brainstorm.json.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const playground = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(playground, '..')
const checkOnly = process.argv.includes('--check')

const STATUS = ['open', 'decided', 'archived']
const IDEA_STATUS = ['open', 'chosen', 'dropped', 'final']
const LOG_TYPES = ['brief', 'recommend', 'chosen', 'dropped', 'feedback', 'refined', 'final', 'note']
const DATE = /^\d{4}-\d{2}-\d{2}$/
const ID = /^p(\d+)-(\d{3})$/

const errors = []
const warnings = []

function check(slug, b) {
  const err = (m) => errors.push(`${slug}: ${m}`)
  const warn = (m) => warnings.push(`${slug}: ${m}`)
  if (b.schema !== 1) err(`"schema" must be 1`)
  if (b.slug !== slug) err(`"slug" is "${b.slug}" but the folder is "${slug}"`)
  for (const k of ['title', 'description', 'created']) if (!b[k]) err(`missing "${k}"`)
  if (b.created && !DATE.test(b.created)) err(`"created" must be YYYY-MM-DD`)
  if (!STATUS.includes(b.status)) err(`"status" must be one of ${STATUS.join(', ')}`)
  if (!b.brief?.quote) warn(`no brief quote: the user's opening ask should be recorded verbatim`)
  if (!b.area) warn(`no "area": the decision cannot be filed under brain/decisions/<area>.md`)
  if (!Array.isArray(b.passes)) return err(`"passes" must be a list`)
  if (!Array.isArray(b.log)) return err(`"log" must be a list`)

  const ids = new Map()
  b.passes.forEach((p, i) => {
    if (p.n !== i + 1) err(`pass ${i + 1} has "n": ${p.n}; passes are numbered in order and never removed`)
    if (!DATE.test(p.date ?? '')) err(`pass ${p.n}: "date" must be YYYY-MM-DD`)
    if (p.n > 1 && !p.brief?.quote) warn(`pass ${p.n}: no feedback quote recorded for what started it`)
    if (p.n > 1 && !(p.from ?? []).length) warn(`pass ${p.n}: "from" is empty, so its lineage is unknown`)
    const seen = new Set()
    for (const idea of p.ideas ?? []) {
      const m = ID.exec(idea.id ?? '')
      if (!m) { err(`pass ${p.n}: idea id "${idea.id}" is not p<pass>-<3 digits>`); continue }
      if (+m[1] !== p.n) err(`${idea.id} sits in pass ${p.n}`)
      if (ids.has(idea.id) || seen.has(idea.id)) err(`${idea.id} is used twice`)
      seen.add(idea.id)
      ids.set(idea.id, idea)
      if (!idea.name) err(`${idea.id}: missing "name"`)
      if (!idea.bet) warn(`${idea.id}: no one-line "bet"`)
      if (!IDEA_STATUS.includes(idea.status)) err(`${idea.id}: "status" must be one of ${IDEA_STATUS.join(', ')}`)
      if (idea.thumb && !existsSync(join(playground, slug, idea.thumb))) warn(`${idea.id}: thumb "${idea.thumb}" does not exist`)
      if (!idea.thumb) warn(`${idea.id}: no illustration yet`)
      if (idea.source && !existsSync(join(repo, idea.source))) warn(`${idea.id}: source "${idea.source}" does not exist`)
    }
  })
  for (const [id, idea] of ids) {
    for (const parent of idea.parents ?? []) {
      if (!ids.has(parent)) err(`${id}: parent "${parent}" does not exist`)
      else if (+ID.exec(parent)[1] >= +ID.exec(id)[1]) err(`${id}: parent "${parent}" is not from an earlier pass`)
    }
  }
  for (const p of b.passes) for (const from of p.from ?? []) if (!ids.has(from)) err(`pass ${p.n}: "from" names "${from}", which does not exist`)

  const logged = { chosen: new Set(), dropped: new Set(), final: new Set() }
  b.log.forEach((e, i) => {
    const at = `log entry ${i + 1}`
    if (!LOG_TYPES.includes(e.type)) err(`${at}: "type" must be one of ${LOG_TYPES.join(', ')}`)
    if (!DATE.test(e.date ?? '')) err(`${at}: "date" must be YYYY-MM-DD`)
    if (!['user', 'agent'].includes(e.by)) err(`${at}: "by" must be user or agent`)
    if (e.by === 'agent' && e.quote) err(`${at}: an agent entry cannot carry a "quote"; use "note"`)
    if (!e.quote && !e.note) err(`${at}: needs a "quote" or a "note" ("No reason given." when the user gave none)`)
    for (const id of e.ideas ?? []) {
      if (!ids.has(id)) err(`${at}: names "${id}", which does not exist`)
      else if (logged[e.type]) logged[e.type].add(id)
    }
  })
  for (const [id, idea] of ids) {
    if (idea.status !== 'open' && !logged[idea.status].has(id)) warn(`${id} is "${idea.status}" but no "${idea.status}" log entry names it`)
  }
  const finals = [...ids.values()].filter((i) => i.status === 'final')
  if (finals.length > 1) err(`more than one idea is "final"`)
  if (b.status === 'decided' && !b.outcome?.idea) err(`"status" is decided but "outcome" is empty`)
  if (b.outcome?.idea && !ids.has(b.outcome.idea)) err(`outcome names "${b.outcome.idea}", which does not exist`)
  return ids
}

const day = (d) => {
  const [y, m, dd] = d.split('-').map(Number)
  return `${dd} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`
}
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ')
const quote = (s) => s.trim().split('\n').map((l) => `> ${l}`).join('\n')
const LABEL = {
  brief: 'Brief', recommend: 'Recommended', chosen: 'Chosen', dropped: 'Dropped',
  feedback: 'Feedback', refined: 'Refined', final: 'Final pick', note: 'Note',
}

function history(b, ids) {
  const name = (id) => (ids.has(id) ? `${id} ${ids.get(id).name}` : id)
  const out = []
  out.push(`# ${b.title}`, '')
  out.push(`<!-- Generated by playground/shell/sync.mjs from playground/${b.slug}/brainstorm.json. Do not edit: change the json and run sync. -->`, '')
  out.push(b.description, '')
  out.push(`- **Status:** ${b.status}`, `- **Area:** ${b.area || 'not set'}`, `- **Started:** ${day(b.created)}`, `- **Last change:** ${day(b.modified)}`)
  out.push(`- **Ideas:** ${ids.size} across ${b.passes.length} ${b.passes.length === 1 ? 'pass' : 'passes'}`, '')

  if (b.outcome?.idea) {
    out.push('## Outcome', '', `**${name(b.outcome.idea)}**, picked ${day(b.outcome.date)}.`, '')
    if (b.outcome.summary) out.push(b.outcome.summary, '')
    // how the winner came about: walk its parents back to pass 1
    const chain = []
    const walk = (id, depth) => {
      const idea = ids.get(id)
      if (!idea || depth > 20) return
      chain.push(`${'  '.repeat(depth)}- ${name(id)}${idea.bet ? `: ${idea.bet}` : ''}`)
      for (const p of idea.parents ?? []) walk(p, depth + 1)
    }
    walk(b.outcome.idea, 0)
    if (chain.length > 1) out.push('Where it came from (each line grew from the ones indented under it):', '', ...chain, '')
  }

  if (b.brief?.quote) out.push('## Brief', '', quote(b.brief.quote), '', `User, ${day(b.brief.date ?? b.created)}.`, '')

  out.push('## Passes', '')
  for (const p of b.passes) {
    out.push(`### Pass ${p.n} · ${day(p.date)}`, '')
    if (p.brief?.quote) out.push(quote(p.brief.quote), '')
    if (p.from?.length) out.push(`Grew from: ${p.from.map(name).join('; ')}.`, '')
    if (p.summary) out.push(`${p.summary} *(agent's summary)*`, '')
    out.push('| ID | Idea | The bet | Grew from | Status |', '|---|---|---|---|---|')
    for (const i of p.ideas ?? []) out.push(`| ${i.id} | ${cell(i.name)} | ${cell(i.bet)} | ${(i.parents ?? []).join(', ')} | ${i.status} |`)
    out.push('')
  }

  out.push('## Decision log', '', 'In order. Quoted text is the user, word for word. Text marked "agent" is the agent\'s reading.', '')
  for (const e of b.log) {
    const who = e.by === 'user' ? 'user' : 'agent'
    out.push(`**${day(e.date)} · ${LABEL[e.type] ?? e.type} · ${who}**${e.ideas?.length ? ` · ${e.ideas.map(name).join('; ')}` : ''}`, '')
    if (e.quote) out.push(quote(e.quote), '')
    if (e.note) out.push(e.by === 'user' ? `Agent's note: ${e.note}` : e.note, '')
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

// ── run ──────────────────────────────────────────────────────────────────────────
const brainDir = join(repo, 'brain')
const useBrain = existsSync(brainDir) && statSync(brainDir).isDirectory()
const historyDir = useBrain ? join(brainDir, 'decisions', 'brainstorms') : null

const brainstorms = []
const written = []
for (const slug of readdirSync(playground).sort()) {
  const file = join(playground, slug, 'brainstorm.json')
  if (slug === 'shell' || !existsSync(file)) continue
  let b
  try { b = JSON.parse(readFileSync(file, 'utf8')) } catch (e) { errors.push(`${slug}: brainstorm.json is not valid JSON (${e.message})`); continue }
  const before = errors.length
  const ids = check(slug, b)
  if (errors.length > before || !ids) continue

  const dates = [b.created, ...b.passes.map((p) => p.date), ...b.log.map((e) => e.date)].filter((d) => DATE.test(d ?? ''))
  const modified = dates.sort().at(-1)
  if (!checkOnly) {
    if (b.modified !== modified) {
      b.modified = modified
      writeFileSync(file, JSON.stringify(b, null, 2) + '\n')
    }
    const text = history(b, ids)
    const local = join(playground, slug, 'HISTORY.md')
    if (useBrain) {
      mkdirSync(historyDir, { recursive: true })
      const target = join(historyDir, `${b.created}-${slug}.md`)
      writeFileSync(target, text)
      written.push(relative(repo, target))
      if (existsSync(local)) rmSync(local) // the history moved into brain/
    } else {
      writeFileSync(local, text)
      written.push(relative(repo, local))
    }
  } else b.modified = modified
  brainstorms.push(b)
}

brainstorms.sort((a, b) => (a.modified < b.modified ? 1 : a.modified > b.modified ? -1 : a.title.localeCompare(b.title)))

if (!checkOnly) {
  const data = { schema: 1, generated: new Date().toISOString(), historyDir: historyDir ? relative(repo, historyDir) : null, brainstorms }
  writeFileSync(
    join(playground, 'data.js'),
    `// Generated by shell/sync.mjs. Do not edit: change a brainstorm.json and run sync.\nwindow.PLAYGROUND = ${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}\n`,
  )
}

for (const w of warnings) console.log(`warning  ${w}`)
for (const e of errors) console.log(`error    ${e}`)
const ideas = brainstorms.reduce((n, b) => n + b.passes.reduce((m, p) => m + (p.ideas?.length ?? 0), 0), 0)
console.log(
  `${checkOnly ? 'checked' : 'synced'} ${brainstorms.length} brainstorm${brainstorms.length === 1 ? '' : 's'}, ${ideas} idea${ideas === 1 ? '' : 's'}` +
    `; ${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`,
)
if (!checkOnly) for (const w of written) console.log(`history  ${w}`)
if (errors.length) {
  console.log('A brainstorm with errors is left out of data.js until it is fixed.')
  process.exit(1)
}
