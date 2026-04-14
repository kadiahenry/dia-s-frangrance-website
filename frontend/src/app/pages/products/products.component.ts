import { ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ProductService, Product } from 'src/app/core/services/product.service';
import { CartService } from 'src/app/core/services/cart.service';
import { WishlistService } from 'src/app/core/services/wishlist.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { buildProductPath } from 'src/app/core/utils/product-path';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent implements OnInit, OnDestroy {
  categories: string[] = ['All', 'Fragrances', 'Body Wash', 'Lotion and Body Cream', 'Scrubs', 'Oils'];
  selectedCategory = 'All';
  searchTerm = '';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchFeedback = '';
  searchSuggestions: string[] = [];
  isLoading = true;
  hasLoadedProducts = false;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    public authService: AuthService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.productService.loadProducts().subscribe(products => {
      this.products = products;
      this.hasLoadedProducts = products.length > 0;
      this.isLoading = false;
      this.updateSearchResults();
      this.updateSeo();
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.searchTerm = params['search'] || '';

      const category = params['category'];
      this.selectedCategory = this.categories.includes(category) ? category : 'All';
      this.updateSearchResults();
      this.updateSeo();
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.updateSearchResults();
  }

  toggleWishlist(product: Product): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.wishlistService.toggle(product as any);
  }

  addToCart(product: Product): void {
    const added = this.cartService.addToCart(product);

    if (!added) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
    }
  }

  addToWishlist(product: Product): void {
    this.toggleWishlist(product);
  }

  isInWishlist(id: number): boolean {
    return this.wishlistService.isInWishlist(id);
  }

  viewProduct(product: Product): void {
    this.router.navigateByUrl(buildProductPath(product));
  }

  trackByCategory(_: number, category: string): string {
    return category;
  }

  trackByProductId(_: number, product: Product): number {
    return product.id;
  }

  private updateSearchResults(): void {
    if (!this.products.length) {
      this.filteredProducts = [];
      this.searchFeedback = this.isLoading ? '' : 'No products are available right now.';
      this.searchSuggestions = [];
      return;
    }

    const results = this.getSearchResults();
    this.filteredProducts = results.products;
    this.searchFeedback = results.message;
    this.searchSuggestions = results.suggestions;
  }

  private updateSeo(): void {
    const hasSearch = !!this.searchTerm.trim();
    const title = this.selectedCategory === 'All'
      ? 'Products'
      : `${this.selectedCategory} Products`;
    const description = hasSearch
      ? `Search results for "${this.searchTerm}" at Dia's Fragrances and More.`
      : `Browse ${this.selectedCategory === 'All' ? 'all fragrances and body care products' : this.selectedCategory.toLowerCase()} at Dia's Fragrances and More.`;

    this.seoService.setPage({
      title,
      description,
      path: '/products',
      image: '/assets/images/logo.png',
      robots: hasSearch ? 'noindex,follow' : 'index,follow',
      keywords: this.selectedCategory === 'All'
        ? 'body care products, fragrances, body wash, lotions, body creams'
        : `${this.selectedCategory.toLowerCase()}, Dia's Fragrances and More`
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: this.seoService.absoluteUrl('/products')
    });
  }

  private getSearchResults(): { products: Product[]; message: string; suggestions: string[] } {
    const categoryProducts = this.products.filter(product =>
      this.selectedCategory === 'All' || product.category === this.selectedCategory
    );
    const query = this.normalizeText(this.searchTerm);

    if (!query) {
      return {
        products: categoryProducts,
        message: '',
        suggestions: []
      };
    }

    const exactMatches = categoryProducts.filter(product => this.matchesSearch(product, query));

    if (exactMatches.length) {
      return {
        products: exactMatches,
        message: '',
        suggestions: []
      };
    }

    const rankedMatches = categoryProducts
      .map(product => ({
        product,
        score: this.getSimilarityScore(product, query)
      }))
      .filter(entry => entry.score >= 0.58)
      .sort((a, b) => b.score - a.score);

    if (rankedMatches.length) {
      return {
        products: rankedMatches.map(entry => entry.product),
        message: `Showing similar results for "${this.searchTerm}" because we couldn't find an exact match.`,
        suggestions: []
      };
    }

    const suggestions = categoryProducts
      .map(product => ({
        name: product.name,
        score: this.getSimilarityScore(product, query)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(entry => entry.name);

    return {
      products: [],
      message: `We couldn't find anything for "${this.searchTerm}".`,
      suggestions
    };
  }

  private matchesSearch(product: Product, query: string): boolean {
    const haystacks = [
      product.name,
      product.type,
      product.category,
      product.description
    ]
      .filter(Boolean)
      .map(value => this.normalizeText(String(value)));

    return haystacks.some(value => value.includes(query));
  }

  private getSimilarityScore(product: Product, query: string): number {
    const candidates = [
      product.name,
      product.type,
      `${product.name} ${product.type || ''}`,
      `${product.category || ''} ${product.name}`
    ]
      .filter(Boolean)
      .map(value => this.normalizeText(String(value)));

    return Math.max(...candidates.map(candidate => this.compareSimilarity(candidate, query)), 0);
  }

  private compareSimilarity(candidate: string, query: string): number {
    if (!candidate || !query) {
      return 0;
    }

    if (candidate.includes(query) || query.includes(candidate)) {
      return 1;
    }

    const candidateWords = candidate.split(' ').filter(Boolean);
    const queryWords = query.split(' ').filter(Boolean);
    const wordScores = queryWords.flatMap(queryWord =>
      candidateWords.map(candidateWord => this.wordSimilarity(candidateWord, queryWord))
    );

    return wordScores.length ? Math.max(...wordScores) : this.wordSimilarity(candidate, query);
  }

  private wordSimilarity(left: string, right: string): number {
    if (!left || !right) {
      return 0;
    }

    const distance = this.levenshteinDistance(left, right);
    return 1 - distance / Math.max(left.length, right.length);
  }

  private levenshteinDistance(left: string, right: string): number {
    const matrix = Array.from({ length: left.length + 1 }, () => new Array<number>(right.length + 1).fill(0));

    for (let i = 0; i <= left.length; i += 1) {
      matrix[i][0] = i;
    }

    for (let j = 0; j <= right.length; j += 1) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= left.length; i += 1) {
      for (let j = 1; j <= right.length; j += 1) {
        const cost = left[i - 1] === right[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[left.length][right.length];
  }

  private normalizeText(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
