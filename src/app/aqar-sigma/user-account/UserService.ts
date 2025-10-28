import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {
  private user: any = null;

  setUser(user: any) {
    this.user = user;
    localStorage.setItem('userProfile', JSON.stringify(user));
  }

  getUser() {
    if (!this.user) {
      const stored = localStorage.getItem('userProfile');
      if (stored) {
        this.user = JSON.parse(stored);
      }
    }
    return this.user;
  }

  clearUser() {
    this.user = null;
    localStorage.removeItem('userProfile');
  }

  isLoggedIn(): boolean {
    // Example: check if user is stored in localStorage
    return !!localStorage.getItem('userProfile');
  }
}