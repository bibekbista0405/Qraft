# Qraft

Qraft is a browser-first QR creation and design studio built around a simple flow: choose what you want to share, make it yours, verify it, then export.

## Product flow

**Landing → Create / Templates / Tools / Projects / Scan & test**

Create and Templates share the same editing model:

**Choose → Add details → Customize → Live preview → Verify → Export**

Projects are saved automatically as the QR content or design changes; there is no manual Save step in the creator.

## Dedicated pages

- **Create** — QR type picker, content editor, professional logo upload, design controls and live preview.
- **Templates** — searchable template browser plus the full editor on the same page. Change QR type, details, colors, logo, spacing and export without leaving the page.
- **Tools** — batch QR generation and a clean entry point to Scan & test.
- **Projects** — locally saved QR projects with thumbnails, restore and delete controls.
- **Scan & test** — separate camera scanner, image scanner, internal QR self-test, and full-screen drag-and-drop image capture.
- **Privacy Policy**, **Terms & Conditions**, **Developer Details** — dedicated documentation pages linked from the landing page footer rather than the creator UI.

## Features

- 24 QR content types
- 37 ready-made templates with categories and search
- Live template editing on the Templates page
- Professional logo upload with automatic high error correction and safe centered clearance
- Social QR presets for WhatsApp, Instagram, Facebook, YouTube, TikTok and Telegram with platform-themed colors, copy and local brand logo artwork
- Color system, background, accent, resolution, quiet zone, error correction, card radius, CTA, frame, glow/gradient and transparent PNG controls
- Advanced styling controls that do not repaint the QR data matrix
- Standards-based QR rendering through `qrcode`
- Readability/contrast-aware defaults
- Fresh QR rendering for every export
- QR PNG, branded Design PNG, SVG, PDF and copy-data export
- Camera QR scanner/tester and image upload scanner
- Full-screen file drag-and-drop detection on the Scan & test page
- Offline Image QR mode using a compact embedded JPEG payload for Qraft's scanner
- Batch generator for up to 1,000 rows + ZIP export
- Local projects with thumbnails and restore (Wi-Fi passwords and 2FA secrets are never stored)
- Undo / redo (buttons, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
- Per-type input validation, URL normalisation and pre-export verification of the final composed card QR crop
- Hash routing, so refresh and the browser back button keep you where you were
- Responsive landing page and application pages
- Scrollbars hidden across the UI while normal scrolling remains enabled
- Clean product typography using local system display/body stacks (Aptos/Segoe UI/Inter fallback)

## Tech stack

- React 19
- TypeScript
- Vite 6
- `qrcode` for standards-based QR generation
- `jsQR` for decoding
- JSZip for batch downloads
- jsPDF for PDF export
- Lucide React for UI icons

## Run locally

Requirements: Node.js 22.x recommended and used by the repository CI/build configuration.

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

Unit tests cover payload building/validation and a pixel-level render → decode round trip (all body shapes, transparent backgrounds, verification warnings).

## Production build

```bash
npm run build
npm run preview
```

## GitHub

The repository is client-side and contains no API keys or server secrets.

```bash
git init
git add .
git commit -m "Initial Qraft release"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/qraft.git
git push -u origin main
```

## Privacy

Normal QR generation, local project storage, image/logo processing, scanning and batch preparation happen in the browser in this application. External URLs encoded into QR codes can of course lead to third-party services.

## Image QR limitation

Qraft's Image QR mode embeds a small compressed image directly in the QR payload. QR codes have strict data capacity, so this is intentionally a compact preview rather than a full-resolution photograph. Qraft's scanner recognizes the embedded payload and displays the image locally without a network request. A generic third-party camera/scanner will not automatically turn that custom payload into the image; universal automatic display requires an online destination such as an image URL or a dedicated scanner that understands the payload.

## License

MIT — see `LICENSE`.


## Design customization
Qraft supports live preview controls for QR body shapes (square, rounded, dots, diamond, bars), scan-safe finder styles, surrounding frames, colors, logo placement, quiet zone, error correction, resolution, gradients, and transparent PNG export.

## Offline Image QR
The Image QR type embeds a compact JPEG image payload inside the QR for Qraft's own scanner. No image-hosting URL is required for that Qraft-to-Qraft offline image workflow. Embedded image QRs intentionally use a conservative square body/finder and low error correction to protect decoding reliability.

## Current UI / reliability pass
- Removed the old pastel/gradient override cascade and rebuilt the stylesheet as one product-oriented design system.
- Studio uses an app viewport on desktop: only the active work area scrolls; page-level scroll is suppressed while editing.
- Preview scale is constrained by both available width and height so the complete card remains visible.
- Removed redundant `pattern` state from `DesignState`; body shape is now the single source of truth. Older saved projects migrate their legacy pattern field on open.
- Finder shapes are limited to the implemented scan-safe square/rounded options.
- Project storage uses IndexedDB with a localStorage fallback and a real clear operation. Auto-save writes are debounced.
- Final card PNG/PDF/SVG exports verify the QR after the final card composition; SVG is rasterized in-browser for the same verification step.
- GitHub Pages/sub-path entry assets use relative paths and the service-worker cache revision has been bumped.
