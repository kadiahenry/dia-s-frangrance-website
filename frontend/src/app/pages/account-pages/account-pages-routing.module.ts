import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../core/guards/auth.guard';
import { CartComponent } from '../../cart/cart.component';
import { CheckoutComponent } from '../../checkout/checkout.component';
import { AccountComponent } from '../account/account.component';
import { OrdersComponent } from '../orders/orders.component';
import { OrderSuccessComponent } from '../order-success/order-success.component';
import { WishlistComponent } from '../wishlist/wishlist.component';

const routes: Routes = [
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Cart' } },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Checkout' } },
  { path: 'wishlist', component: WishlistComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Wishlist' } },
  { path: 'account', component: AccountComponent, canActivate: [AuthGuard], data: { breadcrumb: 'My Account' } },
  { path: 'orders', component: OrdersComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Orders' } },
  { path: 'order-success', component: OrderSuccessComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountPagesRoutingModule {}
