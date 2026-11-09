import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DroneIdentity, DroneService } from '../core/drone.service';
import {
  ComponentInput,
  DRONE_STATUSES,
  DRONE_TYPES,
  DroneDetail,
  DroneType,
  errorMessage
} from '../core/models';
import {
  ComponentGroup,
  ComponentsEditorComponent,
  readComponents,
  setComponents
} from '../shared/components-editor.component';

const TYPE_HINTS: Record<DroneType, string> = {
  Analog: 'Analog camera + video transmitter',
  Digital: 'Digital video unit'
};

@Component({
  selector: 'app-drone-form',
  imports: [ReactiveFormsModule, RouterLink, ComponentsEditorComponent],
  template: `
    <div class="crumbs">
      <a [routerLink]="editing() ? ['/drones', id] : ['/drones']">← {{ editing() ? 'Back to drone' : 'All drones' }}</a>
    </div>

    @if (loadError()) {
      <p class="da-error" role="alert">{{ loadError() }}</p>
    } @else {
      <form class="da-card form-card" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <p class="da-eyebrow">{{ editing() ? 'Edit drone' : 'New drone' }}</p>
        <h1 class="form-title">{{ editing() ? 'Edit ' + (original()?.nickname ?? 'drone') : 'Add a drone' }}</h1>
        <p class="da-hint">
          {{ editing() ? 'Change the basics here. Parts, issues and videos are edited on the drone page.' : 'Enter the basics. We fill in the parts for you, and you can change them.' }}
        </p>

        <div class="da-field">
          <label for="code">Drone code</label>
          <input id="code" class="da-input" formControlName="code" placeholder="DABCN0001" autocomplete="off" [attr.aria-invalid]="invalid('code')" />
          @if (invalid('code')) {
            <span class="da-error">Enter the drone code (up to 50 characters).</span>
          } @else {
            <span class="da-hint">Must be unique.</span>
          }
        </div>

        <div class="da-field">
          <label for="nickname">Nickname</label>
          <input id="nickname" class="da-input" formControlName="nickname" placeholder="For example, Falcon" autocomplete="off" [attr.aria-invalid]="invalid('nickname')" />
          @if (invalid('nickname')) {
            <span class="da-error">Enter a nickname (up to 100 characters).</span>
          } @else if (duplicateNickname()) {
            <span class="da-hint warn-note">Another drone already uses this nickname. You can still save.</span>
          }
        </div>

        <div class="da-field" role="group" aria-labelledby="type-label">
          <span id="type-label" class="da-label">Drone type</span>
          <div class="type-pick">
            @for (item of types; track item) {
              <button type="button" class="type-opt" [attr.aria-pressed]="form.controls.type.value === item" (click)="chooseType(item)">
                <b>{{ item }}</b>
                <small>{{ hints[item] }}</small>
              </button>
            }
          </div>
          @if (invalid('type')) {
            <span class="da-error">Choose Analog or Digital.</span>
          }
        </div>

        @if (editing()) {
          <div class="da-field">
            <label for="status">Status</label>
            <select id="status" class="da-select" formControlName="status">
              @for (item of statuses; track item.value) {
                <option [value]="item.value">{{ item.label }}</option>
              }
            </select>
          </div>
        }

        @if (!editing()) {
          <div class="da-field">
            <span class="da-label">Components @if (form.controls.type.value) {<span class="da-hint">· loaded for {{ form.controls.type.value }}</span>}</span>
            @if (form.controls.type.value) {
              <app-components-editor [rows]="components" />
            } @else {
              <p class="da-hint">Choose a drone type to load its standard components.</p>
            }
          </div>
        }

        @if (error()) {
          <p class="da-error" role="alert">{{ error() }}</p>
        }

        <div class="actions">
          <a class="da-btn da-btn-secondary" [routerLink]="editing() ? ['/drones', id] : ['/drones']">Cancel</a>
          <button type="submit" class="da-btn da-btn-accent" [disabled]="saving()">{{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Save drone' }}</button>
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

  readonly id = this.route.snapshot.paramMap.get('id');
  readonly editing = signal(!!this.id);
  readonly types = DRONE_TYPES;
  readonly statuses = DRONE_STATUSES;
  readonly hints = TYPE_HINTS;

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
        error: (error: unknown) => this.loadError.set(errorMessage(error, 'We could not load this drone.'))
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
        error: () => this.error.set('We could not load the standard components. You can add them by hand.')
      });
    }
  }

  save(): void {
    if (this.form.invalid || (!this.editing() && this.componentsInvalid())) {
      this.form.markAllAsTouched();
      this.components.markAllAsTouched();
      if (!this.form.invalid) {
        this.error.set('Check the components: each needs a name and a whole quantity of at least 1.');
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
    const replace = window.confirm(
      `The drone type changed to ${type}. Replace its components with the standard ${type} list?\n\n` +
        'OK replaces the list. Cancel keeps the current components.'
    );
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

  private componentsInvalid(): boolean {
    return this.components.invalid;
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
    this.error.set(errorMessage(error, 'We could not save the drone. Check the information and try again.'));
    this.saving.set(false);
  }
}
