import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ProductService, Product } from '../../core/services/product.service';
import { CartService } from 'src/app/core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { buildProductPath } from 'src/app/core/utils/product-path';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit, OnDestroy {
  product: Product | null = null;

  private destroy$ = new Subject<void>();
  quantity = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    public authService: AuthService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    const routeSlug = (this.route.snapshot.paramMap.get('slug') || '').trim();
    const id = Number(routeSlug);
    const request$ = Number.isFinite(id) && id > 0
      ? this.productService.fetchById(id)
      : this.productService.fetchBySlug(routeSlug);

    request$.pipe(takeUntil(this.destroy$)).subscribe(found => {
      if (!found) {
        this.router.navigate(['/products']);
        return;
      }

      const canonicalPath = buildProductPath(found);
      const canonicalSlug = canonicalPath.split('/').pop();

      if (routeSlug !== canonicalSlug) {
        this.router.navigateByUrl(canonicalPath, { replaceUrl: true });
        return;
      }

      this.product = found;
      this.seoService.setPage({
        title: found.name,
        description: found.description || `Shop ${found.name} from Dia's Fragrances and More.`,
        path: canonicalPath,
        image: found.image,
        type: 'product',
        keywords: `${found.name}, ${found.category}, ${found.type || 'body care'}, fragrance`
      });
      this.seoService.setStructuredData({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: found.name,
        description: found.description || `Shop ${found.name} from Dia's Fragrances and More.`,
        image: this.seoService.absoluteUrl(found.image),
        category: found.category,
        sku: found.id,
        offers: {
          '@type': 'Offer',
          url: this.seoService.absoluteUrl(canonicalPath),
          priceCurrency: 'JMD',
          price: found.price,
          availability: 'https://schema.org/InStock'
        }
      });
    });
  }

  increase(): void {
    this.quantity++;
  }

  decrease(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }

    for (let i = 0; i < this.quantity; i++) {
      const added = this.cartService.addToCart(this.product as any);

      if (!added) {
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        return;
      }
    }
  }

  isInWishlist(): boolean {
    if (!this.product) {
      return false;
    }

    return this.wishlistService.isInWishlist(this.product.id);
  }

  addToWishlist(product: Product): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.wishlistService.toggle(product as any);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
