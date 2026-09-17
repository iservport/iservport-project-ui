# Project screen registry

The new UI is mounted at `/project/`. `/report/` identifies the authenticated legacy module only. Screen identifiers are stable shorthand, not Angular route prefixes.

| ID  | Screen                        | Legacy route               | New route                          | Shell → default child                                           |
| --- | ----------------------------- | -------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| p1  | Projects                      | `/report/`                 | `/project/`                        | `ProjectHomeComponent` → `ProjectBoardComponent`                |
| p2  | Project summary               | `/report/project/<id>`     | `/project/project/:projectId`      | `ProjectShellComponent` → `ProjectContainerComponent`           |
| p3  | Project schedule / activities | `/report/schedule/<id>`    | `/project/schedule/:projectId`     | `ProjectShellComponent` → `ProjectScheduleContainerComponent`   |
| p4  | Activity monitoring           | `/report/id/<id>`          | `/project/id/:reportId`            | `ProjectShellComponent` → `ProjectReportContainerComponent`     |
| p5  | Activity content              | `/report/content/<id>`     | `/project/content/:reportId`       | `ProjectShellComponent` → `ProjectContentContainerComponent`    |
| p6  | Project conclusion            | `/report/conclusion/<id>`  | `/project/conclusion/:projectId`   | `ProjectShellComponent` → `ProjectConclusionContainerComponent` |
| p7  | Project team                  | `/report/team/<id>`        | `/project/team/:projectId`         | `ProjectShellComponent` → `ProjectTeamContainerComponent`       |
| t1  | Templates                     | `/report/template`         | `/project/template`                | `ProjectTemplateHomeComponent` → shared home/board              |
| t2  | Template detail               | `/report/template/id/<id>` | `/project/template/id/:templateId` | `ProjectShellComponent` → `ProjectTemplateContainerComponent`   |

## Navigation contract

- Every detail route loads its shell and one empty-path, full-match child container.
- Static routes precede compatibility redirects. Angular router links omit the mounted `/project/` base segment.
- `project.config.ts` owns the home menu; both home pages use `CustomTopBoardNavigationComponent`, hiding the active section.
- `CustomContainerShellComponent` owns detail breadcrumbs, header, navigation, edit action, and the child router outlet.
- `CustomHomeShellComponent`, `CustomSearchBarComponent`, and `CustomPaginationComponent` provide the shared home, search, and paging UI.
- App-local labels use `APP_I18N` and the local-first `i18n` pipe in Portuguese, English, German, and Spanish.

## Backend contract

See [api.md](./api.md). Project and report ids are distinct. p4 and p5 first load the report, then resolve its parent project.

## Team messages

p7 includes message history, draft editing, team recipient selection, saving, and an explicit send action. Message delivery is never exercised by automated verification.
