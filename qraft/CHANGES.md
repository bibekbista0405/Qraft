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
