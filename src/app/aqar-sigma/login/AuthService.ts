import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn$ = new BehaviorSubject<boolean>(this.getInitialLoginState());
  userRole$ = new BehaviorSubject<'realtor' | 'user' | 'admin' | 'housing_company' | null>(this.getInitialRole());

  login(role: 'realtor' | 'user' | 'admin' | 'housing_company') {
    console.log(`User logged in with role: ${role}`);
    this.isLoggedIn$.next(true);
    this.userRole$.next(role);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role);
  }

  getAllLocalStorageItems(): { key: string, value: string | null }[] {
  const items: { key: string, value: string | null }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    const value = localStorage.getItem(key);
    items.push({ key, value });
  }
  console.log('All LocalStorage items:', items);
  return items;
}

  logout() {

    console.debug('Logging out user...start' );
this.getAllLocalStorageItems();
    
   

console.log('Current user:', localStorage.getItem('user'));
console.log('Current user: Profile', localStorage.getItem('userProfile'));
console.log('Current realtor: Profile', localStorage.getItem('realtorProfile'));

    this.isLoggedIn$.next(false);
    this.userRole$.next(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');

    console.debug('Logging out user...end' );
console.log('Current user:', localStorage.getItem('user'));
console.log('Current user: Profile', localStorage.getItem('userProfile'));
console.log('Current realtor: Profile', localStorage.getItem('realtorProfile'));

    
  }

  private getInitialLoginState(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  private getInitialRole(): 'realtor' | 'user' | 'admin' | 'housing_company' | null {
    return (localStorage.getItem('userRole') as 'realtor' | 'user' | 'admin' | 'housing_company' | null) || null;
  }
}