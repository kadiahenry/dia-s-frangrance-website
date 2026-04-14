import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProductComponent } from '../product/product.component';
import { ProductsComponent } from '../products/products.component';

const routes: Routes = [
  { path: 'products', component: ProductsComponent, data: { breadcrumb: 'Products' } },
  { path: 'product/:slug', component: ProductComponent, data: { breadcrumb: 'Product' } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CatalogPagesRoutingModule {}
