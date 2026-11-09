import { Component, input } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ComponentInput } from '../core/models';

export type ComponentGroup = FormGroup<{
  name: FormControl<string>;
  detail: FormControl<string>;
  quantity: FormControl<number>;
}>;

export function buildComponentGroup(item?: Partial<ComponentInput>): ComponentGroup {
  return new FormGroup({
    name: new FormControl(item?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)]
    }),
    detail: new FormControl(item?.detail ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(500)]
    }),
    quantity: new FormControl(item?.quantity ?? 1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]
    })
  });
}

export function setComponents(array: FormArray<ComponentGroup>, items: Partial<ComponentInput>[]): void {
  array.clear();
  items.forEach((item) => array.push(buildComponentGroup(item)));
}

export function readComponents(array: FormArray<ComponentGroup>): ComponentInput[] {
  return array.getRawValue().map((item) => ({
    name: item.name.trim(),
    detail: item.detail.trim() || null,
    quantity: Number(item.quantity)
  }));
}

@Component({
  selector: 'app-components-editor',
  imports: [ReactiveFormsModule],
  template: `
    <div class="editor-rows">
      @for (row of rows().controls; track row; let i = $index) {
        <div class="editor-row" [formGroup]="row">
          <div class="da-field">
            <label class="da-visually-hidden" [for]="'cn-' + i">Component name</label>
            <input
              class="da-input"
              [id]="'cn-' + i"
              formControlName="name"
              placeholder="Component name"
              [attr.aria-invalid]="row.controls.name.invalid && row.controls.name.touched"
            />
          </div>
          <div class="da-field">
            <label class="da-visually-hidden" [for]="'cd-' + i">Model or note</label>
            <input class="da-input" [id]="'cd-' + i" formControlName="detail" placeholder="Model or note (optional)" />
          </div>
          <div class="da-field qty">
            <label class="da-visually-hidden" [for]="'cq-' + i">Quantity</label>
            <input
              class="da-input"
              [id]="'cq-' + i"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              formControlName="quantity"
              [attr.aria-invalid]="row.controls.quantity.invalid"
            />
          </div>
          <button type="button" class="da-btn da-btn-ghost da-btn-small" (click)="remove(i)" [attr.aria-label]="'Remove component ' + (i + 1)">
            Remove
          </button>
        </div>
      } @empty {
        <p class="da-hint">No components yet.</p>
      }
    </div>
    <button type="button" class="da-btn da-btn-secondary da-btn-small" (click)="add()">＋ Add component</button>
  `,
  styles: `
    .editor-row {
      align-items: start;
      display: grid;
      gap: 0 var(--da-space-2);
      grid-template-columns: minmax(0, 2fr) minmax(0, 2fr) 5rem auto;
    }

    .editor-row .da-field {
      margin-bottom: var(--da-space-2);
    }

    .editor-row button {
      margin-top: 0.25rem;
    }

    .editor-rows {
      margin-bottom: var(--da-space-3);
    }

    @media (max-width: 39.99rem) {
      .editor-row {
        border-bottom: 1px solid var(--da-border);
        grid-template-columns: 1fr 5rem;
        margin-bottom: var(--da-space-3);
        padding-bottom: var(--da-space-2);
      }

      .editor-row .da-field:nth-child(2) {
        grid-column: 1 / -1;
        grid-row: 2;
      }

      .editor-row button {
        grid-column: 1 / -1;
        justify-self: start;
        margin-top: 0;
      }
    }
  `
})
export class ComponentsEditorComponent {
  readonly rows = input.required<FormArray<ComponentGroup>>();

  add(): void {
    this.rows().push(buildComponentGroup());
  }

  remove(index: number): void {
    this.rows().removeAt(index);
  }
}
