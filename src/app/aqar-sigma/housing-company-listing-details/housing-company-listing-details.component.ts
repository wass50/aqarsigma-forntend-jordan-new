import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HousingProperty, AppartmentDetail, HousingPropertyPhoto } from '../HousingProperty';
import { HttpClient } from '@angular/common/http';
import { HousingService } from '../housing-account/HousingService';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment'; // { changed code }



import { NgIf, NgFor, JsonPipe } from '@angular/common';        
import { LanguageService } from '../LanguageService';

@Component({
  selector: 'app-housing-company-listing-details',
  standalone: true,
  imports: [
    CommonModule,
    // ...other imports if needed...
  ],
  templateUrl: './housing-company-listing-details.component.html',
  styleUrls: ['./housing-company-listing-details.component.css']
})
export class HousingCompanyListingDetailsComponent implements OnInit  , AfterViewInit {
  @Input() property!: HousingProperty;
  @Output() close = new EventEmitter<void>();
  @Output() propertyActivated = new EventEmitter<HousingProperty>();
readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }

  showPhotoModal = false;
  currentPhotoIndex = 0;
  showFullDescription = false;
  showFullSummary = false;
  selectedMeasurementSystem: 'Imperial' | 'Metric' = 'Imperial';

  isEditMode = false;
  editProperty: any = {};
  contactInfo: any = null;
  contactType: 'housing_company' | 'user' | null = null;

  map: any;
  districtLayer: any;
  marker: any;


  isAdmin: boolean = false; // <-- Add this line

  activationMessage: string = '';
  activationInProgress: boolean = false;

  language: 'en' | 'ar' = 'en'; // Default to English

  constructor(private http: HttpClient, private housingService: HousingService,private languageService: LanguageService) {



      this.languageService.language$.subscribe(lang => this.language = lang);

  }

  ngOnInit() {
    // ...your existing property loading logic...


     const user = JSON.parse(localStorage.getItem('adminProfile') || '{}');
    this.isAdmin = user?.role === 'admin';
    this.loadContactInfo();
   
    
  }




    ngAfterViewInit() {
  // Inject Leaflet CSS if not present (for popup/new window)
  console.log('ngAfterViewInit called:  start');
  console.log('Property data:', this.property);
  const leafletCssId = 'leaflet-css';
  if (!document.getElementById(leafletCssId)) {
    const link = document.createElement('link');
    link.id = leafletCssId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
    document.head.appendChild(link);
  }

  if (this.map) {
    this.map.remove();
  }
  const lat = this.property?.lat ?? 31.963158;
  const lng = this.property?.lng ?? 35.930359;
  this.map = L.map('property-map').setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(this.map);


  const googleIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    iconSize: [32, 32], // size of the icon
    iconAnchor: [16, 32], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -32] // point from which the popup should open relative to the iconAnchor
  });
  L.marker([lat, lng], { icon: googleIcon }).addTo(this.map);


  if (
    this.property.district &&
    Array.isArray(this.property.district.polygons) &&
    this.property.district.polygons.length
  ) {
    const geoJson = this.polygonsToGeoJson(this.property.district.polygons);
    this.districtLayer = L.geoJSON(geoJson, {
      style: {
        color: '#1976d2',
        weight: 3,
        fillOpacity: 0.08
      }
    }).addTo(this.map);
    this.map.fitBounds(this.districtLayer.getBounds());
  }
}


 ngAfterViewInit1() {
  if (this.map) {
    this.map.remove();
  }
  if (this.property && this.property.lat && this.property.lng) {
    this.map = L.map('property-map').setView([this.property.lat, this.property.lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([this.property.lat, this.property.lng]).addTo(this.map);

    if (this.property.district && Array.isArray(this.property.district.polygons) && this.property.district.polygons.length) {
      const geoJson = this.polygonsToGeoJson(this.property.district.polygons);
      this.districtLayer = L.geoJSON(geoJson, {
        style: {
          color: '#1976d2',
          weight: 3,
          fillOpacity: 0.08
        }
      }).addTo(this.map);
      this.map.fitBounds(this.districtLayer.getBounds());
    }
  }
}

  loadContactInfo() {
    if (this.property?.housingId) {
      this.http.get(`${this.API_BASE_URL}/api/housing-companies/by-property/${this.property.id}`)
        .subscribe(data => {
          this.contactInfo = data;
          this.contactType = 'housing_company';
        });
    } else if (this.property?.userId) {
      this.http.get(`${this.API_BASE_URL}/api/users/user-by-property/${this.property.id}`)
        .subscribe(data => {
          this.contactInfo = data;
          this.contactType = 'user';
        });
    }
  }

  scrollToSection(event: Event, sectionId: string) {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openPhotoModal(index: number) {
    this.currentPhotoIndex = index;
    this.showPhotoModal = true;
  }

  closePhotoModal() {
    this.showPhotoModal = false;
  }

  nextPhoto() {
    if (this.property?.photos && this.property.photos.length > 0) {
      this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.property.photos.length;
    }
  }

  prevPhoto() {
    if (this.property?.photos && this.property.photos.length > 0) {
      this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.property.photos.length) % this.property.photos.length;
    }
  }

  get propertyDaysOnMarket(): number | null {
    if (!this.property?.listingDate) return null;
    const listing = new Date(this.property.listingDate);
    const now = new Date();
    // Calculate difference in days
    const diff = Math.floor((now.getTime() - listing.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  }

  get statusChange(): string | null {
    if (!this.property?.updatedOn) return null;
    const updated = new Date(this.property.updatedOn);
    const now = new Date();
    const diff = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? 'Today' : `${diff} day${diff > 1 ? 's' : ''} ago`;
  }

  convertSize(size: string, from: 'Imperial' | 'Metric', to: 'Imperial' | 'Metric'): string {
    if (from === to) return size;
    // Extract numbers from "22.2 x 19.5 ft" or "6.8 x 5.9 m"
    const match = size.match(/^([\d.]+)\s*x\s*([\d.]+)\s*(ft|m)?$/i);
    if (!match) return size;
    let width = parseFloat(match[1]);
    let length = parseFloat(match[2]);
    if (from === 'Imperial' && to === 'Metric') {
      width = +(width * 0.3048).toFixed(2);
      length = +(length * 0.3048).toFixed(2);
      return `${width} x ${length} m`;
    }
    if (from === 'Metric' && to === 'Imperial') {
      width = +(width / 0.3048).toFixed(2);
      length = +(length / 0.3048).toFixed(2);
      return `${width} x ${length} ft`;
    }
    return size;
  }

 

  getRoomFeaturesDisplay(features: string[] | string | null | undefined): string {
    if (Array.isArray(features)) {
      return features.join(', ');
    }
    if (typeof features === 'string' && features.trim().length > 0) {
      return features;
    }
    return '-';
  }



getPhotoUrl(photo: HousingPropertyPhoto | string | File | null | undefined): string | undefined {
  if (!photo) return undefined;

  // If it's a PropertyPhoto object
  if (typeof photo === 'object') {
    // Prefer imageBlob if present
    if ('imageBlob' in photo && typeof photo.imageBlob === 'string' && photo.imageBlob.length > 100) {
      return `data:image/jpeg;base64,${photo.imageBlob}`;
    }
    // If imageBlob is a File
    if ('imageBlob' in photo && photo.imageBlob instanceof File) {
      return URL.createObjectURL(photo.imageBlob);
    }
    // Fallback to url if present
    if ('url' in photo && typeof photo.url === 'string') {
      return photo.url;
    }
  }

  // If it's a File
  if (photo instanceof File) {
    return URL.createObjectURL(photo);
  }

  // If it's a base64 string
  if (typeof photo === 'string' && photo.length > 100) {
    return `data:image/jpeg;base64,${photo}`;
  }

  // If it's a short string (URL)
  if (typeof photo === 'string') {
    return photo;
  }

  return undefined;
}


  getPhotoUrl1(photo: HousingPropertyPhoto | string | File | null | undefined): string | undefined {
   
   console.log('getPhotoUrl called with photo1:', photo);
   
    if (!photo){
      console.log('No photo provided');
       return undefined;
    }

    // If it's a PropertyPhoto object
    if (typeof photo === 'object' && 'url' in photo) {
      console.log('Photo is a HousingPropertyPhoto object:');
      // Prefer imageBlob if present
      if (photo.imageBlob instanceof File) {
        console.log('Blob photo detected');
        return URL.createObjectURL(photo.imageBlob);
      }
      if (typeof photo.imageBlob === 'string' && photo.imageBlob.length > 100) {
        console.log('Base64 photo detected');
        console.log('Base64 photo detected'); 
        return `data:image/jpeg;base64,${photo.imageBlob}`;
      }
      // Fallback to url
      return photo.url;
    }

    // If it's a File
    if (photo instanceof File) {
      console.log('Photo is a File object');
      return URL.createObjectURL(photo);
    }

    // If it's a base64 string
    if (typeof photo === 'string' && photo.length > 100) {
      console.log('Photo is a base64 string');
      return `data:image/jpeg;base64,${photo}`;
    }

    // If it's a short string (URL)
    if (typeof photo === 'string') {
      console.log('Photo is a URL string');
      return photo;
    }
console.log('Photo format not recognized');
    return undefined;
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
    return typeof profilePhoto === 'string' ? profilePhoto : undefined;
  }

  enableEdit() {
    this.isEditMode = true;
    this.editProperty = { ...this.property }; // shallow copy for editing
  }

  cancelEdit() {
    this.isEditMode = false;
  }

  saveEdit() {
    // Send PUT request with this.editProperty
    this.http.put(`${this.API_BASE_URL}/api/properties/${this.property.id}`, this.editProperty)
      .subscribe({
        next: (updated: any) => {
          Object.assign(this.property, this.editProperty);
          this.isEditMode = false;
        },
        error: () => {
          // Optionally show error
        }
      });
  }

  canEditProperty(): boolean {
    //console.log('Checking edit permissions for property:', this.property);
    const housing = this.housingService.getHousing();
    // Only allow edit if realtor matches AND status is Active
   //console.log('property.housingId:', this.property?.housingId, 'housing.id:', housing?.id);
   //console.log('property.listingStatus:', this.property?.listingStatus);  
   
   //console.log('property.realtorId:', this.property?.housingId);
   // console.log('realtor.id:', housing?.id);
   // console.log('property.listingStatus:', this.property?.listingStatus);
   
   //console.log('Current realtor:', housing);
    
   
   //console.log (!!housing &&
   //   String(this.property?.housingId) === String(housing.id) &&
   //   this.property?.listingStatus === 'Active')
    
    console.log('canEditProperty result:', !!housing &&
      String(this.property?.housingId) === String(housing.id) &&
      this.property?.listingStatus === 'Active');

      console.log('!!housing', !!housing);
      console.log(this.property?.housingId);
      console.log(housing?.id);
      console.log( this.property?.listingStatus);
  
         
      return (
      !!housing &&
      String(this.property?.housingId) === String(housing.id) &&
      this.property?.listingStatus === 'Active'
    );
  }

  get daysOnMarket(): number | null {
    if (!this.property?.listingDate) return null;
    const listingDate = new Date(this.property.listingDate);
    const today = new Date();
    // Calculate difference in milliseconds
    const diffMs = today.getTime() - listingDate.getTime();
    // Convert to days
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  formatPriceRange(priceRange: string | number): string {
    if (typeof priceRange === 'string' && priceRange.includes('-')) {
      const [low, high] = priceRange.split('-').map(p =>
        Math.round(parseInt(p.replace(/\D/g, ''), 10) / 1000)
      );
      return `${low}K-${high}K JOD`;
    }
    if (typeof priceRange === 'number') {
      return `${Math.round(priceRange / 1000)}K JOD`;
    }
    return priceRange ? priceRange + ' JOD' : '';
  }

  
  private polygonsToGeoJson(polygons: any[]): any {
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          polygons
            .sort((a: any, b: any) => a.coordinateOrder - b.coordinateOrder)
            .map((p: any) => [p.longitude, p.latitude])
        ]
      }
    };
  }

  selectedFloorPlan: string | null = null;

openFloorPlanModal(floorPlan: string) {
  this.selectedFloorPlan = floorPlan;
  const modal: any = document.getElementById('floorPlanModal');
  if (modal) {
    // Bootstrap 5 modal
    const bsModal = new (window as any).bootstrap.Modal(modal);
    bsModal.show();
  }
}


convertFileToBase64(fileOrBlob: Blob, callback: (base64: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    callback(reader.result as string);
  };
  reader.readAsDataURL(fileOrBlob);
}

openFloorPlanModalFromFile(fileOrBlob: Blob) {
  this.convertFileToBase64(fileOrBlob, (base64: string) => {
    const base64Data = base64.split(',')[1];
    this.openFloorPlanModal(base64Data);
  });
}

handleFloorPlanClick(floorPlan: any) {
  if (typeof floorPlan === 'string') {
    this.openFloorPlanModal(floorPlan);
  } else if (floorPlan instanceof File || floorPlan instanceof Blob) {
    this.convertFileToBase64(floorPlan, (base64: string) => {
      const base64Data = base64.split(',')[1];
      this.openFloorPlanModal(base64Data);
    });
  } else {
    console.error('Invalid floorPlan type:', floorPlan);
  }
}

getFloorPlanSrc(floorPlan: any): string {
  if (floorPlan instanceof File) {
    return this.floorPlanThumbUrl(floorPlan);
  }
  if (typeof floorPlan === 'string') {
    if (floorPlan.startsWith('data:image')) {
      return floorPlan;
    }
    return 'data:image/jpeg;base64,' + floorPlan;
  }
  return '';
}

floorPlanThumbUrl(file: File): string {
  return URL.createObjectURL(file);
}


apartmentFilter: 'For_Sale' | 'Sold_Out' = 'For_Sale';

getFilteredApartments() {
  if (!this.property?.apartments) return [];
  return this.property.apartments.filter(a => a.listingStatus === this.apartmentFilter);
}

getApartmentCount(status: 'For_Sale' | 'Sold_Out') {
  if (!this.property?.apartments) return 0;
  return this.property.apartments.filter(a => a.listingStatus === status).length;
}


activateProperty(property: HousingProperty) {
    if (this.activationInProgress) return;
    this.activationInProgress = true;

    // Get the admin user ID from localStorage (adjust key if needed)
    const user = JSON.parse(localStorage.getItem('adminProfile') || '{}');
    const activatedByUserId = user?.id;

    let amenitiesArray: string[] = [];
    if (typeof property.amenities === 'string') {
      amenitiesArray = property.amenities.split(',').map((f: string) => f.trim());
    } else if (Array.isArray(property.amenities)) {
      amenitiesArray = property.amenities as string[];
    }


     const apartments = (property.apartments || []).map(apartment => {
    let featuresArray: string[] = [];
    if (typeof apartment.features === 'string') {
      featuresArray = apartment.features.split(',').map((f: string) => f.trim());
    } else if (Array.isArray(apartment.features)) {
      featuresArray = apartment.features as string[];
    }
    return {
      ...apartment,
      features: featuresArray
    };
  });


    const updated = {
      ...property,
      listingStatus: 'Active',
      cityId: property.city?.id ?? property.cityId,
      districtId: property.district?.id ?? property.districtId,
      neighborhoodId: property.neighborhood?.id ?? property.neighborhoodId,
      city: undefined,
      district: undefined,
      neighborhood: undefined,
      amenities : amenitiesArray,
      apartments: apartments,
     
      activatedByUserId // <-- Add to payload
    };
    console.log('Activate Property Payload:', updated);

    // Send PUT request with activatedByUserId in payload
    this.http.put(
      `${this.API_BASE_URL}/api/precon-properties/${property.id}`,
      updated
    ).subscribe({
      next: () => {
        property.listingStatus = 'Active';
        this.activationMessage = 'Property has been activated successfully.';
        this.activationInProgress = false;
        this.propertyActivated.emit(property); // Notify parent
      },
      error: () => {
        this.activationMessage = 'Failed to activate property. Please try again.';
        this.activationInProgress = false;
      }
    });
  }

  getFeatureArray(features: string | string[] | null | undefined): string[] {
    if (Array.isArray(features)) {
      return features;
    }
    if (typeof features === 'string') {
      return features.split(',').map(f => f.trim());
    }
    return [];
  }

}



