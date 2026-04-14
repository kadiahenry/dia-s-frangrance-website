import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

export interface OrderItemPayload {
  name: string;
  qty: number;
  price: number;
  image: string;
}

export interface OrderPayload {
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  deliveryMethod: string;
  codLocation: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentId: string;
  subtotal: number;
  taxIncluded: number;
  deliveryFee: number;
  total: number;
  items: OrderItemPayload[];
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  createOrder(payload: OrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, payload);
  }

  getMyOrders<T>(): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/my`);
  }
}
