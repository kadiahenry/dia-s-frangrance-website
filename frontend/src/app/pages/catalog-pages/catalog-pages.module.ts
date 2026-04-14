import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { ProductComponent } from '../product/product.component';
import { ProductsComponent } from '../products/products.component';
import { CatalogPagesRoutingModule } from './catalog-pages-routing.module';

@NgModule({
  declarations: [
    ProductsComponent,
    ProductComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    CatalogPagesRoutingModule
  ]
})
export class CatalogPagesModule {}
