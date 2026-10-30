# Project route and navigation registry

Verified against this checkout on 2026-10-30. This is the route baseline for compatibility review with other Iservport frontend modules. It records current behavior and open review items; it does not change routing or prescribe replacement URLs.

The existing [screen registry](specs/project-registry.md) and [screen graph](specs/project.mmd) define P1 (implementation key `p1`), p2–p7, and t1–t2. [agent.yaml](agent.yaml) still points to that screen registry. This root document adds shared entry routes, aliases, navigation sources, and compatibility observations. Keep both registries aligned if routes change.

## Mount and composition

| Setting | Current value | Source |
| --- | --- | --- |
| Browser mount | `/project/`, with trailing slash | [src/index.html](src/index.html) |
| Development serve path | `/project` for all three serve scripts | [package.json](package.json) |
| Module config | `module: 'project'`, `base: '/project/'`, `apiRoot: '/app/report'` | [project.config.ts](src/app/project.config.ts), `PROJECT_CONFIG` |
| Application shell | `IservportAppShellComponent`, `workspace="PROJECT"`, `baseName="project"`, `moduleUrl="/app/report"` | [app.ts](src/app/app.ts), [app.html](src/app/app.html) |
| Router setup | `provideRouter(routes, withComponentInputBinding())`; no hash-location option configured | [app.config.ts](src/app/app.config.ts) |
| Legacy mount metadata | `/report/`; separate legacy module, not an Angular prefix registered here | [agent.yaml](agent.yaml), [screen registry](specs/project-registry.md) |

**Path notation:** Angular paths below omit the HTML base. For example, Angular `schedule/:projectId` becomes browser `/project/schedule/:projectId`. Angular `project/:projectId` becomes browser `/project/project/:projectId`; these are two distinct segments in the current contract.

[app.routes.ts](src/app/app.routes.ts) composes routes in this exact order:

1. `start`
2. `auth`
3. `...projectTemplateRoutes`: template home, template detail
4. `...projectRoutes`: project home, summary, schedule, monitoring, content, conclusion, team
5. `light/:projectId`
6. `report/:reportId`
7. `:projectId`

There are **14 public route declarations**: 11 lazy component routes and 3 redirects. Seven detail routes also declare one empty-path child each, giving **21 route objects** in total. No `loadChildren` declarations, route guards (`canActivate`, `canActivateChild`, `canMatch`, `canLoad`, `canDeactivate`), resolvers, custom matchers, or wildcard `**` routes are declared in the application route definitions. Shared-library and server authentication behavior is outside that statement.

## Public routes

Every component in this table is loaded through `loadComponent`. For each detail row, the public route loads `ProjectShellComponent`, and its single child has `path: ''`, `pathMatch: 'full'`, and lazy-loads the listed container. These children add no URL segment. Home board components are embedded UI, not child routes.

| ID | Angular path | Browser path | Lazy component / shell → default child | Parameters and route metadata | Route source |
| --- | --- | --- | --- | --- | --- |
| entry-start | `start` | `/project/start` | `StartComponent` from `@iservport/iservport-angular-ui` | No local providers or route data | [app.routes.ts](src/app/app.routes.ts) |
| entry-auth | `auth` | `/project/auth` | `CustomAuthComponent` from `@iservport/iservport-angular-ui` | Route provider `CUSTOM_AUTH_WORKSPACE = 'PROJECT'` | [app.routes.ts](src/app/app.routes.ts) |
| t1 | `template` | `/project/template` | `ProjectTemplateHomeComponent` | `pathMatch: 'full'`; `data: { templates: true }` | [project-template.routes.ts](src/app/project/template/project-template.routes.ts) |
| t2 | `template/id/:templateId` | `/project/template/id/:templateId` | `ProjectShellComponent` → `ProjectTemplateContainerComponent` | `templateId` | [project-template.routes.ts](src/app/project/template/project-template.routes.ts) |
| P1 | `''` | `/project/` | `ProjectHomeComponent` | First/home page; `pathMatch: 'full'` | [project.routes.ts](src/app/project/home/project.routes.ts) |
| p2 | `project/:projectId` | `/project/project/:projectId` | `ProjectShellComponent` → `ProjectContainerComponent` | `projectId` | [project.routes.ts](src/app/project/home/project.routes.ts) |
| p3 | `schedule/:projectId` | `/project/schedule/:projectId` | `ProjectShellComponent` → `ProjectScheduleContainerComponent` | `projectId`; optional query `phaseId` | [project.routes.ts](src/app/project/home/project.routes.ts) |
| p4 | `id/:reportId` | `/project/id/:reportId` | `ProjectShellComponent` → `ProjectReportContainerComponent` | `reportId` | [project.routes.ts](src/app/project/home/project.routes.ts) |
| p5 | `content/:reportId` | `/project/content/:reportId` | `ProjectShellComponent` → `ProjectContentContainerComponent` | `reportId` | [project.routes.ts](src/app/project/home/project.routes.ts) |
| p6 | `conclusion/:projectId` | `/project/conclusion/:projectId` | `ProjectShellComponent` → `ProjectConclusionContainerComponent` | `projectId` | [project.routes.ts](src/app/project/home/project.routes.ts) |
| p7 | `team/:projectId` | `/project/team/:projectId` | `ProjectShellComponent` → `ProjectTeamContainerComponent` | `projectId` | [project.routes.ts](src/app/project/home/project.routes.ts) |

Local lazy targets are [project home](src/app/project/home/project-home.component.ts), [template home](src/app/project/template/project-template-home.component.ts), [shared record shell](src/app/project/shared/project-shell.component.ts), [summary](src/app/project/container/project-container.component.ts), [schedule](src/app/project/schedule/project-schedule-container.component.ts), [monitoring](src/app/project/report/project-report-container.component.ts), [content](src/app/project/content/project-content-container.component.ts), [conclusion](src/app/project/conclusion/project-conclusion-container.component.ts), [team](src/app/project/team/project-team-container.component.ts), and [template detail](src/app/project/template/project-template-container.component.ts).

### Compatibility redirects

All three are declared after feature routes in [app.routes.ts](src/app/app.routes.ts). None explicitly sets `pathMatch`; all use the default prefix matching behavior.

| Alias Angular path | Alias browser path | `redirectTo` | Target browser path |
| --- | --- | --- | --- |
| `light/:projectId` | `/project/light/:projectId` | `schedule/:projectId` | `/project/schedule/:projectId` |
| `report/:reportId` | `/project/report/:reportId` | `id/:reportId` | `/project/id/:reportId` |
| `:projectId` | `/project/:projectId` | `project/:projectId` | `/project/project/:projectId` |

These are aliases **inside `/project/`**. They do not implement redirects from browser `/report/...` into the new module.

## Parameters and record context

[ProjectWorkspaceStore](src/app/project/shared/project-workspace.store.ts), provided by the record shell, subscribes to the public route's `paramMap` and converts ids with `Number(...)`:

- `templateId`: load the template directly.
- `reportId`: load the report, then load its project using `report.projectId || report.reportFolderId`. A report id is not a project id.
- `projectId`: load the project directly.

Routes do not constrain ids to numeric values or declare validation guards. The store handles request failures with `PROJECT_LOAD_ERROR`; this is component state, not a route redirect or resolver.

The [timeline](src/app/project/shared/project-timeline.component.ts) links to `['/schedule', projectId()]` with `{ phaseId: phase.id }`. The [schedule container](src/app/project/schedule/project-schedule-container.component.ts) selects that phase when it belongs to the loaded project; initial loading falls back to the first phase, or `0` if none exist. Later valid query changes update selection. Its `select(id)` action now navigates with merged `phaseId` query parameters, so row selection, refresh, and browser history retain the selected phase. No other query-parameter or fragment contract is explicitly consumed by local application code.

Template home embeds `ProjectHomeComponent`; [ProjectHomeStore](src/app/project/home/project-home.store.ts) reads `snapshot.data['templates']` to select template mode. The `templates: true` route data belongs to t1, not t2.

## Navigation entry points

Angular commands here are app-root-relative and omit the mounted `/project/` base. Plain `href` destinations are origin-root URLs and intentionally leave Angular routing.

| Surface / action | Destination or configured entry | Conditions / context | Source |
| --- | --- | --- | --- |
| Shared module menu | `project` home, `template`, `auth`; menu `base: '/project/'` | `PROJECT_TOP_MENU_CONFIG`; project marked `home: true`; captions `PROJECTS`, `PROJECT_TEMPLATES`, `__AUTHORIZATION` | [project.config.ts](src/app/project.config.ts) |
| Project home menu | Template and authorization entries | `projectTopNavigationWithout('project')` hides current home | [board TS](src/app/project/board/project-board.component.ts), [board template](src/app/project/board/project-board.component.html) |
| Template home menu | Project and authorization entries | `projectTopNavigationWithout('template')`; same `CustomTopBoardNavigationComponent` | [board TS](src/app/project/board/project-board.component.ts), [template home](src/app/project/template/project-template-home.component.ts) |
| Project board selection | `['/schedule', item.id]` → p3 | Project mode; card opens activities, not summary | [board template](src/app/project/board/project-board.component.html) |
| Template board selection | `['/template/id', item.id]` → t2 | Template mode | [board template](src/app/project/board/project-board.component.html) |
| Save home create/edit form | `['/project', saved.id]` → p2, or `['/template/id', saved.id]` → t2 | Navigate only after successful save | [home store](src/app/project/home/project-home.store.ts) |
| Save project created from template | `['/project', v.id]` → p2 | `editingProject()` true after template-based creation | [template container](src/app/project/template/project-template-container.component.ts) |
| Project/report breadcrumbs | `/` → P1; `['/project', p.id]` → p2 | Project breadcrumb appears when project loaded; report label is active text | [record shell](src/app/project/shared/project-shell.component.ts), `breadcrumbs` |
| Template breadcrumbs | `/template` → t1 | Template label is active text | [record shell](src/app/project/shared/project-shell.component.ts), `breadcrumbs` |
| Record section navigation | `['/project', p.id]`, `['/schedule', p.id]`, `['/conclusion', p.id]`, `['/team', p.id]` | Requires loaded project; no section navigation for template-only context | [record shell](src/app/project/shared/project-shell.component.ts), `navigation` |
| Report section navigation | `['/id', r.id]`, `['/content', r.id]` | Additional entries only when report loaded | [record shell](src/app/project/shared/project-shell.component.ts), `navigation` |
| Timeline phase selection | `['/schedule', projectId()]` with query `phaseId` | Same schedule screen, phase context | [timeline](src/app/project/shared/project-timeline.component.ts) |
| Schedule activity cards and table rows | `['/id', report.id]` → p4 | Both schedule views use the report id | [schedule template](src/app/project/schedule/project-schedule-container.component.html) |
| Linked content title | `href="/content/id/<contentId>"` | Full-page navigation to the sibling content module; not local p5 | [content container](src/app/project/content/project-content-container.component.ts) |
| Export spreadsheet | `href="/api/report/export/xls/<projectId>"` | Server export endpoint, not an Angular screen | [schedule template](src/app/project/schedule/project-schedule-container.component.html) |
| Authentication bootstrap | `/project/start` | README instructs starting a local authenticated frontend session here | [README.md](README.md), [app.routes.ts](src/app/app.routes.ts) |

Create/edit forms otherwise open locally through editor state; they do not declare additional routes. Summary printing calls `window.print()` in the [summary container](src/app/project/container/project-container.component.ts), with no URL transition. The shared application shell may expose further library-owned navigation; this repository supplies its workspace, base name, and module URL rather than a local route list for those entries.

## Compatibility observations and review gaps

### Verified in repository source

- The mount, dev serve paths, central config, and app-shell base name agree on `project`. Local Angular router links omit the browser mount, following the shared base-path routing convention. Keep `/project/project/:projectId` distinct from the short alias `/project/:projectId` when comparing modules.
- `start` and `auth`, both template routes, and all project routes precede the final parameter alias. Shared auth uses the route-level `CUSTOM_AUTH_WORKSPACE` provider with `PROJECT`, as required by the shared route convention.
- All seven detail screens have the lazy shell plus empty, full-match lazy child shape. The record shell delegates layout, breadcrumbs, and navigation to `CustomContainerShellComponent`. Both homes reuse the central menu and shared top-navigation component, hiding the current home entry.
- The nine screen ids, browser paths, and feature component names agree with `agent.yaml` and `specs/project-registry.md`. That screen registry's home-to-board arrows describe embedded composition, whereas its detail arrows represent routed children.

### Open compatibility work; no behavior changed

| Review item | Evidence and practical implication |
| --- | --- |
| Legacy `/report/` handoff | The explicit chooser now switches between verified `/project/...` and `/report/...` screens. The existing server `ProjectAppController` remains untouched and forwards to `/report/index.html` when `UiResolver` selects the new UI; generic menu-entry migration to `/project/` remains a separate backend compatibility review. The Angular aliases do not implement this server handoff. |
| Broad final alias and unmatched URLs | `:projectId` accepts arbitrary first segments, with no numeric matcher or validation guard. All aliases omit explicit `pathMatch`, and there is no wildcard/not-found screen. Review malformed ids, unknown paths, and extra segments with the intended cross-module policy before changing these public contracts. |
| Home root organization | Project routes live under `src/app/project/home/` and template routes under `src/app/project/template/`. They have separate route files, but both homes share the `project` folder rather than separate `src/app` home roots as described in the shared route-splitting memory. Record this layout difference before a broader reorganization. |
| Shared component runtime contracts | Local record shell markup has no explicit `router-outlet`; it delegates to the library container shell. Menu destination construction and additional app-shell entries also belong to the library. The current checkout declares and uses `8.8.825`. The shared shell source includes its child router outlet, and authenticated browser review on port 4308 confirmed the routed schedule renders inside it. Broader auth/menu behavior remains outside this layout review. |
| Shared top-navigation stylesheet | The board uses the shared navigation component, but its CSS and `src/styles.css` contain no explicit shared-navigation stylesheet import. Check whether the installed library supplies required styling before assessing compliance with the shared navigation stylesheet rule. |
| Sibling content handoff | `/content/id/<contentId>` is an origin-root anchor, distinct from local `/project/content/<reportId>`. Verify the deployed content module's mount, record-id contract, and session continuity. The sibling module was not audited here. |
| Export and deep-link hosting | `/api` is proxied in both [local](proxy.conf.dev.json) and [AWS](proxy.conf.aws.json) dev configs. The chooser adds `/report`, `/assets`, `/static`, `/component`, and `/webjars` proxy entries for classic pages and their assets; `/content` remains a separate module handoff. Production fallback rules for direct `/project/...` loads and the export endpoint's availability are not established by these dev proxies. |
| URL state completeness | Valid `phaseId` query links select a phase, and direct row selection now updates this query parameter. Summary rows remain full-row links to that URL. Filter pills and view mode remain local state. |
| Guard expectations | No local route guards or resolvers are configured. The app shell and `AppState` drive UI authority checks; server/shared-library enforcement and any desired leave-editor confirmation remain separate review items. |

## P1 home review

P1 names the first/home page at `/project/`; `p1` remains the implementation key in `agent.yaml` and the screen graph. The following changes came from the home-page review and do not alter public routes.

### Cards

The [project card stylesheet](src/app/project/board/project-board.component.css) now uses a uniform `1px solid #e2e8f0` border, 12px corners, a subtle resting shadow, and neutral hover/focus borders and shadows. The blue 3px top border was removed. These values follow the actual sibling [asset board cards](/Users/mauriciofernandesdecastro/workspace/iservport-asset-ui/src/app/shared/board-layout.css) and [user cards](/Users/mauriciofernandesdecastro/workspace/iservport-user-ui/src/app/user/shared/user-card.css). Record-specific content and card routing stay the same. Template home reuses this card stylesheet.

### Category / board attention counts

The [home store](src/app/project/home/project-home.store.ts) previously assigned `row.total` to category badges. It now assigns `Math.max(row.alert || 0, row.overdue || 0)`, keyed by category id. A zero count remains hidden by the shared filter. These numbers are report/activity attention counts, not project counts or the count of cards currently visible.

This matches the maintained legacy category filter in [root-ui/src/iservport-component-filter.js](/Users/mauriciofernandesdecastro/workspace/root-ui/src/iservport-component-filter.js), `getAttention(id)` (both ordinary and mapping sections), and the bundled copy at `iservport-root/src/main/resources/static/lib/root-ui.iife.js`. The newer shared frontend memory `frontend-home-filter.md` instead prescribes overdue-first selection and explicitly rejects `Math.max`. **This review intentionally follows the user's request to match the actual legacy category counts**; that convention difference remains for a later cross-module decision. The shared filter's badge API exposes values, without a per-category severity/tone input; badge colors were not reimplemented locally.

Verified backend and legacy scope:

| Concern | Source-defined behavior |
| --- | --- |
| Endpoint / legacy loading | `GET /app/report/stats/category`, also mapped as `/app/project/stats/category`. The [legacy project home](/Users/mauriciofernandesdecastro/workspace/iservport-root/app-plan/src/main/resources/assets/report/template/_home/ng-report-home.js) enables `showStats`; [legacy filter service](/Users/mauriciofernandesdecastro/workspace/root-ui/src/iservport-service-filter.js) loads category stats using `workspaceUrl: 'report'`. [Legacy stats service](/Users/mauriciofernandesdecastro/workspace/root-ui/src/iservport-service-stats.js) normalizes the array by id. |
| Entity and category scope | [ReportStatsRepository](/Users/mauriciofernandesdecastro/workspace/iservport-root/helianto/src/main/scala/com/iservport/report/repository/stats/ReportStatsRepository.scala) reads rows where `entityId` or `sharedEntityId` equals the authenticated entity. [AbstractCategoryStatsService](/Users/mauriciofernandesdecastro/workspace/iservport-root/helianto/src/main/scala/com/iservport/stats/service/AbstractCategoryStatsService.scala) groups by category id. This is not an individual-user assignment or unread-message count. |
| Archived rows | The [summary view migration](/Users/mauriciofernandesdecastro/workspace/iservport-root/app-plan/src/main/resources/db/migration/V17297_task_report_summary_view.sql) joins reports to phases, projects, and categories; all four priorities must be below `'9'`. Reports lacking a joined phase are excluded. |
| Total versus attention | [ReportStatsService](/Users/mauriciofernandesdecastro/workspace/iservport-root/app-plan/src/main/scala/com/iservport/report/service/stats/ReportStatsService.scala) sets `live = true` for view rows. [GenericStats](/Users/mauriciofernandesdecastro/workspace/iservport-root/helianto/src/main/scala/com/iservport/stats/domain/GenericStats.scala) counts all those rows in `total`, while attention counts use `active`. |
| Active statuses | Report `resolution != 'D'` and parent project `resolution.isActive`. [Resolution2](/Users/mauriciofernandesdecastro/workspace/iservport-root/helianto/src/main/scala/com/iservport/report/domain/enums/Resolution2.java) marks only DOING active. This override does not separately exclude report resolution `'X'`; the UI does not add an extra status rule. |
| Due-date window | [GenericStats](/Users/mauriciofernandesdecastro/workspace/iservport-root/helianto/src/main/scala/com/iservport/stats/domain/GenericStats.scala) counts overdue before today and alerts today through 30 days ahead, inclusive, using [StatsConfig](/Users/mauriciofernandesdecastro/workspace/iservport-root/helianto/src/main/scala/com/iservport/stats/service/StatsConfig.scala) and [DateSyntax](/Users/mauriciofernandesdecastro/workspace/iservport-root/helianto/src/main/scala/com/iservport/stats/service/DateSyntax.scala) in the server's clock/time zone. The frontend uses these returned counts rather than reclassifying dates. |
| Current board filters | The category stats request has no search, resolution, priority-selection, or page parameters. Counts remain entity-wide per category when the selected category, board filters, or pagination change. [Legacy filter service](/Users/mauriciofernandesdecastro/workspace/root-ui/src/iservport-service-filter.js) likewise calls the category stats endpoint without the board filter payload. |

The reported Planning = 4 and Continuous Improvement = 52 were not independently retrieved from an authenticated API response. No replacement live counts are claimed here. Regression fixtures use deliberately different totals, alert counts, and overdue counts to distinguish the behaviors.

## Project header, schedule, and UI chooser review

The accumulated changes are now in the current checkout at `/Users/mauriciofernandesdecastro/workspace/iservport-project-ui`, rather than isolated in the original worktree. The running review app is `https://local.iservport.com:4308/project/`; the existing port-4208 server was left running.

- The record header removes its progress bar, aligns with the content gutter, and places large horizontal shared `date-badge` start/due dates on the right. Date-only values use `dateMode="calendar"`. Scoped global fallback styling follows `frontend-date-badge.md` and the sibling asset date badges; no local date component was introduced.
- Breadcrumb labels no longer contain a literal back arrow: the shared breadcrumb supplies it. The shared breadcrumb, navigation, shell, and router outlet remain in use. Nested shell/page/panel padding is reduced. A separate black frame was not reproduced in browser review or identified in the relevant local/shared styles; keyboard focus outlines remain available.
- Schedule phase rows are compact full-row buttons with a chevron, a selected background, `aria-pressed`, and native Enter/Space support. Summary rows remain full-row router links. Shared date badges appear in phase rows and activity due dates; schedule range and phase progress visuals remain on the right.
- Phase selection replaces the dropdown and updates `phaseId` in the URL. Search sits directly beneath the schedule progress bar, with Edit Phase and Remove alongside it. Status and view use Bootstrap 5 pill buttons below search. The count immediately beneath the schedule progress bar is removed; the result total remains in its pagination row.

### New/classic chooser navigation

The new UI uses a dismissible Bootstrap 5 toast only on P1. “Don't show this again” persists `hideUiChoice: true` alongside the active filter in `PROJECT_HOME_FILTER` (key `0`) via `PUT /app/user/preference`. P1 reads that preference before rendering the toast, so dismissal survives reloads and later visits. Closing with × is temporary for the current P1 visit. Saving dismissal does not switch interfaces, reload the board, or redirect; failed saves leave the toast available for retry. The classic Freemarker frame retains its own AngularJS chooser styled with its existing Bootstrap 3 panel/button stack; no Bootstrap 5 runtime is introduced there. Labels are translated in all four new-UI locales and the three existing classic report locale files.

Both implementations call the existing authenticated `PATCH /app/user/preference/ui` with `{ preference: 'report', value: <classic> }`. This patches only one field in `User.uiPreferences`: `true` keeps classic, `false` selects new. Navigation follows only a successful explicit choice. Keeping the current UI dismisses the chooser, request failures keep it available, and duplicate clicks are blocked while saving. There is no automatic mount redirect in either chooser, so chooser initialization cannot create redirect loops.

The backend `ProjectFilter.hideUiChoice` field must be deployed with the P1 dismissal change. New-UI list requests include the flag and wait for preference restoration before the first request: the controller's `@AutoPersistFilter` otherwise replaces the saved preference without retaining the dismissal.

| Context | New browser route | Classic browser route |
| --- | --- | --- |
| Home | `/project/` | `/report/` |
| Project summary | `/project/project/:projectId` | `/report/project/:projectId` |
| Schedule | `/project/schedule/:projectId` | `/report/schedule/:projectId` |
| Report monitoring | `/project/id/:reportId` | `/report/id/:reportId` |
| Report content | `/project/content/:reportId` | `/report/content/:reportId` |
| Conclusion | `/project/conclusion/:projectId` | `/report/conclusion/:projectId` |
| Team | `/project/team/:projectId` | `/report/team/:projectId` |
| Template home/detail | `/project/template`, `/project/template/id/:templateId` | `/report/template`, `/report/template/id/:templateId` |

Classic improve/report maps to monitoring; improve/project, attention, alert, and print map to the project summary; guest and message map to the project's team screen. Unsupported routes fall back to the destination home. New short aliases are normalized to their classic targets. Unknown/invalid ids never become arbitrary destinations. Only known path/id context is carried: the classic schedule does not consume the new `phaseId` query, so unsupported query/filter state is not copied. Both apps use the same origin and backend session, retaining entity context without replacing project ids with report ids.

Source: [new chooser](src/app/project/shared/project-ui-choice.component.ts), [classic chooser](/Users/mauriciofernandesdecastro/workspace/iservport-root/app-plan/src/main/resources/assets/report/project-ui-choice.js), [classic routes](/Users/mauriciofernandesdecastro/workspace/iservport-root/app-plan/src/main/resources/assets/report/ng-report-module.js), [preference endpoint](/Users/mauriciofernandesdecastro/workspace/iservport-root/app-user/src/main/scala/com/iservport/user/controller/UserPreferenceController.scala), and [UiResolver](/Users/mauriciofernandesdecastro/workspace/iservport-root/helianto/src/main/scala/com/iservport/utils/UiResolver.scala).

### Files changed for this review

Current frontend checkout (repository-relative paths):

- `project-registry.md`, `specs/project-registry.md`
- `src/app/app.ts`, `src/app/app.html`, `src/app/i18n/app-i18n.ts`, `src/styles.css`
- `proxy.conf.dev.json`, `proxy.conf.aws.json`
- `src/app/project/board/project-board.component.css`
- `src/app/project/home/project-home.store.ts`, `src/app/project/home/project-home.store.spec.ts`
- `src/app/project/shared/project-shell.component.ts`
- `src/app/project/shared/project-timeline.component.ts`, `src/app/project/shared/project-timeline.component.spec.ts`
- `src/app/project/shared/project-ui-choice.component.ts`, `src/app/project/shared/project-ui-choice.component.spec.ts`
- `src/app/project/schedule/project-schedule-container.component.ts`, `src/app/project/schedule/project-schedule-container.component.html`

Classic checkout at `/Users/mauriciofernandesdecastro/workspace/iservport-root`:

- `app-plan/src/main/resources/assets/report/project-ui-choice.js`
- `app-plan/src/main/resources/templates/frame-bootstrap-project.ftl`
- `app-plan/src/main/resources/assets/report/i18n/report_pt_br.js`, `report_en.js`, `report_de.js`
- `app-plan/src/test/js/project-ui-choice.test.cjs`

Pre-existing edits to frontend `package.json`, `copy-to-static.sh`, `deploy-ui.sh`, and unrelated classic/backend files were preserved. No controllers, route definitions, business records, or message-delivery behavior were changed by this review.

## Validation and scope

- Read repository instructions, `agent.yaml`, the existing specs, and shared frontend routing/base-path/navigation memories before writing this document. Consulted the configured report-domain README references for project/report context; no models or APIs were changed.
- Cross-checked all three route files, every lazy local component target, seven default child declarations, three redirect targets, template route data, auth provider, and global route ordering.
- Searched all `src` router commands, `routerLink` bindings, navigation configuration, plain link destinations, parameter/query readers, and application bootstrap. The tables cover the local definitions found by that search.
- Compared route coverage with the existing [route structure tests](src/app/project/project-routes.spec.ts): they cover the seven detail shell/child shapes and active-home menu filtering, but do not exercise app-level redirects, actual lazy rendering, or external handoffs.
- The original route registry was documentation-only. The subsequent P1 review changes card styling and category badge values; route definitions remain unchanged. [Home store regression tests](src/app/project/home/project-home.store.spec.ts) cover category-id mapping, legacy max selection, zero suppression, independence from totals/board filters/pagination, and exclusion of template home from project stats.
- Current-checkout verification uses its existing dependencies (shared UI `8.8.825`, matching its manifest). `npm test -- --watch=false` passed 35 tests across five files; `node --test app-plan/src/test/js/project-ui-choice.test.cjs` passed 20 classic tests. The classic script also passed `node --check`. `npm run build` passed with the existing initial-bundle warning (about 1.33 MB versus the 500 kB warning threshold, below the 2 MB error threshold). Registry source-link/route checks and whitespace checks passed.
- `sbt 'app_plan / Compile / copyResources'` refreshed classic resources without restarting the backend. Browser review on port 4308 confirmed the new header, dates, compact rows, phase query updates from keyboard selection, status/view pills, phase actions alongside search, and removal of the count under progress. Switching classic schedule 996 → new schedule 996 → classic schedule 996 succeeded, preserving project and entity; the integration check ended with the original classic preference behavior (`report: true`). Only UI-preference writes were made during that check; no business-record writes or message sends were performed.
- Changes are active in the current checkout's development app on port 4308 and in the running classic resource view. They have not been published to production. Broader sibling-module and generic backend entry-point compatibility remains covered by the review gaps above.
