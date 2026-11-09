import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { DroneService } from '../core/drone.service';
import {
  DRONE_STATUSES,
  DRONE_TYPES,
  DroneStatus,
  DroneStatusSummary,
  DroneSummary,
  DroneType,
  statusClass,
  statusLabel
} from '../core/models';
import { TimeAgoPipe } from '../core/time-ago.pipe';

@Component({
  selector: 'app-drones-list',
  imports: [ReactiveFormsModule, RouterLink, TimeAgoPipe],
  template: `
    <div class="page-head">
      <div>
        <p class="da-eyebrow">Warehouse</p>
        <h1>Our drones</h1>
        @if (summary(); as s) {
          <p class="page-sub">{{ s.total }} {{ s.total === 1 ? 'drone' : 'drones' }} · {{ s.available }} available right now</p>
        }
      </div>
      <a class="da-btn da-btn-accent" routerLink="/drones/new">＋ Add drone</a>
    </div>

    @if (summary(); as s) {
      <div class="summary" aria-label="Drones by status">
        <div class="stat stat-highlight"><strong>{{ s.available }}</strong><span>Available</span></div>
        <div class="stat"><strong>{{ s.inTesting }}</strong><span>In testing</span></div>
        <div class="stat"><strong>{{ s.needsRepair }}</strong><span>Needs repair</span></div>
        <div class="stat"><strong>{{ s.unavailable }}</strong><span>Unavailable</span></div>
      </div>
    }

    <div class="toolbar">
      <div class="search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <label class="da-visually-hidden" for="search">Search drones</label>
        <input id="search" class="da-input" type="search" [formControl]="search" placeholder="Search by code or nickname" autocomplete="off" />
      </div>
      <div class="filters">
        <div class="filter-group" role="group" aria-label="Filter by status">
          <span class="filter-label">Status</span>
          <button type="button" class="da-chip" [attr.aria-pressed]="status() === ''" (click)="setStatus('')">All</button>
          @for (item of statuses; track item.value) {
            <button type="button" class="da-chip" [attr.aria-pressed]="status() === item.value" (click)="setStatus(item.value)">
              {{ item.label }}
            </button>
          }
        </div>
        <div class="filter-group" role="group" aria-label="Filter by type">
          <span class="filter-label">Type</span>
          <button type="button" class="da-chip" [attr.aria-pressed]="type() === ''" (click)="setType('')">All</button>
          @for (item of types; track item) {
            <button type="button" class="da-chip" [attr.aria-pressed]="type() === item" (click)="setType(item)">{{ item }}</button>
          }
        </div>
        @if (hasFilters()) {
          <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="clear()">Clear filters</button>
        }
      </div>
    </div>

    @if (error()) {
      <p class="da-error" role="alert">{{ error() }}</p>
    }

    @if (loading() && !drones().length) {
      <p class="da-hint">Loading drones…</p>
    } @else if (!drones().length && !error()) {
      <div class="da-empty">
        @if (hasFilters()) {
          <h3>No drones match</h3>
          <p>Try a different search or clear the filters.</p>
          <button type="button" class="da-btn da-btn-secondary" (click)="clear()">Clear filters</button>
        } @else {
          <h3>No drones yet</h3>
          <p>Add your first drone to start tracking its parts, issues and test flights.</p>
          <a class="da-btn da-btn-accent" routerLink="/drones/new">＋ Add drone</a>
        }
      </div>
    } @else {
      <div class="drones" [class.is-loading]="loading()">
        @for (drone of drones(); track drone.id) {
          <a class="da-card da-card-interactive drone" [routerLink]="['/drones', drone.id]">
            <div class="drone-top">
              <div>
                <div class="drone-code">{{ drone.code }}</div>
                <h3>{{ drone.nickname }}</h3>
              </div>
              <div class="dtype" [title]="drone.type" aria-hidden="true">{{ drone.type[0] }}</div>
            </div>
            <span class="da-status" [class]="'da-status ' + statusClass(drone.status)">{{ statusLabel(drone.status) }}</span>
            <div class="drone-meta">
              <span class="da-pill">{{ drone.type }}</span>
              <span class="da-pill">{{ drone.componentCount }} components</span>
              @if (drone.openIssueCount) {
                <span class="da-pill pill-warn">⚠ {{ drone.openIssueCount }} open {{ drone.openIssueCount === 1 ? 'issue' : 'issues' }}</span>
              }
            </div>
            <div class="drone-foot">
              <span>Updated {{ drone.updatedAtUtc | timeAgo }}</span>
              <span>{{ drone.videoCount ? '🎬 ' + drone.videoCount + (drone.videoCount === 1 ? ' video' : ' videos') : 'No videos' }}</span>
            </div>
          </a>
        }
      </div>
    }
  `
})
export class DronesListComponent {
  private readonly service = inject(DroneService);

  readonly statuses = DRONE_STATUSES;
  readonly types = DRONE_TYPES;
  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;

  readonly search = new FormControl('', { nonNullable: true });
  readonly status = signal<DroneStatus | ''>('');
  readonly type = signal<DroneType | ''>('');
  readonly drones = signal<DroneSummary[]>([]);
  readonly summary = signal<DroneStatusSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  private readonly reload$ = new Subject<void>();

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.reload$
      .pipe(
        startWith(undefined),
        tap(() => this.loading.set(true)),
        switchMap(() =>
          this.service
            .list({ search: this.search.value, status: this.status(), type: this.type() })
            .pipe(
              catchError(() => {
                this.error.set('We could not load the drones. Check that the API is running and try again.');
                return of(null);
              })
            )
        ),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((drones) => {
        if (drones) {
          this.error.set('');
          this.drones.set(drones);
        }
        this.loading.set(false);
      });

    this.search.valueChanges.pipe(debounceTime(250), takeUntilDestroyed(destroyRef)).subscribe(() => this.reload$.next());
    this.service.summary().subscribe({ next: (summary) => this.summary.set(summary), error: () => undefined });
  }

  hasFilters(): boolean {
    return !!(this.search.value.trim() || this.status() || this.type());
  }

  setStatus(value: DroneStatus | ''): void {
    this.status.set(value);
    this.reload$.next();
  }

  setType(value: DroneType | ''): void {
    this.type.set(value);
    this.reload$.next();
  }

  clear(): void {
    this.search.setValue('', { emitEvent: false });
    this.status.set('');
    this.type.set('');
    this.reload$.next();
  }
}
