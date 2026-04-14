import { Component, OnInit } from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.css']
})
export class PrivacyComponent implements OnInit {

  constructor(private seoService: SeoService) { }

  ngOnInit(): void {
    this.seoService.setPage({
      title: 'Privacy Policy',
      description: 'Read the privacy policy for Dia\'s Fragrances and More and learn how your personal data is handled.',
      path: '/privacy',
      image: '/assets/images/logo.png',
      keywords: 'privacy policy, customer data, Dia fragrances privacy'
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy',
      description: 'Read the privacy policy for Dia\'s Fragrances and More and learn how your personal data is handled.',
      url: this.seoService.absoluteUrl('/privacy')
    });
  }

}
