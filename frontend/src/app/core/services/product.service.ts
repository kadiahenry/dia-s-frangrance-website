import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { buildProductSlug } from '../utils/product-path';

export interface Product {
  id: number;
  slug?: string;
  name: string;
  price: number;
  image: string;
  image_url?: string;
  category: string;
  type?: string;
  description?: string;
  notes?: string[];
}

export type ProductPayload = Omit<Product, 'id'>;

export interface UploadResponse {
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;
  private readonly uploadsUrl = `${environment.apiUrl}/uploads`;
  private readonly productsCacheKey = 'productsCache';
  private readonly productsCacheTtlMs = 15 * 60 * 1000;
  private readonly productsSubject = new BehaviorSubject<Product[]>(this.readStoredProducts());
  readonly products$ = this.productsSubject.asObservable();
  private loadProductsRequest$?: Observable<Product[]>;

  constructor(private http: HttpClient) {}

  loadProducts(force = false): Observable<Product[]> {
    if (!force && this.productsSubject.value.length) {
      return of(this.productsSubject.value);
    }

    if (!force && this.loadProductsRequest$) {
      return this.loadProductsRequest$;
    }

    this.loadProductsRequest$ = this.http.get<Product[]>(this.apiUrl).pipe(
      tap(products => {
        this.productsSubject.next(products);
        this.storeProducts(products);
      }),
      shareReplay(1),
      finalize(() => {
        this.loadProductsRequest$ = undefined;
      }),
      catchError(() => of(this.productsSubject.value))
    );

    return this.loadProductsRequest$;
  }

  getAll(): Product[] {
    return this.productsSubject.value;
  }

  warmProductsCache(): void {
    this.loadProducts().subscribe({
      error: () => undefined
    });
  }

  getById(id: number): Product | undefined {
    return this.productsSubject.value.find(product => product.id === id);
  }

  getBySlug(slug: string): Product | undefined {
    return this.productsSubject.value.find(product => this.resolveProductSlug(product) === slug);
  }

  fetchById(id: number): Observable<Product | undefined> {
    const cached = this.getById(id);

    if (cached) {
      return of(cached);
    }

    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      tap(product => {
        const current = this.productsSubject.value;
        if (!current.some(item => item.id === product.id)) {
          this.productsSubject.next([...current, product]);
        }
      }),
      map(product => product),
      catchError(() => of(undefined))
    );
  }

  fetchBySlug(slug: string): Observable<Product | undefined> {
    const cached = this.getBySlug(slug);

    if (cached) {
      return of(cached);
    }

    return this.http.get<Product>(`${this.apiUrl}/slug/${encodeURIComponent(slug)}`).pipe(
      tap(product => {
        const current = this.productsSubject.value;
        if (!current.some(item => item.id === product.id)) {
          this.productsSubject.next([...current, product]);
        }
      }),
      map(product => product),
      catchError(() => of(undefined))
    );
  }

  addProduct(product: ProductPayload): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product).pipe(
      tap(created => {
        this.productsSubject.next([...this.productsSubject.value, created]);
      })
    );
  }

  updateProduct(id: number, product: ProductPayload): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product).pipe(
      tap(updated => {
        this.productsSubject.next(
          this.productsSubject.value.map(item => item.id === id ? updated : item)
        );
      })
    );
  }

  uploadProductImage(file: File): Observable<UploadResponse> {
    return new Observable<UploadResponse>(observer => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const base64 = result.includes(',') ? result.split(',')[1] : result;

        this.http.post<UploadResponse>(this.uploadsUrl, {
          filename: file.name,
          contentType: file.type,
          data: base64
        }).subscribe({
          next: response => {
            observer.next(response);
            observer.complete();
          },
          error: error => observer.error(error)
        });
      };

      reader.onerror = () => {
        observer.error(new Error('Unable to read image file.'));
      };

      reader.readAsDataURL(file);
    });
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.productsSubject.next(this.productsSubject.value.filter(product => product.id !== id));
      })
    );
  }

  private storeProducts(products: Product[]): void {
    localStorage.setItem(this.productsCacheKey, JSON.stringify({
      updatedAt: Date.now(),
      items: products
    }));
  }

  private readStoredProducts(): Product[] {
    const saved = localStorage.getItem(this.productsCacheKey);

    if (!saved) {
      return [];
    }

    try {
      const parsed = JSON.parse(saved) as { updatedAt?: number; items?: Product[] };

      if (!parsed?.updatedAt || !Array.isArray(parsed.items)) {
        return [];
      }

      if (Date.now() - parsed.updatedAt > this.productsCacheTtlMs) {
        localStorage.removeItem(this.productsCacheKey);
        return [];
      }

      return parsed.items;
    } catch {
      localStorage.removeItem(this.productsCacheKey);
      return [];
    }
  }

  private resolveProductSlug(product: Product): string {
    return product.slug || buildProductSlug(product.name, product.type || '');
  }
}
