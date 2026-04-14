import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HomeCategoryItem, HomeContentService, HomeShowcaseItem } from 'src/app/core/services/home-content.service';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  shouldLoadHeroVideo = false;
  heroImage = 'assets/images/backgroundpic-home.jpg';
  newArrivals: HomeShowcaseItem[] = [];
  bestSellers: HomeShowcaseItem[] = [];
  categories: HomeCategoryItem[] = [];
  private heroVideoTimer?: number;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private homeContentService: HomeContentService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.seoService.setPage({
      title: 'Home',
      description: "Shop fragrances, body wash, lotions, body creams, scrubs, and oils from Dia's Fragrances and More.",
      path: '/',
      image: '/assets/images/logo.png',
      keywords: 'fragrances Jamaica, body wash, body cream, lotions, body mist, skincare'
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Store',
          name: "Dia's Fragrances and More",
          url: this.seoService.absoluteUrl('/'),
          image: this.seoService.absoluteUrl('/assets/images/logo.png'),
          description: "Shop fragrances, body wash, lotions, body creams, scrubs, and oils from Dia's Fragrances and More.",
          telephone: '+1-876-496-8099',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Brunswick Avenue',
            addressLocality: 'St Catherine',
            addressCountry: 'JM'
          }
        },
        {
          '@type': 'WebSite',
          name: "Dia's Fragrances and More",
          url: this.seoService.absoluteUrl('/'),
          potentialAction: {
            '@type': 'SearchAction',
            target: this.seoService.absoluteUrl('/products?search={search_term_string}'),
            'query-input': 'required name=search_term_string'
          }
        }
      ]
    });
  }

  ngOnInit(): void {
    this.homeContentService.content$
      .pipe(takeUntil(this.destroy$))
      .subscribe(content => {
        this.heroImage = content.heroImage;
        this.newArrivals = content.newArrivals;
        this.bestSellers = content.bestSellers;
        this.categories = content.categories;
      });

    if (!isPlatformBrowser(this.platformId)) {
      this.homeContentService.load()
        .pipe(takeUntil(this.destroy$))
        .subscribe();
      return;
    }

    const loadHomeContent = () => {
      this.homeContentService.load()
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    };

    const scheduleContentRefresh = () => {
      window.setTimeout(() => loadHomeContent(), 2200);
    };

    if (document.readyState === 'complete') {
      scheduleContentRefresh();
    } else {
      window.addEventListener('load', scheduleContentRefresh, { once: true });
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;

    if (prefersReducedMotion || isSmallScreen) {
      return;
    }

    const enableVideo = () => {
      this.heroVideoTimer = window.setTimeout(() => {
        this.shouldLoadHeroVideo = true;
      }, 3200);
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number; })
        .requestIdleCallback(() => enableVideo(), { timeout: 4000 });
      return;
    }

    enableVideo();
  }

  ngOnDestroy(): void {
    if (this.heroVideoTimer) {
      clearTimeout(this.heroVideoTimer);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  goToCategory(category: string): void {
    this.router.navigate(['/products'], {
      queryParams: { category }
    });
  }

  trackByName(_: number, item: { name: string }): string {
    return item.name;
  }

  get heroImageSrcSet(): string | null {
    if (this.heroImage !== 'assets/images/backgroundpic-home.jpg') {
      return null;
    }

    return 'assets/images/backgroundpic-home-320.jpg 320w, assets/images/backgroundpic-home-480.jpg 480w, assets/images/backgroundpic-home-640.jpg 640w, assets/images/backgroundpic-home.jpg 1280w';
  }

  getCardImageSrcSet(imagePath: string): string | null {
    switch (imagePath) {
      case 'assets/images/backgroundpic-home.jpg':
        return 'assets/images/backgroundpic-home-320.jpg 320w, assets/images/backgroundpic-home-480.jpg 480w, assets/images/backgroundpic-home-640.jpg 640w';
      case 'assets/images/gingham-card.jpg':
        return 'assets/images/gingham-card-196.jpg 196w, assets/images/gingham-card.jpg 420w';
      case 'assets/images/thousand-wishes-card.jpg':
        return 'assets/images/thousand-wishes-card-196.jpg 196w, assets/images/thousand-wishes-card.jpg 420w';
      default:
        return null;
    }
  }
}
