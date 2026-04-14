import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CartService, CartItem } from 'src/app/core/services/cart.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { OrderPayload, OrderService } from 'src/app/core/services/order.service';
import { PayPalConfig, PaymentService } from 'src/app/core/services/payment.service';
import { SeoService } from 'src/app/core/services/seo.service';

type DeliveryMethod = 'knutsford' | 'postoffice' | 'cod';
type PaymentMethod = 'paypal' | 'cod' | 'card';
type CheckoutStep = 'shipping' | 'billing' | 'review';
type CardBrand = 'visa' | 'amex' | 'mastercard' | 'discover';
interface CardBrandOption {
  key: CardBrand;
  label: string;
  badge: string;
}

interface OrderSummaryItem {
  name: string;
  qty: number;
  price: number;
  image: string;
}

interface OrderSummary {
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  deliveryMethod: DeliveryMethod;
  codLocation: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  paymentId: string;
  subtotal: number;
  taxIncluded: number;
  deliveryFee: number;
  total: number;
  items: OrderSummaryItem[];
  orderNumber?: string;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => { render: (selector: string) => Promise<void> };
    };
  }
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  private readonly paypalScriptId = 'paypal-js-sdk';

  cartItems: CartItem[] = [];
  subtotal = 0;
  taxRate = 0.15;
  paymentMethod: PaymentMethod = 'paypal';
  currentStep: CheckoutStep = 'shipping';
  paymentError = '';
  paymentSuccess = '';
  isLoadingPayPal = false;
  isPayPalReady = false;
  private paypalConfig?: PayPalConfig;
  saveToAddresses = false;
  useAddressForBilling = true;
  checkoutPrivacyConsent = false;

  form = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    parish: '',
    country: 'Jamaica',
    deliveryMethod: 'knutsford' as DeliveryMethod,
    codLocation: 'Spanish Town - LOJ Plaza',
    notes: ''
  };
  cardForm = {
    cardholderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  };
  selectedCardBrand: CardBrand = 'visa';

  codLocations = [
    { label: 'Spanish Town - LOJ Plaza', fee: 300 },
    { label: 'Maypen - The Mall', fee: 600 },
    { label: 'Half Way Tree - Bus Park', fee: 800 }
  ];

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    private authService: AuthService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private router: Router,
    private title: Title,
    private meta: Meta,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.seoService.setPage({
      title: 'Checkout',
      description: "Complete your Dia's Fragrances and More order.",
      path: '/checkout',
      robots: 'noindex,nofollow'
    });
    this.seoService.clearStructuredData();

    this.cartItems = this.cartService.getCart();
    const currentUser = this.authService.getUser();

    if (currentUser) {
      const [firstName = '', ...rest] = (currentUser.name || '').split(' ');
      this.form.firstName = firstName;
      this.form.lastName = rest.join(' ');
      this.form.email = currentUser.email || '';
      this.form.phone = currentUser.phone || '';
      this.form.addressLine1 = currentUser.address_line_1 || '';
      this.form.addressLine2 = currentUser.address_line_2 || '';
      this.form.city = currentUser.city || '';
      this.form.parish = currentUser.parish || '';
      this.form.country = currentUser.country || 'Jamaica';
    }

    if (this.cartItems.length === 0) {
      this.router.navigate(['/products']);
      return;
    }

    this.subtotal = this.getSubtotal();
    const preferredPayment = this.route.snapshot.queryParamMap.get('payment');
    if (preferredPayment === 'paypal') {
      this.paymentMethod = 'paypal';
      this.loadPayPalConfig();
    } else if (preferredPayment === 'cod') {
      this.paymentMethod = 'cod';
    } else {
      this.paymentMethod = 'card';
    }
  }

  getSubtotal(): number {
    return this.roundCurrency(
      this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );
  }

  get taxIncluded(): number {
    return this.roundCurrency(this.subtotal - this.subtotal / (1 + this.taxRate));
  }

  get deliveryFee(): number {
    if (this.form.deliveryMethod === 'knutsford') return 300;
    if (this.form.deliveryMethod === 'postoffice') return 300;

    const loc = this.codLocations.find(x => x.label === this.form.codLocation);
    return loc ? loc.fee : 300;
  }

  get total(): number {
    return this.roundCurrency(this.subtotal + this.deliveryFee);
  }

  onDeliveryMethodChange(method: DeliveryMethod): void {
    this.form.deliveryMethod = method;

    if (method === 'cod' && !this.form.codLocation) {
      this.form.codLocation = this.codLocations[0].label;
    }
  }

  onPaymentMethodChange(method: PaymentMethod): void {
    this.paymentMethod = method;
    this.paymentError = '';
    this.paymentSuccess = '';

    if (method === 'paypal' && !this.paypalConfig) {
      this.loadPayPalConfig();
    } else if (method === 'paypal') {
      this.ensurePayPalButtons();
    }
  }

  goToBilling(): void {
    if (!this.validateShippingStep()) {
      return;
    }

    this.currentStep = 'billing';
    this.paymentError = '';
  }

  goToReview(): void {
    if (!this.validateBillingStep()) {
      return;
    }

    this.currentStep = 'review';
    this.paymentError = '';

    if (this.paymentMethod === 'paypal') {
      this.ensurePayPalButtons();
    }
  }

  editStep(step: CheckoutStep): void {
    this.currentStep = step;
    this.paymentError = '';
  }

  placeOrder(): void {
    if (!this.validateCheckoutForm()) {
      return;
    }

    void this.completeOrder({
      paymentMethod: this.paymentMethod,
      paymentStatus: 'pending',
      paymentId: ''
    });
  }

  private loadPayPalConfig(): void {
    this.isLoadingPayPal = true;

    this.paymentService.getPayPalConfig().subscribe({
      next: config => {
        this.paypalConfig = config;
        this.taxRate = config.taxRate || this.taxRate;
        this.ensurePayPalButtons();
      },
      error: err => {
        this.paymentError = err?.error?.message || 'Unable to load PayPal checkout.';
      },
      complete: () => {
        this.isLoadingPayPal = false;
      }
    });
  }

  private ensurePayPalButtons(): void {
    if (this.paymentMethod !== 'paypal' || !this.paypalConfig?.clientId) {
      return;
    }

    if (window.paypal) {
      this.renderPayPalButtons();
      return;
    }

    const existingScript = document.getElementById(this.paypalScriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => this.renderPayPalButtons(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = this.paypalScriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(this.paypalConfig.clientId)}&currency=${encodeURIComponent(this.paypalConfig.currency)}&intent=capture`;
    script.async = true;
    script.onload = () => this.renderPayPalButtons();
    script.onerror = () => {
      this.paymentError = 'Unable to load PayPal checkout.';
    };
    document.body.appendChild(script);
  }

  private renderPayPalButtons(): void {
    if (!window.paypal || this.paymentMethod !== 'paypal') {
      return;
    }

    setTimeout(() => {
      const container = document.getElementById('paypal-button-container');
      if (!container) {
        return;
      }

      container.innerHTML = '';

      window.paypal?.Buttons({
        onClick: (_data: unknown, actions: { resolve: () => Promise<void>; reject: () => Promise<void> }) => {
          this.paymentError = '';
          if (!this.validateCheckoutForm()) {
            return actions.reject();
          }
          return actions.resolve();
        },
        createOrder: async () => {
          const data = await firstValueFrom(this.paymentService.createPayPalOrder(
            this.cartItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            this.deliveryFee
          ));

          if (!data.id) {
            throw new Error('Unable to create PayPal order.');
          }

          return data.id;
        },
        onApprove: async (data: { orderID: string }) => {
          const capture = await firstValueFrom(this.paymentService.capturePayPalOrder(data.orderID));

          this.paymentSuccess = 'Payment completed successfully.';
          void this.completeOrder({
            paymentMethod: 'paypal',
            paymentStatus: capture.status || 'COMPLETED',
            paymentId: capture.id || data.orderID
          });
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'PayPal checkout failed.';
          this.paymentError = message;
        }
      }).render('#paypal-button-container').then(() => {
        this.isPayPalReady = true;
      }).catch(() => {
        this.paymentError = 'Unable to render PayPal checkout.';
      });
    });
  }

  private validateShippingStep(): boolean {
    this.cartItems = this.cartService.getCart();
    this.subtotal = this.getSubtotal();

    if (!this.form.firstName.trim() || !this.form.lastName.trim() || !this.form.phone.trim()) {
      this.paymentError = 'Please enter your first name, last name, and phone number.';
      return false;
    }

    if (!this.form.addressLine1.trim() || !this.form.city.trim() || !this.form.parish.trim()) {
      this.paymentError = 'Please complete your shipping address.';
      return false;
    }

    if (this.cartItems.length === 0) {
      this.paymentError = 'Your cart is empty.';
      this.router.navigate(['/products']);
      return false;
    }

    this.paymentError = '';
    return true;
  }

  private validateBillingStep(): boolean {
    if (!this.form.email.trim()) {
      this.paymentError = 'Please enter your email address.';
      return false;
    }

    if (!this.checkoutPrivacyConsent) {
      this.paymentError = 'Please confirm that you consent to us using your information to process this order.';
      return false;
    }

    if (!this.paymentMethod) {
      this.paymentError = 'Please select a payment method.';
      return false;
    }

    if (this.paymentMethod === 'card') {
      if (!this.cardForm.cardholderName.trim()) {
        this.paymentError = 'Please enter the cardholder name.';
        return false;
      }

      if (!this.sanitizedCardNumber || this.sanitizedCardNumber.length < 13) {
        this.paymentError = 'Please enter a valid card number.';
        return false;
      }

      if (!this.cardForm.expiryMonth || !this.cardForm.expiryYear) {
        this.paymentError = 'Please enter the card expiry month and year.';
        return false;
      }

      if (!/^\d{3,4}$/.test(this.cardForm.cvv.trim())) {
        this.paymentError = 'Please enter a valid security code.';
        return false;
      }
    }

    this.paymentError = '';
    return true;
  }

  private validateCheckoutForm(): boolean {
    return this.validateShippingStep() && this.validateBillingStep();
  }

  private async completeOrder(payment: {
    paymentMethod: PaymentMethod;
    paymentStatus: string;
    paymentId: string;
  }): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      this.paymentError = 'Your session has expired. Please log in again.';
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/checkout' }
      });
      return;
    }

    const orderSummary: OrderSummary = {
      fullName: `${this.form.firstName.trim()} ${this.form.lastName.trim()}`.trim(),
      phone: this.form.phone.trim(),
      email: this.form.email.trim(),
      notes: this.form.notes.trim(),
      deliveryMethod: this.form.deliveryMethod,
      codLocation: this.form.deliveryMethod === 'cod' ? this.form.codLocation : '',
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      paymentId: payment.paymentId,
      subtotal: this.subtotal,
      taxIncluded: this.taxIncluded,
      deliveryFee: this.deliveryFee,
      total: this.total,
      items: this.cartItems.map(i => ({
        name: i.name,
        qty: i.quantity,
        price: i.price,
        image: i.image
      }))
    };

    const orderPayload: OrderPayload = {
      ...orderSummary
    };

    try {
      const savedOrder = await firstValueFrom(this.orderService.createOrder(orderPayload));
      orderSummary.paymentId = orderSummary.paymentId || savedOrder.id?.toString() || '';
      orderSummary.orderNumber = savedOrder.orderNumber;

      localStorage.setItem('lastOrder', JSON.stringify(orderSummary));
      this.cartService.clearCart();
      this.router.navigate(['/order-success'], { state: orderSummary });
    } catch (error) {
      this.paymentError = error instanceof Error ? error.message : 'Unable to complete order.';
    }
  }

  private roundCurrency(value: number): number {
    return Number(value.toFixed(2));
  }

  get cardBrands(): CardBrandOption[] {
    return [
      { key: 'visa', label: 'Visa', badge: 'VISA' },
      { key: 'amex', label: 'American Express', badge: 'AMEX' },
      { key: 'mastercard', label: 'Mastercard', badge: 'MC' },
      { key: 'discover', label: 'Discover', badge: 'DISC' }
    ];
  }

  get sanitizedCardNumber(): string {
    return this.cardForm.cardNumber.replace(/\D/g, '');
  }

  get maskedCardNumber(): string {
    const digits = this.sanitizedCardNumber;
    if (!digits) {
      return '';
    }

    const lastFour = digits.slice(-4);
    return `**** **** **** ${lastFour}`;
  }

  selectCardBrand(brand: CardBrand): void {
    this.selectedCardBrand = brand;
    this.onPaymentMethodChange('card');
  }

  formatCardNumber(): void {
    const digits = this.sanitizedCardNumber.slice(0, 16);
    this.cardForm.cardNumber = digits.replace(/(.{4})/g, '$1 ').trim();
  }

  get deliveryMethodLabel(): string {
    if (this.form.deliveryMethod === 'knutsford') {
      return 'Standard';
    }

    if (this.form.deliveryMethod === 'postoffice') {
      return 'Post Office';
    }

    return 'Cash on Delivery';
  }

  get paymentMethodLabel(): string {
    if (this.paymentMethod === 'paypal') {
      return 'PayPal';
    }

    if (this.paymentMethod === 'card') {
      return `${this.selectedCardBrand.toUpperCase()} ${this.maskedCardNumber || 'Card'}`;
    }

    return 'Cash on Delivery';
  }
}
