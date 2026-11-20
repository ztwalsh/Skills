#!/usr/bin/env node
// Turns a wordmark typeface into outlines, so lockups can be exported as shapes.
//
//   node logo/viewer/outline.mjs            outline the active font (wordmark.active)
//   node logo/viewer/outline.mjs <font-id>  outline one font from wordmark.fonts
//   node logo/viewer/outline.mjs --all      outline every font that has no outline yet
//   add --force to redo a font that is already outlined
//
// The font file is read from logo/wordmark/fonts/<id>.ttf. If it is not there it is downloaded
// once from the Fontsource CDN (the open-source mirror of Google Fonts) and kept. To use a font
// file of your own, put it at that path first (.ttf or .otf, named <id>.ttf).
//
// Writes wordmark.fonts[n].outline into logo.json, in the same shape as wordmark.supplied.
// Run `node logo/viewer/sync.mjs` afterwards. Uses the bundled opentype.js (MIT), no install.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from './vendor/opentype.module.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const force = args.includes('--force')
const all = args.includes('--all')
const wanted = args.find((a) => !a.startsWith('--'))

const file = join(root, 'logo.json')
const logo = JSON.parse(readFileSync(file, 'utf8'))
const wm = logo.wordmark ?? {}
const fonts = wm.fonts ?? []
const kebab = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const r2 = (n) => +n.toFixed(2)

let targets
if (all) targets = fonts.filter((f) => force || !f.outline)
else {
  const id = wanted ?? wm.active
  const f = fonts.find((x) => x.id === id)
  if (!f) {
    console.log(id === 'supplied' ? 'The active wordmark is supplied artwork, which is already outlines. Nothing to do.' : `No font with id "${id}" in wordmark.fonts.`)
    process.exit(id === 'supplied' ? 0 : 1)
  }
  if (f.outline && !force) { console.log(`"${f.id}" is already outlined. Add --force to redo it.`); process.exit(0) }
  targets = [f]
}
if (!targets.length) { console.log('Every font is already outlined.'); process.exit(0) }

async function fontFile(f) {
  const dir = join(root, 'wordmark', 'fonts')
  const path = join(dir, `${f.id}.ttf`)
  if (existsSync(path)) return path
  const weight = f.weight ?? 400
  const style = f.italic ? 'italic' : 'normal'
  const url = `https://cdn.jsdelivr.net/fontsource/fonts/${kebab(f.family)}@latest/latin-${weight}-${style}.ttf`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`could not download ${f.family} ${weight} ${style} (${res.status} from ${url}). Put the font file at wordmark/fonts/${f.id}.ttf and run this again.`)
  mkdirSync(dir, { recursive: true })
  writeFileSync(path, Buffer.from(await res.arrayBuffer()))
  return path
}

const SIZE = 200 // units per em in the outline's own coordinates
const BASE = 200 // y of the baseline

function outline(f, path) {
  const buf = readFileSync(path)
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
  const scale = SIZE / font.unitsPerEm
  const cased = (s) => (f.transform === 'lowercase' ? s.toLowerCase() : f.transform === 'uppercase' ? s.toUpperCase() : s)
  const parts = wm.parts.map(cased)
  const track = (f.tracking ?? 0) * SIZE // extra advance after each glyph, in units
  const opts = { kerning: true }

  // Lay glyphs out by hand so tracking and kerning are exact and the same for every part.
  function set(text, x0) {
    const glyphs = font.stringToGlyphs(text)
    let x = x0
    const d = []
    let yMax = 0
    glyphs.forEach((g, i) => {
      d.push(g.getPath(x, BASE, SIZE).toPathData(2))
      if (g.yMax) yMax = Math.max(yMax, g.yMax)
      x += (g.advanceWidth ?? 0) * scale + track
      if (i < glyphs.length - 1) x += font.getKerningValue(g, glyphs[i + 1]) * scale
    })
    return { d: d.join(''), end: x, glyphs, yMax }
  }

  const first = set(parts[0], 0)
  const out = { parts: [{ d: first.d }], baseline: BASE }
  let tall = first.yMax
  if (parts.length === 2) {
    // As one word: the second part starts where the first ends, plus the kerning across the join.
    const a = first.glyphs.at(-1), b = font.stringToGlyphs(parts[1])[0]
    const joinedX = first.end + font.getKerningValue(a, b) * scale
    // As two words: a word space apart. The viewer moves it again for the inline lockup.
    const space = (font.charToGlyph(' ').advanceWidth ?? font.unitsPerEm * 0.25) * scale + track
    const apartX = first.end + space
    const second = set(parts[1], apartX)
    out.parts.push({ d: second.d })
    out.joinShift = r2(joinedX - apartX)
    tall = Math.max(tall, second.yMax)
  }
  const os2 = font.tables.os2 ?? {}
  const xHeight = os2.sxHeight || font.charToGlyph('x').yMax || font.unitsPerEm * 0.5
  const capHeight = os2.sCapHeight || font.charToGlyph('H').yMax || font.unitsPerEm * 0.7
  const upper = parts.join('') === parts.join('').toUpperCase() && /[A-Z]/.test(parts.join(''))
  out.xTop = r2(BASE - (upper ? capHeight : xHeight) * scale)
  out.ascTop = r2(BASE - Math.max(tall, upper ? capHeight : xHeight) * scale)
  out.source = { file: `wordmark/fonts/${f.id}.ttf`, name: font.names.fullName?.en ?? f.family, version: font.names.version?.en ?? '' }
  return out
}

let failed = 0
for (const f of targets) {
  try {
    const path = await fontFile(f)
    f.outline = outline(f, path)
    console.log(`outlined ${f.id}: ${f.outline.source.name}`)
  } catch (e) {
    failed++
    console.log(`error    ${f.id}: ${e.message}`)
  }
}
writeFileSync(file, JSON.stringify(logo, null, 2) + '\n')
console.log(failed ? `${failed} font${failed === 1 ? '' : 's'} could not be outlined.` : 'Done. Now run: node logo/viewer/sync.mjs')
process.exit(failed ? 1 : 0)
