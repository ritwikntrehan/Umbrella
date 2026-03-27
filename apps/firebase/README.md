# @umbrella/firebase

Firebase-specific app root for deploying Umbrella services.

## What this directory is for

- Keep Firebase configuration isolated from other app roots.
- Provide a single place to manage Hosting and Functions settings.
- Allow independent Firebase deployment workflows.

## Layout

- `firebase.json` - Firebase Hosting/Functions configuration.
- `.firebaserc` - Firebase project alias mapping.
- `hosting/` - Static Hosting public directory (placeholder).
- `functions/` - Cloud Functions workspace scaffold.

## Next steps

1. Set the real Firebase project id in `.firebaserc`.
2. Add production Hosting assets to `hosting/`.
3. Implement function handlers in `functions/src/index.ts`.
