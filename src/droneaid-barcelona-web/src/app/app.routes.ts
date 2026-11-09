import { Routes } from '@angular/router';

import { authGuard } from './core/auth.service';
import { DroneDetailComponent } from './pages/drone-detail.component';
import { DroneFormComponent } from './pages/drone-form.component';
import { DronesListComponent } from './pages/drones-list.component';
import { LoginComponent } from './pages/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'drones', component: DronesListComponent, canActivate: [authGuard] },
  { path: 'drones/new', component: DroneFormComponent, canActivate: [authGuard] },
  { path: 'drones/:id', component: DroneDetailComponent, canActivate: [authGuard] },
  { path: 'drones/:id/edit', component: DroneFormComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'drones' },
  { path: '**', redirectTo: 'drones' }
];
