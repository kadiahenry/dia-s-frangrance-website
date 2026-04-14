import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  readonly resetPasswordForm = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, {
    validators: [matchingPasswordsValidator]
  });
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.title.setTitle("Reset Password | Dia's Fragrances and More");
    this.meta.updateTag({
      name: 'description',
      content: "Choose a new password for your Dia's Fragrances and More account."
    });
    this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' });
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.token) {
      this.errorMessage = 'This password reset link is invalid.';
      return;
    }

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      this.errorMessage = this.resetPasswordForm.hasError('passwordMismatch')
        ? 'Passwords do not match.'
        : 'Please enter a new password with at least 8 characters.';
      return;
    }

    const { password } = this.resetPasswordForm.getRawValue();
    this.isSubmitting = true;

    this.authService.resetPassword(this.token, password).subscribe({
      next: response => {
        this.successMessage = response.message;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Unable to reset password.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}

function matchingPasswordsValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}
