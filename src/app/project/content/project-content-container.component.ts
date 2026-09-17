import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nPipe, CustomPaginationComponent } from '@iservport/iservport-angular-ui';
import { switchMap } from 'rxjs';
import { ProjectWorkspaceStore } from '../shared/project-workspace.store';
import { emptyPage, type ContentLink, type ContentRecord } from '../../api/project/project.model';
@Component({
  selector: 'project-content-container',
  imports: [I18nPipe, FormsModule, CustomPaginationComponent],
  template: `
    @if (store.report(); as report) {
      <main class="project-page">
        <section class="project-panel p-4">
          <h2 class="h5">{{ 'PROJECT_CONTENT' | i18n }}</h2>
          @if (error()) {
            <p class="alert alert-danger" role="alert">{{ error() | i18n }}</p>
          }
          @for (item of contents(); track item.id) {
            <article class="d-flex gap-3 justify-content-between border-bottom py-3">
              <div>
                <a [href]="'/content/id/' + item.contentId"
                  >{{ item.docCode }} · {{ item.docName }}</a
                >
                <p class="text-secondary mb-0">{{ item.docAbstract }}</p>
              </div>
              @if (store.canEdit()) {
                <button
                  class="btn btn-outline-danger btn-sm align-self-start"
                  (click)="remove(item)"
                >
                  {{ 'PROJECT_UNLINK' | i18n }}
                </button>
              }
            </article>
          } @empty {
            <p class="text-secondary">{{ 'PROJECT_NO_CONTENT' | i18n }}</p>
          }
          @if (store.canEdit()) {
            <h3 class="h6 mt-4">{{ 'PROJECT_LINK_CONTENT' | i18n }}</h3>
            <form class="d-flex gap-2" (ngSubmit)="search()">
              <input
                class="form-control"
                name="search"
                [(ngModel)]="query"
                [attr.aria-label]="'PROJECT_SEARCH_CONTENT' | i18n"
                [placeholder]="'PROJECT_SEARCH_CONTENT' | i18n"
              /><button class="btn btn-primary" [disabled]="busy()" type="submit">
                {{ 'PROJECT_SEARCH_ACTION' | i18n }}
              </button>
            </form>
            @for (item of results().content; track item.id) {
              <div
                class="d-flex gap-3 justify-content-between align-items-center border-bottom py-3"
              >
                <span>{{ item.docCode }} · {{ item.docName }}</span
                ><button
                  class="btn btn-outline-primary btn-sm"
                  [disabled]="busy() || linked(item.id)"
                  (click)="attach(item)"
                >
                  {{ (linked(item.id) ? 'PROJECT_LINKED' : 'PROJECT_LINK') | i18n }}
                </button>
              </div>
            }
            <custom-pagination [page]="results()" (change)="search($event)" />
          }
        </section>
      </main>
    }
  `,
})
export class ProjectContentContainerComponent {
  readonly store = inject(ProjectWorkspaceStore);
  readonly contents = signal<ContentLink[]>([]);
  readonly results = signal(emptyPage<ContentRecord>());
  readonly error = signal('');
  readonly busy = signal(false);
  query = '';
  constructor() {
    effect((onCleanup) => {
      const r = this.store.report();
      if (!r) return;
      const sub = this.store.api.contents(r.id).subscribe({
        next: (v) => this.contents.set(v),
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }
  linked(id: number) {
    return this.contents().some((item) => item.contentId === id);
  }
  search(page = 0) {
    this.busy.set(true);
    this.error.set('');
    this.store.api.searchContents(this.query, page).subscribe({
      next: (v) => {
        this.results.set(v);
        this.busy.set(false);
      },
      error: () => this.fail(),
    });
  }
  attach(item: ContentRecord) {
    const r = this.store.report();
    if (!r) return;
    this.busy.set(true);
    this.store.api
      .attachContent(r.id, item.id)
      .pipe(
        switchMap((value) => this.store.api.saveContent(value)),
        switchMap(() => this.store.api.contents(r.id)),
      )
      .subscribe({
        next: (v) => {
          this.contents.set(v);
          this.busy.set(false);
        },
        error: () => this.fail(),
      });
  }
  remove(item: ContentLink) {
    this.busy.set(true);
    this.store.api.removeContent(item.id, item.reportId).subscribe({
      next: (v) => {
        this.contents.set(v);
        this.busy.set(false);
      },
      error: () => this.fail(),
    });
  }
  private fail() {
    this.error.set('PROJECT_SAVE_ERROR');
    this.busy.set(false);
  }
}
