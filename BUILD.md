# ORDOSPACE Dependency Build

This project is still a static HTML/CSS/JS app, but Tailwind and Lucide are now version-pinned.

## Install

```powershell
npm install
```

Pinned versions are recorded in `package-lock.json`.

## Build Local Assets

```powershell
npm run build
```

This command:

- builds `app/styles/tailwind.build.css` from `tailwind.config.cjs`
- copies `lucide@1.22.0` into `app/vendor/lucide/lucide.min.js`

## Verify

```powershell
npm run check:js
npm run smoke
git diff --check
```

`npm run smoke` opens the app in real Chrome and also runs `window.ORDO_QA.run()`.

## CDN Policy

The app should not load these runtime dependencies directly:

- `https://cdn.tailwindcss.com`
- `https://unpkg.com/lucide@latest/...`

Use the local generated files instead:

- `app/styles/tailwind.build.css`
- `app/vendor/lucide/lucide.min.js`
