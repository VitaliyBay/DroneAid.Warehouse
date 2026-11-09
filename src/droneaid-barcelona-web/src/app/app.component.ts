import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { I18nService } from './i18n/i18n.service';
import { LanguageSwitcherComponent } from './i18n/language-switcher.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, LanguageSwitcherComponent],
  template: `
    @if (auth.user(); as user) {
      <header class="da-appbar">
        <a class="da-appbar-home" routerLink="/drones" [attr.aria-label]="i18n.t('app.home')">
          <img class="da-appbar-logo" src="brand/droneaid-logo-circle.png" alt="" width="40" height="40" />
          <span class="da-appbar-title">DroneAid<small>Barcelona</small></span>
        </a>
        <span class="da-spacer"></span>
        <span class="da-user">
          <app-language-switcher />
          <span class="da-user-name">{{ user.userName }}</span>
          <span class="da-avatar" aria-hidden="true">{{ user.userName[0].toUpperCase() }}</span>
          <button type="button" class="da-btn da-btn-ghost da-btn-small da-on-blue" (click)="signOut()">
            {{ i18n.t('app.signOut') }}
          </button>
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
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
