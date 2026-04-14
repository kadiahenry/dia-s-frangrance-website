import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CartService } from 'src/app/core/services/cart.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  isMenuOpen = false;
  isDarkMode = false;
  isInfoMenuOpen = false;
  searchTerm = '';
  cartCount = 0;

  private cartCountSub?: Subscription;

  constructor(
    public router: Router,
    public authService: AuthService,
    public cartService: CartService
  ) {}

  ngOnInit(): void {
    this.cartCount = this.cartService.getCartCount();

    this.cartCountSub = this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
  }

  ngOnDestroy(): void {
    this.cartCountSub?.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.closeAllMenus();
  }

  search(): void {
    const term = this.searchTerm.trim();
    this.closeAllMenus();

    this.router.navigate(['/products'], {
      queryParams: term ? { search: term } : {}
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    if (!this.isMenuOpen) {
      this.isInfoMenuOpen = false;
    }
  }

  toggleInfoMenu(): void {
    this.isInfoMenuOpen = !this.isInfoMenuOpen;
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }

  closeAllMenus(): void {
    this.isMenuOpen = false;
    this.isInfoMenuOpen = false;
  }

  closeMenu(): void {
    this.closeAllMenus();
  }

  goToCart(): void {
    this.closeAllMenus();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/cart' }
      });
      return;
    }

    this.router.navigate(['/cart']);
  }

  goToWishlist(): void {
    this.closeAllMenus();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/wishlist' }
      });
      return;
    }

    this.router.navigate(['/wishlist']);
  }

  logout(): void {
    this.authService.logout();
    this.closeAllMenus();
  }
}
