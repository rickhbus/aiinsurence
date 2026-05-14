# Turtle Icon Package

Generated for the `rickhbus/aiinsurence` Next.js app.

## Recommended install

1. Copy everything in `public/` into your repo's `public/` directory.
2. Copy everything in `src/app/` into your repo's `src/app/` directory. This replaces the existing `src/app/favicon.ico` and adds `src/app/icon.svg` plus `src/app/apple-icon.png`.
3. Merge `next-metadata-snippet.ts` into `src/app/layout.tsx`.
4. Run:

```bash
npm run lint
npm run build
```

## Included assets

- `public/favicon.svg` — main scalable icon.
- `public/icon.svg` — reusable public icon path for UI components.
- `public/turtle-icon.svg` — same vector under a descriptive filename.
- `public/turtle-avatar-transparent.svg` and `.png` — transparent mascot asset for UI placement.
- `public/mask-icon.svg` — monochrome mask icon.
- `public/favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `favicon-96x96.png`.
- `public/favicon.ico` and `src/app/favicon.ico`.
- `public/apple-touch-icon.png` and `src/app/apple-icon.png`.
- `public/android-chrome-192x192.png`, `public/android-chrome-512x512.png`.
- `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`.
- `public/icon-1024.png` — master PNG.
- `public/og-image.png` — basic social preview image.
- `public/site.webmanifest` — PWA manifest.
- `optional/src-app-manifest.ts` — optional Next.js `src/app/manifest.ts` version if you prefer app-route manifests.

## Notes

The SVG is a clean original turtle mascot, not a copied brand character. The maskable icon uses extra safe-zone padding so Android launchers can crop it without cutting off the turtle.
