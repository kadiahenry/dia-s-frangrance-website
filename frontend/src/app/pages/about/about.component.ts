import { Component, OnInit } from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor(private seoService: SeoService) { }

  ngOnInit(): void {
    this.seoService.setPage({
      title: 'About Us',
      description: "Learn about Dia's Fragrances and More, our story, best-selling scents, and bath and body care collection.",
      path: '/about',
      image: '/assets/images/logo.png',
      keywords: 'about Dia fragrances, Jamaica body care store, fragrance shop'
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Dia\'s Fragrances and More',
      description: "Learn about Dia's Fragrances and More, our story, best-selling scents, and bath and body care collection.",
      mainEntity: {
        '@type': 'Store',
        name: "Dia's Fragrances and More",
        foundingDate: '2023',
        telephone: '+1-876-496-8099',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Brunswick Avenue',
          addressLocality: 'St Catherine',
          addressCountry: 'JM'
        }
      }
    });
  }

}
