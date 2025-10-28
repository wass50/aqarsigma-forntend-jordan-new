import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Property, RoomDetail, PropertyPhoto } from '../Property';
import { HttpClient } from '@angular/common/http';
import { RealtorService } from '../realtor-account/RealtorService'; // adjust path
import { UserService } from '../user-account/UserService'; // adjust path
import * as L from 'leaflet';
import { environment } from '../../../environments/environment'; // { changed code }
import { LanguageService } from '../LanguageService'; // adjust path if needed


@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './property-details.component.html',
  styleUrl: './property-details.component.css'
})
export class PropertyDetailsComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() property!: Property;
  @Output() close = new EventEmitter<void>();
  @Output() propertyActivated = new EventEmitter<Property>();

  @Input() showCloseButton = true;
  language: 'en' | 'ar' = 'en';
  readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }
  readonly MAP_TILE_URL = environment.map?.tileUrl ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  readonly MAP_ATTRIBUTION = environment.map?.attribution ?? '© OpenStreetMap contributors';
  readonly MAP_MAX_ZOOM = environment.map?.maxZoom ?? 18;
  readonly DEFAULT_MAP_CENTER = environment.map?.defaultCenter ?? { lat: 31.95, lng: 35.91 };
  readonly DEFAULT_MAP_ZOOM = environment.map?.defaultZoom ?? 12;

  showPhotoModal = false;
  currentPhotoIndex = 0;
  showFullDescription = false;
  showFullSummary = false;
  selectedMeasurementSystem: 'Imperial' | 'Metric' = 'Imperial';

  isEditMode = false;
  editProperty: any = {};
  contactInfo: any = null;
  contactType: 'realtor' | 'user' | null = null;

  map: any;
  districtLayer: any;
  marker: any;

  isAdmin: boolean = false; // <-- Add this line

  activationMessage: string = '';
  activationInProgress: boolean = false;

  isLoggedIn = false;
  propertyWatchLists: any[] = [];
  selectedWatchlist: any = null;

  constructor(private http: HttpClient, private realtorService: RealtorService, private userService: UserService, private languageService: LanguageService,) {

    this.languageService.language$.subscribe(lang => this.language = lang);
  }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('adminProfile') || '{}');
    this.isAdmin = user?.role === 'admin';
    // ...your existing property loading logic...
    console.log('ngOnInit called:   start ');
    this.loadContactInfo();
    console.log('ngOnInit called:  End')

    this.isLoggedIn = this.userService.isLoggedIn();
    console.log('Is user logged in?', this.isLoggedIn);
    if (this.isLoggedIn) {
      // Fetch user's property watchlists
      const userId = this.userService.getUser().id;
      this.http.get<any[]>(`${this.API_BASE_URL}/api/users/${userId}/watchlists?type=PROPERTY`).subscribe(lists => {
        this.propertyWatchLists = lists;
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['property']) {
      console.log('PropertyDetailsComponent ngOnChanges:', changes['property'].currentValue);
    }
  }

  
      ngAfterViewInit() {
    // Inject Leaflet CSS if not present (for popup/new window)
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
    const center = this.DEFAULT_MAP_CENTER;
  const zoom = this.DEFAULT_MAP_ZOOM;
    this.map = L.map('property-map').setView([center.lat, center.lng], zoom);

   L.tileLayer(this.MAP_TILE_URL, { maxZoom: this.MAP_MAX_ZOOM, attribution: this.MAP_ATTRIBUTION }).addTo(this.map);
 








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
      if (this.property?.realtorId) {
        this.http.get(`${this.API_BASE_URL}/api/realtors/by-property/${this.property.id}`)
          .subscribe(data => {
            this.contactInfo = data;
            this.contactType = 'realtor';
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
      if (this.property?.photos) {
        this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.property.photos.length;
      }
    }

    prevPhoto() {
      if (this.property?.photos) {
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

    getRoomMeasurementSystem(room: RoomDetail): 'Imperial' | 'Metric' {
      return room.measurementSystem === 'Imperial' || room.measurementSystem === 'Metric'
        ? room.measurementSystem
        : 'Imperial';
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

    getPhotoUrl(photo: PropertyPhoto | string | File | null | undefined): string | undefined {
      if (!photo) return undefined;

      // If it's a PropertyPhoto object
      if (typeof photo === 'object' && 'url' in photo) {
        // Prefer imageBlob if present
        if (photo.imageBlob instanceof File) {
          return URL.createObjectURL(photo.imageBlob);
        }
        if (typeof photo.imageBlob === 'string' && photo.imageBlob.length > 100) {
          return `data:image/jpeg;base64,${photo.imageBlob}`;
        }
        // Fallback to url
        return photo.url;
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
  
      console.log('Saving edited property:', this.editProperty);

      // Ensure features is sent as an array (backend expects List<String>)
      let featuresArray: string[] = [];
      if (typeof this.editProperty.features === 'string') {
        featuresArray = this.editProperty.features
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
      } else if (Array.isArray(this.editProperty.features)) {
        featuresArray = this.editProperty.features.map((s: any) => String(s).trim()).filter((s: string) => s.length > 0);
      }

      const payload = {
        ...this.editProperty,
        features: featuresArray,
        // ensure IDs are included and embedded objects removed to avoid server-side mapping issues
        cityId: this.editProperty.city?.id ?? this.editProperty.cityId,
        districtId: this.editProperty.district?.id ?? this.editProperty.districtId,
        neighborhoodId: this.editProperty.neighborhood?.id ?? this.editProperty.neighborhoodId,
        city: undefined,
        district: undefined,
        neighborhood: undefined
      };

      this.http.put(`${this.API_BASE_URL}/api/properties/${this.property.id}`, payload)
        .subscribe({
          next: (updated: any) => {
            // Use server response to update local property
            Object.assign(this.property, updated || payload);
            this.isEditMode = false;
          },
          error: () => {
            // Optionally show error
          }
        });
    }


canEditProperty(): boolean {
      // allow edit if:
      // - current user is admin
      // - current realtor matches property.realtorId and listing is Active (existing behaviour)
      // - OR the logged-in normal user owns the property (property.userId === user.id)
      const realtor = this.realtorService.getRealtor();
      const user = this.userService.getUser();



return (
        (!!realtor &&
        String(this.property?.realtorId) === String(realtor.id) &&
        this.property?.listingStatus === 'Active') ||
        (!!user && String(this.property?.userId) === String(user.id) &&
        this.property?.listingStatus === 'Active' )
      );

}

    canEditProperty1(): boolean {
      console.log('Checking edit permissions for property:', this.property);
      const realtor = this.realtorService.getRealtor();
      // Only allow edit if realtor matches AND status is Active
     console.log('property.realtorId:', this.property?.realtorId, 'realtor.id:', realtor?.id);
     console.log('property.listingStatus:', this.property?.listingStatus);  
     
     console.log('property.realtorId:', this.property?.realtorId);
      console.log('realtor.id:', realtor?.id);
      console.log('property.listingStatus:', this.property?.listingStatus);
     
     console.log('Current realtor:', realtor);
       console.log (!!realtor &&
        String(this.property?.realtorId) === String(realtor.id) &&
        this.property?.listingStatus === 'Active')
      return (
        !!realtor &&
        String(this.property?.realtorId) === String(realtor.id) &&
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

    activateProperty(property: Property) {
      if (this.activationInProgress) return;
      this.activationInProgress = true;

      // Get the admin user ID from localStorage (adjust key if needed)
      const user = JSON.parse(localStorage.getItem('adminProfile') || '{}');
      const activatedByUserId = user?.id;

      let featuresArray: string[] = [];
      if (typeof property.features === 'string') {
        featuresArray = property.features.split(',').map((f: string) => f.trim());
      } else if (Array.isArray(property.features)) {
        featuresArray = property.features as string[];
      }

      const updated = {
        ...property,
        listingStatus: 'Active',
        cityId: property.city?.id ?? property.cityId,
        districtId: property.district?.id ?? property.districtId,
        neighborhoodId: property.neighborhood?.id ?? property.neighborhoodId,
        city: undefined,
        district: undefined,
        neighborhood: undefined,
        features: featuresArray,
        activatedByUserId // <-- Add to payload
      };
      console.log('Activate Property Payload:', updated);

      // Send PUT request with activatedByUserId in payload
      this.http.put(
       `${this.API_BASE_URL}/api/properties/${property.id}`,
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

    openSaveToWatchlistModal() {
      const modal = document.getElementById('saveToWatchlistModal');
      if (modal) {
        // @ts-ignore
        new window.bootstrap.Modal(modal).show();
      }
    }

    savePropertyToWatchlist() {
      if (!this.selectedWatchlist) return;
      const watchlistId = this.selectedWatchlist.id;
      const propertyId = this.property.id;
      this.http.post(
        `${this.API_BASE_URL}/api/users/watchlists/${watchlistId}/properties?propertyId=${propertyId}`,
        {}
      ).subscribe({
        next: () => {
          // Optionally show success message
          // @ts-ignore
          window.bootstrap.Modal.getInstance(document.getElementById('saveToWatchlistModal')).hide();
        },
        error: (err) => {
          // Optionally show error message
          console.error('Error saving property to watchlist', err);
        }
      });
    }

    shareProperty() {
      // TODO: Implement share logic (copy link, open modal, etc.)
      alert('Share property feature coming soon!');
    }


    // address in current language (fallbacks)
    get addressLabel(): string {
    if (!this.property) return '';
    return this.language === 'en'
      ? (this.property.address || '')
      : (this.property.address || this.property.address || '');
  }

  // return parts in language-appropriate order
  private getLocationParts(): string[] {
    if (!this.property) return [];
    if (this.language === 'en') {
      return [
        this.property.city?.nameEn || '',
        this.property.district?.nameEn || '',
        this.property.neighborhood?.nameEn || ''
      ].filter(Boolean);
    } else {
      // Arabic order: neighborhood - district - city
      return [
        this.property.neighborhood?.nameAr || '',
        this.property.district?.nameAr || '',
        this.property.city?.nameAr || ''
      ].filter(Boolean);
    }
  }

  // joined label (uses ' - ' between parts)
  get locationLabel(): string {
    const parts = this.getLocationParts();
    return parts.length ? parts.join(' - ') : '';
  }

  // full key facts line with proper separator and Arabic comma
  get keyFactsLine(): string {
    if (!this.property) return '';
    const sep = this.language === 'en' ? ', ' : '، ';
    const title = this.language === 'en' ? 'Key facts for' : 'الحقائق الرئيسية لـ';
    return `${title} ${this.addressLabel}${this.locationLabel ? (sep + this.locationLabel) : ''}.`;
  }

  get floorLabel(): string {
    if (!this.property) return '';

    const raw = String(this.property.floor ?? '').trim();
    if (!raw) return '';

    // match text inside the last parenthesis pair: ( ... )
    const parenMatch = raw.match(/\(([^)]+)\)\s*$/);
    const inside = parenMatch ? parenMatch[1].trim() : '';

    // outside = raw with the parenthesis group removed
    const outside = raw.replace(/\s*\([^)]+\)\s*$/, '').trim();

    // Requirement: English should show the value without the bracket (outside)
    // Arabic should show what's inside the bracket (inside)
    if (this.language === 'en') {
      return outside || inside || raw;
    } else {
      return inside || outside || raw;
    }
  }

  // translation maps for select values (keys are the stored values)
  private valueLabels: { [K in 'waterSupply' | 'heatingType' | 'coolingType']: Record<string, { en: string; ar: string }> } = {
    waterSupply: {
      Municipal: { en: 'Municipal', ar: 'بلدي' },
      Well: { en: 'Well', ar: 'بئر' },
      Tank: { en: 'Tank', ar: 'خزان' },
      Spring: { en: 'Spring', ar: 'نبع' },
      Shared: { en: 'Shared', ar: 'مشترك' },
      None: { en: 'None', ar: 'لا يوجد' },
      Other: { en: 'Other', ar: 'أخرى' },
    },
    heatingType: {
      Central: { en: 'Central', ar: 'مركزي' },
      Gas: { en: 'Gas', ar: 'غاز' },
      Electric: { en: 'Electric', ar: 'كهرباء' },
      Solar: { en: 'Solar', ar: 'شمسي' },
      Diesel: { en: 'Diesel', ar: 'ديزل' },
      Fireplace: { en: 'Fireplace', ar: 'مدفأة' },
      None: { en: 'None', ar: 'لا يوجد' },
    },
    coolingType: {
      Central: { en: 'Central', ar: 'مركزي' },
      'Split Unit': { en: 'Split Unit', ar: 'وحدة منفصلة' },
      'Window Unit': { en: 'Window Unit', ar: 'وحدة نافذة' },
      Evaporative: { en: 'Evaporative', ar: 'تبخيري' },
      Fan: { en: 'Fan', ar: 'مروحة' },
      None: { en: 'None', ar: 'لا يوجد' },
    }
  };

  // Generic helper: returns translated label or the raw value as fallback
  translatePropertyValue(value: string | null | undefined, mapKey: 'waterSupply' | 'heatingType' | 'coolingType'): string {
    if (value == null || value === '') return '-';
    const map = this.valueLabels[mapKey];
    const key = String(value);
    const entry = map[key];
    if (entry) {
      return this.language === 'en' ? entry.en : entry.ar;
    }
    return key;
  }

  // convenience getters if you prefer calling without mapKey
  getWaterSupplyLabel(): string {
    return this.translatePropertyValue(this.property?.waterSupply ?? undefined, 'waterSupply');
  }
  getHeatingTypeLabel(): string {
    return this.translatePropertyValue(this.property?.heatingType ?? undefined, 'heatingType');
  }
  getCoolingTypeLabel(): string {
    return this.translatePropertyValue(this.property?.coolingType ?? undefined, 'coolingType');
  }

  }
