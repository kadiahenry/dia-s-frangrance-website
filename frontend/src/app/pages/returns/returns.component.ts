import { Component, OnInit } from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-returns',
  templateUrl: './returns.component.html',
  styleUrls: ['./returns.component.css']
})
export class ReturnsComponent implements OnInit {

  constructor(private seoService: SeoService) { }

  ngOnInit(): void {
    this.seoService.setPage({
      title: 'Return Policy',
      description: 'Read the return and refund policy for Dia\'s Fragrances and More, including eligibility and in-person return rules.',
      path: '/returns',
      image: '/assets/images/logo.png',
      keywords: 'return policy, refunds, exchanges, Dia fragrances returns'
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Return Policy',
      description: 'Read the return and refund policy for Dia\'s Fragrances and More, including eligibility and in-person return rules.',
      url: this.seoService.absoluteUrl('/returns')
    });
  }

}
