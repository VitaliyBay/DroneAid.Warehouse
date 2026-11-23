import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { DroneService } from '../core/drone.service';
import {
  DRONE_STATUSES,
  DRONE_TYPES,
  DroneStatus,
  DroneStatusSummary,
  DroneSummary,
  DroneType,
  statusClass
} from '../core/models';
import { extractDroneCode } from '../core/scan-code';
import { I18nService } from '../i18n/i18n.service';
import { CodeScannerComponent } from '../shared/code-scanner.component';

@Component({
  selector: 'app-drones-list',
  imports: [ReactiveFormsModule, RouterLink, CodeScannerComponent],
  template: `
    <div class="page-head">
      <div>
        <p class="da-eyebrow">{{ i18n.t('list.eyebrow') }}</p>
        <h1>{{ i18n.t('list.title') }}</h1>
        @if (summary(); as s) {
          <p class="page-sub">{{ i18n.plural('list.count', s.total) }} · {{ i18n.t('list.availableNow', { n: s.available }) }}</p>
        }
      </div>
      <a class="da-btn da-btn-accent" routerLink="/drones/new">＋ {{ i18n.t('list.add') }}</a>
    </div>

    @if (summary(); as s) {
      <div class="summary" [attr.aria-label]="i18n.t('list.summaryLabel')">
        <div class="stat stat-highlight"><strong>{{ s.available }}</strong><span>{{ i18n.t('status.Available') }}</span></div>
        <div class="stat"><strong>{{ s.inTesting }}</strong><span>{{ i18n.t('status.InTesting') }}</span></div>
        <div class="stat"><strong>{{ s.needsRepair }}</strong><span>{{ i18n.t('status.NeedsRepair') }}</span></div>
        <div class="stat"><strong>{{ s.unavailable }}</strong><span>{{ i18n.t('status.Unavailable') }}</span></div>
      </div>
    }

    <div class="toolbar">
      <div class="search-row">
      <div class="search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <label class="da-visually-hidden" for="search">{{ i18n.t('list.searchLabel') }}</label>
        <input id="search" class="da-input" type="search" [formControl]="search" [placeholder]="i18n.t('list.searchPlaceholder')" autocomplete="off" />
      </div>
      <button type="button" class="da-btn da-btn-secondary scan-btn" (click)="scanning.set(true)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
          <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
        </svg>
        {{ i18n.t('scan.button') }}
      </button>
      </div>
      <div class="filters">
        <div class="filter-group" role="group" [attr.aria-label]="i18n.t('list.filterStatus')">
          <span class="filter-label">{{ i18n.t('list.filterStatus') }}</span>
          <button type="button" class="da-chip" [attr.aria-pressed]="status() === ''" (click)="setStatus('')">{{ i18n.t('list.filterAll') }}</button>
          @for (item of statuses; track item.value) {
            <button type="button" class="da-chip" [attr.aria-pressed]="status() === item.value" (click)="setStatus(item.value)">
              {{ statusText(item.value) }}
            </button>
          }
        </div>
        <div class="filter-group" role="group" [attr.aria-label]="i18n.t('list.filterType')">
          <span class="filter-label">{{ i18n.t('list.filterType') }}</span>
          <button type="button" class="da-chip" [attr.aria-pressed]="type() === ''" (click)="setType('')">{{ i18n.t('list.filterAll') }}</button>
          @for (item of types; track item) {
            <button type="button" class="da-chip" [attr.aria-pressed]="type() === item" (click)="setType(item)">{{ typeText(item) }}</button>
          }
        </div>
        @if (hasFilters()) {
          <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="clear()">{{ i18n.t('list.clearFilters') }}</button>
        }
      </div>
    </div>

    @if (scanning()) {
      <app-code-scanner (scanned)="onScanned($event)" (closed)="scanning.set(false)" />
    }

    @if (scanNotice(); as notice) {
      <div class="scan-notice" role="status">
        <span [class.da-error]="notice.kind !== 'looking'">{{ notice.text }}</span>
        @if (notice.kind === 'notFound') {
          <a class="da-btn da-btn-accent da-btn-small" routerLink="/drones/new" [queryParams]="{ code: notice.code }">＋ {{ i18n.t('scan.addWithCode') }}</a>
        }
        <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="scanNotice.set(null)">{{ i18n.t('scan.close') }}</button>
      </div>
    }

    @if (error()) {
      <p class="da-error" role="alert">{{ i18n.t('list.loadError') }}</p>
    }

    @if (loading() && !drones().length) {
      <p class="da-hint">{{ i18n.t('list.loading') }}</p>
    } @else if (!drones().length && !error()) {
      <div class="da-empty">
        @if (hasFilters()) {
          <h3>{{ i18n.t('list.noMatchTitle') }}</h3>
          <p>{{ i18n.t('list.noMatchText') }}</p>
          <button type="button" class="da-btn da-btn-secondary" (click)="clear()">{{ i18n.t('list.clearFilters') }}</button>
        } @else {
          <h3>{{ i18n.t('list.emptyTitle') }}</h3>
          <p>{{ i18n.t('list.emptyText') }}</p>
          <a class="da-btn da-btn-accent" routerLink="/drones/new">＋ {{ i18n.t('list.add') }}</a>
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
              <div class="dtype" [title]="typeText(drone.type)" aria-hidden="true">{{ typeText(drone.type)[0] }}</div>
            </div>
            <span class="da-status" [class]="'da-status ' + statusClass(drone.status)">{{ statusText(drone.status) }}</span>
            <div class="drone-meta">
              <span class="da-pill">{{ typeText(drone.type) }}</span>
              <span class="da-pill">{{ i18n.plural('card.components', drone.componentCount) }}</span>
              @if (drone.openIssueCount) {
                <span class="da-pill pill-warn">⚠ {{ i18n.plural('card.issues', drone.openIssueCount) }}</span>
              }
            </div>
            <div class="drone-foot">
              <span>{{ i18n.t('card.updated', { when: i18n.timeAgo(drone.updatedAtUtc) }) }}</span>
              <span>{{ drone.videoCount ? '🎬 ' + i18n.plural('card.videos', drone.videoCount) : i18n.t('card.noVideos') }}</span>
            </div>
          </a>
        }
      </div>
    }
  `
})
export class DronesListComponent {
  private readonly service = inject(DroneService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly statuses = DRONE_STATUSES;
  readonly types = DRONE_TYPES;
  readonly statusClass = statusClass;

  readonly search = new FormControl('', { nonNullable: true });
  readonly status = signal<DroneStatus | ''>('');
  readonly type = signal<DroneType | ''>('');
  readonly drones = signal<DroneSummary[]>([]);
  readonly summary = signal<DroneStatusSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly scanning = signal(false);
  readonly scanNotice = signal<{ kind: 'looking' | 'notFound' | 'error'; text: string; code: string } | null>(null);

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
                this.error.set(true);
                return of(null);
              })
            )
        ),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((drones) => {
        if (drones) {
          this.error.set(false);
          this.drones.set(drones);
        }
        this.loading.set(false);
      });

    this.search.valueChanges.pipe(debounceTime(250), takeUntilDestroyed(destroyRef)).subscribe(() => this.reload$.next());
    this.service.summary().subscribe({ next: (summary) => this.summary.set(summary), error: () => undefined });
  }

  statusText(status: DroneStatus): string {
    return this.i18n.t(`status.${status}`);
  }

  typeText(type: DroneType): string {
    return this.i18n.t(`type.${type}`);
  }

  /** Opens the drone whose code was scanned; offers to add it when the code is unknown. */
  onScanned(raw: string): void {
    this.scanning.set(false);
    const code = extractDroneCode(raw);
    if (!code) {
      this.scanNotice.set({ kind: 'error', text: this.i18n.t('scan.unreadable'), code: '' });
      return;
    }
    this.scanNotice.set({ kind: 'looking', text: this.i18n.t('scan.looking', { code }), code });
    this.service.getByCode(code).subscribe({
      next: (drone) => void this.router.navigate(['/drones', drone.id]),
      error: (error: { status?: number }) =>
        this.scanNotice.set(
          error?.status === 404
            ? { kind: 'notFound', text: this.i18n.t('scan.notFound', { code }), code }
            : { kind: 'error', text: this.i18n.t('scan.lookupFailed'), code }
        )
    });
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
