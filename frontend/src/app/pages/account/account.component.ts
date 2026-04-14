import { Component, OnInit, OnDestroy } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService, UserSession } from 'src/app/core/services/auth.service';
import { OrderService } from 'src/app/core/services/order.service';

interface CustomerOrder {
  id: number;
  order_number: string;
  created_at: string;
  total: number;
  payment_method?: string;
  payment_status?: string;
}

interface AccountLink {
  label: string;
  anchor?: string;
  route?: string;
  fragment?: string;
  description: string;
  icon: 'account' | 'info' | 'orders' | 'payment' | 'address' | 'wishlist';
}

interface SavedPaymentCard {
  id: string;
  cardholderName: string;
  brand: string;
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

type AccountSection = 'overview' | 'my-info' | 'payment-methods' | 'addresses';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit, OnDestroy {
  user: UserSession | null = null;
  displayName = '';
  recentOrders: CustomerOrder[] = [];
  isLoading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();
  successMessage = '';
  activeSection: AccountSection = 'overview';
  showAddCardForm = false;
  showEditContactForm = false;
  showEditAddressForm = false;
  showEditPasswordForm = false;
  savedPaymentCards: SavedPaymentCard[] = [];
  paymentCardConsent = false;

  profileForm = {
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    parish: '',
    country: 'Jamaica',
    postalCode: '',
    preferredPaymentMethod: 'PayPal',
    currentPassword: '',
    newPassword: ''
  };
  paymentCardForm = {
    cardholderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  };

  accountLinks: AccountLink[] = [
    { label: 'My Account', anchor: 'overview', description: 'See your saved details, orders, and shortcuts.', icon: 'account' },
    { label: 'My Info', anchor: 'my-info', description: 'Update your personal details and password.', icon: 'info' },
    { label: 'Order History', route: '/orders', description: 'Review your recent purchases.', icon: 'orders' },
    { label: 'My Love-It List', route: '/wishlist', description: 'Jump back into your saved favorites.', icon: 'wishlist' },
    { label: 'Payment Methods', anchor: 'payment-methods', description: 'Save your preferred checkout method.', icon: 'payment' },
    { label: 'Addresses', anchor: 'addresses', description: 'Keep your default delivery address ready.', icon: 'address' }
  ];

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle("My Account | Dia's Fragrances and More");
    this.meta.updateTag({
      name: 'description',
      content: "Manage your Dia's Fragrances and More account details and order history."
    });
    this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' });
    this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe(fragment => {
      this.activeSection = this.normalizeSection(fragment);
    });

    this.loadAccount();
  }

  loadAccount(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.loadProfile().subscribe({
      next: user => {
        this.user = user;
        this.displayName = user?.name || this.authService.getDisplayName();
        this.profileForm.name = user?.name || '';
        this.profileForm.phone = user?.phone || '';
        this.profileForm.addressLine1 = user?.address_line_1 || '';
        this.profileForm.addressLine2 = user?.address_line_2 || '';
        this.profileForm.city = user?.city || '';
        this.profileForm.parish = user?.parish || '';
        this.profileForm.country = user?.country || 'Jamaica';
        this.profileForm.postalCode = user?.postal_code || '';
        this.profileForm.preferredPaymentMethod = user?.preferred_payment_method || 'PayPal';
        this.loadSavedPaymentCards();
        this.loadRecentOrders();
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Unable to load your account.';
        this.isLoading = false;
      }
    });
  }

  saveProfile(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.profileForm.name.trim()) {
      this.errorMessage = 'Please enter your name.';
      return;
    }

    this.authService.updateProfile({
      name: this.profileForm.name.trim(),
      phone: this.profileForm.phone.trim(),
      addressLine1: this.profileForm.addressLine1.trim(),
      addressLine2: this.profileForm.addressLine2.trim(),
      city: this.profileForm.city.trim(),
      parish: this.profileForm.parish.trim(),
      country: this.profileForm.country.trim(),
      postalCode: this.profileForm.postalCode.trim(),
      preferredPaymentMethod: this.profileForm.preferredPaymentMethod.trim(),
      currentPassword: this.profileForm.currentPassword.trim(),
      newPassword: this.profileForm.newPassword.trim()
    }).subscribe({
      next: user => {
        this.user = user;
        this.successMessage = 'Your account details were updated.';
        this.profileForm.currentPassword = '';
        this.profileForm.newPassword = '';
        this.showEditContactForm = false;
        this.showEditAddressForm = false;
        this.showEditPasswordForm = false;
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Unable to update your account.';
      }
    });
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }

  signOut(): void {
    this.authService.logout();
  }

  get hasSavedAddress(): boolean {
    return !!(
      this.profileForm.addressLine1.trim() ||
      this.profileForm.addressLine2.trim() ||
      this.profileForm.city.trim() ||
      this.profileForm.parish.trim() ||
      this.profileForm.postalCode.trim() ||
      this.profileForm.phone.trim()
    );
  }

  get formattedAddressLines(): string[] {
    const lines = [
      this.profileForm.addressLine1.trim(),
      this.profileForm.addressLine2.trim(),
      [this.profileForm.city.trim(), this.profileForm.parish.trim()].filter(Boolean).join(', '),
      [this.profileForm.country.trim() || 'Jamaica', this.profileForm.postalCode.trim()].filter(Boolean).join(', '),
      this.profileForm.phone.trim()
    ];

    return lines.filter(Boolean);
  }

  get contactDetailLines(): string[] {
    return [
      this.profileForm.name.trim(),
      this.user?.email || '',
      this.profileForm.phone.trim(),
      this.profileForm.country.trim()
    ].filter(Boolean);
  }

  openSection(section: AccountSection): void {
    this.router.navigate(['/account'], {
      fragment: section === 'overview' ? undefined : section
    });
  }

  openAnchor(anchor: string | undefined): void {
    this.openSection(this.normalizeSection(anchor));
  }

  openLink(link: AccountLink): void {
    if (link.route) {
      this.router.navigate([link.route], {
        fragment: link.fragment
      });
      return;
    }

    this.openAnchor(link.anchor);
  }

  isActiveLink(link: AccountLink): boolean {
    return !link.route && this.normalizeSection(link.anchor) === this.activeSection;
  }

  private normalizeSection(fragment: string | null | undefined): AccountSection {
    if (fragment === 'my-info' || fragment === 'payment-methods' || fragment === 'addresses') {
      return fragment;
    }

    return 'overview';
  }

  openAddCardForm(): void {
    this.showAddCardForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openContactEditor(): void {
    this.showEditContactForm = true;
  }

  openAddressEditor(): void {
    this.showEditAddressForm = true;
  }

  openPasswordEditor(): void {
    this.showEditPasswordForm = true;
  }

  closeContactEditor(): void {
    this.showEditContactForm = false;
  }

  closeAddressEditor(): void {
    this.showEditAddressForm = false;
  }

  closePasswordEditor(): void {
    this.showEditPasswordForm = false;
    this.profileForm.currentPassword = '';
    this.profileForm.newPassword = '';
  }

  cancelAddCard(): void {
    this.showAddCardForm = false;
    this.resetPaymentCardForm();
  }

  savePaymentCard(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const cardholderName = this.paymentCardForm.cardholderName.trim();
    const cardNumber = this.paymentCardForm.cardNumber.replace(/\D/g, '');
    const expiryMonth = this.paymentCardForm.expiryMonth.trim();
    const expiryYear = this.paymentCardForm.expiryYear.trim();
    const cvv = this.paymentCardForm.cvv.trim();

    if (!cardholderName) {
      this.errorMessage = 'Please enter the cardholder name.';
      return;
    }

    if (cardNumber.length < 13 || cardNumber.length > 19) {
      this.errorMessage = 'Please enter a valid card number.';
      return;
    }

    if (!/^\d{2}$/.test(expiryMonth) || Number(expiryMonth) < 1 || Number(expiryMonth) > 12) {
      this.errorMessage = 'Please enter a valid expiry month.';
      return;
    }

    if (!/^\d{2}$/.test(expiryYear)) {
      this.errorMessage = 'Please enter a valid expiry year.';
      return;
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      this.errorMessage = 'Please enter a valid security code.';
      return;
    }

    if (!this.paymentCardConsent) {
      this.errorMessage = 'Please consent to us storing your card details for future checkout convenience.';
      return;
    }

    const newCard: SavedPaymentCard = {
      id: `${Date.now()}`,
      cardholderName,
      brand: this.detectCardBrand(cardNumber),
      lastFour: cardNumber.slice(-4),
      expiryMonth,
      expiryYear,
      isDefault: this.savedPaymentCards.length === 0
    };

    this.savedPaymentCards = this.savedPaymentCards.map(card => ({
      ...card,
      isDefault: newCard.isDefault ? false : card.isDefault
    }));
    this.savedPaymentCards = [...this.savedPaymentCards, newCard];
    this.persistSavedPaymentCards();
    this.profileForm.preferredPaymentMethod = `${newCard.brand} ending in ${newCard.lastFour}`;
    this.resetPaymentCardForm();
    this.showAddCardForm = false;
    this.successMessage = 'New card added successfully.';
  }

  makeDefaultCard(cardId: string): void {
    this.savedPaymentCards = this.savedPaymentCards.map(card => ({
      ...card,
      isDefault: card.id === cardId
    }));
    const defaultCard = this.savedPaymentCards.find(card => card.id === cardId);
    if (defaultCard) {
      this.profileForm.preferredPaymentMethod = `${defaultCard.brand} ending in ${defaultCard.lastFour}`;
    }
    this.persistSavedPaymentCards();
    this.successMessage = 'Default payment card updated.';
    this.errorMessage = '';
  }

  deletePaymentCard(cardId: string): void {
    const removedCard = this.savedPaymentCards.find(card => card.id === cardId);
    this.savedPaymentCards = this.savedPaymentCards.filter(card => card.id !== cardId);

    if (removedCard?.isDefault && this.savedPaymentCards.length) {
      this.savedPaymentCards = this.savedPaymentCards.map((card, index) => ({
        ...card,
        isDefault: index === 0
      }));
      const nextDefault = this.savedPaymentCards[0];
      this.profileForm.preferredPaymentMethod = `${nextDefault.brand} ending in ${nextDefault.lastFour}`;
    }

    if (!this.savedPaymentCards.length) {
      this.profileForm.preferredPaymentMethod = 'PayPal';
    }

    this.persistSavedPaymentCards();
    this.successMessage = 'Payment card removed.';
    this.errorMessage = '';
  }

  formatPaymentCardNumber(): void {
    const digits = this.paymentCardForm.cardNumber.replace(/\D/g, '').slice(0, 19);
    this.paymentCardForm.cardNumber = digits.replace(/(.{4})/g, '$1 ').trim();
  }

  get hasSavedPaymentCards(): boolean {
    return this.savedPaymentCards.length > 0;
  }

  private loadSavedPaymentCards(): void {
    const storageKey = this.getSavedCardsStorageKey();
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      this.savedPaymentCards = [];
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SavedPaymentCard[];
      this.savedPaymentCards = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.savedPaymentCards = [];
    }
  }

  private persistSavedPaymentCards(): void {
    localStorage.setItem(this.getSavedCardsStorageKey(), JSON.stringify(this.savedPaymentCards));
  }

  private getSavedCardsStorageKey(): string {
    return `dias_saved_cards_${this.user?.email || 'guest'}`;
  }

  private resetPaymentCardForm(): void {
    this.paymentCardForm = {
      cardholderName: '',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: ''
    };
    this.paymentCardConsent = false;
  }

  private detectCardBrand(cardNumber: string): string {
    if (cardNumber.startsWith('4')) {
      return 'Visa';
    }

    if (/^3[47]/.test(cardNumber)) {
      return 'American Express';
    }

    if (/^5[1-5]/.test(cardNumber) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(cardNumber)) {
      return 'Mastercard';
    }

    if (/^6(?:011|5)/.test(cardNumber)) {
      return 'Discover';
    }

    return 'Card';
  }

  private loadRecentOrders(): void {
    if (!this.authService.isLoggedIn()) {
      this.isLoading = false;
      return;
    }

    this.orderService.getMyOrders<CustomerOrder[]>().pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: orders => {
        this.recentOrders = orders.slice(0, 3);
      },
      error: () => {
        this.recentOrders = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
