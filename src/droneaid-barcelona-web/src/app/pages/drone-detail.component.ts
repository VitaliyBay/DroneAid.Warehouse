import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { DroneService } from '../core/drone.service';
import {
  DroneDetail,
  DroneIssue,
  DroneVideo,
  errorMessage,
  statusClass,
  statusLabel
} from '../core/models';
import { TimeAgoPipe } from '../core/time-ago.pipe';
import {
  ComponentGroup,
  ComponentsEditorComponent,
  readComponents,
  setComponents
} from '../shared/components-editor.component';

const COLLAPSED_COMPONENTS = 7;

@Component({
  selector: 'app-drone-detail',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ComponentsEditorComponent, TimeAgoPipe],
  template: `
    <div class="crumbs"><a routerLink="/drones">← All drones</a></div>

    @if (drone(); as d) {
      <div class="detail-head">
        <div>
          <div class="head-code">{{ d.code }}</div>
          <h1>{{ d.nickname }}</h1>
          <div class="head-row">
            <span class="da-status" [class]="'da-status ' + statusClass(d.status)">{{ statusLabel(d.status) }}</span>
            <span class="da-pill head-pill">{{ d.type }}</span>
            <span class="da-pill head-pill">Updated {{ d.updatedAtUtc | timeAgo }}</span>
          </div>
        </div>
        <a class="da-btn da-btn-accent" [routerLink]="['/drones', d.id, 'edit']">✎ Edit drone</a>
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
              Components
              @if (!editingComponents()) {
                <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="startEditComponents(d)">✎ Edit</button>
              }
            </h2>
            @if (editingComponents()) {
              <app-components-editor [rows]="componentRows" />
              <div class="actions">
                <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="editingComponents.set(false)">Cancel</button>
                <button type="button" class="da-btn da-btn-small" [disabled]="saving()" (click)="saveComponents(d)">Save components</button>
              </div>
            } @else {
              <ul class="comp">
                @for (item of visibleComponents(d); track item.id) {
                  <li>
                    <span class="comp-name">{{ item.name }}</span>
                    @if (item.detail) {
                      <span class="comp-detail">{{ item.detail }}</span>
                    }
                    <span class="comp-qty" [attr.aria-label]="'Quantity ' + item.quantity">{{ item.quantity }}</span>
                  </li>
                } @empty {
                  <li class="da-hint">No components recorded.</li>
                }
              </ul>
              @if (d.components.length > collapsedCount) {
                <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="showAll.set(!showAll())">
                  {{ showAll() ? 'Show fewer' : 'Show all ' + d.components.length + ' components' }}
                </button>
              }
            }
          </section>

          <section class="da-card" aria-labelledby="issues-title">
            <h2 id="issues-title">
              Issues
              @if (issueEditor() === null) {
                <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="startIssue(null)">＋ Report issue</button>
              }
            </h2>

            @if (issueEditor() !== null) {
              <form class="inline-form" [formGroup]="issueForm" (ngSubmit)="saveIssue(d)" novalidate>
                <div class="da-field">
                  <label for="issue-title">Title</label>
                  <input id="issue-title" class="da-input" formControlName="title" placeholder="What is wrong?" [attr.aria-invalid]="issueForm.controls.title.invalid && issueForm.controls.title.touched" />
                  @if (issueForm.controls.title.invalid && issueForm.controls.title.touched) {
                    <span class="da-error">Enter a short title.</span>
                  }
                </div>
                <div class="da-field">
                  <label for="issue-component">Affected component (optional)</label>
                  <input id="issue-component" class="da-input" formControlName="componentName" list="component-names" />
                  <datalist id="component-names">
                    @for (item of d.components; track item.id) {
                      <option [value]="item.name"></option>
                    }
                  </datalist>
                </div>
                <div class="da-field">
                  <label for="issue-description">Details (optional)</label>
                  <textarea id="issue-description" class="da-textarea" rows="3" formControlName="description"></textarea>
                </div>
                @if (issueEditor() !== 'new') {
                  <div class="da-field">
                    <label for="issue-status">Status</label>
                    <select id="issue-status" class="da-select" formControlName="status">
                      <option value="Open">Open</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                }
                <div class="actions">
                  <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="issueEditor.set(null)">Cancel</button>
                  <button type="submit" class="da-btn da-btn-small" [disabled]="saving()">Save issue</button>
                </div>
              </form>
            }

            @for (issue of d.issues; track issue.id) {
              <article class="issue" [class.issue-done]="issue.status === 'Resolved'">
                <div class="issue-top">
                  <span>{{ issue.title }}</span>
                  <span class="da-pill" [class.pill-warn]="issue.status === 'Open'">{{ issue.status }}</span>
                </div>
                @if (issue.description) {
                  <p>{{ issue.description }}</p>
                }
                <p class="issue-meta">
                  @if (issue.componentName) {Component: {{ issue.componentName }} · }
                  Reported {{ issue.reportedAtUtc | timeAgo }}@if (issue.resolvedAtUtc) { · Resolved {{ issue.resolvedAtUtc | timeAgo }}}
                </p>
                <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="startIssue(issue)">
                  {{ issue.status === 'Open' ? 'Edit or resolve' : 'Edit' }}
                </button>
              </article>
            } @empty {
              @if (issueEditor() === null) {
                <p class="da-hint">No issues reported. Nice and clean.</p>
              }
            }
          </section>
        </div>

        <div class="stack">
          <section class="da-card" aria-labelledby="details-title">
            <h2 id="details-title">Details</h2>
            <ul class="facts">
              <li><span>Code</span><b>{{ d.code }}</b></li>
              <li><span>Nickname</span><b>{{ d.nickname }}</b></li>
              <li><span>Type</span><b>{{ d.type }}</b></li>
              <li><span>Status</span><b>{{ statusLabel(d.status) }}</b></li>
              <li><span>Status since</span><b>{{ d.statusChangedAtUtc | date: 'd MMM y' }}</b></li>
              <li><span>Added</span><b>{{ d.createdAtUtc | date: 'd MMM y' }}</b></li>
            </ul>
          </section>

          <section class="da-card" aria-labelledby="videos-title">
            <h2 id="videos-title">
              Flight test videos
              @if (videoEditor() === null) {
                <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="startVideo(null)">＋ Add link</button>
              }
            </h2>
            <p class="da-hint">Links open in your cloud storage (OneDrive or similar).</p>

            @if (videoEditor() !== null) {
              <form class="inline-form" [formGroup]="videoForm" (ngSubmit)="saveVideo(d)" novalidate>
                <div class="da-field">
                  <label for="video-url">Link (https://…)</label>
                  <input id="video-url" class="da-input" type="url" formControlName="url" placeholder="https://" [attr.aria-invalid]="videoForm.controls.url.invalid && videoForm.controls.url.touched" />
                  @if (videoForm.controls.url.invalid && videoForm.controls.url.touched) {
                    <span class="da-error">Enter a valid link that starts with https://.</span>
                  }
                </div>
                <div class="da-field">
                  <label for="video-label">Label (optional)</label>
                  <input id="video-label" class="da-input" formControlName="label" placeholder="For example, Hover test" />
                </div>
                <div class="da-field">
                  <label for="video-date">Test date (optional)</label>
                  <input id="video-date" class="da-input" type="date" formControlName="testedOn" />
                </div>
                <div class="actions">
                  @if (videoEditor() !== 'new') {
                    <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="removeVideo(d)">Remove link</button>
                  }
                  <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="videoEditor.set(null)">Cancel</button>
                  <button type="submit" class="da-btn da-btn-small" [disabled]="saving()">Save link</button>
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
                    <b>{{ video.label || 'Flight test video' }}</b>
                    <small>{{ host(video.url) }}@if (video.testedOn) { · {{ video.testedOn | date: 'd MMM y' }}}</small>
                  </span>
                </a>
                <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="startVideo(video)" [attr.aria-label]="'Edit video link ' + (video.label || host(video.url))">Edit</button>
              </div>
            } @empty {
              @if (videoEditor() === null) {
                <p class="da-hint">No videos yet.</p>
              }
            }
          </section>
        </div>
      </div>
    } @else if (loadError()) {
      <p class="da-error" role="alert">{{ loadError() }}</p>
    } @else {
      <p class="da-hint">Loading drone…</p>
    }
  `
})
export class DroneDetailComponent implements OnInit {
  private readonly service = inject(DroneService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  readonly collapsedCount = COLLAPSED_COMPONENTS;
  readonly statusLabel = statusLabel;
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
      error: (error: unknown) => this.loadError.set(errorMessage(error, 'We could not load this drone.'))
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

  // Components
  startEditComponents(drone: DroneDetail): void {
    setComponents(this.componentRows, drone.components);
    this.error.set('');
    this.editingComponents.set(true);
  }

  saveComponents(drone: DroneDetail): void {
    if (this.componentRows.invalid) {
      this.componentRows.markAllAsTouched();
      this.error.set('Check the components: each needs a name and a whole quantity of at least 1.');
      return;
    }
    this.persist(this.service.replaceComponents(drone.id, readComponents(this.componentRows)), 'Components saved.', () =>
      this.editingComponents.set(false)
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
    this.persist(request, 'Issue saved.', () => this.issueEditor.set(null));
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
    this.persist(request, 'Video link saved.', () => this.videoEditor.set(null));
  }

  removeVideo(drone: DroneDetail): void {
    const editor = this.videoEditor();
    if (!editor || editor === 'new' || !window.confirm('Remove this video link? The video itself is not deleted.')) {
      return;
    }
    this.persist(this.service.removeVideo(drone.id, editor), 'Video link removed.', () => this.videoEditor.set(null));
  }

  private persist(request: Observable<DroneDetail>, message: string, done: () => void): void {
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    request.subscribe({
      next: (drone) => {
        this.drone.set(drone);
        this.message.set(message);
        this.saving.set(false);
        done();
      },
      error: (error: unknown) => {
        this.error.set(errorMessage(error, 'We could not save your change. Please review it and try again.'));
        this.saving.set(false);
      }
    });
  }
}
