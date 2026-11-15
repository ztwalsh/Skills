// Geometry helpers for drawing marks. Each returns a string of SVG markup (or path data, where
// noted) for the 140 x 140 mark box, centre (70, 70). Fills use currentColor. "§" in an id
// is swapped for a unique token per instance by the viewer, so masks and clips never collide.
// "a" is a lean in degrees from vertical, top to the right; the default is the constant A.
// See reference/marks.md in the logo skill for what each helper is for.
const A = 30;
const RAD = Math.PI / 180;
const f = (n) => +n.toFixed(2);
function pt(p, u, a = A, cx = 70, cy = 70) {
  const r = a * RAD;
  return [cx + p * Math.cos(r) + u * Math.sin(r), cy + p * Math.sin(r) - u * Math.cos(r)];
}
function barAt(x, y, len, w, r = w / 2, a = A) {
  return `<rect x="${f(x - w / 2)}" y="${f(y - len / 2)}" width="${f(w)}" height="${f(len)}" rx="${f(Math.min(r, w / 2))}"${a ? ` transform="rotate(${a} ${f(x)} ${f(y)})"` : ""}/>`;
}
function bar(p, u, len, w, r = w / 2, a = A) {
  const [x, y] = pt(p, u, a);
  return barAt(x, y, len, w, r, a);
}
function barPoly(p, u, len, w, a = A) {
  const c = [
    pt(p - w / 2, u + len / 2, a),
    pt(p + w / 2, u + len / 2, a),
    pt(p + w / 2, u - len / 2, a),
    pt(p - w / 2, u - len / 2, a)
  ];
  return `M${c.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
}
const dot = (cx, cy, r) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>`;
const ring = (cx, cy, r, w) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="currentColor" stroke-width="${w}"/>`;
const line = (x1, y1, x2, y2, w, cap = "round") => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="currentColor" stroke-width="${w}" stroke-linecap="${cap}"/>`;
const sp = (d, w, cap = "round", join = "round") => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="${join}"/>`;
const fp = (d, evenodd = false) => `<path d="${d}"${evenodd ? ' fill-rule="evenodd"' : ""}/>`;
const rrect = (cx, cy, w, h, r) => `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}"/>`;
const poly = (pts) => `<path d="M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z"/>`;
const g = (t, body) => `<g transform="${t}">${body}</g>`;
const circ = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
function arcD(cx, cy, r, t1, t2) {
  const [x1, y1] = [cx + r * Math.cos(t1 * RAD), cy + r * Math.sin(t1 * RAD)];
  const [x2, y2] = [cx + r * Math.cos(t2 * RAD), cy + r * Math.sin(t2 * RAD)];
  const span = t2 - t1;
  return `M${f(x1)} ${f(y1)}A${f(r)} ${f(r)} 0 ${Math.abs(span) > 180 ? 1 : 0} ${span > 0 ? 1 : 0} ${f(x2)} ${f(y2)}`;
}
const dome = (cx, base, r) => `<path d="M${f(cx - r)} ${f(base)}A${f(r)} ${f(r)} 0 0 1 ${f(cx + r)} ${f(base)}Z"/>`;
function hullD(x0, y0, r0, x1, y1, r1) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
  const phi = Math.atan2(dy, dx), al = Math.acos((r0 - r1) / d);
  const P = (x, y, r, t) => `${f(x + r * Math.cos(t))} ${f(y + r * Math.sin(t))}`;
  const big1 = 2 * al > Math.PI ? 1 : 0, big0 = 2 * Math.PI - 2 * al > Math.PI ? 1 : 0;
  return `M${P(x0, y0, r0, phi + al)}L${P(x1, y1, r1, phi + al)}A${f(r1)} ${f(r1)} 0 ${big1} 0 ${P(x1, y1, r1, phi - al)}L${P(x0, y0, r0, phi - al)}A${f(r0)} ${f(r0)} 0 ${big0} 0 ${P(x0, y0, r0, phi + al)}Z`;
}
const hull = (x0, y0, r0, x1, y1, r1) => `<path d="${hullD(x0, y0, r0, x1, y1, r1)}"/>`;
function slant(xc, yc, h, wh, a = A) {
  const s = h / 2 * Math.tan(a * RAD);
  return poly([
    [xc + s - wh / 2, yc - h / 2],
    [xc + s + wh / 2, yc - h / 2],
    [xc - s + wh / 2, yc + h / 2],
    [xc - s - wh / 2, yc + h / 2]
  ]);
}
function knock(solid, cut, k = "") {
  return `<defs><mask id="m\xA7${k}" maskUnits="userSpaceOnUse" x="-60" y="-60" width="260" height="260"><rect x="-60" y="-60" width="260" height="260" fill="#fff"/><g fill="#000" stroke="#000" style="color:#000">${cut}</g></mask></defs><g mask="url(#m\xA7${k})">${solid}</g>`;
}
function clip(shape, body, k = "") {
  return `<defs><clipPath id="c\xA7${k}">${shape}</clipPath></defs><g clip-path="url(#c\xA7${k})">${body}</g>`;
}
export {
  A,
  arcD,
  bar,
  barAt,
  barPoly,
  circ,
  clip,
  dome,
  dot,
  f,
  fp,
  g,
  hull,
  hullD,
  knock,
  line,
  poly,
  pt,
  ring,
  rrect,
  slant,
  sp
};
