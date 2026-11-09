import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { LoginResponse } from './models';

const STORAGE_KEY = 'droneaid.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly user = signal<LoginResponse | null>(this.restore());

  login(userName: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { userName, password }).pipe(
      tap((user) => {
        this.user.set(user);
        this.save(user);
      })
    );
  }

  logout(): void {
    this.user.set(null);
    this.save(null);
  }

  private restore(): LoginResponse | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }

  private save(user: LoginResponse | null): void {
    try {
      if (user) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage can be unavailable (private mode); the session then lasts until reload.
    }
  }
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.user() ? true : inject(Router).createUrlTree(['/login']);
};
