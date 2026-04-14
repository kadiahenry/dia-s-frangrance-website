import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';
import { ProductService } from './product.service';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly crumbsSubject = new BehaviorSubject<Breadcrumb[]>([]);
  readonly crumbs$ = this.crumbsSubject.asObservable();

  constructor(
    private router: Router,
    private productService: ProductService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const root = this.router.routerState.snapshot.root;
        const crumbs = this.buildCrumbs(root);
        this.crumbsSubject.next(crumbs);
      });
  }

  private buildCrumbs(route: ActivatedRouteSnapshot, url = '', crumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children = route.children;

    if (!children || children.length === 0) {
      return crumbs;
    }

    for (const child of children) {
      const routePart = child.url.map(segment => segment.path).join('/');

      if (routePart) {
        url += `/${routePart}`;
      }

      let label: string | undefined = child.data['breadcrumb'];

      if (child.routeConfig?.path === 'product/:slug') {
        const routeSlug = child.paramMap.get('slug') || '';
        const id = Number(routeSlug);
        const product = Number.isFinite(id) && id > 0
          ? this.productService.getById(id)
          : this.productService.getBySlug(routeSlug);

        if (product?.name) {
          label = product.name;
        }
      }

      if (label) {
        crumbs.push({ label, url });
      }

      return this.buildCrumbs(child, url, crumbs);
    }

    return crumbs;
  }
}
