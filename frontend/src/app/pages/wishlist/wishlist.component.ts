import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { WishlistService, WishlistItem } from 'src/app/core/services/wishlist.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { buildProductPath } from 'src/app/core/utils/product-path';

interface AccountNavLink {
  label: string;
  route: string;
  fragment?: string;
}

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  wishlist: WishlistItem[] = [];
  displayName = '';
  accountLinks: AccountNavLink[] = [
    { label: 'My Account', route: '/account' },
    { label: 'My Info', route: '/account', fragment: 'my-info' },
    { label: 'Order History', route: '/orders' },
    { label: 'My Addresses', route: '/account', fragment: 'addresses' },
    { label: 'Payment Methods', route: '/account', fragment: 'payment-methods' },
    { label: 'My Love-It List', route: '/wishlist' }
  ];

  constructor(
    private wishlistService: WishlistService,
    private authService: AuthService,
    private router: Router,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.wishlist = this.wishlistService.getWishlist();
    this.displayName = this.authService.getDisplayName();

    this.seoService.setPage({
      title: 'My Love-It List',
      description: "View and manage your saved favorites on Dia's Fragrances and More.",
      path: '/wishlist',
      robots: 'noindex,nofollow'
    });
    this.seoService.clearStructuredData();
  }

  signOut(): void {
    this.authService.logout();
  }

  remove(id: number): void {
    this.wishlistService.remove(id);
    this.wishlist = this.wishlistService.getWishlist();
  }

  clearAll(): void {
    this.wishlistService.clear();
    this.wishlist = [];
  }

  viewProduct(item: WishlistItem): void {
    this.router.navigateByUrl(buildProductPath(item));
  }
}
