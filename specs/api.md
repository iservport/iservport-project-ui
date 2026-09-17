# Project API contracts

The configured `app-project` backend paths were stale. The implemented module lives in:

- `~/workspace/iservport-root/app-plan/src/main/scala/com/iservport/report/controller/` (no controller README exists; controller annotations are authoritative).
- `~/workspace/iservport-root/app-plan/src/main/scala/com/iservport/report/domain/README.md`.
- `~/workspace/iservport-root/helianto/src/main/scala/com/iservport/report/domain/README.md`.
- `~/workspace/iservport-root/helianto/src/main/scala/com/iservport/custom/controller/` for templates.
- `~/workspace/iservport-root/helianto/src/main/scala/com/iservport/content/controller/ContentTaskController.scala` for activity content.

| Resource         | Endpoint                       | Read/write contract                                                                                  |
| ---------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Project          | `/app/report/project`          | GET `id`; POST `categoryId,nature,templateId`; PUT full entity                                       |
| Project list     | `/app/report/project/filter`   | POST filter and one-based `pageNumber`                                                               |
| Phases           | `/app/report/phase/list`       | GET `projectId,maxPriority`                                                                          |
| Phase            | `/app/report/phase`            | GET `id`; POST `projectId`; PUT full entity (empty response); DELETE `phaseId`                       |
| Activities       | `/app/report/list`             | GET `reportPhaseId`; complete phase list, filtered and paginated locally                             |
| Activity         | `/app/report`                  | GET `id`; PUT full entity; POST `/NATURE_WORKLOAD` with full phase                                   |
| Reviews          | `/app/report/review/list`      | GET `reportId`; POST `/app/report/review?reportId`; PUT full review                                  |
| Team             | `/app/report/team/list`        | GET `projectId`; POST `/app/report/team?folderId&userId`; PUT full member; DELETE `id`               |
| Content links    | `/app/content/task/report`     | GET `reportId`; POST `/app/content/task?reportId` then PUT with `contentId`; DELETE `id,reportId`    |
| Templates        | `/app/custom/template/filter`  | POST filter (`workspace,categoryId,search,priorities`) and one-based `pageNumber`                    |
| Template         | `/app/custom/template`         | GET `id`; POST `categoryId,workspace`; PUT full entity                                               |
| Template content | `/app/custom/template/content` | GET `/list?templateId`; POST `templateId,parentId,templateContentType`; PUT full entity; DELETE `id` |
| Logo             | `/app/custom/template/image`   | multipart POST `file,reportTemplateId`                                                               |

Unlike the default frontend convention, these legacy controllers subtract one from incoming page numbers. The API adapter adds one to the shared paginator's zero-based index, and leaves response `Page.number` unchanged.

Writes preserve the returned entity and its optimistic locking version. Create actions obtain a backend draft before opening its edit form. HTML content is rendered using Angular sanitization; script text is never evaluated.

Statistics: GET `/app/report/stats/category`, `/app/report/stats/project?id=<categoryId>`, and `/app/report/stats/phase?projectId`. Category and project endpoints return generic stats (`id,total,overdue,alert,progress`); progress values are percentages. Phase stats use nested JSON maps (`phaseMap`, `phaseResolutionMap`); the adapter normalizes them to the same model. Template workspace is `TEMPLATE`.
