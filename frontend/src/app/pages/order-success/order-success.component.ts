import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface OrderState {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  deliveryMethod: string;
  codLocation?: string;
  paymentMethod?: 'paypal' | 'manual';
  paymentStatus?: string;
  paymentId?: string;
  subtotal: number;
  taxIncluded?: number;
  deliveryFee: number;
  total: number;
  items: { name: string; qty: number; price: number; image: string }[];
  orderNumber?: string;
}

@Component({
  selector: 'app-order-success',
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.css']
})
export class OrderSuccessComponent implements OnInit {
  order?: OrderState;
  orderNumber = '';
  deliveryMessage = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const stateOrder = nav?.extras.state as OrderState | undefined;

    if (stateOrder) {
      this.order = stateOrder;
      localStorage.setItem('lastOrder', JSON.stringify(stateOrder));
    } else {
      const saved = localStorage.getItem('lastOrder');
      this.order = saved ? (JSON.parse(saved) as OrderState) : undefined;
    }

    if (!this.order) {
      this.router.navigate(['/products']);
      return;
    }

    if (!this.order.orderNumber) {
      this.order.orderNumber = this.generateOrderNumber();
      localStorage.setItem('lastOrder', JSON.stringify(this.order));
    }

    this.orderNumber = this.order.orderNumber;
    this.deliveryMessage = this.getDeliveryMessage(this.order);
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  clearSavedOrder(): void {
    localStorage.removeItem('lastOrder');
  }

  private generateOrderNumber(): string {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `EOW-${random}`;
  }

  private getDeliveryMessage(order: OrderState): string {
    if (order.deliveryMethod === 'knutsford') {
      return 'Your package will be sent via Knutsford Express. You will pick up at the terminal.';
    }

    if (order.deliveryMethod === 'postoffice') {
      return 'Your package will be sent via the Post Office. We will contact you when it is ready for pickup.';
    }

    return `Cash on Delivery pickup scheduled at: ${order.codLocation}. Please have the exact amount ready.`;
  }
}
