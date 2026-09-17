import { Component, effect, inject, signal } from '@angular/core';
import { ProjectMessagesComponent } from './project-messages.component';
import { FormsModule } from '@angular/forms';
import { I18nPipe } from '@iservport/iservport-angular-ui';
import { ProjectWorkspaceStore } from '../shared/project-workspace.store';
import { ProjectEditorComponent, type EditorField } from '../shared/project-editor.component';
import type { Entity, TeamMember, UserOption } from '../../api/project/project.model';
@Component({
  selector: 'project-team-container',
  imports: [I18nPipe, FormsModule, ProjectEditorComponent, ProjectMessagesComponent],
  template: `
    @if (store.project(); as project) {
      <main class="project-page">
        <section class="project-panel p-4">
          <div class="d-flex justify-content-between">
            <h2 class="h5">{{ 'PROJECT_TEAM' | i18n }}</h2>
          </div>
          @if (error()) {
            <p class="alert alert-danger mt-3" role="alert">{{ error() | i18n }}</p>
          }
          @for (member of members(); track member.id) {
            <article
              class="d-flex justify-content-between align-items-center gap-3 border-bottom py-3"
            >
              <div>
                <strong>{{ member.displayName }}</strong>
                <div class="text-secondary small">
                  {{ 'PROJECT_ROLE_' + member.staffRole | i18n }} ·
                  {{ 'PROJECT_GRADE_' + member.staffGrade | i18n }}
                </div>
              </div>
              @if (store.canEdit()) {
                <div class="d-flex gap-2">
                  <button class="btn btn-outline-secondary btn-sm" (click)="edit(member)">
                    {{ 'PROJECT_EDIT' | i18n }}</button
                  ><button
                    class="btn btn-outline-danger btn-sm"
                    [disabled]="busy()"
                    (click)="remove(member)"
                  >
                    {{ 'PROJECT_REMOVE' | i18n }}
                  </button>
                </div>
              }
            </article>
          } @empty {
            <p class="text-secondary mt-3">{{ 'PROJECT_NO_MEMBERS' | i18n }}</p>
          }
          @if (store.canEdit()) {
            <h3 class="h6 mt-4">{{ 'PROJECT_ADD_MEMBER' | i18n }}</h3>
            <form class="d-flex gap-2" (ngSubmit)="search()">
              <input
                class="form-control"
                name="query"
                [(ngModel)]="query"
                [attr.aria-label]="'PROJECT_SEARCH_PEOPLE' | i18n"
                [placeholder]="'PROJECT_SEARCH_PEOPLE' | i18n"
              /><button class="btn btn-primary" type="submit" [disabled]="busy() || !query.trim()">
                {{ 'PROJECT_SEARCH_ACTION' | i18n }}
              </button>
            </form>
            @for (user of users(); track user.id) {
              <div class="d-flex align-items-center justify-content-between border-bottom py-3">
                <span>{{ user.displayName }}</span
                ><button
                  class="btn btn-outline-primary btn-sm"
                  [disabled]="busy()"
                  (click)="add(user)"
                >
                  {{ 'PROJECT_ADD' | i18n }}
                </button>
              </div>
            }
          }
        </section>
        <project-messages [members]="members()" />
      </main>
    }
    @if (editor(); as value) {
      <project-editor
        [value]="value"
        [fields]="fields"
        [busy]="busy()"
        [error]="saveError()"
        (save)="save($event)"
        (cancel)="editor.set(null)"
      />
    }
  `,
})
export class ProjectTeamContainerComponent {
  readonly store = inject(ProjectWorkspaceStore);
  readonly members = signal<TeamMember[]>([]);
  readonly users = signal<UserOption[]>([]);
  readonly editor = signal<Entity | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly saveError = signal('');
  query = '';
  readonly fields: EditorField[] = [
    {
      key: 'staffRole',
      label: 'PROJECT_ROLE',
      type: 'select',
      options: ['OWNER', 'LEADER', 'TEAM', 'OBSERVER', 'OTHER'].map((value) => ({
        value,
        label: 'PROJECT_ROLE_' + value,
      })),
    },
    {
      key: 'staffGrade',
      label: 'PROJECT_GRADE',
      type: 'select',
      options: ['STARTER', 'BASIC', 'MEDIUM', 'FULL', 'ADVANCED', 'COMPLEX'].map((value) => ({
        value,
        label: 'PROJECT_GRADE_' + value,
      })),
    },
    { key: 'workflowLevel', label: 'PROJECT_WORKFLOW_LEVEL', type: 'number', min: 0 },
  ];
  constructor() {
    effect((onCleanup) => {
      const p = this.store.project();
      if (!p) return;
      const sub = this.store.api.team(p.id).subscribe({
        next: (v) => this.members.set(v),
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }
  load() {
    const p = this.store.project();
    if (p)
      this.store.api
        .team(p.id)
        .subscribe({ next: (v) => this.members.set(v), error: () => this.fail() });
  }
  search() {
    const p = this.store.project();
    if (!p) return;
    this.busy.set(true);
    this.store.api
      .searchUsers(
        p.categoryId,
        this.query,
        this.members().map((m) => m.userId),
      )
      .subscribe({
        next: (v) => {
          this.users.set(v);
          this.busy.set(false);
        },
        error: () => this.fail(),
      });
  }
  add(user: UserOption) {
    const p = this.store.project();
    if (!p) return;
    this.busy.set(true);
    this.store.api.addMember(p.id, user.id).subscribe({
      next: () => {
        this.users.update((items) => items.filter((u) => u.id !== user.id));
        this.busy.set(false);
        this.load();
      },
      error: () => this.fail(),
    });
  }
  edit(member: TeamMember) {
    this.store.api.member(member.id).subscribe({
      next: (v) => {
        this.saveError.set('');
        this.editor.set(v);
      },
      error: () => this.fail(),
    });
  }
  save(value: Entity) {
    this.busy.set(true);
    this.store.api.saveMember(value as TeamMember).subscribe({
      next: () => {
        this.editor.set(null);
        this.busy.set(false);
        this.load();
      },
      error: () => {
        this.saveError.set('PROJECT_SAVE_ERROR');
        this.busy.set(false);
      },
    });
  }
  remove(member: TeamMember) {
    this.busy.set(true);
    this.store.api.removeMember(member.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: () => this.fail(),
    });
  }
  private fail() {
    this.error.set('PROJECT_SAVE_ERROR');
    this.busy.set(false);
  }
}
