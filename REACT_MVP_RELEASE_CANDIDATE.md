# React MVP Release Candidate

## Decision

Round 17 keeps the React MVP as a preview-first release candidate.

The current production Vercel app is still the static Sprint 5 app at:

- https://ordospace-sprint5.vercel.app/

The React MVP remains isolated under `react-mvp/` and builds to `dist-react/`.
Do not switch `vercel.json` from the static output to `dist-react/` until the
React MVP release candidate is reviewed and the user explicitly approves a
production cutover.

## Why Preview-First

- `vercel.json` currently runs `npm run build` and serves the repository root.
- Changing production output to `dist-react/` would replace the existing static
  production app.
- The existing production app is already deployed and verified.
- The React MVP now has its own release-grade local checks and can be previewed
  without changing `origin/main`.

## Release Candidate Check

Run:

```powershell
npm.cmd run mvp:release-check
```

This performs:

1. Pure data/session/route/lifecycle/persistence/activity/form validators.
2. React production build into `dist-react/`.
3. Real-browser smoke against the built `dist-react/` artifact through Vite
   preview.

For only the built-artifact browser smoke:

```powershell
npm.cmd run mvp:smoke:preview
```

For an already running preview URL:

```powershell
npm.cmd run mvp:smoke -- --url http://127.0.0.1:4174/
```

For a protected Vercel preview, enable Protection Bypass for Automation in
Vercel and run the smoke with the generated secret in the environment:

```powershell
$env:VERCEL_AUTOMATION_BYPASS_SECRET='<vercel-generated-secret>'
npm.cmd run mvp:smoke -- --url <preview-url>
```

The smoke harness sends `x-vercel-protection-bypass` and asks Vercel to set the
bypass cookie for in-browser navigations. Do not commit or store the bypass
secret in repo files or shared memory.

## Vercel Preview Guidance

Use a Vercel preview deployment only after the user approves creating a public
preview URL. Do not pass `--prod` during preview checks.

Useful dry-run command before any upload:

```powershell
npx.cmd --yes vercel@latest deploy dist-react --dry --yes --non-interactive --project ordospace-sprint5
```

The local checkout is not linked with a `.vercel/project.json`, so the project
name must be supplied for dry-runs and preview deployments unless the user
explicitly approves running `vercel link`.

The final production cutover should happen only after:

- `npm.cmd run mvp:release-check` passes.
- A public preview URL is smoke-tested with `npm.cmd run mvp:smoke -- --url <preview-url>`.
  If the preview is protected by Vercel Authentication, configure a bypass
  secret first and rerun the smoke.
- The user approves replacing or routing the production URL.
