# Audit fixes

## Build / security
- Fixed the TypeScript error that failed `npm run build` (and CI): `saveProject` is now typed `Promise<boolean>`.
- `jspdf` 2.x -> 4.x (removes the critical DOMPurify advisory); `vitest` 5 for tests. `npm audit`: 0 vulnerabilities.
- `jspdf` and `jszip` are lazy-loaded; main bundle 951 kB -> ~500 kB.
- `package-lock.json` included; CI uses `npm ci`, runs tests, builds and audits production deps.
- Relative Vite `base` + `import.meta.env.BASE_URL` for the logo, so sub-path hosting (GitHub Pages) works.
- Fonts are self-hosted via @fontsource (no Google Fonts request; matches the offline/privacy claims).
- `noUnusedLocals` enabled; dead code removed (`quickStyles`, `TypePicker`, `FlowSteps`, unused icons/destructures).
- Removed most `any` types (icons, `updateDesign`, `Field` children, `qr` matrix).

## Rendering / export
- Transparent background: finder patterns are drawn as a ring (even-odd) so they stay hollow instead of turning into solid blocks (PNG and SVG).
- Dots / Diamond body shapes: alignment patterns are drawn solid; previously QRs above version 1 with those shapes could not be decoded.
- Square modules are now solid (no 5% gaps).
- SVG export is real vector (QR embedded as paths, not a raster image), honours frame style, logo size, title size and transparency.
- PNG card no longer draws a CTA when the frame is "None"; "Scan" frame text is no longer background-on-background.
- Card QR rendered at its exact 840px size (no resampling blur).
- Logos are downscaled to a 256px PNG on upload (keeps projects small; fixes silent localStorage quota failures).

## Verification
- Verifies the exact exported size, checks contrast (>= 3:1), and only allows inverted decoding for genuinely light-on-dark designs.
- Extra 300px decode pass -> "dense QR" warning; warnings for light-on-dark and transparent output.
- Friendly error for over-long content.

## Payloads / validation
- New `src/lib/payload.ts` (unit-tested): Wi-Fi escaping (`: "` added, `nopass` has no password), full iCalendar events with normalised dates, `geo:` with authoritative coordinates, YouTube `@handle`, WhatsApp honours the URL field, mailto without empty query, 2FA secret normalised, bare domains get `https://`.
- Per-type validation with an inline "Needed before export" message; empty defaults (e.g. `+977 `) can no longer be exported.

## State / persistence
- Autosave only after a real edit (no more blank default projects); secrets (Wi-Fi password, 2FA secret) are not stored and their thumbnails use a placeholder; privacy text updated.
- Autosave race fixed (project id assigned synchronously). Storage quota errors are handled and reported.
- Undo/redo: UI buttons + keyboard shortcuts, snapshots include QR type, typing is coalesced, history cleared when a project is opened.
- Applying a template also switches to the matching QR type and removes preset social logos; leaving a social type restores default styling.
- Error-correction dropdown is locked (and says so) while a logo is present.
- Hash routing (`#/create`, ...).

## Scanner / batch
- Camera is stopped when leaving the Scan page; `BarcodeDetector` formats are awaited and the detector is cached; frames are downscaled to 720px.
- Batch: URLs containing commas work, duplicate names get suffixes, over-limit/skipped rows are reported, UI yields with progress, ZIP is lazy-loaded.

## UX / a11y
- Visible `:focus-visible` ring, Esc closes the success dialog (and it autofocuses), toast timer no longer cuts newer toasts short, two templates no longer share the name "Review".

## Not done (bigger projects, tracked as upgrades)
- Move projects from localStorage to IndexedDB with schema migration.
- Move the camera decode loop into a Web Worker.
- Full focus trap for the dialog; PWA/offline caching.
- Finish splitting `App.tsx` (payload + rendering are extracted; the page components still live there).
