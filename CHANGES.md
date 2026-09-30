
- Fixed final App.tsx TypeScript integration issues: missing RotateCcw import and ensured template/project import code is strongly typed.
- Standardized the supported local/CI Node.js runtime on Node 22.x to match the repository CI and current Qraft development environment.
## Template Editor workspace — 2026-09-30

- Rebuilt the template customization screen as a dedicated viewport-fitted editor workspace while preserving the existing template gallery.
- Added a dedicated editor header with Back to Templates, Reset, Undo/Redo, and state-driven completion.
- Editor defaults to Content and uses a compact vertical section navigator on desktop: Content, Appearance, Shape, Branding, Advanced.
- Added a fixed bottom status/action area with Done during editing and Export/Edit again only after customization is completed.
- Export actions are absent from the editing state rather than merely disabled.
- Locked the document viewport while the editor is active and constrained scrolling to the preview/control regions instead of allowing the page to grow.
- Added responsive desktop/mobile workspace layouts with `min-height: 0` and controlled internal scrolling.
- Template edits, logo upload/removal, undo/redo, and content changes return the editor to Editing state.
- Preserved the existing QR renderer, verification, templates, content types, design controls, logo safety, autosave, PWA, and project/library behavior.

## Stability hardening — 2026-09-30

- Fixed transparent SVG finder holes and transparent logo clear areas.
- Fixed SVG ink-gradient output so vector exports match the canvas renderer.
- Fixed IndexedDB/localStorage project migration and made project clearing report IndexedDB failures.
- Added strict Qraft v1 backup/project validation and normalization.
- Hardened event date validation and phone/SMS normalization.
- Limited camera BarcodeDetector scanning to QR codes and throttled camera decoding work.
- Made the service worker cache static assets selectively instead of caching every GET response.
- Standardized the documented runtime on Node.js 24.x.

# Qraft change log

## Current repair — 2026-09-30

### Product UI
- Rebuilt `src/styles.css` as a single product-oriented design system instead of layering multiple legacy theme overrides.
- Replaced the pastel/pill-heavy visual treatment with a neutral white/slate surface system and cobalt accent.
- Switched website typography away from Baloo 2 / Nunito to a professional Aptos / Segoe UI / Inter fallback stack and removed the font-package imports/dependencies.
- Desktop Create uses an app-like viewport: page scrolling is suppressed during editing and the active work area is the scrollable region.
- Preview scaling now considers both available width and height, preventing the complete card or QR from being cropped.

### Create / design / export
- Removed duplicate `pattern` state from `DesignState`; `bodyShape` is now the single source of truth. Legacy saved `pattern` values are migrated when projects are reopened.
- Finder options are limited to implemented scan-safe square and rounded variants; old template `circle` values normalize to rounded.
- QR card PNG/PDF/SVG exports re-decode the QR after the final card composition (SVG is rasterized in-browser for verification), not just the raw QR render.
- Offline Image QR compression accepts a wider range of ordinary images while staying within a practical byte budget for a standard QR.
- Social QR presets retain platform-specific colours and bundled SVG marks.

### Persistence / reliability
- Auto-save remains automatic and now debounces IndexedDB writes to reduce churn while typing or dragging controls.
- Auto-save revisions prevent an older asynchronous thumbnail render from overwriting a newer edit.
- Added IndexedDB clear support and a localStorage fallback when IndexedDB is unavailable.
- Browser-stored projects remain local; sensitive Wi-Fi passwords and 2FA secrets are redacted before persistence.
- Relative entry-point asset paths are used for sub-path deployments, including GitHub Pages.
- Bumped the service-worker cache revision after the UI/runtime changes.

### Scanner
- Camera and image scanning remain available with `BarcodeDetector` when supported and a `jsQR` fallback with grayscale, inversion, upscale, and centered-crop retries.
- Full-screen image drag/drop remains enabled on the Scan & Test page.
- Qraft-specific embedded Image QR payloads are rendered as images by Qraft's scanner. Generic camera apps may display a `data:` payload as text because QR scanners do not all render data URLs.

## Earlier releases
- Added the dedicated Create / Templates / Tools / Projects / Scan & Test pages.
- Added auto-save, undo/redo, templates, batch generation, local projects, card exports, logo controls, frames, body shapes, and a recovery boundary.
- Added Privacy Policy, Terms & Conditions, and Developer Details as dedicated pages.

## Phase 4 — Power tools — 2026-09-30
- Added a QR Lab diagnostic card with contrast, quiet-zone, logo-size, and payload-density checks plus the existing decoder verification.
- Added project-library JSON backup and restore. Imports validate the Qraft backup envelope, merge by project id, normalize legacy form/design fields, and cap the library at 100 projects.
- Added batch contact-sheet export alongside the existing ZIP export.
- Kept the batch generator capped at 1,000 rows with safe duplicate filenames and progress feedback.
- Preserved local-first storage and the existing sensitive-field redaction behavior.
- Regression-checked Phases 1–3 in source: deterministic build settings, Node 22 pin, QR renderer unification/safety, mobile scrolling, project search/favorites/duplicate, command palette, ink gradients, and QR health are present.

## Phase 5
- Added PWA install prompt when the browser supports installation.
- Added live offline status in the header while preserving local QR creation and saved projects.
- Hardened service-worker registration with an explicit base-path scope.
- Bumped the service-worker cache key so deployments do not retain stale Phase 4 assets.

## Stability pass — Phases 1–5 — 2026-09-30
- Rechecked Phases 1–5 against the actual source instead of relying on prior phase notes.
- Hardened the PWA service worker with an install-time app-shell cache and safe offline navigation fallback; bumped cache revision to v4.
- Hardened the PWA install prompt lifecycle, including `appinstalled` cleanup and prompt error handling.
- Project backup restore now strips Wi-Fi passwords and 2FA secrets before persistence, preserving Qraft's local privacy guarantee across imported backups.
- Imported project backups are persisted immediately instead of waiting for an editor autosave cycle.
- Batch contact sheets now avoid oversized browser canvases: small batches download one PNG, while larger batches are split into safe sheets and bundled into a ZIP.
- Contact-sheet image failures no longer prevent the remaining sheets from completing.
- Preserved existing Phase 1 renderer/build safeguards, Phase 2 project tools, Phase 3 design/health checks, and Phase 4 batch/backup tools.

## Template & Design Expansion
- Added 12 new visual templates across Modern, Nature, Premium, Commerce, Minimal, Events and Friendly categories.
- Added QR body shapes: Pill, Hex and Leaf, with conservative dense-code fallback preserved.
- Added finder styles: Circle and Diamond.
- Added frame styles: Ribbon, Outline, Corner and Stamp.
- Template presets now carry their intended frame style instead of relying only on category defaults.
- PNG/SVG card exports render the expanded frame styles consistently with the live preview.

## Stability patch — Vercel / Node runtime

- Aligned the repository Node engine with Vercel's current Node 24 project setting (`24.x`).
- Updated `.nvmrc` to Node 24 so local, CI, and Vercel use the same major runtime.
- Made `npm run build` call the dedicated `typecheck` script before Vite, keeping the build pipeline explicit and easier to diagnose.
- Kept `vercel.json` minimal so it does not override dependency/runtime behavior unnecessarily.
- Updated the package-lock root engine metadata to match `package.json`.

## Dark mode — Qraft visual system

- Added persistent **System / Dark / Light** theme control in the application header.
- Added the exact Qraft dark palette: `#0B0D10` app background, layered charcoal surfaces, `#8B7CFF` primary accent, and updated semantic success/warning/error colors.
- Added dark-mode hierarchy for navigation, studio panels, controls, templates, projects, tools, scanner, overlays, command palette, legal pages, and feedback states.
- Added subtle 180ms theme transitions while respecting `prefers-reduced-motion`.
- Kept QR artwork surfaces isolated from the application theme so dark mode does not invert, recolor, or alter QR generation/export output.
- Added early theme application in `index.html` to reduce light-mode flash when a dark/system preference is active.
- No QR payload, rendering, scan, export, storage, template, batch, or PWA logic was intentionally changed.

## Template editor UX update — focused editing flow
- Kept the existing template gallery/cards unchanged.
- Reworked the selected-template editor into a focused editing workflow with a live preview first and dedicated Content, Appearance, Shape, Branding, and Advanced sections.
- Added template/customized state feedback so users can see when they have moved away from the original preset.
- Added Reset template to restore the selected template without leaving the editor.
- Kept Undo/Redo and local autosave available in the editor action area.
- Added sticky desktop editing/save behavior and responsive mobile tab layout.
- Kept QR rendering/export logic and template definitions intact.
- Removed the stale System-theme branch so the Light/Dark theme type and resolver are consistent.

## Developer portfolio demo QR

- Replaced the generic mini/demo QR payload used across Qraft's visible sample QR previews with the developer portfolio URL: `https://bibekbista.vercel.app/`.
- Updated the landing-page showcase card to identify the QR as Bibek Bista's developer portfolio and use a clear "SCAN TO VISIT" call to action.
- Kept the QR generator, template rendering, export, verification, and user-entered content flows unchanged.
