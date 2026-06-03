# iservport-project-ui
Iservport Project UI

## Project Structure

- `src/app/api/project/`: backend-facing project models, tokens, and API service.
- `src/app/project/home/`: root project home page with `PROJECT_HOME_FILTER`.
- `src/app/project/board/`: project board and project cards.
- `src/app/project/template/`: template home page with `PROJECT_TOPIC_FILTER`.
- `src/app/project/container/`: project summary container route `/:projectId`.
- `src/app/project/light/`: light review container route `/light/:projectId`.
- `src/app/project/phase/`: phase container route `/phase/:phaseId`.
- `src/app/project/report/`: report container route `/report/:reportId`.
- `src/app/project/conclusion/`: conclusion container route `/conclusion/:projectId`.
- `src/app/project/team/`: team container route `/team/:projectId`.
- `src/app/project/shared/`: shared project shell and placeholder panel components.
