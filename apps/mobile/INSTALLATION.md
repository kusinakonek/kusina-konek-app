# Mobile app installation (Expo)

This mobile app lives in an npm-workspaces monorepo. Install dependencies **from the repo root** so you get a single, hoisted `node_modules`.

## Prerequisites

- Node.js version from the repo root `.nvmrc` (recommended)
- npm (comes with Node)
- Expo Go (on your phone) or an emulator/simulator

## Install (recommended)

From the repo root:

```bash
npm ci
```

Notes:
- `npm ci` is the most reproducible option for teammates and CI.
- Do **not** run installs inside `apps/mobile`.
- There should be **no** `apps/mobile/node_modules`. If you see one, delete it.

## Run the app

From the repo root:

```bash
npm run dev:mobile
```

Common alternatives:

```bash
npm --workspace apps/mobile run android
npm --workspace apps/mobile run ios
npm --workspace apps/mobile run web
```

## Run tests

From the repo root:

```bash
npm --workspace apps/mobile test
```

## TypeScript

This repo currently typechecks the server workspace from the root:

```bash
npm run typecheck
```

If you want to typecheck only the mobile app, run TypeScript directly:

```bash
npm --workspace apps/mobile exec tsc -p tsconfig.json --noEmit
```

## Troubleshooting

### Metro cache / weird bundler issues

```bash
npm --workspace apps/mobile exec expo start --clear
```

### If installs behave strangely

- Ensure you installed from the repo root.
- Ensure `apps/mobile/node_modules` is deleted.
- Re-run:

```bash
npm ci
```
