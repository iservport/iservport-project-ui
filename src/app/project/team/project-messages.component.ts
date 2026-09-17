import { Component, inject, input, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, switchMap } from 'rxjs';
import {
  MessageRepository,
  I18nPipe,
  I18nLookupService,
  CustomFroalaComponent,
  CustomPaginationComponent,
} from '@iservport/iservport-angular-ui';
import { ProjectWorkspaceStore } from '../shared/project-workspace.store';
import {
  emptyPage,
  type Entity,
  type Page,
  type TeamMember,
} from '../../api/project/project.model';
interface Message extends Entity {
  subject: string;
  content: string;
  messageState: string;
}
interface Recipient extends Entity {
  recipientId: number;
  displayName: string;
  email: string;
}
@Component({
  selector: 'project-messages',
  imports: [FormsModule, I18nPipe, CustomFroalaComponent, CustomPaginationComponent],
  template: ` <section class="project-panel p-4 mt-3">
    <div class="d-flex justify-content-between align-items-center">
      <h2 class="h5">{{ 'PROJECT_MESSAGES' | i18n }}</h2>
      @if (store.canEdit()) {
        <button class="btn btn-outline-primary" [disabled]="busy()" (click)="create()">
          {{ 'PROJECT_NEW_MESSAGE' | i18n }}
        </button>
      }
    </div>
    @if (error()) {
      <div role="alert" class="alert alert-danger mt-3">{{ error() | i18n }}</div>
    }
    @if (sent()) {
      <div role="status" class="alert alert-success mt-3">{{ 'PROJECT_MESSAGE_SENT' | i18n }}</div>
    }
    <div class="d-flex gap-2 mt-3">
      <input
        class="form-control"
        [(ngModel)]="search"
        [attr.aria-label]="'PROJECT_SEARCH_MESSAGES' | i18n"
        (keyup.enter)="load()"
      /><button class="btn btn-secondary" (click)="load()">
        {{ 'PROJECT_SEARCH_ACTION' | i18n }}
      </button>
    </div>
    @for (message of page().content; track message.id) {
      <button
        class="btn btn-light d-flex justify-content-between w-100 mt-2 text-start"
        (click)="open(message.id)"
      >
        <span>{{ message.subject || ('PROJECT_NO_SUBJECT' | i18n) }}</span
        ><span class="badge text-bg-secondary">{{
          'PROJECT_MESSAGE_' + message.messageState | i18n
        }}</span>
      </button>
    }
    <custom-pagination [page]="page()" (change)="load($event)" />
    @if (draft; as message) {
      <form class="border-top mt-4 pt-3" (ngSubmit)="save()">
        <div class="d-flex justify-content-between">
          <h3 class="h6">{{ 'PROJECT_MESSAGE' | i18n }}</h3>
          <button
            type="button"
            class="btn-close"
            [attr.aria-label]="'PROJECT_CLOSE' | i18n"
            (click)="draft = null"
          ></button>
        </div>
        <label for="message-subject" class="form-label mt-2">{{ 'PROJECT_SUBJECT' | i18n }}</label
        ><input
          id="message-subject"
          class="form-control"
          name="subject"
          [(ngModel)]="message.subject"
          [disabled]="!store.canEdit() || delivered()"
          required
        />
        <custom-froala
          id="message-content"
          class="d-block mt-3"
          assetBaseUrl="/project/froala"
          [(target)]="message.content"
          [disabled]="busy() || !store.canEdit() || delivered()"
        />
        <h4 class="h6 mt-3">{{ 'PROJECT_RECIPIENTS' | i18n }}</h4>
        @for (recipient of recipients(); track recipient.id) {
          <div class="d-flex align-items-center justify-content-between py-2 border-bottom">
            <span>{{ recipient.displayName }} · {{ recipient.email }}</span>
            @if (store.canEdit() && !delivered()) {
              <button
                type="button"
                class="btn btn-outline-danger btn-sm"
                [disabled]="busy()"
                (click)="removeRecipient(recipient.id)"
              >
                {{ 'PROJECT_REMOVE' | i18n }}
              </button>
            }
          </div>
        }
        @if (store.canEdit() && !delivered()) {
          <div class="d-flex gap-2 mt-3">
            <select
              class="form-select"
              name="recipient"
              [(ngModel)]="recipientId"
              [attr.aria-label]="'PROJECT_RECIPIENTS' | i18n"
            >
              <option [ngValue]="0">{{ 'PROJECT_SELECT_MEMBER' | i18n }}</option>
              @for (member of members(); track member.id) {
                <option [ngValue]="member.identityId">{{ member.displayName }}</option>
              }</select
            ><button
              class="btn btn-outline-primary"
              type="button"
              [disabled]="!recipientId || busy()"
              (click)="addRecipient()"
            >
              {{ 'PROJECT_ADD' | i18n }}
            </button>
          </div>
          <div class="d-flex gap-2 justify-content-end mt-4">
            <button class="btn btn-secondary" type="submit" [disabled]="busy()">
              {{ 'PROJECT_SAVE' | i18n }}</button
            ><button
              class="btn btn-primary"
              type="button"
              [disabled]="busy() || !recipients().length || !message.subject.trim()"
              (click)="send()"
            >
              {{ 'PROJECT_SEND' | i18n }}
            </button>
          </div>
        }
      </form>
    }
  </section>`,
})
export class ProjectMessagesComponent {
  readonly store = inject(ProjectWorkspaceStore);
  private readonly repo = inject(MessageRepository);
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nLookupService);
  readonly members = input<TeamMember[]>([]);
  readonly page = signal<Page<Message>>(emptyPage());
  readonly recipients = signal<Recipient[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly sent = signal(false);
  draft: Message | null = null;
  search = '';
  recipientId = 0;
  constructor() {
    effect((onCleanup) => {
      const p = this.store.project();
      if (!p) return;
      const sub = this.requestPage(p.id, 0).subscribe({
        next: (v) => this.page.set(v),
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }
  private requestPage(sourceId: number, page: number) {
    return this.http.post<Page<Message>>(
      '/app/message/filter',
      {
        workspace: 'PROJECT',
        sourceId,
        search: this.search,
        priorities: { checked: ['0', '1'] },
        messageTypes: { checked: ['EMAIL'] },
      },
      { params: { pageNumber: page + 1 } },
    );
  }
  load(page = 0) {
    const p = this.store.project();
    if (p)
      this.requestPage(p.id, page).subscribe({
        next: (v) => this.page.set(v),
        error: () => this.fail(),
      });
  }
  delivered() {
    return !!this.draft && ['SENT', 'SENDING', 'DELIVERED'].includes(this.draft.messageState);
  }
  create() {
    const p = this.store.project();
    if (!p) return;
    this.busy.set(true);
    this.repo.messagePostRequest('PROJECT', p.id, 'EMAIL', 0).subscribe({
      next: (v: Message) => {
        this.draft = v;
        this.recipients.set([]);
        this.sent.set(false);
        this.busy.set(false);
      },
      error: () => this.fail(),
    });
  }
  open(id: number) {
    this.busy.set(true);
    forkJoin({
      message: this.repo.messageGetRequest(id),
      recipients: this.repo.recipientListRequest(id),
    }).subscribe({
      next: (v) => {
        this.draft = v.message;
        this.recipients.set(v.recipients);
        this.busy.set(false);
      },
      error: () => this.fail(),
    });
  }
  save() {
    if (!this.draft) return;
    this.busy.set(true);
    this.repo.messagePutRequest(this.draft).subscribe({
      next: (v: Message) => {
        this.draft = v;
        this.busy.set(false);
        this.load();
      },
      error: () => this.fail(),
    });
  }
  addRecipient() {
    if (!this.draft || !this.recipientId) return;
    this.busy.set(true);
    const id = this.draft.id;
    this.repo
      .recipientPostRequest(this.draft, this.recipientId)
      .pipe(
        switchMap(() =>
          forkJoin({
            message: this.repo.messageGetRequest(id),
            recipients: this.repo.recipientListRequest(id),
          }),
        ),
      )
      .subscribe({
        next: (v) => {
          this.draft = v.message;
          this.recipients.set(v.recipients);
          this.recipientId = 0;
          this.busy.set(false);
        },
        error: () => this.fail(),
      });
  }
  removeRecipient(id: number) {
    this.busy.set(true);
    this.repo.recipientDeleteRequest(id).subscribe({
      next: (v) => {
        this.recipients.set(v);
        this.busy.set(false);
      },
      error: () => this.fail(),
    });
  }
  send() {
    if (!this.draft || !window.confirm(this.i18n.t('PROJECT_CONFIRM_SEND'))) return;
    this.busy.set(true);
    this.error.set('');
    this.repo
      .messagePutRequest(this.draft)
      .pipe(switchMap((value) => this.http.post('/app/report/mail/message', value)))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.sent.set(true);
          this.draft = null;
          this.load();
        },
        error: () => {
          this.error.set('PROJECT_SEND_ERROR');
          this.busy.set(false);
        },
      });
  }
  private fail() {
    this.error.set('PROJECT_SAVE_ERROR');
    this.busy.set(false);
  }
}
