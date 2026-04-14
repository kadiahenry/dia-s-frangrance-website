import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AuthService } from 'src/app/core/services/auth.service';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessage = '';
  welcomeName = '';
  returnUrl = '/';
  isSubmitting = false;

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
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    this.loginForm.patchValue({
      email: this.route.snapshot.queryParamMap.get('email') || ''
    });
    this.welcomeName = this.authService.getRememberedName();

    this.seoService.setPage({
      title: 'Login',
      description: "Login to your Dia's Fragrances and More account.",
      path: '/login',
      robots: 'noindex,nofollow'
    });
    this.seoService.clearStructuredData();
  }

  login(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Please enter a valid email address and password.';
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.isSubmitting = true;

    this.authService.login(email, password).pipe(
      catchError((error) => {
        if (error?.status === 401) {
          return this.authService.adminLogin(email, password);
        }

        return throwError(() => error);
      })
    ).subscribe({
      next: () => {
        const destination = this.authService.isAdmin()
          ? (this.returnUrl.startsWith('/admin') ? this.returnUrl : '/admin-dashboard')
          : this.returnUrl;

        this.router.navigateByUrl(destination);
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Unable to log in.';
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}
