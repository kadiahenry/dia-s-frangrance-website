import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
    if (this.authService.isAdmin()) {
      return true;
    }

    return this.authService.loadProfile().pipe(
      map(user => {
        if (user?.role === 'admin') {
          return true;
        }

        this.router.navigate(['/admin-login'], {
          queryParams: { returnUrl: state.url }
        });

        return false;
      })
    );
  }
}
