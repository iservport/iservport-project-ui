import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IservportAppShellComponent } from '@iservport/iservport-angular-ui';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, IservportAppShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
