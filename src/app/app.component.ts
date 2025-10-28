import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

import { HouseSegmaModule } from './aqar-sigma/house-segma.module';
import { MapSearchComponent } from "./aqar-sigma/map-search/map-search.component";
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FormsModule } from '@angular/forms';
import { MapService } from './aqar-sigma/map-search/MapService';
import { CommonModule } from '@angular/common';
import { AuthService } from './aqar-sigma/login/AuthService';
import { LanguageService } from './aqar-sigma/LanguageService';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,RouterModule, HouseSegmaModule, MapSearchComponent, LeafletModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'my-angular-17-app';
  selectedProvince: string = '';
  selectedCountry: string = '';

  // Province center coordinates
  provinceCenters: { [key: string]: [number, number] } = {
    BC: [49.2827, -123.1207],       // Vancouver
    AB: [53.9333, -116.5765],
    SK: [52.9399, -106.4509],
    MB: [49.8951, -97.1384],
    ON: [43.6532, -79.3832],        // Toronto
    QC: [52.9399, -73.5491],
    NB: [46.5653, -66.4619],
    NS: [44.6820, -63.7443],
    PE: [46.5107, -63.4168],
    NL: [53.1355, -57.6604],
    YT: [64.2823, -135.0000],
    NT: [64.8255, -124.8457],
    NU: [70.2998, -83.1076]
  };

  // Country center coordinates
  countryCenters: { [key: string]: [number, number] } = {
    Jordan: [31.9454, 35.9284],        // Amman
    UAE: [24.4539, 54.3773],           // Abu Dhabi
    SA: [24.7136, 46.6753],            // Riyadh
    Egypt: [30.0444, 31.2357]          // Cairo
  };

  isLoggedIn = false;
  userRole: 'realtor' | 'user' | 'admin' | 'housing_company' | null = null;
  language: 'en' | 'ar' = 'en'; // Default language

  get myAccountRoute() {
    if (this.userRole === 'realtor') return '/realtor-account';
    if (this.userRole === 'user') return '/user-account';
    if (this.userRole === 'admin') return '/admin';
    if (this.userRole === 'housing_company') return '/housing-account'; // <-- Add this line
    return '/';
  }

  constructor(private router: Router, private mapService: MapService, private authService: AuthService, private languageService: LanguageService) {
    this.authService.isLoggedIn$.subscribe(val => this.isLoggedIn = val);
    this.authService.userRole$.subscribe(role => this.userRole = role);
    this.languageService.language$.subscribe(lang => this.language = lang);
  }

  ngOnInit() {
    setInterval(() => {
      const loginTime = localStorage.getItem('loginTime');
      if (loginTime && Date.now() - Number(loginTime) > 30 * 60 * 1000) {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    }, 60000); // check every minute
  }

  goToContact(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.router.navigate(['/contact']);
  }

  onCountryChange(event: Event) {
    const country = this.selectedCountry;
    const center = this.countryCenters[country];
    if (center) {
      this.mapService.setMapCenter(center); // Notify map to update center
    }
  }

  // Call this after login
  setLoginState(role: 'realtor' | 'user') {
    this.isLoggedIn = true;
    this.userRole = role;
  }

  // Call this on logout
 

  setLanguage(lang: 'en' | 'ar') {
    this.languageService.setLanguage(lang);
  }

  currentYear = new Date().getFullYear();
  goToAccount() {
  this.router.navigate(['/user-account']);
}
goToWatchlist() {
  this.router.navigate(['/watchlist']);
}
logout() {
     this.isLoggedIn = false;
    this.userRole = null;
  localStorage.removeItem('userProfile');
  this.router.navigate(['/login']);
}


}
