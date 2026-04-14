import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';
import { AdminLoginComponent } from '../admin-login/admin-login.component';
import { AdminPagesRoutingModule } from './admin-pages-routing.module';

@NgModule({
  declarations: [
    AdminLoginComponent,
    AdminDashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    AdminPagesRoutingModule
  ]
})
export class AdminPagesModule {}
