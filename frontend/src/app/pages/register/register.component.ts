import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  readonly registerForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    privacyConsent: [false, Validators.requiredTrue]
  }, {
    validators: [passwordsMatchValidator]
  });

  errorMessage = '';
  isSubmitting = false;
  returnUrl = '/account';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private title: Title,
    private meta: Meta,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/account';
    this.seoService.setPage({
      title: 'Create Account',
      description: "Create your Dia's Fragrances and More account for faster checkout and order tracking.",
      path: '/register',
      robots: 'noindex,nofollow'
    });
    this.seoService.clearStructuredData();
  }

  register(): void {
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = this.getValidationMessage();
      return;
    }

    const { name, email, password, privacyConsent } = this.registerForm.getRawValue();

    this.isSubmitting = true;

    this.authService.register(name, email, password, privacyConsent).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Unable to create account.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  private getValidationMessage(): string {
    if (this.registerForm.hasError('passwordMismatch')) {
      return 'Passwords do not match.';
    }

    if (this.registerForm.controls.password.hasError('minlength')) {
      return 'Password must be at least 8 characters long.';
    }

    if (this.registerForm.controls.privacyConsent.invalid) {
      return 'You must agree to the privacy policy to create an account.';
    }

    return 'Please complete all required fields.';
  }
}

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}
