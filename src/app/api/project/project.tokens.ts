import { InjectionToken } from '@angular/core';
// The new /project/ frontend still uses the existing report backend.
export const PROJECT_API_ROOT = new InjectionToken<string>('PROJECT_API_ROOT', {
  providedIn: 'root',
  factory: () => '/app/report',
});
