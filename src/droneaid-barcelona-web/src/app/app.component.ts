import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface LoginResponse {
  userName: string;
  role: string;
}

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly loginForm = this.formBuilder.nonNullable.group({
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', [Validators.required]]
  });

  isSubmitting = false;
  errorMessage = '';
  authenticatedUser: LoginResponse | null = null;

  login(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.http.post<LoginResponse>('/api/auth/login', this.loginForm.getRawValue()).subscribe({
      next: (user) => {
        this.authenticatedUser = user;
        this.isSubmitting = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message ??
          'We could not sign you in. Check that the application is available and try again.';
        this.isSubmitting = false;
      }
    });
  }
}
