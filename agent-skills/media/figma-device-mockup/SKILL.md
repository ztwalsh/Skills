---
name: figma-device-mockup
description: "Use when the user wants an App Store / marketing-style device mockup (an app screenshot dropped into a real iPhone/iPad/Watch/Mac frame). Two paths: (preferred) download Apple's own official Bezel PSD/PNG pack and composite locally with ImageMagick -- free, highest fidelity, no rate limits; (fallback) build it inside Figma using Apple's official UI Kit community library via the Figma MCP tools. Both produce a flat, straight-on device render -- NOT a tilted/glossy 3D perspective render, which Apple's own marketing guidelines actually prohibit anyway (see Limitations)."
---

# Device Mockup (App Store / Marketing)

Turns a raw app screenshot into a marketing-ready device mockup using **Apple's own official assets** -- no purchased PSD mockup pack needed, no invented device chrome.

There are two ways to do this. **Try Path A first** -- it's faster, higher-resolution, has more color options, and doesn't burn Figma MCP calls. Fall back to Path B only if the user specifically wants it built inside a live Figma file (e.g. to hand off to a designer, or compose alongside other Figma artboards).

| | Path A: Direct download + ImageMagick | Path B: Figma MCP + UI Kit library |
|---|---|---|
| Source | Apple's official Bezel pack (developer.apple.com/design/resources) | Apple's official UI Kit community library, inside Figma |
| Fidelity | Native PSD/PNG resolution (e.g. 1350x2760 for iPhone 17) | Same source images, but re-exported/flattened through Figma's renderer |
| Color options | Full current lineup (e.g. iPhone 17: Black/Lavender/Mist Blue/Sage/White; iPhone 17 Pro: Cosmic Orange/Deep Blue/Silver; iPhone Air: Cloud White/Light Gold/Sky Blue/Space Black) | Whatever variants that Figma library's maintainer shipped -- can lag or omit colors |
| Speed / cost | Local, free, no external rate limit | Counts against Figma MCP tool-call budget; Starter/free-tier teams hit a low ceiling fast (~10-15 calls exhausts it) |
| Good for | Final deliverables, batches, anything where you want the sharpest possible output | Working inside an existing Figma file / handing off to a designer |

Neither path can produce a tilted/angled/3D perspective render -- see Limitations.

---

## Path A (preferred): Direct download + ImageMagick

### 1. Download and open Apple's Bezel pack

Apple publishes per-device DMGs at predictable URLs under `devimages-cdn.apple.com/design/resources/download/`:

```
Bezel-iPhone-17.dmg
Bezel-iPhone-16.dmg
Bezel-iPad-Pro-(M5).dmg
Bezel-iPad-Air-(M4).dmg
Bezel-iPad-mini-(A17-Pro).dmg
Bezel-iPad-(A16).dmg
Bezel-Apple-Watch-Ultra-3-2025.dmg
Bezel-Apple-Watch-Ultra-2-2024.dmg
Bezel-Apple-Watch-Series-11-2025.dmg
Bezel-MacBook-Pro-M5.dmg
Bezel-MacBook-Air-M5.dmg
Bezel-MacBook-Neo.dmg
Bezel-iMac-M4.dmg
Bezel-Studio-Displays.dmg
Bezel-Apple-TV.dmg
Keynote-Live-Video-Product-Bezel.dmg
```

Re-verify this list with `WebFetch` on `https://developer.apple.com/design/resources/` before hardcoding a filename -- Apple renames these every hardware cycle (e.g. "Bezel-iPhone-17" will become "Bezel-iPhone-18").

```bash
curl -sL -o Bezel-iPhone-17.dmg "https://devimages-cdn.apple.com/design/resources/download/Bezel-iPhone-17.dmg"
```

These DMGs carry a clickthrough license (use restricted to mock-ups of Apple-platform UI -- fine for App Store/marketing screenshots of your own app, not for anything else). `hdiutil attach` blocks on that license text over stdin; auto-accept it:

```bash
yes | hdiutil attach Bezel-iPhone-17.dmg -nobrowse -mountpoint ./mnt_device
```

Inside: `Photoshop/<Device>/<Device> - <Color> - <Portrait|Landscape>.psd` and a parallel `PNG/` tree with flattened-but-alpha-intact PNGs of the same. **Use the PNGs** -- no need to open Photoshop. Copy the one you want out of the mount, then unmount:

```bash
cp "mnt_device/PNG/iPhone 17/iPhone 17 - Black - Portrait.png" ./frame.png
hdiutil detach ./mnt_device -quiet
```

### 2. Find the real screen cutout

The PNG has genuine alpha transparency where the screen is -- but **don't just bounding-box every transparent pixel**. The canvas is rectangular while the device silhouette has rounded corners, so the four corner triangles *outside* the device are also transparent, and a naive bbox scan balloons out to nearly the whole canvas.

Use the flood-fill script in this skill, which starts from the image's center (reliably inside the screen) and only follows the one connected transparent region:

```bash
python3 scripts/find_cutout.py frame.png
# Screen cutout:   x=72 y=66 w=1200 h=2616
```

### 3. Composite

```bash
scripts/composite_mockup.sh screenshot.png frame.png final.png \
    72 66 1200 2616 164 \
    "#F2F1EF" 2400 4400
```

Args after the cutout box: corner radius (approximate the device's screen radius -- `~0.137 * cutout_width` has matched well so far, e.g. 164 for a 1200px-wide cutout), then optional background hex + canvas size. Omit the last three args to get just the transparent frame+screenshot composite with no background/shadow.

Internally this: cover-fit-crops the screenshot to the cutout box, rounds its corners with a draw+multiply mask (avoids needing `-clip-mask` file juggling), composites it *behind* the frame PNG so the frame's opaque bezel naturally masks any overflow, then (if a background was given) adds a soft `-shadow` and drops the whole thing onto a solid canvas.

**Resolution:** final crispness is capped by the *source screenshot's* native resolution, not by anything in this pipeline. A ~300px-wide screenshot will look soft no matter what canvas size you output at -- ask for a native-resolution capture (simulator screenshot, `xcrun simctl io booted screenshot`, or an actual device screenshot) if the source looks low-res before starting.

---

## Path B (fallback): Figma MCP + UI Kit library

Use this when the user explicitly wants it inside a Figma file.

**Prerequisites:** load the `figma-use` and `figma-create-new-file` skills before calling the corresponding MCP tools, per their own instructions.

### 1. Pick a Figma plan/team with headroom

Figma's MCP server rate-limits by **plan tier**. A Starter/free-tier team hits its ceiling in ~10-15 calls -- this whole workflow. Before creating the file, call `whoami` to list the user's plans and prefer a Pro/Org team even if it's not their "personal" one.

If a rate-limit error appears mid-workflow, **do not retry against the same file** -- every subsequent call against that `fileKey` fails too, including reads. Create a fresh file under a higher-tier plan and rebuild. This may mean re-requesting the source screenshot if it was only cached locally and the cache has since cleared.

### 2. Find and place the device component

```
search_design_system(query: "iPhone 17 Pro", fileKey, includeLibraryKeys: [<iOS kit library key>])
```

Apple's kit ships each device as a `component_set` with a `Color=` variant axis. Import a specific variant and place an instance -- **never `appendChild` the imported `component_set` itself**, it's a read-only library node and throws `"Cannot move node. Node is an internal, read-only node."`:

```js
const set = await figma.importComponentSetByKeyAsync('<componentKey>');
const variant = set.children.find(c => c.name === 'Color=Black');
const instance = variant.createInstance();
instance.x = 0; instance.y = 0;
figma.currentPage.appendChild(instance);
```

### 3. Find the screen cutout the same way as Path A

The flattened/composited instance render (`get_screenshot`) looks opaque either way -- transparency only survives in the **raw** asset. Pull it with `download_assets(fileKey, nodeId, ...)` (use `rawImages`, not `export`), download it, and run the same `find_cutout.py` script (pass `--scale <exportScale>` to convert the result to Figma design-space units).

In practice the cutout ends up very close to the instance's own `width`/`height` (the raw image bleeds ~20-45px beyond the instance bounds for the physical device edge, but the screen region itself ≈ the instance frame) -- verify with the script rather than hardcoding, this will drift as Apple revises the kit.

### 4. Place the screenshot behind the frame, group, background, shadow, export

```js
const screenRect = figma.createRectangle();
screenRect.x = 0; screenRect.y = 0;
screenRect.resize(<cutoutW>, <cutoutH>);
screenRect.cornerRadius = 55; // ~ instance width * 0.137
figma.currentPage.appendChild(screenRect);
figma.currentPage.insertChild(0, screenRect); // MUST be behind the device instance in z-order
```

Upload the screenshot as that rectangle's fill (`upload_assets(fileKey, nodeId, scaleMode: 'FILL')`, then `curl -X POST -F "file=@shot.png" <submitUrl>`), group `[screenRect, instance]`, put the group on a background frame with a `DROP_SHADOW` effect, then export with `get_screenshot(..., maxDimension: 4000)` or a scaled `download_assets` call -- the tools' own `maxDimension`/scale defaults are modest (1024px), bump them explicitly for a real deliverable.

---

## Limitations (say these out loud, don't discover them mid-task)

- **No tilted/3D/isometric angle, from either path.** Apple's official assets (both the Figma UI Kit and the direct-download Bezel packs) only ever ship **Portrait** and **Landscape** -- both perfectly flat, straight-on, just the device rotated 90°. If the user's reference image has perspective, floating shadow, glossy highlights -- that's a third-party PSD/Photoshop smart-object mockup pack (Mockuuups Studio, Rotato, Envato, Previewed) or a tool, not something built from Apple's own assets.
- **This isn't just a missing feature -- it's Apple's own rule.** Their App Store Marketing Guidelines explicitly state: *"Straight-on product shots are preferred. Don't use extreme angles or alter an Apple product in any way."* 3D renderings, tilting/rotating, and altered reflections/shadows are called out as prohibited. Worth surfacing to the user if the mockup is headed for actual App Store assets, not just a pitch deck or social post.
- **Color options are whatever Apple currently ships** -- re-check with `search_design_system` (Path B) or the live Design Resources page (Path A) each time rather than assuming last generation's names/colors still apply.
- **License restriction (Path A only):** the Bezel DMGs carry a clickthrough license limiting use to mock-ups of Apple-platform software UI. Fine for this use case; don't repurpose the raw assets for anything else.
- **Figma MCP call budget is real (Path B only).** ~10-15 calls for this whole flow. Prefer Path A unless the user specifically needs it inside Figma.
