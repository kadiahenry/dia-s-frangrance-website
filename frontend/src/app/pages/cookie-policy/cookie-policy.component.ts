import { Component, OnInit } from '@angular/core';
import { CookieConsentService } from 'src/app/core/services/cookie-consent.service';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-cookie-policy',
  templateUrl: './cookie-policy.component.html',
  styleUrls: ['./cookie-policy.component.css']
})
export class CookiePolicyComponent implements OnInit {
  constructor(
    private seoService: SeoService,
    private cookieConsentService: CookieConsentService
  ) {}

  ngOnInit(): void {
    this.seoService.setPage({
      title: 'Cookie Policy',
      description: 'Learn how Dia\'s Fragrances and More uses cookies, what types of cookies are used, and how you can manage your cookie choices.',
      path: '/cookie-policy',
      image: '/assets/images/logo.png',
      keywords: 'cookie policy, tracking, website cookies, Dia fragrances cookies'
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Cookie Policy',
      description: 'Learn how Dia\'s Fragrances and More uses cookies, what types of cookies are used, and how you can manage your cookie choices.',
      url: this.seoService.absoluteUrl('/cookie-policy')
    });
  }

  get currentChoice(): string {
    return this.cookieConsentService.consent?.choice || 'not set';
  }

  openCookieSettings(): void {
    this.cookieConsentService.openPreferences();
  }

  acceptCookies(): void {
    this.cookieConsentService.accept();
  }

  rejectCookies(): void {
    this.cookieConsentService.reject();
  }

  resetCookies(): void {
    this.cookieConsentService.reset();
  }
}
