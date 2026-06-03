import { InjectionToken } from '@angular/core';

export const PROJECT_API_ROOT = new InjectionToken<string>('PROJECT_API_ROOT', {
  providedIn: 'root',
  factory: () => '/app/project'
});
