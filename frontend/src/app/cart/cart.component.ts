import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartItem, CartService } from 'src/app/core/services/cart.service';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  private cartSub?: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.seoService.setPage({
      title: 'Cart',
      description: "Review the items in your Dia's Fragrances and More cart.",
      path: '/cart',
      robots: 'noindex,nofollow'
    });
    this.seoService.clearStructuredData();

    this.cartItems = this.cartService.getCart();

    this.cartSub = this.cartService.cart$.subscribe(cart => {
      this.cartItems = cart;
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  increase(id: number): void {
    this.cartService.increaseQuantity(id);
  }

  decrease(id: number): void {
    this.cartService.decreaseQuantity(id);
  }

  removeItem(id: number): void {
    this.cartService.removeFromCart(id);
  }

  getTotal(): number {
    return this.cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  getTaxIncluded(): number {
    const subtotal = this.getTotal();
    return Number((subtotal - subtotal / 1.15).toFixed(2));
  }

  getEstimatedShipping(): number {
    return this.cartItems.length ? 300 : 0;
  }

  getOrderTotal(): number {
    return Number((this.getTotal() + this.getEstimatedShipping()).toFixed(2));
  }

  proceedToCheckout(preferredPayment?: 'paypal'): void {
    this.router.navigate(
      ['/checkout'],
      preferredPayment ? { queryParams: { payment: preferredPayment } } : undefined
    );
  }
}
