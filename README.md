# Qraft

Qraft is a browser-first QR creation and design studio built around a simple flow: choose what you want to share, make it yours, verify it, then export.

## Product flow

**Landing → Create / Templates / Tools / Projects / Scan & test**

Create and Templates share the same editing model:

**Choose → Add details → Customize → Live preview → Verify → Export / Save**

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
- Color system, background, accent, resolution, quiet zone, error correction, card radius, CTA, frame, glow/gradient and transparent PNG controls
- Advanced styling controls that do not repaint the QR data matrix
- Standards-based QR rendering through `qrcode`
- Readability/contrast-aware defaults
- Fresh QR rendering for every export
- QR PNG, branded Design PNG, SVG, PDF and copy-data export
- Camera QR scanner/tester and image upload scanner
- Full-screen file drag-and-drop detection on the Scan & test page
- Offline Image QR mode using a compact embedded image payload for Qraft's scanner
- Batch generator for up to 1,000 rows + ZIP export
- Local projects with thumbnails and restore
- Undo / redo
- Responsive landing page and application pages
- Scrollbars hidden across the UI while normal scrolling remains enabled
- Cute/sweet display typography using Baloo 2 + Nunito

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

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

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
