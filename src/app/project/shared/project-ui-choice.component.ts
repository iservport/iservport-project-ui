import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { I18nPipe } from '@iservport/iservport-angular-ui';
import { ProjectHomeStore } from '../home/project-home.store';

/** Router URL is relative to the new app's /project/ HTML base. */
export function classicProjectUrl(url: string): string {
  const path = url.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  if (/^\/(project|schedule|id|content|conclusion|team)\/[1-9]\d*$/.test(path) ||
      /^\/template(?:\/id\/[1-9]\d*)?$/.test(path)) return '/report' + path;
  const alias = path.match(/^\/(light|report)\/([1-9]\d*)$/);
  if (alias) return '/report/' + (alias[1] === 'light' ? 'schedule/' : 'id/') + alias[2];
  if (/^\/[1-9]\d*$/.test(path)) return '/report/project' + path;
  return '/report/';
}

@Component({
  selector: 'project-ui-choice',
  imports: [I18nPipe],
  template: `
    @if (visible() && store.uiChoiceReady() && !store.filter().hideUiChoice) {
      <aside class="toast show project-ui-choice" role="status" aria-live="polite" aria-atomic="true">
        <div class="toast-header">
          <strong class="me-auto">{{ 'PROJECT_UI_CHOICE' | i18n }}</strong>
          <button type="button" class="btn-close" [disabled]="busy()"
            [attr.aria-label]="'PROJECT_CLOSE' | i18n" (click)="visible.set(false)"></button>
        </div>
        <div class="toast-body">
          <p class="mb-2">{{ 'PROJECT_UI_CHOICE_DESC' | i18n }}</p>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-primary btn-sm" [disabled]="busy()" (click)="choose(false)">
              {{ 'PROJECT_UI_NEW' | i18n }}
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" [disabled]="busy()" (click)="choose(true)">
              {{ 'PROJECT_UI_CLASSIC' | i18n }}
            </button>
          </div>
          <button type="button" class="btn btn-link btn-sm text-secondary mt-2 p-0"
            [disabled]="busy()" (click)="hideForever()">
            {{ 'PROJECT_UI_DONT_SHOW_AGAIN' | i18n }}
          </button>
          @if (error()) { <p class="text-danger small mt-2 mb-0" role="alert">{{ 'PROJECT_UI_ERROR' | i18n }}</p> }
        </div>
      </aside>
    }
  `,
})
export class ProjectUiChoiceComponent {
  readonly store = inject(ProjectHomeStore);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  readonly visible = signal(true);
  readonly busy = signal(false);
  readonly error = signal(false);
  hideForever() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(false);
    this.store.hideUiChoice().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.visible.set(false);
      },
      error: () => { this.busy.set(false); this.error.set(true); },
    });
  }
  choose(classic: boolean) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(false);
    const destination = classicProjectUrl(this.router.url);
    this.http.patch('/app/user/preference/ui', { preference: 'report', value: classic })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.busy.set(false);
          this.visible.set(false);
          if (classic) this.document.defaultView?.location.assign(destination);
        },
        error: () => { this.busy.set(false); this.error.set(true); },
      });
  }
}
