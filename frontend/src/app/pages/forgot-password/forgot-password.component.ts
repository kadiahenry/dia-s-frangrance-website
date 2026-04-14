import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  errorMessage = '';
  successMessage = '';
  resetUrl = '';
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle("Forgot Password | Dia's Fragrances and More");
    this.meta.updateTag({
      name: 'description',
      content: "Request a password reset for your Dia's Fragrances and More account."
    });
    this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' });
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.resetUrl = '';

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    const { email } = this.forgotPasswordForm.getRawValue();
    this.isSubmitting = true;

    this.authService.requestPasswordReset(email).subscribe({
      next: response => {
        this.successMessage = response.message;
        this.resetUrl = response.resetUrl || '';
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Unable to start password reset.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}
