import { A11yModule } from '@angular/cdk/a11y';
import { Component, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nPipe, CustomFroalaComponent } from '@iservport/iservport-angular-ui';
import type { Entity } from '../../api/project/project.model';
export interface EditorField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'richtext' | 'select';
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string | number; label: string; literal?: boolean }[];
}
@Component({
  selector: 'project-editor',
  imports: [FormsModule, I18nPipe, CustomFroalaComponent, A11yModule],
  template: ` <div class="modal-backdrop show"></div>
    <div
      class="modal d-block"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-editor-title"
      (keydown.escape)="!busy() && cancel.emit()"
    >
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <form class="modal-content" #form="ngForm" (ngSubmit)="form.valid && save.emit(draft)">
          <div class="modal-header">
            <h2 class="modal-title fs-5" id="project-editor-title">{{ title() | i18n }}</h2>
            <button
              type="button"
              class="btn-close"
              [attr.aria-label]="'PROJECT_CLOSE' | i18n"
              [disabled]="busy()"
              (click)="cancel.emit()"
            ></button>
          </div>
          <div class="modal-body">
            @if (error()) {
              <div class="alert alert-danger" role="alert">{{ error() | i18n }}</div>
            }
            @for (field of fields(); track field.key) {
              <div class="mb-3">
                <label class="form-label" [for]="'edit-' + field.key">{{
                  field.label | i18n
                }}</label>
                @switch (field.type) {
                  @case ('richtext') {
                    <custom-froala
                      [id]="'edit-' + field.key"
                      assetBaseUrl="/project/froala"
                      [target]="text(field.key)"
                      (targetChange)="draft[field.key] = $event"
                      [disabled]="busy()"
                    />
                  }
                  @case ('textarea') {
                    <textarea
                      class="form-control"
                      rows="6"
                      [id]="'edit-' + field.key"
                      [name]="field.key"
                      [(ngModel)]="draft[field.key]"
                      [required]="!!field.required"
                    ></textarea>
                  }
                  @case ('select') {
                    <select
                      class="form-select"
                      [id]="'edit-' + field.key"
                      [name]="field.key"
                      [(ngModel)]="draft[field.key]"
                      [required]="!!field.required"
                    >
                      @for (option of field.options; track option.value) {
                        <option [ngValue]="option.value">
                          {{ option.literal ? option.label : (option.label | i18n) }}
                        </option>
                      }
                    </select>
                  }
                  @default {
                    <input
                      class="form-control"
                      [id]="'edit-' + field.key"
                      [name]="field.key"
                      [type]="field.type || 'text'"
                      [(ngModel)]="draft[field.key]"
                      [required]="!!field.required"
                      [min]="field.min ?? null"
                      [max]="field.max ?? null"
                    />
                  }
                }
              </div>
            }
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              [disabled]="busy()"
              (click)="cancel.emit()"
            >
              {{ 'PROJECT_CANCEL' | i18n }}</button
            ><button class="btn btn-primary" type="submit" [disabled]="busy() || !form.valid">
              {{ (busy() ? 'PROJECT_SAVING' : 'PROJECT_SAVE') | i18n }}
            </button>
          </div>
        </form>
      </div>
    </div>`,
})
export class ProjectEditorComponent implements OnInit {
  readonly value = input.required<Entity>();
  readonly fields = input.required<EditorField[]>();
  readonly title = input('PROJECT_EDIT');
  readonly busy = input(false);
  readonly error = input('');
  readonly save = output<Entity>();
  readonly cancel = output<void>();
  draft: Entity = { id: 0 };
  text(key: string) {
    return String(this.draft[key] ?? '');
  }
  ngOnInit() {
    this.draft = { ...this.value() };
    for (const field of this.fields()) {
      const value = this.draft[field.key];
      if (field.type === 'date' && value) {
        const date = new Date(value as string | number);
        this.draft[field.key] = Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
      }
    }
  }
}
