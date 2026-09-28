# Qraft

Qraft is a clean, client-side QR creation studio for making branded, readable QR codes without unnecessary complexity.

## Product flow

**Landing → Get Started → Qraft Studio → Choose → Add info → Customize → Export**

## Features

- 24 QR content types
- 36+ ready-made templates with categories and search
- Simple quick styles with optional advanced controls
- Custom patterns and finder styles
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

## Tech stack

- React 19
- TypeScript
- Vite 6
- QRCode.js
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
