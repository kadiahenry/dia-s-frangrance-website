import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService } from 'src/app/core/services/auth.service';
import {
  HomeCategoryItem,
  HomeContentService,
  HomeShowcaseItem
} from 'src/app/core/services/home-content.service';
import { Product, ProductPayload, ProductService } from 'src/app/core/services/product.service';
import { environment } from 'src/environments/environment';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalCustomers: number;
}

interface DashboardOrder {
  order_number: string;
  full_name: string;
  email?: string;
  phone: string;
  payment_method: string;
  payment_status: string;
  total: number;
  created_at: string;
}

interface DashboardCustomer {
  full_name: string;
  email?: string;
  phone: string;
  orders_count: number;
  total_spent: number;
  last_order_at: string;
}

interface DashboardUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface DashboardResponse {
  stats: DashboardStats;
  recentOrders: DashboardOrder[];
  customers: DashboardCustomer[];
  users: DashboardUser[];
}

type HomeSectionKey = 'newArrivals' | 'bestSellers' | 'categories';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly homeEditorDefaults = this.createDefaultHomeContent();
  products: Product[] = [];
  isLoading = false;
  isSaving = false;
  isLoadingDashboard = false;
  editingProductId: number | null = null;
  selectedImageFile: File | null = null;
  selectedImageName = '';
  errorMessage = '';
  successMessage = '';
  dashboardError = '';
  homeErrorMessage = '';
  homeSuccessMessage = '';
  isSavingHomeContent = false;
  homeUploadingItemKey: string | null = null;
  homeSelectedImageNames: Record<string, string> = {};
  selectedHeroImageFile: File | null = null;
  selectedHeroImageName = '';
  private pendingEditProductId: number | null = null;

  stats: DashboardStats = {
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalCustomers: 0
  };

  recentOrders: DashboardOrder[] = [];
  customers: DashboardCustomer[] = [];
  users: DashboardUser[] = [];
  homeSectionLabels: Record<HomeSectionKey, string> = {
    newArrivals: 'New Arrivals',
    bestSellers: 'Best Sellers',
    categories: 'Shop by Category'
  };
  selectedHomeSection: HomeSectionKey = 'newArrivals';
  homeContent = this.createEmptyHomeContent();

  form: ProductPayload = {
    name: '',
    type: '',
    price: 0,
    image: '',
    image_url: '',
    category: 'Fragrances',
    description: '',
    notes: []
  };

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private productService: ProductService,
    private homeContentService: HomeContentService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/admin-login'], {
        queryParams: { returnUrl: '/admin-dashboard' }
      });
      return;
    }

    this.loadProducts();
    this.loadDashboardData();
    this.loadHomeContent();
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const editId = Number(params['edit']);
      this.pendingEditProductId = Number.isFinite(editId) && editId > 0 ? editId : null;
      this.applyPendingEdit();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.loadProducts(true).pipe(takeUntil(this.destroy$)).subscribe({
      next: products => {
        this.products = products;
        this.applyPendingEdit();
      },
      error: () => {
        this.errorMessage = 'Unable to load products.';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  loadDashboardData(): void {
    if (!this.authService.isAdmin()) {
      this.dashboardError = 'Your admin session has expired.';
      return;
    }

    this.isLoadingDashboard = true;
    this.dashboardError = '';

    this.http.get<DashboardResponse>(`${environment.apiUrl}/admin/dashboard`).pipe(takeUntil(this.destroy$)).subscribe({
      next: data => {
        this.stats = data.stats;
        this.recentOrders = data.recentOrders;
        this.customers = data.customers;
        this.users = data.users;
      },
      error: err => {
        this.dashboardError = err?.error?.message || 'Unable to load dashboard activity.';
      },
      complete: () => {
        this.isLoadingDashboard = false;
      }
    });
  }

  saveProduct(): void {
    if (!this.authService.isAdmin()) {
      this.errorMessage = 'Your admin session has expired. Please log in again.';
      this.router.navigate(['/admin-login'], {
        queryParams: { returnUrl: '/admin-dashboard' }
      });
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSaving = true;

    const payload: ProductPayload = {
      ...this.form,
      name: this.form.name.trim(),
      type: this.form.type?.trim() || '',
      image: this.form.image.trim(),
      image_url: (this.form.image_url || this.form.image).trim(),
      category: this.form.category.trim(),
      description: this.form.description?.trim() || '',
      notes: Array.isArray(this.form.notes) ? this.form.notes : []
    };

    if (this.selectedImageFile) {
      this.productService.uploadProductImage(this.selectedImageFile).subscribe({
        next: response => {
          payload.image = response.imageUrl;
          payload.image_url = response.imageUrl;
          this.form.image = response.imageUrl;
          this.form.image_url = response.imageUrl;
          this.selectedImageFile = null;
          this.selectedImageName = '';
          this.persistProduct(payload);
        },
        error: err => {
          this.errorMessage = err?.error?.message || 'Unable to upload image.';
          this.isSaving = false;
        }
      });
      return;
    }

    this.persistProduct(payload);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.selectedImageFile = file;
    this.selectedImageName = file ? file.name : '';
  }

  onHomeImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;

    if (!file) {
      return;
    }

    if (!this.authService.isAdmin()) {
      this.homeErrorMessage = 'Your admin session has expired. Please log in again.';
      input.value = '';
      return;
    }

    const item = this.currentHomeItems[index];

    if (!item) {
      input.value = '';
      return;
    }

    const itemKey = this.getHomeItemKey(index);
    this.homeErrorMessage = '';
    this.homeUploadingItemKey = itemKey;
    this.homeSelectedImageNames[itemKey] = file.name;

    this.productService.uploadProductImage(file).subscribe({
      next: response => {
        item.image = response.imageUrl;
      },
      error: err => {
        this.homeErrorMessage = err?.error?.message || 'Unable to upload home page image.';
        delete this.homeSelectedImageNames[itemKey];
      },
      complete: () => {
        if (this.homeUploadingItemKey === itemKey) {
          this.homeUploadingItemKey = null;
        }

        input.value = '';
      }
    });
  }

  onHeroImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.selectedHeroImageFile = file;
    this.selectedHeroImageName = file ? file.name : '';
  }

  editProduct(product: Product): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.editingProductId = product.id;
    this.form = {
      name: product.name,
      type: product.type || '',
      price: product.price,
      image: product.image,
      image_url: product.image_url || product.image,
      category: product.category,
      description: product.description || '',
      notes: product.notes || []
    };
    this.selectedImageFile = null;
    this.selectedImageName = '';
  }

  cancelEdit(): void {
    this.resetForm();
    this.errorMessage = '';
    this.successMessage = '';
  }

  deleteProduct(product: Product): void {
    if (!this.authService.isAdmin()) {
      this.errorMessage = 'Your admin session has expired. Please log in again.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products = this.productService.getAll();
        this.successMessage = `"${product.name}" was deleted.`;
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Unable to delete product.';
      }
    });
  }

  updateNotes(rawNotes: string): void {
    this.form.notes = rawNotes
      .split(',')
      .map(note => note.trim())
      .filter(Boolean);
  }

  addHomeItem(): void {
    if (this.selectedHomeSection === 'categories') {
      this.homeContent.categories.push({
        name: '',
        image: ''
      });
      return;
    }

    this.homeContent[this.selectedHomeSection].push({
      name: '',
      image: '',
      price: 0
    });
  }

  removeHomeItem(index: number): void {
    this.homeContent[this.selectedHomeSection].splice(index, 1);
  }

  getHomeItemPrice(index: number): number {
    if (this.selectedHomeSection === 'categories') {
      return 0;
    }

    return this.homeContent[this.selectedHomeSection][index]?.price || 0;
  }

  setHomeItemPrice(index: number, value: string | number): void {
    if (this.selectedHomeSection === 'categories') {
      return;
    }

    const parsed = Number(value);
    this.homeContent[this.selectedHomeSection][index].price = Number.isFinite(parsed) ? parsed : 0;
  }

  saveHomeContent(): void {
    if (!this.authService.isAdmin()) {
      this.homeErrorMessage = 'Your admin session has expired. Please log in again.';
      return;
    }

    this.homeErrorMessage = '';
    this.homeSuccessMessage = '';
    this.isSavingHomeContent = true;

    if (this.selectedHeroImageFile) {
      this.productService.uploadProductImage(this.selectedHeroImageFile).subscribe({
        next: response => {
          this.homeContent.heroImage = response.imageUrl;
          this.selectedHeroImageFile = null;
          this.selectedHeroImageName = '';
          this.persistHomeContent();
        },
        error: err => {
          this.homeErrorMessage = err?.error?.message || 'Unable to upload hero image.';
          this.isSavingHomeContent = false;
        }
      });
      return;
    }

    this.persistHomeContent();
  }

  resetHomeContent(): void {
    if (!this.authService.isAdmin()) {
      this.homeErrorMessage = 'Your admin session has expired. Please log in again.';
      return;
    }

    this.homeContentService.reset().subscribe({
      next: content => {
        this.homeContent = {
          heroImage: content.heroImage,
          newArrivals: content.newArrivals.map(item => ({ ...item })),
          bestSellers: content.bestSellers.map(item => ({ ...item })),
          categories: content.categories.map(item => ({ ...item }))
        };
        this.homeErrorMessage = '';
        this.homeSuccessMessage = 'Home page content reset to default.';
        this.loadHomeContent();
      },
      error: err => {
        this.homeErrorMessage = err?.error?.message || 'Unable to reset home page content.';
      }
    });
  }

  get currentHomeItems(): Array<HomeShowcaseItem | HomeCategoryItem> {
    return this.homeContent[this.selectedHomeSection];
  }

  getHomeItemKey(index: number): string {
    return `${this.selectedHomeSection}-${index}`;
  }

  private resetForm(): void {
    this.editingProductId = null;
    this.selectedImageFile = null;
    this.selectedImageName = '';
    this.form = {
      name: '',
      type: '',
      price: 0,
      image: '',
      image_url: '',
      category: 'Fragrances',
      description: '',
      notes: []
    };
  }

  private loadHomeContent(): void {
    this.homeContentService.load(true).subscribe({
      next: content => {
        this.homeContent = this.normalizeEditorHomeContent(content);
      },
      error: err => {
        this.homeErrorMessage = err?.error?.message || 'Unable to load home page content.';
      }
    });
  }

  private persistProduct(payload: ProductPayload): void {
    const request$ = this.editingProductId === null
      ? this.productService.addProduct(payload)
      : this.productService.updateProduct(this.editingProductId, payload);

    request$.subscribe({
      next: () => {
        this.loadProducts();
        this.successMessage = this.editingProductId === null
          ? 'Product added successfully.'
          : 'Product updated successfully.';
        this.resetForm();
      },
      error: err => {
        this.errorMessage = err?.error?.message || (
          this.editingProductId === null ? 'Unable to add product.' : 'Unable to update product.'
        );
      },
      complete: () => {
        this.isSaving = false;
      }
    });
  }

  private applyPendingEdit(): void {
    if (this.pendingEditProductId === null || !this.products.length) {
      return;
    }

    const product = this.products.find(item => item.id === this.pendingEditProductId);

    if (!product) {
      return;
    }

    this.editProduct(product);
    this.pendingEditProductId = null;
  }

  private persistHomeContent(): void {
    if (!this.authService.isAdmin()) {
      this.homeErrorMessage = 'Your admin session has expired. Please log in again.';
      this.isSavingHomeContent = false;
      return;
    }

    this.homeContentService.save({
      heroImage: this.homeContent.heroImage.trim(),
      newArrivals: this.homeContent.newArrivals
        .filter(item => item.name.trim() && item.image.trim())
        .map(item => ({
          ...item,
          price: Number(item.price) || 0
        })),
      bestSellers: this.homeContent.bestSellers
        .filter(item => item.name.trim() && item.image.trim())
        .map(item => ({
          ...item,
          price: Number(item.price) || 0
        })),
      categories: this.homeContent.categories
        .filter(item => item.name.trim() && item.image.trim())
        .map(item => ({ ...item }))
    }).pipe(
      finalize(() => {
        this.isSavingHomeContent = false;
      })
    ).subscribe({
      next: content => {
        this.homeContent = this.normalizeEditorHomeContent(content);
        this.homeSelectedImageNames = {};
        this.homeSuccessMessage = 'Home page content saved successfully.';
        this.loadHomeContent();
      },
      error: err => {
        this.homeErrorMessage = err?.error?.message || 'Unable to save home page content.';
      }
    });
  }

  private createEmptyHomeContent(): {
    heroImage: string;
    newArrivals: HomeShowcaseItem[];
    bestSellers: HomeShowcaseItem[];
    categories: HomeCategoryItem[];
  } {
    return this.normalizeEditorHomeContent(this.homeEditorDefaults);
  }

  private createDefaultHomeContent(): {
    heroImage: string;
    newArrivals: HomeShowcaseItem[];
    bestSellers: HomeShowcaseItem[];
    categories: HomeCategoryItem[];
  } {
    return {
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
  }

  private normalizeEditorHomeContent(content: {
    heroImage: string;
    newArrivals: HomeShowcaseItem[];
    bestSellers: HomeShowcaseItem[];
    categories: HomeCategoryItem[];
  }): {
    heroImage: string;
    newArrivals: HomeShowcaseItem[];
    bestSellers: HomeShowcaseItem[];
    categories: HomeCategoryItem[];
  } {
    const fallback = this.createDefaultHomeContent();

    return {
      heroImage: content.heroImage,
      newArrivals: this.fillShowcaseItems(content.newArrivals, fallback.newArrivals),
      bestSellers: this.fillShowcaseItems(content.bestSellers, fallback.bestSellers),
      categories: this.fillCategoryItems(content.categories, fallback.categories)
    };
  }

  private fillShowcaseItems(items: HomeShowcaseItem[], fallback: HomeShowcaseItem[]): HomeShowcaseItem[] {
    const nextItems = (items || []).slice(0, 3).map(item => ({ ...item }));

    for (const fallbackItem of fallback) {
      if (nextItems.length >= 3) {
        break;
      }

      nextItems.push({ ...fallbackItem });
    }

    return nextItems;
  }

  private fillCategoryItems(items: HomeCategoryItem[], fallback: HomeCategoryItem[]): HomeCategoryItem[] {
    const nextItems = (items || []).slice(0, 3).map(item => ({ ...item }));

    for (const fallbackItem of fallback) {
      if (nextItems.length >= 3) {
        break;
      }

      nextItems.push({ ...fallbackItem });
    }

    return nextItems;
  }
}
