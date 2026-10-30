# Project screen registry

The new UI is mounted at `/project/`. `/report/` identifies the authenticated legacy module only. Screen identifiers are stable shorthand, not Angular route prefixes.

| ID  | Screen                        | Legacy route               | New route                          | Shell → default child                                           |
| --- | ----------------------------- | -------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| P1  | Projects (first/home page)    | `/report/`                 | `/project/`                        | `ProjectHomeComponent` → `ProjectBoardComponent`                |
| p2  | Project summary               | `/report/project/<id>`     | `/project/project/:projectId`      | `ProjectShellComponent` → `ProjectContainerComponent`           |
| p3  | Project schedule / activities | `/report/schedule/<id>`    | `/project/schedule/:projectId`     | `ProjectShellComponent` → `ProjectScheduleContainerComponent`   |
| p4  | Activity monitoring           | `/report/id/<id>`          | `/project/id/:reportId`            | `ProjectShellComponent` → `ProjectReportContainerComponent`     |
| p5  | Activity content              | `/report/content/<id>`     | `/project/content/:reportId`       | `ProjectShellComponent` → `ProjectContentContainerComponent`    |
| p6  | Project conclusion            | `/report/conclusion/<id>`  | `/project/conclusion/:projectId`   | `ProjectShellComponent` → `ProjectConclusionContainerComponent` |
| p7  | Project team                  | `/report/team/<id>`        | `/project/team/:projectId`         | `ProjectShellComponent` → `ProjectTeamContainerComponent`       |
| t1  | Templates                     | `/report/template`         | `/project/template`                | `ProjectTemplateHomeComponent` → shared home/board              |
| t2  | Template detail               | `/report/template/id/<id>` | `/project/template/id/:templateId` | `ProjectShellComponent` → `ProjectTemplateContainerComponent`   |

## Navigation contract

P1 is the first/home page. Its implementation identifier remains `p1` in `agent.yaml` and the screen graph.

- Every detail route loads its shell and one empty-path, full-match child container.
- Static routes precede compatibility redirects. Angular router links omit the mounted `/project/` base segment.
- `project.config.ts` owns the home menu; both home pages use `CustomTopBoardNavigationComponent`, hiding the active section.
- `CustomContainerShellComponent` owns detail breadcrumbs, header, navigation, edit action, and the child router outlet.
- `CustomHomeShellComponent`, `CustomSearchBarComponent`, and `CustomPaginationComponent` provide the shared home, search, and paging UI.
- App-local labels use `APP_I18N` and the local-first `i18n` pipe in Portuguese, English, German, and Spanish.

## Header and schedule review

The record header uses right-aligned horizontal shared date badges and no progress bar. Schedule progress remains, without a count underneath. Full phase rows select directly and retain `phaseId` in the URL; status/view pills sit below search, and Edit Phase/Remove sit beside search. Breadcrumbs rely on the shared component's single back arrow.

P1 offers an explicit new/classic chooser. In the new UI it is mounted only on P1, never on detail, template, start, or auth pages. “Don't show this again” saves `hideUiChoice: true` in the current user's `PROJECT_HOME_FILTER` preference (key `0`), retaining the active filter selections and leaving the new/classic UI preference unchanged. The chooser waits for the saved dismissal to load; closing with × dismisses it only for the current P1 visit. Failed dismissal saves keep the chooser available for retry. The classic frame has its own chooser implementation. Known screen paths retain project/report/template ids; unsupported routes fall back to home. See the [root registry](../project-registry.md#newclassic-chooser-navigation) for route mapping, persistence, and remaining server-entry compatibility observations.

## Backend contract

See [api.md](./api.md). Project and report ids are distinct. p4 and p5 first load the report, then resolve its parent project.

P1 category/board badges show the legacy attention count `max(alert, overdue)`, not `total` report rows. See the [root registry](../project-registry.md#p1-home-review) for source evidence, status/filter scope, and the difference from the newer shared overdue-first convention.

P1's backend `ProjectFilter` includes `hideUiChoice`. Project list requests carry this property because `/app/report/project/filter` uses `@AutoPersistFilter` and replaces the saved preference. The first list request waits for preference restoration. Deploy the backend filter field with this frontend change so automatic persistence retains the dismissal.

## Team messages

p7 includes message history, draft editing, team recipient selection, saving, and an explicit send action. Message delivery is never exercised by automated verification.
