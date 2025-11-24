import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.apiService.getCurrentUser().pipe(
      map(response => {
        // Check if user is authenticated and has admin role
        if (response.authenticated && response.user && response.user.role === 'admin') {
          return true;
        } else {
          // User is not admin, redirect to home
          console.warn('Access denied: Admin role required');
          this.router.navigate(['/'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      }),
      catchError(error => {
        // Error checking authentication, redirect to login
        console.error('Authentication error:', error);
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      })
    );
  }
}