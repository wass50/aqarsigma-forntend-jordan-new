import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RealtorGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Allow view mode for public access
   
   
   console.log('RealtorGuard: Checking access for route', route.url, 'with query params', route.queryParamMap);
   
   
   if (route.queryParamMap.get('view') === 'true') {
      console.log('RealtorGuard: view mode, allowing access');
      return true;
    }

    const userJson = localStorage.getItem('user');
    let user: any = null;
    try {
      user = userJson ? JSON.parse(userJson) : null;
    } catch {
      user = null;
    }
    if (user && (user.role === 'realtor' || user.role === 'admin')) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}