import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    @if (auth.user(); as user) {
      <header class="da-appbar">
        <a class="da-appbar-home" routerLink="/drones" aria-label="DroneAid Barcelona – home">
          <img class="da-appbar-logo" src="brand/droneaid-logo-circle.png" alt="" width="40" height="40" />
          <span class="da-appbar-title">DroneAid<small>Barcelona</small></span>
        </a>
        <span class="da-spacer"></span>
        <span class="da-user">
          <span class="da-user-name">{{ user.userName }}</span>
          <span class="da-avatar" aria-hidden="true">{{ user.userName[0].toUpperCase() }}</span>
          <button type="button" class="da-btn da-btn-ghost da-btn-small da-on-blue" (click)="signOut()">Sign out</button>
        </span>
      </header>
      <main class="da-container da-main"><router-outlet /></main>
    } @else {
      <router-outlet />
    }
  `
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
