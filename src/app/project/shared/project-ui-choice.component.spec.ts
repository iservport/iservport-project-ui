import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Pipe, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

vi.mock('@iservport/iservport-angular-ui', () => ({ I18nPipe: class I18nPipe {} }));
import { classicProjectUrl, ProjectUiChoiceComponent } from './project-ui-choice.component';
import { ProjectHomeStore } from '../home/project-home.store';

@Pipe({ name: 'i18n' })
class TestI18nPipe {
  transform(key: string) { return key; }
}

describe('Project UI switching', () => {
  it.each([
    ['/', '/report/'],
    ['/project/203', '/report/project/203'],
    ['/schedule/203?phaseId=141', '/report/schedule/203'],
    ['/id/4475', '/report/id/4475'],
    ['/content/4475', '/report/content/4475'],
    ['/conclusion/203', '/report/conclusion/203'],
    ['/team/203', '/report/team/203'],
    ['/template', '/report/template'],
    ['/template/id/6', '/report/template/id/6'],
    ['/light/203', '/report/schedule/203'],
    ['/report/4475', '/report/id/4475'],
    ['/203', '/report/project/203'],
    ['/project/not-an-id', '/report/'],
    ['//other.example/path', '/report/'],
    ['/unknown', '/report/'],
  ])('maps %s to the classic screen %s', (path, destination) => {
    expect(classicProjectUrl(path)).toBe(destination);
  });

  function setup(url = '/schedule/203?phaseId=141') {
    const assign = vi.fn();
    const save = new Subject<unknown>();
    const store = {
      uiChoiceReady: signal(true),
      filter: signal({ hideUiChoice: false }),
      hideUiChoice: vi.fn(() => save),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: Router, useValue: { url } },
        { provide: ProjectHomeStore, useValue: store },
        { provide: DOCUMENT, useValue: { defaultView: { location: { assign } } } },
      ],
    });
    const choice = TestBed.runInInjectionContext(() => new ProjectUiChoiceComponent());
    return { choice, assign, store, save, http: TestBed.inject(HttpTestingController) };
  }

  it('saves only the report preference and navigates only after success', () => {
    const { choice, assign, http } = setup();
    choice.choose(true);
    choice.choose(true);
    expect(assign).not.toHaveBeenCalled();
    const req = http.expectOne('/app/user/preference/ui');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ preference: 'report', value: true });
    req.flush({ report: true, otherModule: false });
    expect(assign).toHaveBeenCalledExactlyOnceWith('/report/schedule/203');
    http.verify();
  });

  it('stays on the current screen when keeping the new UI, without an automatic redirect', () => {
    const { choice, assign, http } = setup();
    choice.choose(false);
    const req = http.expectOne('/app/user/preference/ui');
    expect(req.request.body).toEqual({ preference: 'report', value: false });
    req.flush({ report: false });
    expect(assign).not.toHaveBeenCalled();
    expect(choice.visible()).toBe(false);
    http.verify();
  });

  it('keeps the chooser available when switching fails', () => {
    const { choice, assign, http } = setup('/');
    choice.choose(true);
    http.expectOne('/app/user/preference/ui').flush('failed', { status: 500, statusText: 'Failure' });
    expect(choice.error()).toBe(true);
    expect(choice.visible()).toBe(true);
    expect(choice.busy()).toBe(false);
    expect(assign).not.toHaveBeenCalled();
    http.verify();
  });

  it('saves permanent dismissal once without switching UI or navigating', () => {
    const { choice, store, save, assign, http } = setup('/');
    choice.hideForever();
    choice.hideForever();
    expect(store.hideUiChoice).toHaveBeenCalledOnce();
    expect(choice.visible()).toBe(true);
    expect(choice.busy()).toBe(true);
    save.next({});
    save.complete();
    expect(choice.visible()).toBe(false);
    expect(choice.busy()).toBe(false);
    expect(assign).not.toHaveBeenCalled();
    http.expectNone('/app/user/preference/ui');
    http.verify();
  });

  it('allows retry after a dismissal save fails', () => {
    const { choice, store, save } = setup('/');
    choice.hideForever();
    save.error(new Error('Save failed'));
    expect(choice.visible()).toBe(true);
    expect(choice.busy()).toBe(false);
    expect(choice.error()).toBe(true);
    store.hideUiChoice.mockReturnValue(new Subject());
    choice.hideForever();
    expect(choice.error()).toBe(false);
    expect(store.hideUiChoice).toHaveBeenCalledTimes(2);
  });

  function renderChoice() {
    const store = {
      uiChoiceReady: signal(false),
      filter: signal({ hideUiChoice: false }),
      hideUiChoice: vi.fn(() => new Subject()),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: Router, useValue: { url: '/' } },
        { provide: ProjectHomeStore, useValue: store },
      ],
    });
    TestBed.overrideComponent(ProjectUiChoiceComponent, { set: { imports: [TestI18nPipe] } });
    const fixture = TestBed.createComponent(ProjectUiChoiceComponent);
    fixture.detectChanges();
    return { fixture, store, element: fixture.nativeElement as HTMLElement };
  }

  it('never renders the chooser while loading or after a saved dismissal is restored', () => {
    const { fixture, store, element } = renderChoice();
    expect(element.querySelector('aside')).toBeNull();
    store.filter.set({ hideUiChoice: true });
    store.uiChoiceReady.set(true);
    fixture.detectChanges();
    expect(element.querySelector('aside')).toBeNull();
  });

  it('offers permanent dismissal, while closing with × makes no preference write', () => {
    const { fixture, store, element } = renderChoice();
    store.uiChoiceReady.set(true);
    fixture.detectChanges();
    expect(element.textContent).toContain('PROJECT_UI_DONT_SHOW_AGAIN');
    element.querySelector<HTMLButtonElement>('.btn-close')!.click();
    fixture.detectChanges();
    expect(element.querySelector('aside')).toBeNull();
    expect(store.hideUiChoice).not.toHaveBeenCalled();
    TestBed.inject(HttpTestingController).verify();
  });
});
