import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';

interface LoginResponse {
  userName: string;
  role: string;
}

interface ComponentType {
  id: string;
  name: string;
  category: string;
  manufacturerOrModel?: string;
  partNumber?: string;
  unitOfMeasure: string;
  compatibilityNotes?: string;
  minimumQuantityPerBuild: number;
}

interface ComponentStock {
  id: string;
  componentType: ComponentType;
  quantity: number;
  availabilityState: string;
  serialNumberOrBatch?: string;
  sourceReference?: string;
}

interface ComponentRequest {
  id: string;
  componentType: ComponentType;
  requestedQuantity: number;
  receivedQuantity: number;
  reason: string;
  priority: string;
  requestedBy: string;
  relatedDroneIdentifier?: string;
  status: string;
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

  readonly componentTypeForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    category: ['', [Validators.required, Validators.maxLength(100)]],
    manufacturerOrModel: ['', Validators.maxLength(200)],
    partNumber: ['', Validators.maxLength(100)],
    unitOfMeasure: ['each', [Validators.required, Validators.maxLength(50)]],
    compatibilityNotes: ['', Validators.maxLength(2000)],
    minimumQuantityPerBuild: [1, [Validators.required, Validators.min(0.001)]]
  });

  readonly receiptForm = this.formBuilder.nonNullable.group({
    componentTypeId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.001)]],
    availabilityState: ['Available', Validators.required],
    serialNumberOrBatch: ['', Validators.maxLength(200)],
    sourceReference: ['', Validators.maxLength(300)],
    reason: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  readonly requestForm = this.formBuilder.nonNullable.group({
    componentTypeId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.001)]],
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
    priority: ['Normal', Validators.required],
    relatedDroneIdentifier: ['', Validators.maxLength(100)]
  });

  isSubmitting = false;
  errorMessage = '';
  authenticatedUser: LoginResponse | null = null;
  componentTypes: ComponentType[] = [];
  stock: ComponentStock[] = [];
  requests: ComponentRequest[] = [];
  inventoryError = '';
  inventoryMessage = '';
  isLoadingInventory = false;

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
        this.loadInventory();
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message ??
          'We could not sign you in. Check that the application is available and try again.';
        this.isSubmitting = false;
      }
    });
  }

  loadInventory(): void {
    this.isLoadingInventory = true;
    this.inventoryError = '';
    forkJoin({
      componentTypes: this.http.get<ComponentType[]>('/api/inventory/component-types'),
      stock: this.http.get<ComponentStock[]>('/api/inventory/stock'),
      requests: this.http.get<ComponentRequest[]>('/api/inventory/requests')
    }).subscribe({
      next: (inventory) => {
        this.componentTypes = inventory.componentTypes;
        this.stock = inventory.stock;
        this.requests = inventory.requests;
        this.isLoadingInventory = false;
      },
      error: () => {
        this.inventoryError = 'We could not load inventory. Check that the API is running and try again.';
        this.isLoadingInventory = false;
      }
    });
  }

  createComponentType(): void {
    if (this.componentTypeForm.invalid || !this.authenticatedUser) {
      this.componentTypeForm.markAllAsTouched();
      return;
    }

    this.saveInventory(
      this.http.post<ComponentType>('/api/inventory/component-types', {
        ...this.componentTypeForm.getRawValue(),
        performedBy: this.authenticatedUser.userName
      }),
      'Component type added to the catalogue.',
      () => this.componentTypeForm.reset({ unitOfMeasure: 'each', minimumQuantityPerBuild: 1 })
    );
  }

  receiveStock(): void {
    if (this.receiptForm.invalid || !this.authenticatedUser) {
      this.receiptForm.markAllAsTouched();
      return;
    }

    this.saveInventory(
      this.http.post<ComponentStock>('/api/inventory/stock/receipts', {
        ...this.receiptForm.getRawValue(),
        performedBy: this.authenticatedUser.userName
      }),
      'Receipt recorded. The stock availability has been updated.',
      () => this.receiptForm.reset({ quantity: 1, availabilityState: 'Available' })
    );
  }

  createRequest(): void {
    if (this.requestForm.invalid || !this.authenticatedUser) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.saveInventory(
      this.http.post<ComponentRequest>('/api/inventory/requests', {
        ...this.requestForm.getRawValue(),
        requestedBy: this.authenticatedUser.userName
      }),
      'Component request saved as a draft.',
      () => this.requestForm.reset({ quantity: 1, priority: 'Normal' })
    );
  }

  availableQuantity(componentTypeId: string): number {
    return this.stock
      .filter((item) => item.componentType.id === componentTypeId && item.availabilityState === 'Available')
      .reduce((total, item) => total + item.quantity, 0);
  }

  private saveInventory(request: Observable<unknown>, message: string, reset: () => void): void {
    this.inventoryError = '';
    this.inventoryMessage = '';
    request.subscribe({
      next: () => {
        reset();
        this.inventoryMessage = message;
        this.loadInventory();
      },
      error: (error: { error?: { message?: string } }) => {
        this.inventoryError = error.error?.message ?? 'We could not save your change. Please review the information and try again.';
      }
    });
  }
}
