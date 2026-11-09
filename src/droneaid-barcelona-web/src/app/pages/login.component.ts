import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/models';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="login">
      <div class="login-hero">
        <img src="brand/droneaid-logo-circle.png" alt="DroneAid logo" width="80" height="80" />
        <h1>Know your <span>drones.</span></h1>
        <p>Every drone, its parts, issues and test flights in one friendly place.</p>
      </div>
      <div class="login-panel">
        <form class="da-card login-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <p class="da-eyebrow">Workspace access</p>
          <h2>Welcome back</h2>
          <p class="da-hint">Sign in with your DroneAid account.</p>

          <div class="da-field">
            <label for="userName">Username</label>
            <input
              id="userName"
              class="da-input"
              formControlName="userName"
              autocomplete="username"
              placeholder="Your username"
              [attr.aria-invalid]="showError('userName')"
            />
            @if (showError('userName')) {
              <span class="da-error">Enter your username.</span>
            }
          </div>
          <div class="da-field">
            <label for="password">Password</label>
            <input
              id="password"
              class="da-input"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              placeholder="Your password"
              [attr.aria-invalid]="showError('password')"
            />
            @if (showError('password')) {
              <span class="da-error">Enter your password.</span>
            }
          </div>

          @if (error()) {
            <p class="da-error" role="alert">{{ error() }}</p>
          }
          <button class="da-btn da-btn-accent login-submit" type="submit" [disabled]="submitting()">
            {{ submitting() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

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
        this.error.set(
          errorMessage(error, 'We could not sign you in. Check that the application is available and try again.')
        );
        this.submitting.set(false);
      }
    });
  }
}
