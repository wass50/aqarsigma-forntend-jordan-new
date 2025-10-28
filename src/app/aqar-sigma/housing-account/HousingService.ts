import { Injectable } from '@angular/core';
import { Housing } from '../Housing';

@Injectable({ providedIn: 'root' })
export class HousingService {
  private housing: Housing | null = null;

  setHousing(housing: Housing | null) {
    this.housing = housing;
    // Only store minimal data in localStorage
    if (housing) {
      const { id, userId, role, firstName, lastName, email, username, phoneNumber, companyName, companyAddress, licenseNumber } = housing;
      localStorage.setItem('housingProfile', JSON.stringify({
        id, userId, role, firstName, lastName, email, username, phoneNumber, companyName, companyAddress, licenseNumber
      }));
    } else {
      localStorage.removeItem('housingProfile');
    }
  }

  getHousing(): Housing | null {
    if (!this.housing) {
      const stored = localStorage.getItem('housingProfile');
      if (stored) {
        this.housing = JSON.parse(stored);
      }
    }

    //console.log('Retrieved housing profile:', this.housing);
    return this.housing;
  }

  clearHousing() {
    this.housing = null;
    localStorage.removeItem('housingProfile');
  }
}