# Qraft

Qraft is a clean, client-side QR creation studio for making branded, readable QR codes without unnecessary complexity.

## Product flow

**Landing → Get Started → Qraft Studio → Choose → Add info → Customize → Export**

## Features

- **Offline Image QR** — compact image thumbnails can be embedded directly into the QR payload and recovered by Qraft without internet access.

- 24 QR content types
- 36+ ready-made templates with categories and search
- Simple quick styles with optional advanced controls
- Standard, scan-safe QR rendering with reliable finder patterns
- Logo support with safer error correction
- Readability and contrast checks
- Fresh QR rendering for every export
- QR PNG, branded PNG, SVG, PDF and copy-data export
- Camera QR scanner/tester and image upload scanner
- Batch generator for up to 1,000 rows + ZIP export
- Local projects with thumbnails and restore
- Undo / redo
- Responsive landing page and studio
- Qraft brand assets included in `public/`
- Motion-rich landing page with animated QR showcase and template previews

## Tech stack

- React 19
- TypeScript
- Vite 6
- `qrcode` package for standards-compliant QR generation
- jsQR
- JSZip
- jsPDF
- Lucide React

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

The repository is intentionally client-side and contains no secrets or API keys.

```bash
git init
git add .
git commit -m "Initial Qraft release"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/qraft.git
git push -u origin main
```

## Privacy

Normal QR generation, projects, scanning and batch preparation happen locally in the browser. QR payloads are not sent to a Qraft server by this application.

## License

MIT — see `LICENSE`.

## Image QR limitation

Qraft's Image QR mode embeds a compact compressed thumbnail directly in the QR payload. QR codes have a strict data-capacity limit, so this is intentionally a small preview rather than a full-resolution photograph. Qraft's scanner recognizes the embedded payload and displays the image locally without a network request. A normal third-party camera/scanner will see the encoded payload text; making a full-resolution image appear automatically in every phone camera requires an online URL/hosting destination or a dedicated scanner app.
