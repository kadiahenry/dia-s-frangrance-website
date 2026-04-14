import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';

export interface WishlistItem {
  id: number;
  name: string;
  type?: string;
  price: number;
  image: string;
  image_url?: string;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private wishlist: WishlistItem[] = [];

  private wishlistCountSubject = new BehaviorSubject<number>(0);
  wishlistCount$ = this.wishlistCountSubject.asObservable();

  constructor(private authService: AuthService) {
    this.loadWishlist();
    this.wishlistCountSubject.next(this.getCount());
  }

  getWishlist(): WishlistItem[] {
    return this.wishlist;
  }

  getCount(): number {
    return this.wishlist.length;
  }

  isInWishlist(id: number): boolean {
    return this.wishlist.some(item => item.id === id);
  }

  add(item: WishlistItem): boolean {
    // ✅ Block if not logged in
    if (!this.authService.isLoggedIn()) return false;

    if (this.isInWishlist(item.id)) return true;

    this.wishlist.push(this.normalizeWishlistItem(item));
    this.saveWishlistAndUpdateCount();
    return true;
  }

  remove(id: number): boolean {
    // ✅ Block if not logged in
    if (!this.authService.isLoggedIn()) return false;

    this.wishlist = this.wishlist.filter(item => item.id !== id);
    this.saveWishlistAndUpdateCount();
    return true;
  }

  /**
   * ✅ Toggle add/remove
   * Returns false if blocked (not logged in)
   */
  toggle(item: WishlistItem): boolean {
    // ✅ Block if not logged in
    if (!this.authService.isLoggedIn()) return false;

    if (this.isInWishlist(item.id)) {
      this.remove(item.id);
    } else {
      this.add(item);
    }
    return true;
  }

  clear(): void {
    this.wishlist = [];
    localStorage.removeItem('wishlist');
    this.wishlistCountSubject.next(0);
  }

  private saveWishlistAndUpdateCount(): void {
    localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    this.wishlistCountSubject.next(this.getCount());
  }

  private loadWishlist(): void {
    const saved = localStorage.getItem('wishlist');
    this.wishlist = saved
      ? (JSON.parse(saved) as WishlistItem[]).map(item => this.normalizeWishlistItem(item))
      : [];
  }

  private normalizeWishlistItem(item: WishlistItem): WishlistItem {
    const normalizedImage = (item.image || item.image_url || '/assets/images/logo.png').trim();

    return {
      ...item,
      image: normalizedImage,
      image_url: item.image_url || item.image
    };
  }
}
