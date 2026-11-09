import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DroneIdentity, DroneService } from '../core/drone.service';
import { ComponentInput, DRONE_STATUSES, DRONE_TYPES, DroneDetail, DroneType } from '../core/models';
import { I18nService } from '../i18n/i18n.service';
import {
  ComponentGroup,
  ComponentsEditorComponent,
  readComponents,
  setComponents
} from '../shared/components-editor.component';

@Component({
  selector: 'app-drone-form',
  imports: [ReactiveFormsModule, RouterLink, ComponentsEditorComponent],
  template: `
    <div class="crumbs">
      <a [routerLink]="editing() ? ['/drones', id] : ['/drones']">← {{ editing() ? i18n.t('form.backToDrone') : i18n.t('form.allDrones') }}</a>
    </div>

    @if (loadError()) {
      <p class="da-error" role="alert">{{ loadError() }}</p>
    } @else {
      <form class="da-card form-card" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <p class="da-eyebrow">{{ editing() ? i18n.t('form.eyebrowEdit') : i18n.t('form.eyebrowNew') }}</p>
        <h1 class="form-title">
          {{ editing() ? i18n.t('form.titleEdit', { name: original()?.nickname ?? i18n.t('form.fallbackName') }) : i18n.t('form.titleNew') }}
        </h1>
        <p class="da-hint">{{ editing() ? i18n.t('form.hintEdit') : i18n.t('form.hintNew') }}</p>

        <div class="da-field">
          <label for="code">{{ i18n.t('form.code') }}</label>
          <input id="code" class="da-input" formControlName="code" placeholder="DABCN0001" autocomplete="off" [attr.aria-invalid]="invalid('code')" />
          @if (invalid('code')) {
            <span class="da-error">{{ i18n.t('form.codeError') }}</span>
          } @else {
            <span class="da-hint">{{ i18n.t('form.codeHint') }}</span>
          }
        </div>

        <div class="da-field">
          <label for="nickname">{{ i18n.t('form.nickname') }}</label>
          <input id="nickname" class="da-input" formControlName="nickname" [placeholder]="i18n.t('form.nicknamePlaceholder')" autocomplete="off" [attr.aria-invalid]="invalid('nickname')" />
          @if (invalid('nickname')) {
            <span class="da-error">{{ i18n.t('form.nicknameError') }}</span>
          } @else if (duplicateNickname()) {
            <span class="da-hint warn-note">{{ i18n.t('form.nicknameDuplicate') }}</span>
          }
        </div>

        <div class="da-field" role="group" aria-labelledby="type-label">
          <span id="type-label" class="da-label">{{ i18n.t('form.type') }}</span>
          <div class="type-pick">
            @for (item of types; track item) {
              <button type="button" class="type-opt" [attr.aria-pressed]="form.controls.type.value === item" (click)="chooseType(item)">
                <b>{{ i18n.t('type.' + item) }}</b>
                <small>{{ i18n.t(item === 'Analog' ? 'type.Analog.hint' : 'type.Digital.hint') }}</small>
              </button>
            }
          </div>
          @if (invalid('type')) {
            <span class="da-error">{{ i18n.t('form.typeError') }}</span>
          }
        </div>

        @if (editing()) {
          <div class="da-field">
            <label for="status">{{ i18n.t('form.status') }}</label>
            <select id="status" class="da-select" formControlName="status">
              @for (item of statuses; track item.value) {
                <option [value]="item.value">{{ i18n.t('status.' + item.value) }}</option>
              }
            </select>
          </div>
        }

        @if (!editing()) {
          <div class="da-field">
            <span class="da-label">
              {{ i18n.t('form.components') }}
              @if (form.controls.type.value) {
                <span class="da-hint">{{ i18n.t('form.componentsLoadedFor', { type: i18n.t('type.' + form.controls.type.value) }) }}</span>
              }
            </span>
            @if (form.controls.type.value) {
              <app-components-editor [rows]="components" />
            } @else {
              <p class="da-hint">{{ i18n.t('form.chooseTypeFirst') }}</p>
            }
          </div>
        }

        @if (error()) {
          <p class="da-error" role="alert">{{ error() }}</p>
        }

        <div class="actions">
          <a class="da-btn da-btn-secondary" [routerLink]="editing() ? ['/drones', id] : ['/drones']">{{ i18n.t('common.cancel') }}</a>
          <button type="submit" class="da-btn da-btn-accent" [disabled]="saving()">
            {{ saving() ? i18n.t('common.saving') : editing() ? i18n.t('form.saveChanges') : i18n.t('form.save') }}
          </button>
        </div>
      </form>
    }
  `
})
export class DroneFormComponent implements OnInit {
  private readonly service = inject(DroneService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18nService);

  readonly id = this.route.snapshot.paramMap.get('id');
  readonly editing = signal(!!this.id);
  readonly types = DRONE_TYPES;
  readonly statuses = DRONE_STATUSES;

  readonly components = new FormArray<ComponentGroup>([]);
  readonly form = inject(FormBuilder).group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    nickname: ['', [Validators.required, Validators.maxLength(100)]],
    type: [null as DroneType | null, Validators.required],
    status: ['Available' as DroneDetail['status']]
  });

  readonly original = signal<DroneDetail | null>(null);
  readonly duplicateNickname = signal(false);
  readonly loadError = signal('');
  readonly error = signal('');
  readonly saving = signal(false);

  private knownNicknames: { id: string; nickname: string }[] = [];

  ngOnInit(): void {
    this.service.list().subscribe({
      next: (drones) => {
        this.knownNicknames = drones.map((drone) => ({ id: drone.id, nickname: drone.nickname.toLowerCase() }));
        this.checkNickname();
      },
      error: () => undefined
    });
    this.form.controls.nickname.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.checkNickname());

    if (this.id) {
      this.service.get(this.id).subscribe({
        next: (drone) => {
          this.original.set(drone);
          this.form.patchValue({ code: drone.code, nickname: drone.nickname, type: drone.type, status: drone.status });
        },
        error: (error: unknown) => this.loadError.set(this.i18n.error(error, 'form.loadFailed'))
      });
    }
  }

  invalid(name: 'code' | 'nickname' | 'type'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  chooseType(type: DroneType): void {
    this.form.controls.type.setValue(type);
    this.form.controls.type.markAsDirty();
    if (!this.editing()) {
      this.service.defaultComponents(type).subscribe({
        next: (items) => setComponents(this.components, items),
        error: () => this.error.set(this.i18n.t('form.defaultsFailed'))
      });
    }
  }

  save(): void {
    if (this.form.invalid || (!this.editing() && this.components.invalid)) {
      this.form.markAllAsTouched();
      this.components.markAllAsTouched();
      if (!this.form.invalid) {
        this.error.set(this.i18n.t('form.componentsInvalid'));
      }
      return;
    }
    this.error.set('');
    this.saving.set(true);
    const value = this.form.getRawValue();
    const identity: DroneIdentity = {
      code: value.code!.trim(),
      nickname: value.nickname!.trim(),
      type: value.type!,
      status: this.editing() ? value.status! : 'Available'
    };

    if (this.id) {
      const typeChanged = this.original() !== null && this.original()!.type !== identity.type;
      this.service.update(this.id, identity).subscribe({
        next: () => (typeChanged ? this.offerDefaults(this.id!, identity.type) : this.finish(this.id!)),
        error: (error: unknown) => this.fail(error)
      });
    } else {
      this.service.create(identity, readComponents(this.components)).subscribe({
        next: (drone) => this.finish(drone.id),
        error: (error: unknown) => this.fail(error)
      });
    }
  }

  private offerDefaults(id: string, type: DroneType): void {
    const replace = window.confirm(this.i18n.t('form.typeChangedConfirm', { type: this.i18n.t(`type.${type}`) }));
    if (!replace) {
      this.finish(id);
      return;
    }
    this.service.defaultComponents(type).subscribe({
      next: (items: ComponentInput[]) =>
        this.service.replaceComponents(id, items).subscribe({
          next: () => this.finish(id),
          error: (error: unknown) => this.fail(error)
        }),
      error: (error: unknown) => this.fail(error)
    });
  }

  private checkNickname(): void {
    const nickname = (this.form.controls.nickname.value ?? '').trim().toLowerCase();
    this.duplicateNickname.set(
      !!nickname && this.knownNicknames.some((item) => item.nickname === nickname && item.id !== this.id)
    );
  }

  private finish(id: string): void {
    void this.router.navigate(['/drones', id]);
  }

  private fail(error: unknown): void {
    this.error.set(this.i18n.error(error, 'form.saveFailed'));
    this.saving.set(false);
  }
}
