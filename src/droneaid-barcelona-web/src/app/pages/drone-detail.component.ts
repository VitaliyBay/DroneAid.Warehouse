import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { DroneService } from '../core/drone.service';
import { DroneDetail, DroneIssue, DroneVideo, statusClass } from '../core/models';
import { I18nService } from '../i18n/i18n.service';
import {
  ComponentGroup,
  ComponentsEditorComponent,
  readComponents,
  setComponents
} from '../shared/components-editor.component';

const COLLAPSED_COMPONENTS = 7;

@Component({
  selector: 'app-drone-detail',
  imports: [ReactiveFormsModule, RouterLink, ComponentsEditorComponent],
  template: `
    <div class="crumbs"><a routerLink="/drones">← {{ i18n.t('detail.allDrones') }}</a></div>

    @if (drone(); as d) {
      <div class="detail-head">
        <div>
          <div class="head-code">{{ d.code }}</div>
          <h1>{{ d.nickname }}</h1>
          <div class="head-row">
            <span class="da-status" [class]="'da-status ' + statusClass(d.status)">{{ i18n.t('status.' + d.status) }}</span>
            <span class="da-pill head-pill">{{ i18n.t('type.' + d.type) }}</span>
            <span class="da-pill head-pill">{{ i18n.t('card.updated', { when: i18n.timeAgo(d.updatedAtUtc) }) }}</span>
          </div>
        </div>
        <a class="da-btn da-btn-accent" [routerLink]="['/drones', d.id, 'edit']">✎ {{ i18n.t('detail.editDrone') }}</a>
      </div>

      @if (message()) {
        <p class="da-ok" role="status">{{ message() }}</p>
      }
      @if (error()) {
        <p class="da-error" role="alert">{{ error() }}</p>
      }

      <div class="cols">
        <div class="stack">
          <section class="da-card" aria-labelledby="components-title">
            <h2 id="components-title">
              {{ i18n.t('detail.components') }}
              @if (!editingComponents()) {
                <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="startEditComponents(d)">✎ {{ i18n.t('common.edit') }}</button>
              }
            </h2>
            @if (editingComponents()) {
              <app-components-editor [rows]="componentRows" />
              <div class="actions">
                <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="editingComponents.set(false)">{{ i18n.t('common.cancel') }}</button>
                <button type="button" class="da-btn da-btn-small" [disabled]="saving()" (click)="saveComponents(d)">{{ i18n.t('detail.saveComponents') }}</button>
              </div>
            } @else {
              <ul class="comp">
                @for (item of visibleComponents(d); track item.id) {
                  <li>
                    <span class="comp-name">{{ item.name }}</span>
                    @if (item.detail) {
                      <span class="comp-detail">{{ item.detail }}</span>
                    }
                    <span class="comp-qty" [attr.aria-label]="i18n.t('detail.quantity', { n: item.quantity })">{{ item.quantity }}</span>
                  </li>
                } @empty {
                  <li class="da-hint">{{ i18n.t('detail.noComponents') }}</li>
                }
              </ul>
              @if (d.components.length > collapsedCount) {
                <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="showAll.set(!showAll())">
                  {{ showAll() ? i18n.t('detail.showFewer') : i18n.t('detail.showAll', { n: d.components.length }) }}
                </button>
              }
            }
          </section>

          <section class="da-card" aria-labelledby="issues-title">
            <h2 id="issues-title">
              {{ i18n.t('detail.issues') }}
              @if (issueEditor() === null) {
                <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="startIssue(null)">＋ {{ i18n.t('detail.reportIssue') }}</button>
              }
            </h2>

            @if (issueEditor() !== null) {
              <form class="inline-form" [formGroup]="issueForm" (ngSubmit)="saveIssue(d)" novalidate>
                <div class="da-field">
                  <label for="issue-title">{{ i18n.t('detail.issueTitle') }}</label>
                  <input id="issue-title" class="da-input" formControlName="title" [placeholder]="i18n.t('detail.issueTitlePlaceholder')" [attr.aria-invalid]="issueForm.controls.title.invalid && issueForm.controls.title.touched" />
                  @if (issueForm.controls.title.invalid && issueForm.controls.title.touched) {
                    <span class="da-error">{{ i18n.t('detail.issueTitleError') }}</span>
                  }
                </div>
                <div class="da-field">
                  <label for="issue-component">{{ i18n.t('detail.issueComponent') }}</label>
                  <input id="issue-component" class="da-input" formControlName="componentName" list="component-names" />
                  <datalist id="component-names">
                    @for (item of d.components; track item.id) {
                      <option [value]="item.name"></option>
                    }
                  </datalist>
                </div>
                <div class="da-field">
                  <label for="issue-description">{{ i18n.t('detail.issueDetails') }}</label>
                  <textarea id="issue-description" class="da-textarea" rows="3" formControlName="description"></textarea>
                </div>
                @if (issueEditor() !== 'new') {
                  <div class="da-field">
                    <label for="issue-status">{{ i18n.t('detail.issueStatus') }}</label>
                    <select id="issue-status" class="da-select" formControlName="status">
                      <option value="Open">{{ i18n.t('detail.issueOpen') }}</option>
                      <option value="Resolved">{{ i18n.t('detail.issueResolved') }}</option>
                    </select>
                  </div>
                }
                <div class="actions">
                  <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="issueEditor.set(null)">{{ i18n.t('common.cancel') }}</button>
                  <button type="submit" class="da-btn da-btn-small" [disabled]="saving()">{{ i18n.t('detail.saveIssue') }}</button>
                </div>
              </form>
            }

            @for (issue of d.issues; track issue.id) {
              <article class="issue" [class.issue-done]="issue.status === 'Resolved'">
                <div class="issue-top">
                  <span>{{ issue.title }}</span>
                  <span class="da-pill" [class.pill-warn]="issue.status === 'Open'">
                    {{ issue.status === 'Open' ? i18n.t('detail.issueOpen') : i18n.t('detail.issueResolved') }}
                  </span>
                </div>
                @if (issue.description) {
                  <p>{{ issue.description }}</p>
                }
                <p class="issue-meta">{{ issueMeta(issue) }}</p>
                <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="startIssue(issue)">
                  {{ issue.status === 'Open' ? i18n.t('detail.issueEditResolve') : i18n.t('common.edit') }}
                </button>
              </article>
            } @empty {
              @if (issueEditor() === null) {
                <p class="da-hint">{{ i18n.t('detail.noIssues') }}</p>
              }
            }
          </section>
        </div>

        <div class="stack">
          <section class="da-card" aria-labelledby="details-title">
            <h2 id="details-title">{{ i18n.t('detail.details') }}</h2>
            <ul class="facts">
              <li><span>{{ i18n.t('detail.code') }}</span><b>{{ d.code }}</b></li>
              <li><span>{{ i18n.t('detail.nickname') }}</span><b>{{ d.nickname }}</b></li>
              <li><span>{{ i18n.t('detail.type') }}</span><b>{{ i18n.t('type.' + d.type) }}</b></li>
              <li><span>{{ i18n.t('common.status') }}</span><b>{{ i18n.t('status.' + d.status) }}</b></li>
              <li><span>{{ i18n.t('detail.statusSince') }}</span><b>{{ i18n.date(d.statusChangedAtUtc) }}</b></li>
              <li><span>{{ i18n.t('detail.added') }}</span><b>{{ i18n.date(d.createdAtUtc) }}</b></li>
            </ul>
          </section>

          <section class="da-card" aria-labelledby="videos-title">
            <h2 id="videos-title">
              {{ i18n.t('detail.videos') }}
              @if (videoEditor() === null) {
                <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="startVideo(null)">＋ {{ i18n.t('detail.addLink') }}</button>
              }
            </h2>
            <p class="da-hint">{{ i18n.t('detail.videosHint') }}</p>

            @if (videoEditor() !== null) {
              <form class="inline-form" [formGroup]="videoForm" (ngSubmit)="saveVideo(d)" novalidate>
                <div class="da-field">
                  <label for="video-url">{{ i18n.t('detail.videoUrl') }}</label>
                  <input id="video-url" class="da-input" type="url" formControlName="url" placeholder="https://" [attr.aria-invalid]="videoForm.controls.url.invalid && videoForm.controls.url.touched" />
                  @if (videoForm.controls.url.invalid && videoForm.controls.url.touched) {
                    <span class="da-error">{{ i18n.t('detail.videoUrlError') }}</span>
                  }
                </div>
                <div class="da-field">
                  <label for="video-label">{{ i18n.t('detail.videoLabel') }}</label>
                  <input id="video-label" class="da-input" formControlName="label" [placeholder]="i18n.t('detail.videoLabelPlaceholder')" />
                </div>
                <div class="da-field">
                  <label for="video-date">{{ i18n.t('detail.videoDate') }}</label>
                  <input id="video-date" class="da-input" type="date" formControlName="testedOn" />
                </div>
                <div class="actions">
                  @if (videoEditor() !== 'new') {
                    <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="removeVideo(d)">{{ i18n.t('detail.removeLink') }}</button>
                  }
                  <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="videoEditor.set(null)">{{ i18n.t('common.cancel') }}</button>
                  <button type="submit" class="da-btn da-btn-small" [disabled]="saving()">{{ i18n.t('detail.saveLink') }}</button>
                </div>
              </form>
            }

            @for (video of d.videos; track video.id) {
              <div class="video">
                <a class="video-link" [href]="video.url" target="_blank" rel="noopener noreferrer">
                  <span class="play" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                  <span>
                    <b>{{ video.label || i18n.t('detail.videoDefaultLabel') }}</b>
                    <small>{{ host(video.url) }}{{ video.testedOn ? ' · ' + i18n.date(video.testedOn) : '' }}</small>
                  </span>
                </a>
                <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="startVideo(video)" [attr.aria-label]="i18n.t('detail.editVideoAria', { name: video.label || host(video.url) })">{{ i18n.t('common.edit') }}</button>
              </div>
            } @empty {
              @if (videoEditor() === null) {
                <p class="da-hint">{{ i18n.t('detail.noVideos') }}</p>
              }
            }
          </section>
        </div>
      </div>
    } @else if (loadError()) {
      <p class="da-error" role="alert">{{ loadError() }}</p>
    } @else {
      <p class="da-hint">{{ i18n.t('detail.loading') }}</p>
    }
  `
})
export class DroneDetailComponent implements OnInit {
  private readonly service = inject(DroneService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  readonly i18n = inject(I18nService);

  readonly collapsedCount = COLLAPSED_COMPONENTS;
  readonly statusClass = statusClass;

  readonly drone = signal<DroneDetail | null>(null);
  readonly loadError = signal('');
  readonly error = signal('');
  readonly message = signal('');
  readonly saving = signal(false);
  readonly showAll = signal(false);

  readonly editingComponents = signal(false);
  readonly componentRows = new FormArray<ComponentGroup>([]);

  readonly issueEditor = signal<'new' | string | null>(null);
  readonly issueForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    componentName: [''],
    description: [''],
    status: ['Open' as DroneIssue['status']]
  });

  readonly videoEditor = signal<'new' | string | null>(null);
  readonly videoForm = this.formBuilder.nonNullable.group({
    url: ['', [Validators.required, Validators.pattern(/^https:\/\/\S+$/i)]],
    label: [''],
    testedOn: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.get(id).subscribe({
      next: (drone) => this.drone.set(drone),
      error: (error: unknown) => this.loadError.set(this.i18n.error(error, 'detail.loadError'))
    });
  }

  visibleComponents(drone: DroneDetail) {
    return this.showAll() ? drone.components : drone.components.slice(0, COLLAPSED_COMPONENTS);
  }

  host(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  issueMeta(issue: DroneIssue): string {
    const parts: string[] = [];
    if (issue.componentName) {
      parts.push(this.i18n.t('detail.issueComponentLine', { name: issue.componentName }));
    }
    parts.push(this.i18n.t('detail.issueReported', { when: this.i18n.timeAgo(issue.reportedAtUtc) }));
    if (issue.resolvedAtUtc) {
      parts.push(this.i18n.t('detail.issueResolvedWhen', { when: this.i18n.timeAgo(issue.resolvedAtUtc) }));
    }
    return parts.join(' · ');
  }

  // Components
  startEditComponents(drone: DroneDetail): void {
    setComponents(this.componentRows, drone.components);
    this.error.set('');
    this.editingComponents.set(true);
  }

  saveComponents(drone: DroneDetail): void {
    if (this.componentRows.invalid) {
      this.componentRows.markAllAsTouched();
      this.error.set(this.i18n.t('detail.componentsInvalid'));
      return;
    }
    this.persist(
      this.service.replaceComponents(drone.id, readComponents(this.componentRows)),
      'detail.componentsSaved',
      () => this.editingComponents.set(false)
    );
  }

  // Issues
  startIssue(issue: DroneIssue | null): void {
    this.issueForm.reset({
      title: issue?.title ?? '',
      componentName: issue?.componentName ?? '',
      description: issue?.description ?? '',
      status: issue?.status ?? 'Open'
    });
    this.error.set('');
    this.issueEditor.set(issue ? issue.id : 'new');
  }

  saveIssue(drone: DroneDetail): void {
    if (this.issueForm.invalid) {
      this.issueForm.markAllAsTouched();
      return;
    }
    const value = this.issueForm.getRawValue();
    const body = {
      title: value.title.trim(),
      description: value.description.trim() || null,
      componentName: value.componentName.trim() || null,
      status: value.status
    };
    const editor = this.issueEditor();
    const request =
      editor === 'new' || editor === null
        ? this.service.addIssue(drone.id, body)
        : this.service.updateIssue(drone.id, editor, body);
    this.persist(request, 'detail.issueSaved', () => this.issueEditor.set(null));
  }

  // Videos
  startVideo(video: DroneVideo | null): void {
    this.videoForm.reset({ url: video?.url ?? '', label: video?.label ?? '', testedOn: video?.testedOn ?? '' });
    this.error.set('');
    this.videoEditor.set(video ? video.id : 'new');
  }

  saveVideo(drone: DroneDetail): void {
    if (this.videoForm.invalid) {
      this.videoForm.markAllAsTouched();
      return;
    }
    const value = this.videoForm.getRawValue();
    const body = { url: value.url.trim(), label: value.label.trim() || null, testedOn: value.testedOn || null };
    const editor = this.videoEditor();
    const request =
      editor === 'new' || editor === null
        ? this.service.addVideo(drone.id, body)
        : this.service.updateVideo(drone.id, editor, body);
    this.persist(request, 'detail.videoSaved', () => this.videoEditor.set(null));
  }

  removeVideo(drone: DroneDetail): void {
    const editor = this.videoEditor();
    if (!editor || editor === 'new' || !window.confirm(this.i18n.t('detail.removeConfirm'))) {
      return;
    }
    this.persist(this.service.removeVideo(drone.id, editor), 'detail.videoRemoved', () => this.videoEditor.set(null));
  }

  private persist(request: Observable<DroneDetail>, messageKey: string, done: () => void): void {
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    request.subscribe({
      next: (drone) => {
        this.drone.set(drone);
        this.message.set(this.i18n.t(messageKey));
        this.saving.set(false);
        done();
      },
      error: (error: unknown) => {
        this.error.set(this.i18n.error(error, 'detail.saveFailed'));
        this.saving.set(false);
      }
    });
  }
}
