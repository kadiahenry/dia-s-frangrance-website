import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';

export interface CartItem {
  id: number;
  name: string;
  type?: string;
  price: number;
  image: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  // In-memory cart
  private cart: CartItem[] = [];

  /**
   * ✅ Best practice:
   * cartSubject holds the full cart and can be observed by components
   */
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  /**
   * ✅ Reactive cart count (Header subscribes here)
   */
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  constructor(private authService: AuthService) {
    // Load cart from storage
    this.loadCart();

    // Push initial values so UI updates on refresh
    this.cartSubject.next(this.cart);
    this.cartCountSubject.next(this.getCartCount());
  }

  /** Get current cart array (sync) */
  getCart(): CartItem[] {
    return this.cart;
  }

  /**
   * ✅ Add to cart ONLY if logged in
   * Returns true if added, false if blocked
   */
  addToCart(product: Omit<CartItem, 'quantity'>): boolean {

    // Block if not logged in
    if (!this.authService.isLoggedIn()) {
      return false;
    }

    const item = this.cart.find(p => p.id === product.id);

    if (item) {
      item.quantity++;
    } else {
      this.cart.push({ ...product, quantity: 1 });
    }

    this.saveCartAndEmit();
    return true;
  }

  increaseQuantity(id: number): void {
    const item = this.cart.find(p => p.id === id);

    if (item) {
      item.quantity++;
      this.saveCartAndEmit();
    }
  }

  decreaseQuantity(id: number): void {
    const item = this.cart.find(p => p.id === id);

    if (item) {
      item.quantity--;

      if (item.quantity <= 0) {
        this.cart = this.cart.filter(x => x.id !== id);
      }

      this.saveCartAndEmit();
    }
  }

  removeFromCart(id: number): void {
    this.cart = this.cart.filter(item => item.id !== id);
    this.saveCartAndEmit();
  }

  /** Total number of items (sum of quantities) */
  getCartCount(): number {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  clearCart(): void {
    this.cart = [];
    localStorage.removeItem('cart');

    // ✅ emit updates immediately
    this.cartSubject.next(this.cart);
    this.cartCountSubject.next(0);
  }

  /** Save cart + emit to subscribers (header/cart page) */
  private saveCartAndEmit(): void {
    localStorage.setItem('cart', JSON.stringify(this.cart));

    // ✅ emit full cart + count
    this.cartSubject.next(this.cart);
    this.cartCountSubject.next(this.getCartCount());
  }

  /** Load cart from localStorage */
  private loadCart(): void {
    const saved = localStorage.getItem('cart');
    this.cart = saved ? JSON.parse(saved) : [];
  }
}
