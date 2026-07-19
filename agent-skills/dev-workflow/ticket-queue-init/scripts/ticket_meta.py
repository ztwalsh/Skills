#!/usr/bin/env python3
"""Minimal YAML-frontmatter reader/writer for tickets/*.md.

No PyYAML dependency (not guaranteed to be installed) - the frontmatter
shape is deliberately simple: flat `key: value` pairs plus one list field
(`scope`). Not a general YAML parser - don't grow the ticket schema without
growing this.
"""
import sys
import glob
import os

TICKETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tickets")


def split_frontmatter(text):
    if not text.startswith("---\n"):
        raise ValueError("no frontmatter")
    end = text.index("\n---\n", 4)
    fm_text = text[4:end]
    body = text[end + 5:]
    return fm_text, body


def parse_frontmatter(fm_text):
    fields = {}
    lines = fm_text.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.strip().startswith("#"):
            i += 1
            continue
        if ":" in line and not line.startswith(" "):
            key, _, rest = line.partition(":")
            key = key.strip()
            rest = rest.strip()
            if rest:
                fields[key] = rest.strip('"')
                i += 1
            else:
                items = []
                j = i + 1
                while j < len(lines) and lines[j].strip().startswith("-"):
                    items.append(lines[j].strip()[1:].strip().strip('"'))
                    j += 1
                fields[key] = items
                i = j
        else:
            i += 1
    return fields


def render_frontmatter(fields, order):
    out = []
    for key in order:
        if key not in fields:
            continue
        val = fields[key]
        if isinstance(val, list):
            out.append(f"{key}:")
            for item in val:
                out.append(f"  - {item}")
        else:
            out.append(f"{key}: {val}")
    return "\n".join(out)


def load(path):
    with open(path) as f:
        text = f.read()
    fm_text, body = split_frontmatter(text)
    fields = parse_frontmatter(fm_text)
    order = [l.split(":")[0].strip() for l in fm_text.split("\n") if l.strip() and not l.startswith(" ") and not l.strip().startswith("#")]
    return fields, order, body


def save(path, fields, order, body):
    for key in fields:
        if key not in order:
            order.append(key)
    fm = render_frontmatter(fields, order)
    with open(path, "w") as f:
        f.write(f"---\n{fm}\n---\n{body}")


def cmd_get(args):
    path, field = args
    fields, _, _ = load(path)
    val = fields.get(field, "")
    if isinstance(val, list):
        print(",".join(val))
    else:
        print(val)


def cmd_set(args):
    path = args[0]
    fields, order, body = load(path)
    for kv in args[1:]:
        key, _, val = kv.partition("=")
        fields[key] = val
    save(path, fields, order, body)


def cmd_pick_next(args):
    candidates = []
    for path in sorted(glob.glob(os.path.join(TICKETS_DIR, "*.md"))):
        if os.path.basename(path) in ("_template.md", "README.md"):
            continue
        fields, _, _ = load(path)
        if fields.get("status") == "todo":
            try:
                priority = int(fields.get("priority", "3"))
            except ValueError:
                priority = 3
            candidates.append((priority, path))
    if not candidates:
        return
    candidates.sort(key=lambda c: c[0])
    print(candidates[0][1])


if __name__ == "__main__":
    cmd = sys.argv[1]
    args = sys.argv[2:]
    {"get": cmd_get, "set": cmd_set, "pick-next": cmd_pick_next}[cmd](args)
