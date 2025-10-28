import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HousingService} from './HousingService';
import { Housing } from '../Housing';
import { PropertyDetailsComponent } from '../property-details/property-details.component'; // <-- Import this
import { polygon, latLng, tileLayer, geoJSON, MapOptions, GeoJSONOptions, Layer, marker, icon, Popup, DivIcon } from 'leaflet';
import { LeafletModule } from '@asymmetrik/ngx-leaflet'; // <-- Add this
import { Feature, Polygon } from 'geojson'; 
import { LanguageService } from '../LanguageService';

import { NgZone } from '@angular/core';
import { AuthService } from '../login/AuthService'; // <-- Add this import
import {CreatePreConstructionListingComponent} from '../create-pre-construction-listing/create-pre-construction-listing.component';
import {HousingProperty, HousingPropertyPhoto, City} from '../HousingProperty';
import { HousingCompanyListingDetailsComponent } from '../housing-company-listing-details/housing-company-listing-details.component'; // <-- Import the new component
import { environment } from '../../../environments/environment'; // { changed code }

@Component({
  selector: 'app-housing-account',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CreatePreConstructionListingComponent,
    LeafletModule,
    PropertyDetailsComponent,
    HousingCompanyListingDetailsComponent // <-- Add this line
  ],
  templateUrl: './housing-account.component.html',
  styleUrl: './housing-account.component.css'
})


export class HousingAccountComponent {
  readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }
  // Map / app config driven from environment
  readonly MAP_TILE_URL = environment.map.tileUrl;
  readonly MAP_ATTRIBUTION = environment.map.attribution;
  readonly MAP_DEFAULT_CENTER = environment.map.defaultCenter;
  readonly MAP_DEFAULT_ZOOM = environment.map.defaultZoom;
  readonly MAP_MARKER_ICONS = environment.map.markerIcon;
 
  isLoggedIn = false;
  activeTab: string = 'profile';

  housing: Housing | null = null;

  editEmail = false;
  editEmailValue = '';
  editPhone = false;
  editPhoneValue = '';
  editSignInEmail = false;
  editSignInEmailValue = '';
  editBrokerageAddress = false;
  editBrokerageAddressValue = '';
  editFirstName = false;
  editFirstNameValue = '';
  editLastName = false;
  editLastNameValue = '';
  editUsername = false;
  editUsernameValue = '';
  editPassword = false;
  editPasswordValue = '';

  editLicense = false;
  editLicenseValue = '';
  editBrokerage = false;
  editBrokerageValue = '';

  editWebsite = false;
  editWebsiteValue = '';
  editBio = false;
  editBioValue = '';
  editSocialLinks = false;
  editSocialLinksValue: string[] = [];

  properties: any[] = [];
  propertiesLoading = false;

  selectedProperty: any = null;
  showDetails = false;

  propertyTypes: string[] = [];
  propertyStatuses: string[] = [];
  selectedType: string = '';
  selectedStatus: string = '';
  filteredProperties: any[] = [];

 
  selectedPhotoFile: File | null = null;
  photoPreview: string | ArrayBuffer | null = null;
  isUploadingPhoto = false;

  districtPolygonLayers: Layer[] = [];
  fullDistricts: any[] = []; // <-- Add this line

  

  mapOptions: MapOptions = {
    layers: [
      tileLayer(this.MAP_TILE_URL, {
        maxZoom: 18,
        attribution: this.MAP_ATTRIBUTION
      }),
    ],
    zoom: this.MAP_DEFAULT_ZOOM,
    center: latLng(this.MAP_DEFAULT_CENTER.lat, this.MAP_DEFAULT_CENTER.lng)
  };

  propertiesMapOptions: MapOptions = {
    layers: [
      tileLayer(this.MAP_TILE_URL, {
        maxZoom: 18,
        attribution: this.MAP_ATTRIBUTION
      })
    ],
    zoom: this.MAP_DEFAULT_ZOOM,
    center: latLng(this.MAP_DEFAULT_CENTER.lat, this.MAP_DEFAULT_CENTER.lng)
  };

  propertyMarkers: Layer[] = [];

  greenIcon = icon({
    iconUrl: this.MAP_MARKER_ICONS.green,
    shadowUrl: this.MAP_MARKER_ICONS.shadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  redIcon = icon({
    iconUrl: this.MAP_MARKER_ICONS.red,
    shadowUrl: this.MAP_MARKER_ICONS.shadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  grayIcon = icon({
    iconUrl: this.MAP_MARKER_ICONS.gray,
    shadowUrl: this.MAP_MARKER_ICONS.shadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  showMap: boolean = true;
  selectedArea: string = '';
  isViewMode = false;

  availableDistricts: any[] = [];
  selectedDistrictId: string = '';

  language: 'en' | 'ar' = 'en'; // Default to English

  constructor(
    private route: ActivatedRoute,
    private housingService: HousingService,
    private router: Router,
    private http: HttpClient,
    private ngZone: NgZone,
    private authService: AuthService,

    private languageService: LanguageService

  ) {
    this.authService.isLoggedIn$.subscribe(val => this.isLoggedIn = val);
    this.housing = this.housingService.getHousing();
    if (this.housing) {
      this.editEmailValue = this.housing.email;
      this.editPhoneValue = this.housing.phoneNumber;
      this.editSignInEmailValue = this.housing.email;
      this.editBrokerageAddressValue = this.housing.companyAddress || '';
      this.languageService.language$.subscribe(lang => this.language = lang);
    }
  }

  




 ngOnInit() {
    console.log('Realtor from service on init:', this.housing);
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Route param id:', id);
    this.isViewMode = !!id;
    console.log('Is view mode:', this.isViewMode);

   if (id) {
  // View mode: fetch the selected realtor from backend
  this.http.get<any>(`${this.API_BASE_URL}/api/housing-companies/${id}/noProperties`).subscribe(res => {
    if (res && res.user) {
      // Flatten user fields for the single realtor, preserve realtor.id!
      this.housing = { ...res, ...res.user, id: res.id, userId: res.user.id };
    } else {
      // Fallback: just use the response as is
      this.housing = res;
      console.warn('No user object found in realtor response:', res);
    }

// --- Normalize socialLinks here ---
if (this.housing && this.housing.socialLinks) {
  if (typeof this.housing.socialLinks === 'string') {
    try {
      const parsed = JSON.parse(this.housing.socialLinks);
      this.housing.socialLinks = Array.isArray(parsed)
        ? parsed
        : [String(this.housing.socialLinks)];
    } catch {
      this.housing.socialLinks = [String(this.housing.socialLinks)];
    }
  } else if (Array.isArray(this.housing.socialLinks)) {
    // Already an array, do nothing
  } else if (typeof this.housing.socialLinks === 'object') {
    this.housing.socialLinks = Object.values(this.housing.socialLinks).map(String);
  }
}


    console.log('Fetched realtor for view mode:', this.housing);
    if (this.housing && this.housing.id) {
      this.fetchProperties();
      
       //this.showCompanyDistrictPolygonsOnMap();
    }
  });
} else {
      // Logged-in mode: use realtor from service/localStorage
      if (this.housing && this.housing.id) {
        this.fetchProperties();
        //this.showCompanyDistrictPolygonsOnMap();
      }
    }
  }





 fetchProperties() {
    console.log('Fetching properties for housing:', this.housing?.id); // <-- Add this line
    if (!this.housing || !this.housing.id) return;
    this.propertiesLoading = true;

    this.http.get<any[]>(`${this.API_BASE_URL}/api/housing-companies/${this.housing.id}/properties`)
      .subscribe({
        next: (data) => {
          console.log('Fetched properties:', data); // <-- Add this line
          this.properties = data;
          this.propertyTypes = [...new Set(data.map(p => p.propertyType).filter(Boolean))];
          this.propertyStatuses = [...new Set(data.map(p => p.listingStatus).filter(Boolean))];
          
          // Prepare unique districts for filter
          this.availableDistricts = Array.from(
            new Map(data.map(p => [p.district?.id, p.district])).values()
          ).filter(d => !!d);
          this.applyPropertyFilters();
          this.propertiesLoading = false;
          console.log('Properties after fetch call:', this.properties); // <-- Add this line
          this.showCompanyDistrictPolygonsOnMap(); // <-- Move this
        },
        error: () => {
          console.error('Failed to fetch properties');
          this.properties = [];
          this.propertyTypes = [];
          this.propertyStatuses = [];
          this.applyPropertyFilters();
          this.propertiesLoading = false;
        }
      });
     
  }

  applyPropertyFilters() {
    this.filteredProperties = (this.properties || []).filter(p =>
      (!this.selectedType || p.propertyType === this.selectedType) &&
      (!this.selectedStatus || p.listingStatus === this.selectedStatus) &&
      (!this.selectedDistrictId || String(p.district?.id) === String(this.selectedDistrictId))
    );
    this.updatePropertyMarkers();
  }

  updatePropertyMarkers() {
    this.propertyMarkers = (this.filteredProperties || [])
      .filter(p => p.lat && p.lng)
      .map(p => {
        // Get first letter of property type
       const typeInitial = p.propertyType ? p.propertyType.charAt(0) : '';
         
let priceLow = 0;
  if (typeof p.priceRange === 'string' && p.priceRange.includes('-')) {
    priceLow = parseInt(p.priceRange.split('-')[0].replace(/\D/g, ''), 10);
  } else if (typeof p.priceRange === 'number') {
    priceLow = p.priceRange;
  } else {
    priceLow =  0;
  }




  const priceLabel = (priceLow / 1000) + "K +";

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
              font-size: 0.85em;
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

 


   getPropertyPopupHtml(property: HousingProperty): string {
         /* let photoUrl: string | undefined = undefined;
          if (property.photos && property.photos.length > 0) {
            const mainPhoto = property.photos.find(p => p.isMain) || property.photos[0];
            photoUrl = this.getPhotoUrl(mainPhoto);
          }
      
      */
      let photoUrl: string | undefined = this.getPhotoUrlNew(property);
      
       
      console.log("property:", property);
     console.log("city:", property.city);
     console.log("district:", property.district);

      
          return `
            <div class="property-popup-content" style="cursor:pointer; display: grid; grid-template-columns: 100px 1fr; gap: 12px; align-items: center; min-width: 320px;">
              <div>
                <img src="${photoUrl}" alt="photo" style="width:100px; height:auto; border-radius:6px;">
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="font-weight: bold; color: #1976d2;">
                  ${property.priceRange.toLocaleString()} JOD
                  <span style="font-weight: normal; color: #666; font-size: 0.95em;">| Listed: ${this.formatDate(property.listingDate)}</span>
                </div>
               <div style="color: #222;">
  ${property.address ?? ''}
  ${property.city?.nameEn ?? property.city?.nameEn ?? ''}
  ${property.district?.nameEn ?? property.district?.nameEn ?? ''}
  ${property.neighborhood?.nameEn ?? property.neighborhood?.nameEn ?? ''}
</div>
                <div style="color: #444; font-size: 0.95em;">
                   
                  <span style="margin-right:8px;">
                    <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-fill.svg" alt="bed" width="16" style="vertical-align:middle; margin-right:2px;">
                    ${property.bedroomRange != null ? property.bedroomRange : 0}
                  </span>
                  <span style="margin-right:8px;">
                    <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/droplet-half.svg" alt="bath" width="16" style="vertical-align:middle; margin-right:2px;">
                    ${property.bathroomRange != null ? property.bathroomRange: 0}
                  </span>
                  <span style="margin-right:8px;">
                    <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/rulers.svg" alt="area" width="16" style="vertical-align:middle; margin-right:2px;">
                    ${property.areaRange ? property.areaRange : 'N/A'} m²
                  </span>
                 
                </div>
              </div>
            </div>
          `;
        }


        getPhotoUrlNew(housingProperty: any): string | undefined {
   
   
    if (housingProperty.mainPhotoBlob && housingProperty.mainPhotoBlob.length > 100) {
      return `data:image/jpeg;base64,${housingProperty.mainPhotoBlob}`;
    }
    if (housingProperty.mainPhotoUrl) {
      return housingProperty.mainPhotoUrl;
    }
    // fallback for old structure
    if (housingProperty.photos && housingProperty.photos.length > 0) {
      const mainPhoto = housingProperty.photos.find((ph: any) => ph.isMain) || housingProperty.photos[0];
      if (mainPhoto.imageBlob && typeof mainPhoto.imageBlob === 'string' && mainPhoto.imageBlob.length > 100) {
        return `data:image/jpeg;base64,${mainPhoto.imageBlob}`;
      }
      if (mainPhoto.url) {
        return mainPhoto.url;
      }
    }
    return undefined;
  }

  formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

  toggleEdit(field: string) {
    switch (field) {
      case 'firstName':
        this.editFirstName = true;
        this.editFirstNameValue = this.housing?.firstName || '';
        break;
      case 'lastName':
        this.editLastName = true;
        this.editLastNameValue = this.housing?.lastName || '';
        break;
      case 'username':
        this.editUsername = true;
        this.editUsernameValue = this.housing?.username || '';
        break;
      case 'password':
        this.editPassword = true;
        this.editPasswordValue = '';
        break;
      case 'email':
        this.editEmail = true;
        this.editEmailValue = this.housing?.email || '';
        break;
      case 'phone':
        this.editPhone = true;
        this.editPhoneValue = this.housing?.phoneNumber || '';
        break;
      case 'license':
        this.editLicense = true;
        this.editLicenseValue = this.housing?.licenseNumber || '';
        break;
      case 'brokerage':
        this.editBrokerage = true;
        this.editBrokerageValue = this.housing?.companyName || '';
        break;
      case 'brokerageAddress':
        this.editBrokerageAddress = true;
        this.editBrokerageAddressValue = this.housing?.companyAddress || '';
        break;
      case 'website':
        this.editWebsite = true;
        this.editWebsiteValue = this.housing?.websiteUrl || '';
        break;
      case 'bio':
        this.editBio = true;
        this.editBioValue = this.housing?.bio || '';
        break;
      case 'socialLinks':
        this.editSocialLinks = true;
        this.editSocialLinksValue = Array.isArray(this.housing?.socialLinks) ? [...this.housing.socialLinks] : [];
        break;
    }
  }

  saveEdit(field: string) {
    if (!this.housing) return;

    // User fields
    if (['firstName', 'lastName', 'username', 'email', 'phone', 'password'].includes(field)) {
      let userPayload: any = {};
      let closeEdit = () => {};

      switch (field) {
        case 'firstName':
          userPayload.firstName = this.editFirstNameValue;
          closeEdit = () => { this.housing!.firstName = this.editFirstNameValue; this.editFirstName = false; };
          break;
        case 'lastName':
          userPayload.lastName = this.editLastNameValue;
          closeEdit = () => { this.housing!.lastName = this.editLastNameValue; this.editLastName = false; };
          break;

        case 'username':
          userPayload.username = this.editUsernameValue;
          closeEdit = () => { this.housing!.username = this.editUsernameValue; this.editUsername = false; };
          break;
        case 'email':
          userPayload.email = this.editEmailValue;
          closeEdit = () => { this.housing!.email = this.editEmailValue; this.editEmail = false; };
          break;
        case 'phone':
          userPayload.phoneNumber = this.editPhoneValue;
          closeEdit = () => { this.housing!.phoneNumber = this.editPhoneValue; this.editPhone = false; };
          break;
        case 'password':
          userPayload.password = this.editPasswordValue;
          closeEdit = () => { this.editPassword = false; };
          break;
      }

      this.http.put(`${this.API_BASE_URL}/api/users/${this.housing.userId}`, userPayload)
        .subscribe({
          next: () => closeEdit(),
          error: () => closeEdit() // Optionally handle error
        });
      return;
    }

    // Realtor fields
    if (['license', 'brokerage', 'brokerageAddress', 'website', 'bio', 'socialLinks'].includes(field)) {
      let housingPayload: any = {};
      let closeEdit = () => {};

      switch (field) {
        case 'license':
          housingPayload.licenseNumber = this.editLicenseValue;
          closeEdit = () => { this.housing!.licenseNumber = this.editLicenseValue; this.editLicense = false; };
          break;
        case 'brokerage':
          housingPayload.brokerageName = this.editBrokerageValue;
          closeEdit = () => { this.housing!.companyName = this.editBrokerageValue; this.editBrokerage = false; };
          break;
        case 'brokerageAddress':
          housingPayload.brokerageAddress = this.editBrokerageAddressValue;
          closeEdit = () => { this.housing!.companyAddress = this.editBrokerageAddressValue; this.editBrokerageAddress = false; };
          break;
        case 'website':
          housingPayload.websiteUrl = this.editWebsiteValue;
          closeEdit = () => { this.housing!.websiteUrl = this.editWebsiteValue; this.editWebsite = false; };
          break;
        case 'bio':
          housingPayload.bio = this.editBioValue;
          closeEdit = () => { this.housing!.bio = this.editBioValue; this.editBio = false; };
          break;
        case 'socialLinks':
          housingPayload.socialLinks = this.editSocialLinksValue.filter(link => !!link);
          closeEdit = () => { this.housing!.socialLinks = this.editSocialLinksValue.filter(link => !!link); this.editSocialLinks = false; };
          break;
      }

      this.http.put(`${this.API_BASE_URL}/api/realtors/${this.housing.id}`, housingPayload)
        .subscribe({
          next: () => closeEdit(),
          error: () => closeEdit() // Optionally handle error
        });
      return;
    }
  }

  saveAll() {
    if (!this.housing) return;

    // User fields
    const userPayload: any = {
      firstName: this.housing.firstName,
      lastName: this.housing.lastName,
      email: this.housing.email,
      username: this.housing.username,
      phoneNumber: this.housing.phoneNumber
    };
    if (this.editPasswordValue) {
      userPayload.password = this.editPasswordValue;
    }

    // Realtor fields
    const housingayload = {
      licenseNumber: this.housing.licenseNumber,
      brokerageName: this.housing.companyName,
      brokerageAddress: this.housing.companyAddress,
      websiteUrl: this.housing.websiteUrl,
      bio: this.housing.bio,
      socialLinks: this.housing.socialLinks
    };

    // Update user info
    this.http.put(`${this.API_BASE_URL}/api/users/${this.housing.userId}`, userPayload)
      .subscribe({
        next: () => { /* Optionally show success */ },
        error: () => { /* Optionally show error */ }
      });

    // Update realtor info
    this.http.put(`${this.API_BASE_URL}/api/realtors/${this.housing.id}`, housingayload)
      .subscribe({
        next: () => { /* Optionally show success */ },
        error: () => { /* Optionally show error */ }
      });
  }

  saveWebsite() {
    // Call your update API here if needed
    this.housing!.websiteUrl = this.editWebsiteValue;
    this.editWebsite = false;
  }

  savePhone() {
    this.housing!.phoneNumber = this.editPhoneValue;
    this.editPhone = false;
  }

  saveBio() {
    this.housing!.bio = this.editBioValue;
    this.editBio = false;
  }

  saveSocialLinks() {
    if (!this.housing) return;
    this.housing.socialLinks = (this.editSocialLinksValue || []).filter(link => !!link);
    this.editSocialLinks = false;
  }

  setEditSocialLinksValue() {
    // Always set as array, never string
    if (Array.isArray(this.housing?.socialLinks)) {
      this.editSocialLinksValue = [...this.housing!.socialLinks];
    } else if (typeof this.housing?.socialLinks === 'string' && this.housing.socialLinks) {
      this.editSocialLinksValue = [this.housing.socialLinks];
    } else {
      this.editSocialLinksValue = [];
    }
    this.editSocialLinks = true;
  }

  startEditWebsite() {
    this.editWebsiteValue = this.housing?.websiteUrl || '';
    this.editWebsite = true;
  }

  onLogout() {
    // Implement your logout logic here
     
    this.housingService.clearHousing();
    this.housingService.setHousing(null);
    this.authService.logout();

    this.router.navigate(['/login']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  getProfilePhotoSrc(profilePhoto: File | string | null | undefined): string | undefined {
    if (!profilePhoto) return undefined;
    if (profilePhoto instanceof File) {
      return URL.createObjectURL(profilePhoto);
    }
    // If it's a base64 string, prepend the data URL header
    if (typeof profilePhoto === 'string' && profilePhoto.length > 100) {
      return `data:image/jpeg;base64,${profilePhoto}`;
    }
    return undefined;
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

 

  get mapLayers(): Layer[] {
    return [
      tileLayer(this.MAP_TILE_URL, {
        maxZoom: 18,
        attribution: this.MAP_ATTRIBUTION
      })
    ];
  }




goToHousingCompanies(event: Event) {
  event.preventDefault();
  this.router.navigate(['/housing-companies']);
}


onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    this.selectedPhotoFile = input.files[0];
    const reader = new FileReader();
    reader.onload = e => this.photoPreview = reader.result;
    reader.readAsDataURL(this.selectedPhotoFile);
  }
}

removePhoto() {
  this.selectedPhotoFile = null;
  this.photoPreview = null;
}
updatePhoto() {
  if (!this.photoPreview || !this.housing) return;
  const base64 = (this.photoPreview as string).split(',')[1];
  this.housing.profilePhoto = base64;
  this.saveEdit('profilePhoto');
}


showCompanyDistrictPolygonsOnMap() {
  console.log('Showing company district polygons on map');
  this.districtPolygonLayers = [];
  // Get unique district objects from properties

  console.log('Properties:', this.properties);
  const districts = Array.from(
    new Map(this.properties.map(p => [p.district?.id, p.district])).values()
  );
  if (!districts.length) {
    console.log('No districts found for company properties'); 
    return;
  }

  let firstLatLng: any = null;
  console.log('Company districts:', districts);







  districts.forEach(district => {
    const poly = district.polygons;
    if (!poly || poly.length < 3) return;
    const latlngs = poly.map((point: any) => [point.latitude, point.longitude]);
    if (!firstLatLng && latlngs.length > 0) firstLatLng = latlngs[0];
    const polyLayer = polygon(latlngs, {
      color: '#00bfae',
      weight: 4,
      fillColor: '#00bfae',
      fillOpacity: 0.10
    })
    .bindPopup(`${district.nameEn} (${district.nameAr})`)
   

   .bindTooltip(
      `${this.housing?.companyName} provides housing service in ${district.nameEn}<br>` +
      `  يقدم خدمات الإسكان  في ${district.nameAr} ${this.housing?.companyName} `,
      { direction: 'top', sticky: true, className: 'district-tooltip' }
    );


    this.districtPolygonLayers.push(polyLayer);
  });





 

  // Center map on first polygon if available
  if (firstLatLng) {
    this.mapOptions = {
      ...this.mapOptions,
      center: latLng(firstLatLng[0], firstLatLng[1]),
      zoom: 11
    };
  }
}
}