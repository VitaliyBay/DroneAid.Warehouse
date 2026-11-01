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
  unitOfMeasure: string;
}

interface ComponentStock {
  id: string;
  componentType: ComponentType;
  quantity: number;
  availabilityState: string;
}

interface DroneComponentAvailability {
  componentName: string;
  requiredQuantity: number;
  availableQuantity: number;
  unitOfMeasure: string;
}

interface DroneBuildCapacity {
  configurationId: string;
  configurationName: string;
  description: string;
  availableBuilds: number;
  components: DroneComponentAvailability[];
}

interface DroneRequest {
  id: string;
  configurationName: string;
  quantity: number;
  reason: string;
  priority: string;
  donorReference?: string;
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

  readonly droneRequestForm = this.formBuilder.nonNullable.group({
    configurationId: ['digital', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    donorReference: ['', Validators.maxLength(200)],
    priority: ['Normal', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  isSubmitting = false;
  errorMessage = '';
  authenticatedUser: LoginResponse | null = null;
  componentTypes: ComponentType[] = [];
  stock: ComponentStock[] = [];
  buildCapacity: DroneBuildCapacity[] = [];
  droneRequests: DroneRequest[] = [];
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
      buildCapacity: this.http.get<DroneBuildCapacity[]>('/api/inventory/build-capacity'),
      droneRequests: this.http.get<DroneRequest[]>('/api/inventory/drone-requests')
    }).subscribe({
      next: (inventory) => {
        this.componentTypes = inventory.componentTypes;
        this.stock = inventory.stock;
        this.buildCapacity = inventory.buildCapacity;
        this.droneRequests = inventory.droneRequests;
        this.isLoadingInventory = false;
      },
      error: () => {
        this.inventoryError = 'We could not load drone availability. Check that the API is running and try again.';
        this.isLoadingInventory = false;
      }
    });
  }

  createDroneRequest(): void {
    if (this.droneRequestForm.invalid || !this.authenticatedUser) {
      this.droneRequestForm.markAllAsTouched();
      return;
    }

    this.saveInventory(
      this.http.post<DroneRequest>('/api/inventory/drone-requests', {
        ...this.droneRequestForm.getRawValue(),
        requestedBy: this.authenticatedUser.userName
      }),
      'Drone request recorded. The component plan is linked to the selected configuration.',
      () => this.droneRequestForm.reset({ configurationId: 'digital', quantity: 1, priority: 'Normal' })
    );
  }

  availableQuantity(componentTypeId: string): number {
    return this.stock
      .filter((item) => item.componentType.id === componentTypeId && item.availabilityState === 'Available')
      .reduce((total, item) => total + item.quantity, 0);
  }

  limitingComponents(configuration: DroneBuildCapacity): DroneComponentAvailability[] {
    return configuration.components.filter((component) => component.availableQuantity < component.requiredQuantity);
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
