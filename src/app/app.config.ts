import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { LANG, xRequestedWithInterceptor } from '@iservport/iservport-angular-ui';
import { routes } from './app.routes';
import { APP_I18N } from './i18n/app-i18n';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      withInterceptors([xRequestedWithInterceptor]),
    ),
    { provide: LANG, useValue: APP_I18N },
    provideRouter(routes, withComponentInputBinding()),
  ],
};
