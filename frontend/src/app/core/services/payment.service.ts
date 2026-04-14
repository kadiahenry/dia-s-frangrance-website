import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

export interface PayPalConfig {
  clientId: string;
  currency: string;
  taxRate: number;
}

export interface PaymentCartItem {
  name: string;
  quantity: number;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/payments/paypal`;

  constructor(private http: HttpClient) {}

  getPayPalConfig(): Observable<PayPalConfig> {
    return this.http.get<PayPalConfig>(`${this.apiUrl}/config`);
  }

  createPayPalOrder(items: PaymentCartItem[], deliveryFee: number): Observable<{ id: string; status?: string }> {
    return this.http.post<{ id: string; status?: string }>(`${this.apiUrl}/orders`, {
      items,
      deliveryFee
    });
  }

  capturePayPalOrder(orderId: string): Observable<{ id?: string; status?: string }> {
    return this.http.post<{ id?: string; status?: string }>(`${this.apiUrl}/orders/${orderId}/capture`, {});
  }
}
