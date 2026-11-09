import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { I18nService } from '../i18n/i18n.service';
import { LanguageSwitcherComponent } from '../i18n/language-switcher.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, LanguageSwitcherComponent],
  template: `
    <div class="login">
      <div class="login-hero">
        <img src="brand/droneaid-logo-circle.png" [alt]="i18n.t('login.logoAlt')" width="80" height="80" />
        <h1>{{ i18n.t('login.heroTitle1') }} <span>{{ i18n.t('login.heroTitle2') }}</span></h1>
        <p>{{ i18n.t('login.heroText') }}</p>
      </div>
      <div class="login-panel">
        <div class="login-lang"><app-language-switcher /></div>
        <form class="da-card login-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <p class="da-eyebrow">{{ i18n.t('login.eyebrow') }}</p>
          <h2>{{ i18n.t('login.title') }}</h2>
          <p class="da-hint">{{ i18n.t('login.hint') }}</p>

          <div class="da-field">
            <label for="userName">{{ i18n.t('login.username') }}</label>
            <input
              id="userName"
              class="da-input"
              formControlName="userName"
              autocomplete="username"
              [placeholder]="i18n.t('login.usernamePlaceholder')"
              [attr.aria-invalid]="showError('userName')"
            />
            @if (showError('userName')) {
              <span class="da-error">{{ i18n.t('login.usernameError') }}</span>
            }
          </div>
          <div class="da-field">
            <label for="password">{{ i18n.t('login.password') }}</label>
            <input
              id="password"
              class="da-input"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              [placeholder]="i18n.t('login.passwordPlaceholder')"
              [attr.aria-invalid]="showError('password')"
            />
            @if (showError('password')) {
              <span class="da-error">{{ i18n.t('login.passwordError') }}</span>
            }
          </div>

          @if (error()) {
            <p class="da-error" role="alert">{{ error() }}</p>
          }
          <button class="da-btn da-btn-accent login-submit" type="submit" [disabled]="submitting()">
            {{ submitting() ? i18n.t('login.submitting') : i18n.t('login.submit') }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly form = inject(FormBuilder).nonNullable.group({
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', Validators.required]
  });
  readonly submitting = signal(false);
  readonly error = signal('');

  showError(name: 'userName' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    const { userName, password } = this.form.getRawValue();
    this.auth.login(userName, password).subscribe({
      next: () => void this.router.navigateByUrl('/drones'),
      error: (error: unknown) => {
        this.error.set(this.i18n.error(error, 'login.failed'));
        this.submitting.set(false);
      }
    });
  }
}
