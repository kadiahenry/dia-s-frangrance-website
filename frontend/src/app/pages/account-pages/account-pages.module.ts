import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CartComponent } from '../../cart/cart.component';
import { CheckoutComponent } from '../../checkout/checkout.component';
import { SharedModule } from '../../shared/shared.module';
import { AccountComponent } from '../account/account.component';
import { AccountPagesRoutingModule } from './account-pages-routing.module';
import { OrdersComponent } from '../orders/orders.component';
import { OrderSuccessComponent } from '../order-success/order-success.component';
import { WishlistComponent } from '../wishlist/wishlist.component';

@NgModule({
  declarations: [
    CartComponent,
    CheckoutComponent,
    AccountComponent,
    OrdersComponent,
    OrderSuccessComponent,
    WishlistComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    AccountPagesRoutingModule
  ]
})
export class AccountPagesModule {}
