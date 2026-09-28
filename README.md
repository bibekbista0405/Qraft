# QR-Code

A complete, friendly QR design studio built with React + Vite + TypeScript.

## Included

### QR content
- Website / URL
- Plain text
- Email
- Phone
- SMS
- Wi-Fi
- Contact / vCard
- Location
- WhatsApp
- Social profile
- Payment information payload

### Design studio
- 16 premade templates
- Editable headline, subtitle and CTA
- Square, rounded, dots, diamond and bars patterns
- Square, rounded and circular finder corners
- Brand colors and custom color picker
- Background colors
- Logo upload (PNG/JPG/WEBP, 5 MB limit)
- Automatic high error correction when a logo is added
- Logo size control
- Quiet-zone control
- Resolution presets up to 2400px
- Transparent QR background
- Branded card gradient
- Automatic contrast/readability guidance

### Export
- QR PNG
- Branded design PNG
- Custom-style SVG
- Branded PDF
- Browser print
- Copy encoded content

### Tools
- Camera QR scanner/tester
- Image QR scanner/tester
- CSV batch generation
- Batch ZIP export
- Up to 1,000 batch rows
- Local project save/restore
- Project thumbnails
- Undo / redo
- New project workflow

### Privacy
Normal QR generation, scanning, projects and batch processing run locally in the browser. The app does not upload QR data to a server. Dynamic QR and analytics are intentionally not faked: connect the QR to your own redirect/analytics backend when you need those server-side capabilities.

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Project naming
The project and update archive are intentionally kept as **QR-Code**. Future update archives should continue using exactly `QR-Code.zip`.
