import { Component } from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-contactus',
  templateUrl: './contactus.component.html',
  styleUrls: ['./contactus.component.css']
})
export class ContactusComponent {

  // Simple model for template-driven forms (since you're already using FormsModule)
  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  // Basic UI feedback (no backend yet)
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private seoService: SeoService) {
    this.seoService.setPage({
      title: 'Contact Us',
      description: "Contact Dia's Fragrances and More for help with products, orders, and customer support.",
      path: '/contact',
      image: '/assets/images/logo.png',
      keywords: 'contact Dia fragrances, fragrance support, customer service Jamaica'
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Dia\'s Fragrances and More',
      description: "Contact Dia's Fragrances and More for help with products, orders, and customer support.",
      mainEntity: {
        '@type': 'Store',
        name: "Dia's Fragrances and More",
        telephone: '+1-876-496-8099',
        email: 'info@diasfragrance.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Brunswick Avenue',
          addressLocality: 'St Catherine',
          addressCountry: 'JM'
        }
      }
    });
  }

  /**
   * Called when the form is submitted
   * For now, we only simulate success.
   * Later, we can send this to your backend (Node/Express) or Email API.
   */
  onSubmit(form: any): void {
    this.successMessage = '';
    this.errorMessage = '';

    // Basic client-side validation (Angular also validates via required/minlength)
    if (form.invalid) {
      this.errorMessage = 'Please fill out all required fields.';
      return;
    }

    this.isSubmitting = true;

    // Simulate a request (replace with real API call later)
    setTimeout(() => {
      this.isSubmitting = false;
      this.successMessage = "Message sent! We'll get back to you soon.";

      // Reset the form
      form.resetForm();
    }, 700);
  }
}


