import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const userJson = localStorage.getItem('user');
    let user: any = null;
    try {
      user = userJson ? JSON.parse(userJson) : null;
    } catch {
      user = null;
    }
    if (user && user.role === 'admin') {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}