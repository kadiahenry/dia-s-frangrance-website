import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BannerComponent } from '../components/banner/banner.component';
import { BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';

@NgModule({
  declarations: [
    BannerComponent,
    BreadcrumbsComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    BannerComponent,
    BreadcrumbsComponent
  ]
})
export class SharedModule {}
