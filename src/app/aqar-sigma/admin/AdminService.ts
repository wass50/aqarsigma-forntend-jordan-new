import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private admin: any = null;

  setAdmin(admin: any) {
    this.admin = admin;
    localStorage.setItem('adminProfile', JSON.stringify(admin));
  }

  getAdmin() {
    if (!this.admin) {
      const stored = localStorage.getItem('adminProfile');
      if (stored) {
        this.admin = JSON.parse(stored);
      }
    }
    return this.admin;
  }

  clearAdmin() {
    this.admin = null;
    localStorage.removeItem('adminProfile');
  }
}