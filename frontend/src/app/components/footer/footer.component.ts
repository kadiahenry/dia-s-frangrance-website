import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { CookieConsentService } from 'src/app/core/services/cookie-consent.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  constructor(
    public authService: AuthService,
    private cookieConsentService: CookieConsentService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
  }

  openCookieSettings(): void {
    this.cookieConsentService.openPreferences();
  }

  goToAccount(): void {
    this.router.navigate([this.authService.isLoggedIn() ? '/account' : '/login'], {
      queryParams: this.authService.isLoggedIn() ? undefined : { returnUrl: '/account' }
    });
  }

  goToOrders(): void {
    this.router.navigate([this.authService.isLoggedIn() ? '/orders' : '/login'], {
      queryParams: this.authService.isLoggedIn() ? undefined : { returnUrl: '/orders' }
    });
  }

  goToAddresses(): void {
    this.router.navigate([this.authService.isLoggedIn() ? '/account' : '/login'], {
      fragment: this.authService.isLoggedIn() ? 'addresses' : undefined,
      queryParams: this.authService.isLoggedIn() ? undefined : { returnUrl: '/account' }
    });
  }

  goToPaymentMethods(): void {
    this.router.navigate([this.authService.isLoggedIn() ? '/account' : '/login'], {
      fragment: this.authService.isLoggedIn() ? 'payment-methods' : undefined,
      queryParams: this.authService.isLoggedIn() ? undefined : { returnUrl: '/account' }
    });
  }

  goToWishlist(): void {
    this.router.navigate([this.authService.isLoggedIn() ? '/wishlist' : '/login'], {
      queryParams: this.authService.isLoggedIn() ? undefined : { returnUrl: '/wishlist' }
    });
  }

  handlePrimaryAuthAction(): void {
    if (this.authService.isLoggedIn()) {
      this.goToAccount();
      return;
    }

    this.router.navigate(['/login']);
  }

  handleSecondaryAuthAction(): void {
    if (this.authService.isLoggedIn()) {
      this.logout();
      return;
    }

    this.router.navigate(['/register']);
  }

  get primaryAuthLabel(): string {
    return this.authService.isLoggedIn() ? 'My Account' : 'Sign In';
  }

  get secondaryAuthLabel(): string {
    return this.authService.isLoggedIn() ? 'Sign Out' : 'Create Account';
  }
}
