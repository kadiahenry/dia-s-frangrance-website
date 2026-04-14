import { Component, OnInit } from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-shipping',
  templateUrl: './shipping.component.html',
  styleUrls: ['./shipping.component.css']
})
export class ShippingComponent implements OnInit {

  constructor(private seoService: SeoService) { }

  ngOnInit(): void {
    this.seoService.setPage({
      title: 'Shipping Information',
      description: 'Learn about delivery times, shipping rates, and pickup options for Dia\'s Fragrances and More orders in Jamaica.',
      path: '/shipping',
      image: '/assets/images/logo.png',
      keywords: 'shipping Jamaica, delivery options, pickup options, Dia fragrances shipping'
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Shipping Information',
      description: 'Learn about delivery times, shipping rates, and pickup options for Dia\'s Fragrances and More orders in Jamaica.',
      url: this.seoService.absoluteUrl('/shipping')
    });
  }

}
