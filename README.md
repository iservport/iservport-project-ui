# iservport-project-ui

Angular 22 / TypeScript 6 replacement for the legacy report module. The new app stays at `/project/`; the existing backend remains under `/app/report`.

## Commands

- `npm run setup`: install dependencies and build (run by the project owner).
- `npm run start:dev:https`: local backend.
- `npm run start:aws:https`: deployed backend.
- `npm run build`: production build.
- `npm test -- --watch=false`: route and HTTP contract tests.

The local frontend needs its own authenticated session at `/project/start`. Restart the dev server after changing proxy configuration.

## Structure

- [Screen registry](specs/project-registry.md): p1–p7 and t1–t2, legacy/new URLs, and shell/container contracts.
- [API contracts](specs/api.md): backend source locations, parameters, and pagination conventions.
- `src/app/project.config.ts`: shared home navigation and project filter.
- `src/app/project/home/`: API-backed project filter and board state.
- `src/app/project/shared/`: record shell, route state, editors, and schedule display.
- `src/app/project/{container,schedule,report,content,conclusion,team,template}/`: feature containers.
- `src/app/api/project/`: typed HTTP adapters and models.
- `src/app/i18n/`: local Portuguese, English, German, and Spanish translations.
- `public/froala/`: rich-text editor assets matching the sibling content app.

Existing record versions and unedited metadata are preserved in save requests. Create actions obtain backend drafts before editing. Message delivery occurs only through the explicit Send action.
