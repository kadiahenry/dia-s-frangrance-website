import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { ProductService } from './core/services/product.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.scrollTo(0, 0);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => {
        window.scrollTo(0, 0);
      });

    const warmProductsCache = () => {
      window.setTimeout(() => this.productService.warmProductsCache(), 500);
    };

    const restoreSession = () => {
      window.setTimeout(() => this.authService.restoreSessionSilently(), 1200);
    };

    const scheduleBackgroundWork = () => {
      restoreSession();
      window.setTimeout(() => warmProductsCache(), 2200);
    };

    if (document.readyState === 'complete') {
      scheduleBackgroundWork();
      return;
    }

    window.addEventListener('load', scheduleBackgroundWork, { once: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
