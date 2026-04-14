import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';

export interface UserSession {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  privacy_consent?: boolean;
  privacy_consent_at?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  parish?: string;
  country?: string;
  postal_code?: string;
  preferred_payment_method?: string;
  created_at?: string;
}

interface AuthResponse {
  user: UserSession;
}

interface ForgotPasswordResponse {
  message: string;
  resetUrl?: string;
}

interface BasicMessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly authStorageKey = 'authUser';
  private lastEmail = '';
  private readonly userSubject = new BehaviorSubject<UserSession | null>(this.readStoredUser());
  private profileRestoreAttempted = false;

  readonly user$ = this.userSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  getUser(): UserSession | null {
    return this.userSubject.value;
  }

  getDisplayName(): string {
    return this.getUser()?.name || this.getRememberedName() || 'Friend';
  }

  getRememberedName(): string {
    const rememberedEmail = this.lastEmail.trim().toLowerCase();

    if (!rememberedEmail) {
      return '';
    }

    const storedUser = this.userSubject.value;

    if (storedUser?.email === rememberedEmail) {
      return storedUser.name || this.buildNameFromEmail(rememberedEmail);
    }

    return this.buildNameFromEmail(rememberedEmail);
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }

  login(email: string, password: string): Observable<UserSession> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email: email.trim().toLowerCase(),
      password: password.trim()
    }).pipe(
      tap(response => this.setCustomerSession(response)),
      map(response => response.user)
    );
  }

  adminLogin(email: string, password: string): Observable<UserSession> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/admin-login`, {
      email: email.trim().toLowerCase(),
      password: password.trim()
    }).pipe(
      tap(response => this.setCustomerSession(response)),
      map(response => response.user)
    );
  }

  register(name: string, email: string, password: string, privacyConsent: boolean): Observable<UserSession> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      privacyConsent
    }).pipe(
      tap(response => this.setCustomerSession(response)),
      map(response => response.user)
    );
  }

  requestPasswordReset(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, {
      email: email.trim().toLowerCase()
    });
  }

  resetPassword(token: string, password: string): Observable<BasicMessageResponse> {
    return this.http.post<BasicMessageResponse>(`${this.apiUrl}/reset-password`, {
      token,
      password: password.trim()
    });
  }

  loadProfile(): Observable<UserSession | null> {
    return this.http.get<{ user: UserSession }>(`${this.apiUrl}/me`, {
    }).pipe(
      tap(response => this.updateStoredUser(response.user)),
      map(response => response.user),
      catchError(() => {
        this.clearStoredUser();
        return of(null);
      })
    );
  }

  restoreSessionSilently(): void {
    if (this.profileRestoreAttempted || !this.userSubject.value) {
      return;
    }

    this.profileRestoreAttempted = true;

    this.loadProfile().subscribe({
      error: () => undefined
    });
  }

  updateProfile(payload: {
    name: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    parish?: string;
    country?: string;
    postalCode?: string;
    preferredPaymentMethod?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Observable<UserSession> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/me`, payload).pipe(
      tap(response => this.setCustomerSession(response)),
      map(response => response.user)
    );
  }

  applyAuthenticatedUser(user: UserSession): void {
    this.lastEmail = user.email;
    this.userSubject.next(user);
    this.storeUser(user);
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.clearStoredUser();
      this.router.navigate(['/']);
    });
  }

  private setCustomerSession(response: AuthResponse): void {
    this.lastEmail = response.user.email;
    this.userSubject.next(response.user);
    this.storeUser(response.user);
  }

  private updateStoredUser(user: UserSession): void {
    this.lastEmail = user.email;
    this.userSubject.next(user);
    this.storeUser(user);
  }

  private buildNameFromEmail(email: string): string {
    const localPart = email.split('@')[0] || 'Friend';

    return localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private storeUser(user: UserSession): void {
    localStorage.setItem(this.authStorageKey, JSON.stringify(user));
  }

  private clearStoredUser(): void {
    this.userSubject.next(null);
    localStorage.removeItem(this.authStorageKey);
  }

  private readStoredUser(): UserSession | null {
    const saved = localStorage.getItem(this.authStorageKey);

    if (!saved) {
      return null;
    }

    try {
      const user = JSON.parse(saved) as UserSession;
      this.lastEmail = user?.email || '';
      return user?.email ? user : null;
    } catch {
      localStorage.removeItem(this.authStorageKey);
      return null;
    }
  }
}
