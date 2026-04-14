import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface HomeShowcaseItem {
  name: string;
  image: string;
  price?: number;
}

export interface HomeCategoryItem {
  name: string;
  image: string;
}

export interface HomeContentState {
  heroImage: string;
  newArrivals: HomeShowcaseItem[];
  bestSellers: HomeShowcaseItem[];
  categories: HomeCategoryItem[];
}

@Injectable({
  providedIn: 'root'
})
export class HomeContentService {
  private readonly showcaseItemCount = 3;
  private readonly categoryItemCount = 3;
  private readonly apiUrl = `${environment.apiUrl}/home-content`;
  private readonly backendBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
  private readonly homeContentCacheKey = 'homeContentCache';
  private readonly defaultContent: HomeContentState = {
    heroImage: 'assets/images/backgroundpic-home.jpg',
    newArrivals: [
      { name: 'In The Sun', price: 1800, image: 'assets/uploads/1774148769316-in-the-sun-set-removebg-preview.webp' },
      { name: 'Pearberry', price: 1800, image: 'assets/uploads/1774148446103-pearberry-set.webp' },
      { name: 'Bahamas Passionfruit', price: 1800, image: 'assets/uploads/1774983663459-bahamas-passionfruit-set--2-.webp' }
    ],
    bestSellers: [
      { name: 'Cucumber Melon', price: 1800, image: 'assets/uploads/1774983545707-cucumbermelonn.webp' },
      { name: 'Thousand Wishes', price: 1800, image: 'assets/images/thousand-wishes-card.jpg' },
      { name: 'Gingham', price: 1800, image: 'assets/images/gingham-card.jpg' }
    ],
    categories: [
      { name: 'Fragrances', image: 'assets/uploads/1774148463864-fragrances.webp' },
      { name: 'Body Wash', image: 'assets/uploads/1774148750036-bodywash-removebg-preview.webp' },
      { name: 'Lotion and Body Cream', image: 'assets/uploads/1774148480432-lotion-body-cream.webp' }
    ]
  };
  private readonly contentSubject = new BehaviorSubject<HomeContentState>(this.readStoredContent());
  private hasLoadedRemote = false;

  readonly content$ = this.contentSubject.asObservable();

  constructor(private http: HttpClient) {}

  get content(): HomeContentState {
    return this.contentSubject.value;
  }

  load(force = false): Observable<HomeContentState> {
    if (!force && this.hasLoadedRemote) {
      return of(this.contentSubject.value);
    }

    return this.http.get<HomeContentState>(this.apiUrl).pipe(
      timeout(15000),
      tap(content => {
        const normalized = this.normalizeContent(content);
        this.contentSubject.next(normalized);
        this.storeContent(normalized);
        this.hasLoadedRemote = true;
      }),
      catchError(() => of(this.contentSubject.value))
    );
  }

  save(content: HomeContentState): Observable<HomeContentState> {
    const normalized = this.normalizeContent(content);

    return this.http.put<HomeContentState>(this.apiUrl, normalized).pipe(
      timeout(15000),
      tap(savedContent => {
        const saved = this.normalizeContent(savedContent);
        this.contentSubject.next(saved);
        this.storeContent(saved);
        this.hasLoadedRemote = true;
      })
    );
  }

  reset(): Observable<HomeContentState> {
    return this.save(this.cloneContent(this.defaultContent));
  }

  private normalizeContent(content: Partial<HomeContentState>): HomeContentState {
    const defaultClone = this.cloneContent(this.defaultContent);

    return {
      heroImage: typeof content.heroImage === 'string' && content.heroImage.trim()
        ? this.optimizeImagePath(content.heroImage.trim())
        : this.defaultContent.heroImage,
      newArrivals: this.normalizeShowcaseItems(content.newArrivals, defaultClone.newArrivals),
      bestSellers: this.normalizeShowcaseItems(content.bestSellers, defaultClone.bestSellers),
      categories: this.normalizeCategoryItems(content.categories, defaultClone.categories)
    };
  }

  private normalizeShowcaseItems(items: Partial<HomeShowcaseItem>[] | undefined, fallback: HomeShowcaseItem[]): HomeShowcaseItem[] {
    const normalized = Array.isArray(items)
      ? items
        .map(item => ({
          name: String(item?.name || '').trim(),
          image: this.normalizeShowcaseImage(String(item?.name || '').trim(), String(item?.image || '').trim()),
          price: Number(item?.price) || 0
        }))
        .filter(item => item.name && item.image)
      : [];

    return this.fillWithFallback(normalized, fallback, this.showcaseItemCount);
  }

  private normalizeCategoryItems(items: Partial<HomeCategoryItem>[] | undefined, fallback: HomeCategoryItem[]): HomeCategoryItem[] {
    const normalized = Array.isArray(items)
      ? items
        .map(item => ({
          name: String(item?.name || '').trim(),
          image: this.optimizeImagePath(String(item?.image || '').trim())
        }))
        .filter(item => item.name && item.image)
      : [];

    return this.fillWithFallback(normalized, fallback, this.categoryItemCount);
  }

  private fillWithFallback<T extends { name: string; image: string }>(items: T[], fallback: T[], count: number): T[] {
    const nextItems = items.slice(0, count).map(item => ({ ...item }));

    for (const fallbackItem of fallback) {
      if (nextItems.length >= count) {
        break;
      }

      nextItems.push({ ...fallbackItem });
    }

    return nextItems;
  }

  private optimizeImagePath(path: string): string {
    const normalizedPath = path.replace(/\\/g, '/');

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    if (normalizedPath.startsWith('/uploads/')) {
      return `${this.backendBaseUrl}${normalizedPath}`;
    }

    if (normalizedPath.includes('1774148769316-in-the-sun-set-removebg-preview.webp')) {
      return 'assets/uploads/1774148769316-in-the-sun-set-removebg-preview.webp';
    }

    if (normalizedPath.includes('1774148446103-pearberry-set.webp')) {
      return 'assets/uploads/1774148446103-pearberry-set.webp';
    }

    if (normalizedPath.includes('1774983663459-bahamas-passionfruit-set--2-.webp')) {
      return 'assets/uploads/1774983663459-bahamas-passionfruit-set--2-.webp';
    }

    if (normalizedPath.includes('1774983545707-cucumbermelonn.webp')) {
      return 'assets/uploads/1774983545707-cucumbermelonn.webp';
    }

    if (normalizedPath.includes('1774148463864-fragrances.webp')) {
      return 'assets/uploads/1774148463864-fragrances.webp';
    }

    if (normalizedPath.includes('1774148750036-bodywash-removebg-preview.webp')) {
      return 'assets/uploads/1774148750036-bodywash-removebg-preview.webp';
    }

    if (normalizedPath.includes('1774148480432-lotion-body-cream.webp')) {
      return 'assets/uploads/1774148480432-lotion-body-cream.webp';
    }

    if (normalizedPath.endsWith('/backgroundpic.jpg') || normalizedPath.includes('backgroundpic.webp')) {
      return 'assets/images/backgroundpic-home.jpg';
    }

    if (normalizedPath.endsWith('/thousand-wishes.jpg') || normalizedPath.includes('thousand-wishes.webp')) {
      return 'assets/images/thousand-wishes-card.jpg';
    }

    if (
      normalizedPath.endsWith('/gihnam.jpg')
      || normalizedPath.includes('gihnam.webp')
    ) {
      return 'assets/images/gingham-card.jpg';
    }

    return path;
  }

  private normalizeShowcaseImage(name: string, imagePath: string): string {
    const normalizedImagePath = this.optimizeImagePath(imagePath);
    const normalizedName = name.trim().toLowerCase();

    if (
      normalizedName === 'cucumber melon'
      && (!normalizedImagePath || normalizedImagePath === 'assets/images/gingham-card.jpg')
    ) {
      return 'assets/uploads/1774983545707-cucumbermelonn.webp';
    }

    return normalizedImagePath;
  }

  private cloneContent(content: HomeContentState): HomeContentState {
    return {
      heroImage: content.heroImage,
      newArrivals: content.newArrivals.map(item => ({ ...item })),
      bestSellers: content.bestSellers.map(item => ({ ...item })),
      categories: content.categories.map(item => ({ ...item }))
    };
  }

  private storeContent(content: HomeContentState): void {
    localStorage.setItem(this.homeContentCacheKey, JSON.stringify(content));
  }

  private readStoredContent(): HomeContentState {
    const saved = localStorage.getItem(this.homeContentCacheKey);

    if (!saved) {
      return this.cloneContent(this.defaultContent);
    }

    try {
      return this.normalizeContent(JSON.parse(saved));
    } catch {
      localStorage.removeItem(this.homeContentCacheKey);
      return this.cloneContent(this.defaultContent);
    }
  }

}
