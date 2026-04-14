import { Component, OnInit } from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-accessibility',
  templateUrl: './accessibility.component.html',
  styleUrls: ['./accessibility.component.css']
})
export class AccessibilityComponent implements OnInit {

  constructor(private seoService: SeoService) { }

  ngOnInit(): void {
    this.seoService.setPage({
      title: 'Accessibility',
      description: 'Learn how Dia\'s Fragrances and More supports accessible browsing and inclusive shopping.',
      path: '/accessibility',
      image: '/assets/images/logo.png',
      keywords: 'accessibility statement, inclusive shopping, accessible website'
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Accessibility',
      description: 'Learn how Dia\'s Fragrances and More supports accessible browsing and inclusive shopping.',
      url: this.seoService.absoluteUrl('/accessibility')
    });
  }

}
