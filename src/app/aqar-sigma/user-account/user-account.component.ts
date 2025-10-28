import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../login/AuthService';
import { Router } from '@angular/router';
import { UserService } from './UserService';
import { FormsModule } from '@angular/forms'; // <-- Add this import
import { CreateListingComponent } from '../create-listing/create-listing.component';
import { PropertyDetailsComponent } from '../property-details/property-details.component'; // <-- Import this
import { latLng, tileLayer, geoJSON, MapOptions, GeoJSONOptions, Layer, marker, icon, Popup, DivIcon } from 'leaflet';
import { LeafletModule } from '@asymmetrik/ngx-leaflet'; // <-- Add this
import { Feature, Polygon } from 'geojson';
import { NgZone } from '@angular/core';
import { environment } from '../../../environments/environment'; // { changed code }
import * as L from 'leaflet';
import { LanguageService } from '../LanguageService';



@Component({
  selector: 'app-user-account',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateListingComponent, LeafletModule, PropertyDetailsComponent],
  templateUrl: './user-account.component.html',
  styleUrls: ['./user-account.component.css']
})
export class UserAccountComponent implements OnInit {
  user: any = null;
  isLoggedIn = false;

  activeTab: string = 'profile'; // <-- Add this line

  editEmail = false;
  editPhone = false;
  editPassword = false;
  editSignInUserName = false;

  editEmailValue = '';
  editPhoneValue = '';
  editPasswordValue = '';
  editSignInUserNameValue= '';
readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }
language: 'en' | 'ar' = 'en';

  properties: any[] = [];
  propertiesLoading = false;

  // state for details-only view
  showDetails: boolean = false;
  selectedProperty: any = null;

  propertyTypes: string[] = [];
  propertyStatuses: string[] = [];
  selectedType: string = '';
  selectedStatus: string = '';
  filteredProperties: any[] = [];

  myListings: any[] = [];

  listingCount: number = 0; // <-- Add this property
  maxListings: number = environment.maxListingsPerUser;  // <-- Configurable max

 mapOptions: MapOptions = {
    layers: [
      tileLayer(environment.map?.tileUrl ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: environment.map?.maxZoom ?? 18,
        attribution: environment.map?.attribution ?? '© OpenStreetMap contributors'
      }),
    ],
    zoom: environment.map?.defaultZoom ?? 13,
    center: latLng(
      environment.map?.defaultCenter?.lat ?? 31.94412979332786,
      environment.map?.defaultCenter?.lng ?? 35.935268264115564
    )
  };
   propertiesMapOptions: MapOptions = {
      layers: [
        tileLayer(environment.map.tileUrl, {
          maxZoom: environment.map?.maxZoom ?? 18,
          attribution: environment.map.attribution
        })
      ],
      zoom: 13,
       center: latLng(environment.map.defaultCenter.lat, environment.map.defaultCenter.lng)
    };
  
    propertyMarkers: Layer[] = [];
  
    greenIcon = icon({
      iconUrl: environment.map.markerIcon.green, // Use your actual path
      shadowUrl: environment.map.markerIcon.shadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    redIcon = icon({
      iconUrl: environment.map.markerIcon.red,
      shadowUrl: environment.map.markerIcon.shadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    grayIcon = icon({
      iconUrl: 'assets/marker-icon-gray.png',
      shadowUrl: environment.map.markerIcon.shadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  
    showMap: boolean = true;
    selectedArea: string = '';
    selectedDistrict: number | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private ngZone: NgZone, // <-- Add this line
    private http: HttpClient , private languageService: LanguageService,) {

    this.languageService.language$.subscribe(lang => this.language = lang);
  }


  ngOnInit() {

    
  this.user = JSON.parse(localStorage.getItem('userProfile') || '{}');
  if (!this.user || !this.user.id) {
    this.router.navigate(['/login']);
    return;
  }
    this.authService.isLoggedIn$.subscribe(val => {
      this.isLoggedIn = val;
      if (this.isLoggedIn) {
        this.user = this.userService.getUser();
        this.editEmailValue = this.user?.email || '';
        this.editPhoneValue = this.user?.phoneNumber || '';
        this.fetchProperties();

        // Fetch active listing count for the user

        
        this.http.get<number>(`${this.API_BASE_URL}/api/users/${this.user.id}/properties/non-sold/count`)
          .subscribe(count => {
            this.listingCount = count;
          });
      } else {
        this.user = null;
      }
    });

    // Fetch user's listings from API
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
   


    console.log('this.myListings:', this.myListings);
  }


   fetchProperties() {
    console.log('Fetching properties for User:', this.user?.id); // <-- Add this line
    if (!this.user || !this.user.id) return;
    this.propertiesLoading = true;

    this.http.get<any[]>(`${this.API_BASE_URL}/api/users/${this.user.id}/properties`)
        .subscribe({
        next: (data) => {
          console.log('Fetched properties:', data); // <-- Add this line
          this.properties = data;
          this.propertyTypes = [...new Set(data.map(p => p.propertyType).filter(Boolean))];
          this.propertyStatuses = [...new Set(data.map(p => p.listingStatus).filter(Boolean))];
          this.applyPropertyFilters();
          this.propertiesLoading = false;
        },
        error: () => {
          this.properties = [];
          this.propertyTypes = [];
          this.propertyStatuses = [];
          this.applyPropertyFilters();
          this.propertiesLoading = false;
        }
      });
  }

  toggleEdit(field: string) {
    if (field === 'email') this.editEmail = !this.editEmail;
    if (field === 'phone') this.editPhone = !this.editPhone;
    if (field === 'password') this.editPassword = !this.editPassword;
    if (field === 'signInUserName') this.editSignInUserName = !this.editSignInUserName;
  }

  saveEdit(field: string) {
    if (field === 'email' && this.user) {
      this.user.email = this.editEmailValue;
      this.userService.setUser(this.user);
      this.editEmail = false;
      this.http.put(`${this.API_BASE_URL}/api/users/${this.user.id}`, this.user).subscribe();
    }
    if (field === 'phone' && this.user) {
      console.log('Saving phone number:', this.editPhoneValue);
      this.user.phoneNumber = this.editPhoneValue;
      this.userService.setUser(this.user);
      this.editPhone = false;
      this.http.put(`${this.API_BASE_URL}/api/users/${this.user.id}`, this.user).subscribe();
    }
    if (field === 'password' && this.user) {
      if (!this.validatePassword(this.editPasswordValue)) {
        alert('Password must be at least 6 characters, contain one uppercase letter, and one number.');
        return;
      }
      this.user.password = this.editPasswordValue;
      this.userService.setUser(this.user);
      this.editPassword = false;
      this.http.put(`${this.API_BASE_URL}/api/users/${this.user.id}`, this.user).subscribe();
    }
    if (field === 'signInEmail' && this.user) {
      this.user.email = this.editSignInUserNameValue;
      this.userService.setUser(this.user);
      this.editSignInUserName = false;
      this.http.put(`${this.API_BASE_URL}/api/users/${this.user.id}`, this.user).subscribe();
    }
  }

  onLogout() {
    this.authService.logout();
    this.userService.clearUser();
    this.router.navigate(['/login']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onDeleteAccount() {
  // Add confirmation and deletion logic here
}

getPhotoUrl(photo: any): string | undefined {
    if (!photo) return undefined;
    if (typeof photo === 'object' && 'url' in photo) {
      if (photo.imageBlob instanceof File) {
        return URL.createObjectURL(photo.imageBlob);
      }
      if (typeof photo.imageBlob === 'string' && photo.imageBlob.length > 100) {
        return `data:image/jpeg;base64,${photo.imageBlob}`;
      }
      return photo.url;
    }
    if (photo instanceof File) {
      return URL.createObjectURL(photo);
    }
    if (typeof photo === 'string' && photo.length > 100) {
      return `data:image/jpeg;base64,${photo}`;
    }
    if (typeof photo === 'string') {
      return photo;
    }
    return undefined;
  }

 applyPropertyFilters() {
    this.filteredProperties = (this.properties || []).filter(p =>
      (!this.selectedType || p.propertyType === this.selectedType) &&
      (!this.selectedStatus || p.listingStatus === this.selectedStatus)
    );
    this.updatePropertyMarkers();
  }

  updatePropertyMarkers() {
    this.propertyMarkers = (this.filteredProperties || [])
      .filter(p => p.lat && p.lng)
      .map(p => {
        // Get first letter of property type
        const typeInitial = p.propertyType ? p.propertyType.charAt(0) : '';
        // Format price
        let priceLabel = '';
        if (p.listingType === 'For_Lease') {
          priceLabel = `${p.price?.toLocaleString?.() ?? p.price} J`;
        } else {
          priceLabel = `${Math.round((p.price ?? 0) / 1000)}K J`;
        }

        // Choose marker color based on status
        let markerColor = '#43a047'; // green
        if (p.listingStatus === 'Sold') markerColor = '#d32f2f'; // red
        else if (p.listingStatus === 'De_Listed') markerColor = '#757575'; // gray






        // Create a custom DivIcon
        const customIcon = new DivIcon({
          className: 'custom-property-marker',
          html: `
            <div style="
              background: ${markerColor};
              color: #fff;
              border-radius: 20px;
              padding: 4px 10px;
              font-size: 0.90em;
              font-weight: bold;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              border: 2px solid #fff;
              display: flex;
              flex-direction: row;
              align-items: center;
              min-width: 38px;
              max-width: 70px;
              gap: 6px;
              overflow: hidden;
              white-space: nowrap;
            ">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${typeInitial}</span>
              <span style="font-size:0.95em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${priceLabel}</span>
            </div>
          `,
          iconSize: [70, 41],
          iconAnchor: [35, 41],
          popupAnchor: [0, -36]
        });

        return marker([p.lat, p.lng], { icon: customIcon })
          .bindPopup(this.getPropertyPopupHtml(p))
          .on('popupopen', (event) => {
            setTimeout(() => {
              // Use the public API to get the popup DOM node
              const popupContent = event.popup.getElement()?.querySelector('.property-popup-content') as HTMLElement;
              if (popupContent) {
                popupContent.addEventListener('click', () => {
                  this.ngZone.run(() => {
                    this.selectedProperty = p;
                    this.showDetails = true;
                    event.target.closePopup();
                  });
                }, { once: true });
              }
            }, 0);
          });
      });
  }
 
   getPropertyPopupHtml(property: any): string {
    let photoUrl = '';
    if (property.photos && property.photos.length > 0) {
      const mainPhoto = property.photos.find((ph: any) => ph.isMain) || property.photos[0];
      photoUrl = this.getPhotoUrl(mainPhoto) ?? '';
    }
    return `
      <div class="property-popup-content" style="display: flex; flex-direction: row; align-items: flex-start; min-width:320px; max-width:420px; gap: 16px; cursor:pointer;">
        <div style="flex: 0 0 120px;">
          <img src="${photoUrl}" alt="photo" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px; background: #eee;">
        </div>
        <div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-weight:bold;color:#1976d2;">${property.address}</div>
          <div style="color:#444;">${property.propertyType} | $${property.price?.toLocaleString?.() ?? property.price}</div>
          <div style="color:#666;font-size:0.95em;">${property.city ?? ''} ${property.province ?? ''} ${property.postalCode ?? ''}</div>
        </div>
      </div>
    `;
  }

  validatePassword(password: string): boolean {
    // At least 6 chars, one uppercase, one number
    return /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);
  }

  goToWatchList() {
    this.router.navigate(['/watchlist'], { state: { user: this.user } });
  }

  // call when popup content is clicked
  openDetailsForProperty(p: any, popupTarget?: any) {
    // if the property already has full details, use it; otherwise fetch from API
    if (p && (p.description || p.photos)) {
      this.selectedProperty = p;
      this.showDetails = true;
      this.showMap = false;
      try { popupTarget?.closePopup?.(); } catch {}
      return;
    }

    // fetch full property details then show details-only view
    this.http.get<any>(`${this.API_BASE_URL}/api/properties/${p.id}`).subscribe(fullProperty => {
      this.selectedProperty = fullProperty;
      this.showDetails = true;
      this.showMap = false;
      try { popupTarget?.closePopup?.(); } catch {}
    }, () => {
      // optional: handle error
    });
  }

  closeDetails() {
    this.showDetails = false;
    this.selectedProperty = null;
    this.showMap = true;
    // allow layout to settle then force resize so map re-renders correctly
    setTimeout(() => { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 200);
  }
}