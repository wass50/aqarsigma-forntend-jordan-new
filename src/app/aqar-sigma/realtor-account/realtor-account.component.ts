import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RealtorService } from './RealtorService';
import { Realtor } from '../Realtor';
import { CreateListingComponent } from '../create-listing/create-listing.component'; // <-- Import this
import { PropertyDetailsComponent } from '../property-details/property-details.component'; // <-- Import this
import { latLng, tileLayer, geoJSON, MapOptions, GeoJSONOptions, Layer, marker, icon, Popup, DivIcon, polygon } from 'leaflet';
import { LeafletModule } from '@asymmetrik/ngx-leaflet'; // <-- Add this
import { Feature, Polygon } from 'geojson';
import { NgZone } from '@angular/core';
import { AuthService } from '../login/AuthService'; // <-- Add this import
import { ActivatedRoute } from '@angular/router';
import { LanguageService } from '../LanguageService'; // <-- Add this import
import { environment } from '../../../environments/environment'; // { changed code }
import * as L from 'leaflet';
import 'leaflet.markercluster'; // ensure markercluster is installed: npm i leaflet.markercluster
import { LocationService } from '../LocationService'; // { changed code }

@Component({
  selector: 'app-realtor-account',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CreateListingComponent,
    LeafletModule,
    PropertyDetailsComponent // <-- Add this line
  ],
  templateUrl: './realtor-account.component.html',
  styleUrls: ['./realtor-account.component.css']
})
export class RealtorAccountComponent {
  isLoggedIn = false;
  activeTab: string = 'profile';

  realtor: Realtor | null = null;
  isViewMode = false;
  readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }
  readonly MAP_ATTRIBUTION = environment.map?.attribution ?? '© OpenStreetMap contributors';
  readonly MAP_DEFAULT_CENTER = environment.map?.defaultCenter ?? { lat: 31.94412979332786, lng: 35.935268264115564 };
  readonly MAP_DEFAULT_ZOOM = environment.map?.defaultZoom ?? 13;
  readonly MAP_MAX_ZOOM = environment.map?.maxZoom ?? 18;
  readonly MAP_TILE_URL = environment.map?.tileUrl ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  
   

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

  districtPolygonLayers: Layer[] = [];

  mapOptions: MapOptions = {
    layers: [
      tileLayer(this.MAP_TILE_URL, {
        maxZoom: this.MAP_MAX_ZOOM,
        attribution: this.MAP_ATTRIBUTION
      }),
      
    ],
    zoom: 13,
    center: latLng(31.94412979332786, 35.935268264115564) // Center near Al-Yarmouk
  };

  propertiesMapOptions: MapOptions = {
    layers: [
      tileLayer(this.MAP_TILE_URL, {
        maxZoom: this.MAP_MAX_ZOOM,
        attribution: this.MAP_ATTRIBUTION
      })
    ],
    zoom: this.MAP_DEFAULT_ZOOM,
    center: latLng(this.MAP_DEFAULT_CENTER.lat, this.MAP_DEFAULT_CENTER.lng)
  };


  propertyMarkers: L.Layer[] = [];
  private markerClusterGroup: any = null;
  // Note: make sure leaflet.markercluster CSS is included (angular.json "styles" or global styles):
  // "node_modules/leaflet.markercluster/dist/MarkerCluster.css",
  // "node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css",

   greenIcon = icon({
    iconUrl: environment.map?.markerIcon?.green ?? 'assets/marker-icon-green.png',
    shadowUrl: environment.map?.markerIcon?.shadow ?? 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  redIcon = icon({
    iconUrl: environment.map?.markerIcon?.red ?? 'assets/marker-icon-red.png',
    shadowUrl: environment.map?.markerIcon?.shadow ?? 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  grayIcon = icon({
    iconUrl: environment.map?.markerIcon?.gray ?? 'assets/marker-icon-gray.png',
    shadowUrl: environment.map?.markerIcon?.shadow ?? 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  showMap: boolean = true;
  selectedArea: string = '';

  selectedPhotoFile: File | null = null;
  photoPreview: string | ArrayBuffer | null = null;

  language: 'en' | 'ar' = 'en';

  
  constructor(
    private route: ActivatedRoute,
    private realtorService: RealtorService,
    private router: Router,
    private http: HttpClient,
    private ngZone: NgZone,
    private authService: AuthService,
    private languageService: LanguageService,
    private locationService: LocationService // { changed code }
  ) {
    this.authService.isLoggedIn$.subscribe(val => this.isLoggedIn = val);
    this.realtor = this.realtorService.getRealtor();
    if (this.realtor) {
      this.editEmailValue = this.realtor.email;
      this.editPhoneValue = this.realtor.phoneNumber;
      this.editSignInEmailValue = this.realtor.email;
      this.editBrokerageAddressValue = this.realtor.brokerageAddress || '';
    }
    this.languageService.language$.subscribe(lang => this.language = lang);
  }

  ngOnInit() {

     
    console.log('Realtor from service on init:', this.realtor);
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Route param id:', id);
    this.isViewMode = !!id;
    //console.log('Is view mode:', this.isViewMode);

   if (id) {
  // View mode: fetch the selected realtor from backend
  this.http.get<any>(`${this.API_BASE_URL}/api/realtors/${id}`).subscribe(res => {
    if (res && res.user) {
      // Flatten user fields for the single realtor, preserve realtor.id!
      this.realtor = { ...res, ...res.user, id: res.id, userId: res.user.id };
    } else {
      // Fallback: just use the response as is
      this.realtor = res;
      console.warn('No user object found in realtor response:', res);
    }

// --- Normalize socialLinks here ---
if (this.realtor && this.realtor.socialLinks) {
  if (typeof this.realtor.socialLinks === 'string') {
    try {
      const parsed = JSON.parse(this.realtor.socialLinks);
      this.realtor.socialLinks = Array.isArray(parsed)
        ? parsed
        : [String(this.realtor.socialLinks)];
    } catch {
      this.realtor.socialLinks = [String(this.realtor.socialLinks)];
    }
  } else if (Array.isArray(this.realtor.socialLinks)) {
    // Already an array, do nothing
  } else if (typeof this.realtor.socialLinks === 'object') {
    this.realtor.socialLinks = Object.values(this.realtor.socialLinks).map(String);
  }
}


    console.log('Fetched realtor for view mode:', this.realtor);
    if (this.realtor && this.realtor.id) {
      this.fetchProperties();
      this.showDistrictPolygonsOnMap();
    }
  });
} else {
      // Logged-in mode: use realtor from service/localStorage
      if (this.realtor && this.realtor.id) {
        this.fetchProperties();
        this.showDistrictPolygonsOnMap();
      }
    }
  }

  fetchProperties() {
    console.log('Fetching properties for realtor:', this.realtor?.id); // <-- Add this line
    if (!this.realtor || !this.realtor.id) return;
    this.propertiesLoading = true;

    this.http.get<any[]>(`${this.API_BASE_URL}/api/properties/${this.realtor.id}/thumbnails`)

    
      .subscribe({
        next: (data) => {
          console.log('Fetched properties new:', data); // <-- Add this line
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

  applyPropertyFilters() {
    this.filteredProperties = (this.properties || []).filter(p =>
      (!this.selectedType || p.propertyType === this.selectedType) &&
      (!this.selectedStatus || p.listingStatus === this.selectedStatus)
    );
    this.updatePropertyMarkers();
  }

  updatePropertyMarkers() {
    const props = (this.filteredProperties || []).filter(p => p.lat && p.lng);

    if (this.markerClusterGroup) {
      try { this.markerClusterGroup.clearLayers(); } catch (e) { /* ignore */ }
    } else {
      this.markerClusterGroup = (L as any).markerClusterGroup ? (L as any).markerClusterGroup() : null;
    }

    if (!this.markerClusterGroup) {
      this.propertyMarkers = [];
      props.forEach(p => {
        const customIcon = this.createCustomDivIconForProperty(p);
        const m: any = L.marker([p.lat, p.lng], { icon: customIcon });
        m.propertyId = p.id; // allow matching later
        // bind an initial popup (may be missing names)
        m.bindPopup(this.getPropertyPopupHtml(p));
        // ensure names are fetched and then update popup content
        this.locationService.ensurePropertyNames(p).then(() => {
          try { m.setPopupContent(this.getPropertyPopupHtml(p)); } catch {}
        });
        m.on('popupopen', (event: any) => {
          // attach click handler to the popup content to fetch property details and show panel
          setTimeout(() => {
            const popupEl = event?.popup?.getElement?.();
            const content = popupEl?.querySelector?.('.property-popup-content') as HTMLElement | null;
            if (content) {
              content.addEventListener('click', (ev: Event) => {
                console.log('Popup content clicked for property id:', p.id);
                ev.stopPropagation();
                // Fetch full property details by ID and show details panel
                this.http.get<any>(`${this.API_BASE_URL}/api/properties/${p.id}`).subscribe(fullProperty => {
                  this.ngZone.run(() => {
                    this.selectedProperty = fullProperty;
                    this.showDetails = true;
                    try { (event.target as any).closePopup(); } catch {}
                  });
                });
              }, { once: true });
            }
          }, 0);
        });
         this.propertyMarkers.push(m);
       });
       return;
     }
 
     // cluster case
     props.forEach(p => {
       const customIcon = this.createCustomDivIconForProperty(p);
       const m: any = L.marker([p.lat, p.lng], { icon: customIcon });
       m.propertyId = p.id; // important for updatePopupForProperty()
       m.bindPopup(this.getPropertyPopupHtml(p));
       // fetch names if needed and update popup + cluster layers
       this.locationService.ensurePropertyNames(p).then(() => {
         try { m.setPopupContent(this.getPropertyPopupHtml(p)); } catch {}
         try { this.updatePopupForProperty(p); } catch {}
       });
       m.on('popupopen', (event: any) => {
        setTimeout(() => {
          const popupEl = event?.popup?.getElement?.();
          const content = popupEl?.querySelector?.('.property-popup-content') as HTMLElement | null;
          if (content) {
            content.addEventListener('click', (ev: Event) => {
              ev.stopPropagation();
              // Fetch full property details by ID and show details panel
              this.http.get<any>(`${this.API_BASE_URL}/api/properties/${p.id}`).subscribe(fullProperty => {
                this.ngZone.run(() => {
                  this.selectedProperty = fullProperty;
                  this.showDetails = true;
                  try { (event.target as any).closePopup(); } catch {}
                });
              });
            }, { once: true });
          }
        }, 0);
      });
       this.markerClusterGroup.addLayer(m);
     });
 
     this.propertyMarkers = [this.markerClusterGroup];
   }

  createCustomDivIconForProperty(p: any): DivIcon {
    const typeInitial = p.propertyType ? p.propertyType.charAt(0) : '';
    let priceLabel = '';
    if (p.price) {
      priceLabel = (p.price / 1000).toFixed(0) + 'K JOD';
    }
    let markerColor = '#43a047'; // green
    if (p.listingStatus === 'Sold') markerColor = '#d32f2f';
    else if (p.listingStatus === 'De_Listed') markerColor = '#757575';

    return new DivIcon({
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
  }
 
   private updatePopupForProperty(property: any) {
    const content = this.getPropertyPopupHtml(property);
    // cluster group case
    if (this.markerClusterGroup && typeof this.markerClusterGroup.eachLayer === 'function') {
      this.markerClusterGroup.eachLayer((layer: any) => {
        try {
          if ((layer as any).propertyId === property.id && typeof layer.setPopupContent === 'function') {
            layer.setPopupContent(content);
          }
        } catch { /* ignore */ }
      });
    }
    // non-cluster markers
    (this.propertyMarkers || []).forEach((layer: any) => {
      try {
        if (layer && (layer as any).propertyId === property.id && typeof layer.setPopupContent === 'function') {
          layer.setPopupContent(content);
        }
      } catch { /* ignore */ }
    });
  }

  getPropertyPopupHtml(property: any): string {
   /* let photoUrl = '';
    if (property.mainPhotoThumbnail) {
      photoUrl = property.mainPhotoThumbnail;
    } else if (property.photos && property.photos.length > 0) {
      const mainPhoto = property.photos.find((ph: any) => ph.isMain) || property.photos[0];
      photoUrl = this.getPhotoUrl(mainPhoto) ?? '';
    }
*/
    let photoUrl: string | undefined = this.getPhotoUrlNew(property);

     const cityId = property.cityId ?? property.city?.id;
    const districtId = property.districtId ?? property.district?.id;
    const neighborhoodId = property.neighborhoodId ?? property.neighborhood?.id;

    // prefer in-object names, else empty for now
    const districtNameEn = property.district?.nameEn ?? '';
    const districtNameAr = property.district?.nameAr ?? '';
    const cityName = property.city?.nameEn ?? (typeof property.city === 'string' ? property.city : '') ?? '';
    const neighborhoodName = property.neighborhood?.nameEn ?? (typeof property.neighborhood === 'string' ? property.neighborhood : '') ?? '';

    // If any name is missing but we have ids, ask shared LocationService to populate and update popup once ready.
    const needsFetch = ((!districtNameEn && districtId) || (!cityName && cityId) || (!neighborhoodName && neighborhoodId));
    if (needsFetch) {
      this.locationService.ensurePropertyNames(property).then(() => {
        try { this.updatePopupForProperty(property); } catch { /* ignore */ }
      });
    }
   
   

    return `
      <div class="property-popup-content" style="display: flex; flex-direction: row; align-items: flex-start; min-width:320px; max-width:420px; gap: 16px; cursor:pointer;">
        <div style="flex: 0 0 120px;">
          <img src="${photoUrl}" alt="photo" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px; background: #eee;">
        </div>
        <div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-weight:bold;color:#1976d2;">${property.address}</div>
          <div style="color:#444;">${property.propertyType} | ${(property.price ? (property.price / 1000).toFixed(0) + 'K JOD' : '')}</div>
          <div style="color:#666;font-size:0.95em;">${property.address}, ${cityName} ${districtNameEn} (${districtNameAr}) ${neighborhoodName}</div>
        </div>
      </div>
    `;
  }


  getPhotoUrlNew(property: any): string | undefined {
  if (property.mainPhotoThumbnail && property.mainPhotoThumbnail.length > 100) {
    return `data:image/jpeg;base64,${property.mainPhotoThumbnail}`;
  }
  if (property.mainPhotoUrl) {
    return property.mainPhotoUrl;
  }
  // fallback for old structure
  if (property.photos && property.photos.length > 0) {
    const mainPhoto = property.photos.find((ph: any) => ph.isMain) || property.photos[0];
    if (mainPhoto.imageBlob && typeof mainPhoto.imageBlob === 'string' && mainPhoto.imageBlob.length > 100) {
      return `data:image/jpeg;base64,${mainPhoto.imageBlob}`;
    }
    if (mainPhoto.url) {
      return mainPhoto.url;
    }
  }
  return undefined;
}

  toggleEdit(field: string) {
    switch (field) {
      case 'firstName':
        this.editFirstName = true;
        this.editFirstNameValue = this.realtor?.firstName || '';
        break;
      case 'lastName':
        this.editLastName = true;
        this.editLastNameValue = this.realtor?.lastName || '';
        break;
      case 'username':
        this.editUsername = true;
        this.editUsernameValue = this.realtor?.username || '';
        break;
      case 'password':
        this.editPassword = true;
        this.editPasswordValue = '';
        break;
      case 'email':
        this.editEmail = true;
        this.editEmailValue = this.realtor?.email || '';
        break;
      case 'phone':
        this.editPhone = true;
        this.editPhoneValue = this.realtor?.phoneNumber || '';
        break;
      case 'license':
        this.editLicense = true;
        this.editLicenseValue = this.realtor?.licenseNumber || '';
        break;
      case 'brokerage':
        this.editBrokerage = true;
        this.editBrokerageValue = this.realtor?.brokerageName || '';
        break;
      case 'brokerageAddress':
        this.editBrokerageAddress = true;
        this.editBrokerageAddressValue = this.realtor?.brokerageAddress || '';
        break;
      case 'website':
        this.editWebsite = true;
        this.editWebsiteValue = this.realtor?.websiteUrl || '';
        break;
      case 'bio':
        this.editBio = true;
        this.editBioValue = this.realtor?.bio || '';
        break;
      case 'socialLinks':
        this.editSocialLinks = true;
        this.editSocialLinksValue = Array.isArray(this.realtor?.socialLinks) ? [...this.realtor.socialLinks] : [];
        break;
    }
  }

  saveEdit(field: string) {
    if (!this.realtor) return;

    // User fields
    if (['firstName', 'lastName', 'username', 'email', 'phone', 'password'].includes(field)) {
      let userPayload: any = {};
      let closeEdit = () => {};

      switch (field) {
        case 'firstName':
          userPayload.firstName = this.editFirstNameValue;
          closeEdit = () => { this.realtor!.firstName = this.editFirstNameValue; this.editFirstName = false; };
          break;
        case 'lastName':
          userPayload.lastName = this.editLastNameValue;
          closeEdit = () => { this.realtor!.lastName = this.editLastNameValue; this.editLastName = false; };
          break;
        case 'username':
          userPayload.username = this.editUsernameValue;
          closeEdit = () => { this.realtor!.username = this.editUsernameValue; this.editUsername = false; };
          break;
        case 'email':
          userPayload.email = this.editEmailValue;
          closeEdit = () => { this.realtor!.email = this.editEmailValue; this.editEmail = false; };
          break;
        case 'phone':
          userPayload.phoneNumber = this.editPhoneValue;
          closeEdit = () => { this.realtor!.phoneNumber = this.editPhoneValue; this.editPhone = false; };
          break;
        case 'password':
          userPayload.password = this.editPasswordValue;
          closeEdit = () => { this.editPassword = false; };
          break;
      }

      this.http.put(`${this.API_BASE_URL}/api/users/${this.realtor.userId}`, userPayload)
        .subscribe({
          next: () => closeEdit(),
          error: () => closeEdit() // Optionally handle error
        });
      return;
    }

    // Realtor fields
    if (['license', 'brokerage', 'brokerageAddress', 'website', 'bio', 'socialLinks'].includes(field)) {
      let realtorPayload: any = {};
      let closeEdit = () => {};

      switch (field) {
        case 'license':
          realtorPayload.licenseNumber = this.editLicenseValue;
          closeEdit = () => { this.realtor!.licenseNumber = this.editLicenseValue; this.editLicense = false; };
          break;
        case 'brokerage':
          realtorPayload.brokerageName = this.editBrokerageValue;
          closeEdit = () => { this.realtor!.brokerageName = this.editBrokerageValue; this.editBrokerage = false; };
          break;
        case 'brokerageAddress':
          realtorPayload.brokerageAddress = this.editBrokerageAddressValue;
          closeEdit = () => { this.realtor!.brokerageAddress = this.editBrokerageAddressValue; this.editBrokerageAddress = false; };
          break;
        case 'website':
          realtorPayload.websiteUrl = this.editWebsiteValue;
          closeEdit = () => { this.realtor!.websiteUrl = this.editWebsiteValue; this.editWebsite = false; };
          break;
        case 'bio':
          realtorPayload.bio = this.editBioValue;
          closeEdit = () => { this.realtor!.bio = this.editBioValue; this.editBio = false; };
          break;
        case 'socialLinks':
          realtorPayload.socialLinks = this.editSocialLinksValue.filter(link => !!link);
          closeEdit = () => { this.realtor!.socialLinks = this.editSocialLinksValue.filter(link => !!link); this.editSocialLinks = false; };
          break;
       

      }
      

      this.http.put(`${this.API_BASE_URL}/api/realtors/${this.realtor.id}`, realtorPayload)
        .subscribe({
          next: () => closeEdit(),
          error: () => closeEdit() // Optionally handle error
        });
      return;
    }

    // Add this case for profilePhoto
    if (field === 'profilePhoto') {
      const realtorPayload: any = {
        profilePhoto: this.realtor.profilePhoto
      };
      this.http.put(`${this.API_BASE_URL}/api/realtors/${this.realtor.id}`, realtorPayload)
        .subscribe({
          next: () => {
            // Optionally clear preview and file after update
            this.photoPreview = null;
            this.selectedPhotoFile = null;
          },
          error: () => {
            // Optionally handle error
          }
        });
      return;
    }
  }

  saveAll() {
    if (!this.realtor) return;

    // User fields
    const userPayload: any = {
      firstName: this.realtor.firstName,
      lastName: this.realtor.lastName,
      email: this.realtor.email,
      username: this.realtor.username,
      phoneNumber: this.realtor.phoneNumber
    };
    if (this.editPasswordValue) {
      userPayload.password = this.editPasswordValue;
    }

    // Realtor fields
    const realtorPayload = {
      licenseNumber: this.realtor.licenseNumber,
      brokerageName: this.realtor.brokerageName,
      brokerageAddress: this.realtor.brokerageAddress,
      websiteUrl: this.realtor.websiteUrl,
      bio: this.realtor.bio,
      socialLinks: this.realtor.socialLinks
    };

    // Update user info
    this.http.put(`${this.API_BASE_URL}/api/users/${this.realtor.userId}`, userPayload)
      .subscribe({
        next: () => { /* Optionally show success */ },
        error: () => { /* Optionally show error */ }
      });

    // Update realtor info
    this.http.put(`${this.API_BASE_URL}/api/realtors/${this.realtor.id}`, realtorPayload)
      .subscribe({
        next: () => { /* Optionally show success */ },
        error: () => { /* Optionally show error */ }
      });
  }

  saveWebsite() {
    // Call your update API here if needed
    this.realtor!.websiteUrl = this.editWebsiteValue;
    this.editWebsite = false;
  }

  savePhone() {
    this.realtor!.phoneNumber = this.editPhoneValue;
    this.editPhone = false;
  }

  saveBio() {
    this.realtor!.bio = this.editBioValue;
    this.editBio = false;
  }

  saveSocialLinks() {
    if (!this.realtor) return;
    this.realtor.socialLinks = (this.editSocialLinksValue || []).filter(link => !!link);
    this.editSocialLinks = false;
  }

  setEditSocialLinksValue() {
    // Always set as array, never string
    if (Array.isArray(this.realtor?.socialLinks)) {
      this.editSocialLinksValue = [...this.realtor!.socialLinks];
    } else if (typeof this.realtor?.socialLinks === 'string' && this.realtor.socialLinks) {
      this.editSocialLinksValue = [this.realtor.socialLinks];
    } else {
      this.editSocialLinksValue = [];
    }
    this.editSocialLinks = true;
  }

  startEditWebsite() {
    this.editWebsiteValue = this.realtor?.websiteUrl || '';
    this.editWebsite = true;
  }

  onLogout() {
    // Implement your logout logic here
     
    this.realtorService.clearRealtor;
    this.realtorService.setRealtor(null);
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

  showDistrictPolygonsOnMap() {
  this.districtPolygonLayers = [];
  if (!this.realtor?.districts) return;

  let firstLatLng: any = null;

  this.realtor.districts.forEach(district => {
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
      `${this.realtor?.firstName} ${this.realtor?.lastName} provides real estate service in ${district.nameEn}<br>` +
      `  يقدم خدمات الوساطة العقارية في ${district.nameAr} ${this.realtor?.firstName} ${this.realtor?.lastName} `,
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
  if (!this.photoPreview || !this.realtor) return;
  const base64 = (this.photoPreview as string).split(',')[1];
  this.realtor.profilePhoto = base64;
  this.saveEdit('profilePhoto');
}

goToRealtors(event: Event) {
  event.preventDefault();
  this.router.navigate(['/realtors']);
}

  // local caches (delegate to LocationService but keep local copies for template sync)
  private cityCache: Record<number, any> = {};
  private districtCache: Record<number, any> = {};
  private neighborhoodCache: Record<number, any> = {};

  private fetchCity(id: number): Promise<any> {
    if (!id) return Promise.resolve(null);
    if (this.cityCache[id]) return Promise.resolve(this.cityCache[id]);
    return this.locationService.getCity(Number(id))
      .then(c => { if (c) this.cityCache[id] = c; return c; })
      .catch(() => null);
  }

  private fetchDistrict(id: number): Promise<any> {
    if (!id) return Promise.resolve(null);
    if (this.districtCache[id]) return Promise.resolve(this.districtCache[id]);
    return this.locationService.getDistrict(Number(id))
      .then(d => { if (d) this.districtCache[id] = d; return d; })
      .catch(() => null);
  }

  private fetchNeighborhood(id: number): Promise<any> {
    if (!id) return Promise.resolve(null);
    if (this.neighborhoodCache[id]) return Promise.resolve(this.neighborhoodCache[id]);
    return this.locationService.getNeighborhood(Number(id))
      .then(n => { if (n) this.neighborhoodCache[id] = n; return n; })
      .catch(() => null);
  }

  // Ensure property has readable city/district/neighborhood names (fills property and local caches)
  private ensurePropertyNames(property: any): Promise<void> {
    if (!property) return Promise.resolve();
    const hasNames = !!(property.city?.nameEn || property.district?.nameEn || property.neighborhood?.nameEn);
    if (hasNames) return Promise.resolve();

    const cityId = property.cityId ?? property.city?.id;
    const districtId = property.districtId ?? property.district?.id;
    const neighborhoodId = property.neighborhoodId ?? property.neighborhood?.id;

    return Promise.all([
      cityId ? this.fetchCity(Number(cityId)) : Promise.resolve(null),
      districtId ? this.fetchDistrict(Number(districtId)) : Promise.resolve(null),
      neighborhoodId ? this.fetchNeighborhood(Number(neighborhoodId)) : Promise.resolve(null)
    ]).then(([city, district, neighborhood]) => {
      if (city) { property.city = property.city || {}; property.city.nameEn = city.nameEn; property.city.nameAr = city.nameAr; this.cityCache[cityId] = city; }
      if (district) { property.district = property.district || {}; property.district.nameEn = district.nameEn; property.district.nameAr = district.nameAr; this.districtCache[districtId] = district; }
      if (neighborhood) { property.neighborhood = property.neighborhood || {}; property.neighborhood.nameEn = neighborhood.nameEn; property.neighborhood.nameAr = neighborhood.nameAr; this.neighborhoodCache[neighborhoodId] = neighborhood; }
    }).then(() => {});
  }

  // called when a property popup is clicked (you already set this.selectedProperty and this.showDetails = true)
  closeDetails() {
    this.showDetails = false;
    this.selectedProperty = null;
    // let layout settle then trigger resize so Leaflet re-calculates when map is shown again
    setTimeout(() => {
      try { window.dispatchEvent(new Event('resize')); } catch (e) { /* ignore */ }
    }, 200);
  }
}