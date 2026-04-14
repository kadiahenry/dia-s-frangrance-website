import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type CookieConsentChoice = 'accepted' | 'rejected';

interface CookieConsentState {
  choice: CookieConsentChoice;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  private readonly storageKey = 'cookieConsent';
  private readonly consentSubject = new BehaviorSubject<CookieConsentState | null>(this.readStoredConsent());
  private readonly preferencesOpenSubject = new BehaviorSubject<boolean>(false);

  readonly consent$ = this.consentSubject.asObservable();
  readonly preferencesOpen$ = this.preferencesOpenSubject.asObservable();

  get consent(): CookieConsentState | null {
    return this.consentSubject.value;
  }

  get isBannerVisible(): boolean {
    return this.preferencesOpenSubject.value || !this.consentSubject.value;
  }

  accept(): void {
    this.saveConsent('accepted');
  }

  reject(): void {
    this.saveConsent('rejected');
  }

  reset(): void {
    localStorage.removeItem(this.storageKey);
    this.consentSubject.next(null);
    this.preferencesOpenSubject.next(true);
  }

  openPreferences(): void {
    this.preferencesOpenSubject.next(true);
  }

  closePreferences(): void {
    if (this.consentSubject.value) {
      this.preferencesOpenSubject.next(false);
    }
  }

  private saveConsent(choice: CookieConsentChoice): void {
    const state: CookieConsentState = {
      choice,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.storageKey, JSON.stringify(state));
    this.consentSubject.next(state);
    this.preferencesOpenSubject.next(false);
  }

  private readStoredConsent(): CookieConsentState | null {
    const saved = localStorage.getItem(this.storageKey);

    if (!saved) {
      return null;
    }

    try {
      const parsed = JSON.parse(saved) as CookieConsentState;
      return parsed?.choice ? parsed : null;
    } catch {
      return null;
    }
  }
}
