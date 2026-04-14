import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AuthService } from 'src/app/core/services/auth.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { environment } from 'src/environments/environment';

interface OrderItem {
  name: string;
  image: string;
  price: number;
  qty: number;
}

interface CustomerOrder {
  id: number;
  order_number: string;
  created_at: string;
  payment_method: string;
  payment_status: string;
  delivery_method: string;
  total: number;
  items: OrderItem[];
}

interface AccountNavLink {
  label: string;
  route: string;
  fragment?: string;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: CustomerOrder[] = [];
  isLoading = false;
  errorMessage = '';
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
    private authService: AuthService,
    private http: HttpClient,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.seoService.setPage({
      title: 'My Orders',
      description: "Review your Dia's Fragrances and More order history.",
      path: '/orders',
      robots: 'noindex,nofollow'
    });
    this.seoService.clearStructuredData();
    this.displayName = this.authService.getDisplayName();
    this.loadOrders();
  }

  signOut(): void {
    this.authService.logout();
  }

  get groupedOrders(): Array<{ label: string; orders: CustomerOrder[] }> {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const groups = new Map<string, CustomerOrder[]>();

    for (const order of this.orders) {
      const label = formatter.format(new Date(order.created_at));
      groups.set(label, [...(groups.get(label) || []), order]);
    }

    return Array.from(groups.entries()).map(([label, orders]) => ({
      label,
      orders
    }));
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<CustomerOrder[]>(`${environment.apiUrl}/orders/my`).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: orders => {
        this.orders = orders;
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Unable to load your orders.';
      }
    });
  }
}
