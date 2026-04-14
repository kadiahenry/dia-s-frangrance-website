import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full', data: { breadcrumb: 'Home' } },
  { path: 'login', component: LoginComponent, data: { breadcrumb: 'Login' } },
  { path: 'register', component: RegisterComponent, data: { breadcrumb: 'Create Account' } },
  { path: 'forgot-password', component: ForgotPasswordComponent, data: { breadcrumb: 'Reset Password' } },
  { path: 'reset-password/:token', component: ResetPasswordComponent, data: { breadcrumb: 'Reset Password' } },
  {
    path: '',
    loadChildren: () => import('./catalog-pages/catalog-pages.module').then((m) => m.CatalogPagesModule)
  },
  {
    path: '',
    loadChildren: () => import('./info-pages/info-pages.module').then((m) => m.InfoPagesModule)
  },
  {
    path: '',
    loadChildren: () => import('./account-pages/account-pages.module').then((m) => m.AccountPagesModule)
  },
  {
    path: '',
    loadChildren: () => import('./admin-pages/admin-pages.module').then((m) => m.AdminPagesModule)
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule {}
