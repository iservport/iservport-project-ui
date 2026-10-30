import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomIdentityAvatarComponent, DateBadgeComponent, I18nPipe } from '@iservport/iservport-angular-ui';
import type { Report } from '../../api/project/project.model';
import { statusLabel } from '../shared/project-fields';

@Component({
  selector: 'project-action-card',
  imports: [RouterLink, CustomIdentityAvatarComponent, DateBadgeComponent, I18nPipe],
  templateUrl: './project-action-card.component.html',
  styleUrl: './project-action-card.component.css',
})
export class ProjectActionCardComponent {
  readonly report = input.required<Report>();
  readonly vertical = input(false);
  readonly canEdit = input(false);
  readonly edit = output<number>();
  readonly statusLabel = statusLabel;
}
