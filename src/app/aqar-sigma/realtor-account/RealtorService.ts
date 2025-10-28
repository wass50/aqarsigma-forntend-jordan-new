import { Injectable } from '@angular/core';
import { Realtor } from '../Realtor';

@Injectable({ providedIn: 'root' })
export class RealtorService {
  private realtor: Realtor | null = null;

  setRealtor(realtor: Realtor | null) {
    this.realtor = realtor;
    
    if (realtor) {
      localStorage.setItem('realtorProfile', JSON.stringify(realtor));
       
    } else {
      localStorage.removeItem('realtorProfile');
    }
  }

  getRealtor(): Realtor | null {
    if (!this.realtor) {
      const stored = localStorage.getItem('realtorProfile');
      if (stored) {
        this.realtor = JSON.parse(stored);
      }
    }
    return this.realtor;
  }

  clearRealtor() {
    this.realtor = null;
    localStorage.removeItem('realtorProfile');
    
    
  }
}