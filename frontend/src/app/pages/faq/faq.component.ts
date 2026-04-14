import { Component, OnInit } from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent implements OnInit {
  faqs = [
    {
      question: 'How long does shipping take?',
      answer: 'Most orders are processed as quickly as possible and then shipped based on the delivery method you choose at checkout. Standard delivery timelines usually fall within 1 to 7 business days, while pickup options depend on dispatch confirmation.'
    },
    {
      question: 'Do you offer Cash on Delivery?',
      answer: 'Yes. Cash on Delivery is available for eligible pickup locations. If you choose that option during checkout, you will see the available locations and the fee tied to each one before you place your order.'
    },
    {
      question: 'Can I track my order after I place it?',
      answer: 'Yes. Once your order is saved to your account, you can review it in Order History. You will be able to see your order date, items purchased, payment method, and current payment status there.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We currently support Card, PayPal, and Cash on Delivery where available. Card checkout and PayPal checkout are presented as separate payment options during checkout, and your saved payment preference can be managed from the My Payment Methods section of your account.'
    },
    {
      question: 'Can I update my account details later?',
      answer: 'Yes. You can update your personal information, address details, and payment preference from the My Account area at any time after signing in.'
    },
    {
      question: 'What if I search for a product and cannot find it?',
      answer: 'Our product search now checks for close spellings too. If your search is similar to a product we carry, we will show similar results with a helpful message. If nothing matches, the page will let you know the item is not available. Contact us via email or WhatsApp if you need further assistance.'
    },
    {
      question: 'Do you accept returns or exchanges?',
      answer: 'Please review our Returns page for the most up-to-date guidance on eligibility, timing, and how to contact us before sending anything back.'
    },
    {
      question: 'How can I contact customer support?',
      answer: 'You can reach us through the Contact page, via email at support@diasfragrance.com, or by phone at +1 (876) 496-8099 if you need help with an order, product question, or account issue.'
    }
  ];

  constructor(
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    const description = 'Find answers to common questions about orders, shipping, payment methods, account support, and shopping with Dia\'s Fragrances and More.';

    this.seoService.setPage({
      title: 'FAQ',
      description,
      path: '/faq',
      image: '/assets/images/logo.png',
      keywords: 'FAQ, shipping questions, payment methods, returns, fragrance store help'
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: this.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    });
  }
}

