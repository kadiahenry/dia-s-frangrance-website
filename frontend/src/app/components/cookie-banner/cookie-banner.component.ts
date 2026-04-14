import { Component } from '@angular/core';

import { CookieConsentService } from 'src/app/core/services/cookie-consent.service';

@Component({
  selector: 'app-cookie-banner',
  templateUrl: './cookie-banner.component.html',
  styleUrls: ['./cookie-banner.component.css']
})
export class CookieBannerComponent {
  constructor(public cookieConsentService: CookieConsentService) {}

  get isVisible(): boolean {
    return this.cookieConsentService.isBannerVisible;
  }

  get currentChoice(): string {
    return this.cookieConsentService.consent?.choice || '';
  }

  acceptCookies(): void {
    this.cookieConsentService.accept();
  }

  rejectCookies(): void {
    this.cookieConsentService.reject();
  }

  closePreferences(): void {
    this.cookieConsentService.closePreferences();
  }
}
