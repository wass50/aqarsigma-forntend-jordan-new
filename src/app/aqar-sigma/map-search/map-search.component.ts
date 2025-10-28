import { Component, AfterViewInit, ElementRef, ViewChild, HostListener, NgZone, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FormsModule } from '@angular/forms';
import { Property, PropertyPhoto, District, City } from '../Property'; // Adjust the import path as necessary
import { PropertyDetailsComponent } from '../property-details/property-details.component'; // Adjust path if needed
import { MapService } from './MapService';
//import * as L from 'leaflet';
//import { marker, DivIcon } from 'leaflet';
//import 'leaflet.markercluster';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router'; // Add this import
import { environment } from '../../../environments/environment';
import { LanguageService } from '../LanguageService';
import { Subscription } from 'rxjs';
import {  NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
type StatusKey = 'Active' | 'Sold' | 'De_Listed' | 'Pending';

// Use global Leaflet instance provided by angular.json "scripts" (avoid importing leaflet here)
declare global { interface Window { L: any; } }
declare const L: any;
// convenience wrappers that use the global L
const marker = (latlng: any, opts?: any) => (window as any).L.marker(latlng, opts);
const DivIcon = (window as any).L.DivIcon;

@Component({
  selector: 'app-map-search',
  standalone: true,
  imports: [
    CommonModule,
    LeafletModule,
    FormsModule,
    PropertyDetailsComponent // <-- This must be here!
  ],
  templateUrl: './map-search.component.html',
  styleUrl: './map-search.component.css'
})
export class MapSearchComponent implements OnInit, AfterViewInit {
  @ViewChild('activeGroup') activeGroup?: ElementRef;
  @ViewChild('activeDropdown') activeDropdown?: ElementRef;
  @ViewChild('soldGroup') soldGroup?: ElementRef;
  @ViewChild('soldDropdown') soldDropdown?: ElementRef;
  @ViewChild('priceFilterContainer') priceFilterContainer?: ElementRef;
  @ViewChild('priceSliderPanel') priceSliderPanel?: ElementRef;
  @ViewChild('moreFilterPanel') moreFilterPanel?: ElementRef;

  readonly API_BASE_URL = environment.apiBaseUrl;


 propertyDetailsInlineMode: boolean = environment.showDetailsInline ?? false;
  selectedPropertyInline: Property | null = null;
  showDetailsInline: boolean = false;
   language: 'en' | 'ar' = 'en';
 propertyTypes: string[] = [];
  listingTypes: string[] = [];
  propertyCategories: string[] = [];
  selectedType: string = 'All';
  selectedListingType: string = 'For_Sale'; // Default to For_Sale
  selectedCategory: string = 'All';
  selectedStatus: string = 'Active';
  activeDateRange: string = ''; // '', '7', '30', '180', 'year'
  soldDateRange: string = '';
  allProperties: Property[] = [];
  selectedOwnerType: 'all' | 'private' | 'realtor' = 'all'; // Add this property
  districts: District[] = [];
  cities: City[] = [];
  selectedDistrictId: number | '' = '';
  selectedCitytId: number | '' = '';
  dropDownDistricts: District[] = [];
  dropDownCities: City[] = [];
  isUpdateMinPrice: boolean = false;
  isUpdateMaxPrice: boolean = false;
  isUpdateMinArea: boolean = false;
  isUpdateMaxArea: boolean = false;
   selectedPrice: number | null = null;

  private markers: any;
  lastFetchedBounds: L.LatLngBounds | null = null;
  cachedProperties: Property[] = [];
  
  map: any;
   areaPolygon: { lat: number, lng: number }[] | null = null;

  minPrice: number = 0;
  maxPrice: number = 2000000;
  priceStep: number = 10000;

  // Optionally, set these after loading properties for dynamic min/max
  actualMinPrice: number = 0;
  actualMaxPrice: number = 0;

  minSqft: number | null = null;
  maxSqft = 10000; // Default, will be set based on your data

  minArea = 0;
  maxArea = 1000; // or set dynamically based on your data

  showPriceSlider = false;
  showActiveDropdown = false;
  showSoldDropdown = false;

  statusFilters: Record<StatusKey, boolean> = {
    Active: true,
    Sold: false,
    'De_Listed': false,
    Pending: false // <-- Add this line
  };

  showMoreFilter = false;
  moreFilter: {
    bedrooms: number | null,
    bathrooms: number | null,
    garageCovered: number | null,
    keyword: string,
    basementFinished: boolean,
    basementSeparate: boolean,
    basementWalkout: boolean,
    openHouse: string,
    minSqft: number | null,
    minArea: number | null,
    maxArea: number | null,
    minPrice: number | null,
    maxPrice: number | null
  } = {
    bedrooms: null,
    bathrooms: null,
    garageCovered: null,
    keyword: '',
    basementFinished: false,
    basementSeparate: false,
    basementWalkout: false,
    openHouse: 'unspecified',
    minSqft: null,
    minArea: null,
    maxArea: null,
    minPrice: null,
    maxPrice: null
  };

  selectedProperty: Property | null = null; // For summary panel
  showDetails: boolean = false;             // For full details panel

  districtLayer: L.Layer | null = null;
  fullDistricts: any[] = [];
  fullCities: any[] = [];
showWishlistArea: boolean = false;
 selectedWishlistAreaId: string | number | null = null;
  
  isAdmin: boolean = false;

  areaLayer: L.Layer | null = null;

private langSub: Subscription | null = null;
propertyCategoriesOptions: { code: string, label: string }[] = [];
  propertyTypesOptions: { code: string, label: string }[] = [];
  listingTypesOptions: { code: string, label: string }[] = [];
// ..

  constructor(
    private http: HttpClient,
    private mapService: MapService,
    private ngZone: NgZone,
     private languageService: LanguageService,
     private router: Router // <-- Add this line
  ) {
    // Check admin role (adjust logic as needed)
    const user = JSON.parse(localStorage.getItem('adminProfile') || '{}');
    console.log('Admin profile from localStorage:', user);
    this.isAdmin = user?.role === 'admin';
    console.log('Is Admin:', this.isAdmin);
   
   
   
    this.languageService.language$.subscribe(lang => this.language = lang);
     this.langSub = this.languageService.language$.subscribe(lang => {
       this.language = lang;
       this.updateLabels();
      // refresh popup HTML for existing markers so language switch updates immediately
      this.refreshPopupsForLanguage();
     });
  }
 
  // update popup HTML for all markers (called when language changes)
  private refreshPopupsForLanguage() {
    if (!this.markers || typeof (this.markers as any).getLayers !== 'function') return;
    try {
      const layers = (this.markers as any).getLayers();
      layers.forEach((layer: any) => {
        const p: Property | undefined = layer.propertyData;
        if (!p) return;
        const html = this.getPropertyPopupHtml(p);
        // if a popup exists, update its content; otherwise bind a new popup
        if (layer.getPopup && layer.getPopup()) {
          try { layer.getPopup().setContent(html); } catch { layer.bindPopup(html); }
        } else {
          layer.bindPopup(html);
        }

        // re-attach click handler to the popup DOM if popup is open (setContent removes listeners)
        try {
          const popup = layer.getPopup && layer.getPopup();
          const isOpen = typeof layer.isPopupOpen === 'function' ? layer.isPopupOpen() : false;
          if (popup && isOpen) {
            const popupEl = (popup as any).getElement ? (popup as any).getElement() : null;
            const contentEl = popupEl ? popupEl.querySelector('.property-popup-content') : null;
            if (contentEl) {
              // attach once so repeated calls won't stack handlers
              const handler = () => {
                // fetch full property details by ID and show details inline
                this.http.get<Property>(`${this.API_BASE_URL}/api/properties/${p.id}`).subscribe(fullProperty => {
                  this.ngZone.run(() => {
                    this.selectedProperty = fullProperty;
                    this.showDetails = true;
                    try { layer.closePopup(); } catch {}
                  });
                });
              };
              // remove any existing identical listener (best-effort)
              try { contentEl.removeEventListener('click', (contentEl as any).__popupClickHandler); } catch {}
              (contentEl as any).__popupClickHandler = handler;
              contentEl.addEventListener('click', handler, { once: true });
            }
          }
        } catch (err) {
          // ignore DOM attach errors
        }

        // if popup is currently open, reopen it to ensure display refresh
        if (typeof layer.isPopupOpen === 'function' && layer.isPopupOpen()) {
          try { layer.openPopup(); } catch { /* ignore */ }
        }
      });
    } catch (err) {
      console.warn('refreshPopupsForLanguage error', err);
    }
  }

   


 updateLabels() {

  console.log('[updateLabels] called');
    const props = this.allProperties || [];

    const buildOptionsFor = (kind: 'category' | 'type' | 'listing') => {
      const map = new Map<string, string>();
      props.forEach(p => {
        let code: any = '';
        let labelEn: any = '';
        let labelAr: any = '';
        if (kind === 'category') {
          code = (p as any).propertyCategoryCode ?? (p as any).propertyCategoryId ?? (p as any).propertyCategory ?? (p as any).propertyCategoryLabelEn;
          labelEn = (p as any).propertyCategoryLabelEn ?? (p as any).propertyCategory ?? '';
          labelAr = (p as any).propertyCategoryLabelAr ?? '';
        } else if (kind === 'type') {
          code = (p as any).propertyTypeCode ?? (p as any).propertyTypeId ?? (p as any).propertyType ?? (p as any).propertyTypeLabelEn;
          labelEn = (p as any).propertyTypeLabelEn ?? (p as any).propertyType ?? '';
          labelAr = (p as any).propertyTypeLabelAr ?? '';
        } else {
          code = (p as any).listingTypeCode ?? (p as any).listingTypeId ?? (p as any).listingType ?? (p as any).listingTypeLabelEn;
          labelEn = (p as any).listingTypeLabelEn ?? (p as any).listingType ?? '';
          labelAr = (p as any).listingTypeLabelAr ?? '';
        }
        if (code == null) return;
        code = String(code);
        const label = this.language === 'ar' ? (labelAr || labelEn || code) : (labelEn || labelAr || code);
        if (!map.has(code)) map.set(code, label);
      });
      return Array.from(map.entries()).map(([code, label]) => ({ code, label }));
    };

    this.propertyCategoriesOptions = buildOptionsFor('category');
    this.propertyTypesOptions = buildOptionsFor('type');
    this.listingTypesOptions = buildOptionsFor('listing');

    // keep simple label arrays in sync for any legacy usage
    this.propertyCategories = this.propertyCategoriesOptions.map(o => o.label);
    this.propertyTypes = this.propertyTypesOptions.map(o => o.label);
    this.listingTypes = this.listingTypesOptions.map(o => o.label);

    console.log('[updateLabels] propertyCategoriesOptions:', this.propertyCategoriesOptions);
    console.log('[updateLabels] propertyTypesOptions:', this.propertyTypesOptions);
    console.log('[updateLabels] listingTypesOptions:', this.listingTypesOptions);
   }
  
 

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.clearAreaOverlay();
  }


  private routerSub?: Subscription;

ngOnInit(): void {
  let areaPolygon: any[] | null = null;
  const nav = this.router.getCurrentNavigation();
  if (nav?.extras.state?.['areaPolygon']) {
    areaPolygon = nav.extras.state['areaPolygon'];
  } else {
    // Fallback to localStorage
    const stored = localStorage.getItem('areaPolygon');
    if (stored) {
      this.areaPolygon = JSON.parse(stored);
    }
  }
  console.log('Area polygon:', areaPolygon);


   this.clearAreaOverlay();

    // subscribe to navigation end to clear overlay when arriving to this route
   this.routerSub = this.router.events
     .pipe(
       // narrow event type for TS using a type predicate
        filter((e): e is NavigationEnd => e instanceof NavigationEnd)
     )
      .subscribe((e: NavigationEnd) => {
        // optionally check url if you only want to clear on a specific path
       if (e.urlAfterRedirects && e.urlAfterRedirects.includes('/map-search')) {
          this.clearAreaOverlay();
        }
     });
 
}
showAreaPolygonOnMap(polygon: { lat: number, lng: number }[]) {
  console.log('[showAreaPolygonOnMap] called');
  console.log('Input polygon:', polygon);

  if (this.areaLayer && this.map) {
    console.log('Removing previous areaLayer');
    this.map.removeLayer(this.areaLayer);
    this.areaLayer = null;
  }
  if (!polygon || polygon.length < 3) {
    console.warn('Polygon is missing or has less than 3 points:', polygon);
    return;
  }
  if (!this.map) {
    console.warn('Map is not initialized');
    return;
  }

  // Convert [{lat, lng}, ...] to [[lat, lng], ...]
  const coords: [number, number][] = polygon.map(p => [p.lat, p.lng]);
  console.log('Converted coords:', coords);

  // Ensure polygon is closed
  if (
    coords.length &&
    (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])
  ) {
    coords.push([coords[0][0], coords[0][1]]);
    console.log('Closed polygon coords:', coords);
  }

  // Draw area polygon on map
  this.areaLayer = L.polygon(coords, { color: '#3419e2ff', weight: 2, fillOpacity: 0.15 }).addTo(this.map);
  console.log('Polygon layer added:', this.areaLayer);
  this.map.fitBounds((this.areaLayer as L.Polygon).getBounds());
  console.log('Map fit to polygon bounds');
}

  ngAfterViewInit() {

   const center = environment.map?.defaultCenter ?? { lat: 31.95, lng: 35.91 };
   const zoom = environment.map?.defaultZoom ?? 12;
   this.map = L.map('map').setView([center.lat, center.lng], zoom);

    L.tileLayer(environment.map?.tileUrl ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: environment.map?.maxZoom ?? 18,
     attribution: environment.map?.attribution ?? '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Use marker cluster group instead of plain layer group
    this.markers = L.markerClusterGroup();
    this.map.addLayer(this.markers);

    // load districts and cities separately (no forkJoin). When both finish, fetch properties in bounds.
    let districtsLoaded = false;
    let citiesLoaded = false;

    this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/with-polygons`)
      .subscribe({
        next: (districts) => {
          this.fullDistricts = districts || [];
          this.districts = this.fullDistricts;
          districtsLoaded = true;
          console.log('fullDistricts loaded:', this.fullDistricts.length);
          if (citiesLoaded) {
            // both loaded -> fetch properties
            this.fetchPropertiesInBounds(this.map.getBounds());
          }
        },
        error: (err) => {
          console.warn('Failed loading fullDistricts', err);
          this.fullDistricts = [];
          this.districts = [];
          districtsLoaded = true;
          if (citiesLoaded) {
            this.fetchPropertiesInBounds(this.map.getBounds());
          }
        }
      });

    this.http.get<any[]>(`${this.API_BASE_URL}/api/cities`)
      .subscribe({
        next: (cities) => {
          this.fullCities = cities || [];
           this.cities = this.fullCities;
          citiesLoaded = true;
          console.log('fullCities loaded:', this.fullCities.length, this.fullCities);
          if (districtsLoaded) {
            // both loaded -> fetch properties
            this.fetchPropertiesInBounds(this.map.getBounds());
          }
        },
        error: (err) => {
          console.warn('Failed loading fullCities', err);
          this.fullCities = [];
          citiesLoaded = true;
          if (districtsLoaded) {
            this.fetchPropertiesInBounds(this.map.getBounds());
          }
        }
      });

    // fetch when user moves or zooms the map
    this.map.on('moveend zoomend', () => {
      this.fetchPropertiesInBounds(this.map.getBounds());
    });
    // debug: fullCities/fullDistricts logs will appear from the subscriptions above

      // Get unique district IDs from properties

      const propertyDistrictIds = new Set(this.allProperties.map((p: Property) => p.districtId).filter((id: number) => id != null));
      const propertyCityIds = new Set(this.allProperties.map((p: Property) => p.cityId).filter((id: number) => id != null));
     
     console.log('Property District IDs:', propertyDistrictIds);
     console.log('Property City IDs:', propertyCityIds);
      this.propertyTypes = Array.from(new Set(this.allProperties.map((p: Property) => p.propertyTypeCode))) as string[];
      this.listingTypes = Array.from(new Set(this.allProperties.map((p: Property) => p.listingTypeCode))) as string[];
      //this.propertyCategories = Array.from(new Set(this.allProperties.map((p: Property) => p.propertyCategoryLabelEn))) as string[];
     // this.propertyCategories = Array.from(new Set(this.allProperties.map((p: Property) => p.propertyCategoryLabelAr))) as string[];
     
 this.listingTypes = Array.from(new Set(
        this.allProperties.map((p: Property) =>
          this.language === 'ar'
           ? (p.listingTypeLabelAr ?? p.listingTypeLabelEn)
            : (p.listingTypeLabelEn ?? p.listingTypeLabelAr)
        )
      )).filter(Boolean) as string[];



 this.propertyCategories = Array.from(new Set(
        this.allProperties.map((p: Property) =>
          this.language === 'ar'
           ? (p.propertyCategoryLabelAr ?? p.propertyCategoryLabelEn)
            : (p.propertyCategoryLabelEn ?? p.propertyCategoryLabelAr)
        )
      )).filter(Boolean) as string[];

console.log('Property Category1:', this.propertyCategories);




      //const propertyDistrictIds = new Set(properties.map(p => p.districtId).filter(id => id != null));
      this.dropDownDistricts = this.fullDistricts.filter(d => propertyDistrictIds.has(d.id));
      this.dropDownCities = this.fullCities.filter(c => propertyCityIds.has(c.id));
     
     console.log('Drop-down districts:', this.dropDownDistricts);
     console.log('Drop-down cities:', this.dropDownCities);
      this.selectedCategory = 'All';
      this.selectedListingType = 'For_Sale';
      



      //const propertyDistrictIds = new Set(properties.map(p => p.districtId).filter(id => id != null));
      this.districts = this.fullDistricts.filter(d => propertyDistrictIds.has(d.id));


      // Set dynamic min/max price
      

      this.filterProperties(); // <-- Only show filtered properties (For-Sale by default)

      // After fetching fullDistricts (with polygons)
      this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/with-polygons`).subscribe(districts => {
        this.fullDistricts = districts;

        // Get unique district IDs from properties
       // const propertyDistrictIds = new Set(properties.map(p => p.district?.id).filter(id => id != null));

        // Only districts that have properties
        this.districts = this.fullDistricts.filter(d => propertyDistrictIds.has(d.id));
      });

     
      // Subscribe to province center changes
      this.mapService.center$.subscribe(center => {
      if (center && this.map) {
        this.map.setView(center, 7); // Adjust zoom as needed
      }
      });

      // Listen for cluster clicks
      this.markers.on('clusterclick', (event: any) => {
      // Prevent cluster from zooming in (do this FIRST)
      if (event.originalEvent) {
        event.originalEvent.preventDefault();
        event.originalEvent.stopPropagation();
      }
      if (event.preventDefault) event.preventDefault();

      const markers = event.layer.getAllChildMarkers();
      if (markers.length <= 5) {
        // Build popup HTML for up to 5 properties, photo left, clickable
        const popupHtml = markers.map((m: any, idx: number) => {
         
         
         
         
          const p = m.propertyData;
          
          
        
          

          let photoUrl: string | undefined = this.getPhotoUrlNew(p);
          
         // photoUrl = this.getPhotoUrlNew(p);
          
          return `
            <div class="cluster-property-item" data-idx="${idx}" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; cursor: pointer;">
              <img src="${photoUrl ?? ''}" alt="photo" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px;">
              <div>
                <div style="font-weight:bold;">${p.address}</div>
                <div style="font-size:0.95em;">$${p.price?.toLocaleString?.() ?? p.price} | ${p.listingStatus}</div>
              </div>
            </div>
          `;
        }).join('');
        const popupDiv = document.createElement('div');
        popupDiv.innerHTML = popupHtml;
        popupDiv.style.minWidth = '260px';

        Array.from(popupDiv.querySelectorAll('.cluster-property-item')).forEach((el: any, idx: number) => {
          el.addEventListener('click', () => {
            const p = markers[idx].propertyData;
            this.ngZone.run(() => {
              this.selectedProperty = p;
              this.showDetails = true;
              event.layer.closePopup();
            });
          });
        });

        event.layer.bindPopup(popupDiv).openPopup();

        // The critical part: return false IMMEDIATELY after handling
        return false;
      }
      // For clusters with more than 5 markers, do nothing special (default behavior)
      return;
      });

      // Fetch districts and add polygons
      this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/with-polygons`).subscribe(districts => {
      this.fullDistricts = districts;
      const geojson = this.districtsToGeoJson(districts);

      const districtLayer = L.geoJSON(geojson, {
        style: {
          color: 'transparent', // Hide all borders by default
          weight: 2,
          fillOpacity: 0.05
        },
        onEachFeature: (feature: any, layer: any) => {
          // Tooltip with Arabic and English name
          const tooltipText = `${feature.properties.nameEn} (${feature.properties.nameAr})`;
          layer.bindTooltip(tooltipText, {sticky: true});

          // Highlight only the hovered district
          layer.on('mouseover', (e: any) => {
            e.target.setStyle({
              color: '#0d7684', // Show border on hover
              weight: 2,
              fillOpacity: 0.15
            });
            e.target.openTooltip();
          });
          layer.on('mouseout', (e: any) => {
            // Reset only this district's style
            e.target.setStyle({
              color: 'transparent',
              weight: 2,
              fillOpacity: 0.05
            });
            e.target.closeTooltip();
          });
        }
      }).addTo(this.map);
      });
        if (this.areaPolygon) {
          console.log('Drawing area polygon:', this.areaPolygon);
            this.showAreaPolygonOnMap(this.areaPolygon);
          }

   }

  togglePriceSlider() {
    this.showPriceSlider = !this.showPriceSlider;
  }

  toggleMoreFilter() {
    this.showMoreFilter = !this.showMoreFilter;
  }

  applyMoreFilter() {
    this.showMoreFilter = false;
    this.filterProperties();
  }

  setActiveStatus() {
    this.selectedStatus = 'Active';
    this.activeDateRange = '';
    this.isUpdateMaxArea = false;
    this.isUpdateMinArea = false;
    this.isUpdateMinPrice = false;
    this.isUpdateMaxPrice = false;
    this.filterProperties();
  }

  setActiveDateRange(range: string) {
    this.selectedStatus = 'Active';
    this.activeDateRange = range;
    console.log('Active date range value:', this.activeDateRange);
    this.showActiveDropdown = false;
     this.isUpdateMaxArea = false;
    this.isUpdateMinArea = false;
    this.isUpdateMinPrice = false;
    this.isUpdateMaxPrice = false;
    this.filterProperties();
  }

  toggleActiveDropdown() {
    this.showActiveDropdown = !this.showActiveDropdown;
  }

  setSoldStatus() {
    this.selectedStatus = 'Sold';
    this.soldDateRange = '';
     this.isUpdateMaxArea = false;
    this.isUpdateMinArea = false;
    this.isUpdateMinPrice = false;
    this.isUpdateMaxPrice = false;
    this.filterProperties();
  }

  toggleSoldDropdown() {
    this.showSoldDropdown = !this.showSoldDropdown;
  }

  setSoldDateRange(range: string) {
    this.selectedStatus = 'Sold';
    this.soldDateRange = range;
    this.showSoldDropdown = false;
     this.isUpdateMaxArea = false;
    this.isUpdateMinArea = false;
    this.isUpdateMinPrice = false;
    this.isUpdateMaxPrice = false;
    this.filterProperties();
  }

  setDelistedStatus() {
    console.log('Setting status to De_Listed');

    this.selectedStatus = 'De_Listed';
     this.isUpdateMaxArea = false;
    this.isUpdateMinArea = false;
    this.isUpdateMinPrice = false;
    this.isUpdateMaxPrice = false;
    this.filterProperties();
  }

  setPendingStatus() {
    console.log('Setting status to Pending');

    this.selectedStatus = 'Pending';
     this.isUpdateMaxArea = false;
    this.isUpdateMinArea = false;
    this.isUpdateMinPrice = false;
    this.isUpdateMaxPrice = false;
    this.filterProperties();
  }


   onSelectedPriceChange(raw: string | number): void {
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    this.selectedPrice = v;
  }

  applyPriceFilter(): void {
    if (this.selectedPrice == null) {
     // this.maxPrice = null;
      this.isUpdateMaxPrice = false;
    } else {
      this.maxPrice = this.selectedPrice;
      this.isUpdateMaxPrice = true;
    }
    this.filterProperties();
  }

  // ...existing code...


  filterProperties() {
    console.log('All properties before filtering:', this.allProperties);
    let filtered = [...this.allProperties];

     
   console.log('selectedListingType:', this.selectedListingType);
    // Listing Type filter
    if (this.selectedListingType !== 'All') {
      filtered = filtered.filter(p => p.listingTypeCode === this.selectedListingType);
    }

    console.log('Filtering properties with status:', this.selectedStatus);
    // Status filter: Only show Active if selectedStatus is 'Active'
    if (this.selectedStatus === 'Active') {
      filtered = filtered.filter(p => p.listingStatus === 'Active');
      if (
  this.activeDateRange &&
  this.activeDateRange !== 'all' &&
  this.activeDateRange !== '' &&
  this.activeDateRange !== null &&
  this.activeDateRange !== undefined
){
        const now = new Date();
        filtered = filtered.filter(p => {

          
          const listingDate = new Date(p.listingDate);
          const diffDays = (now.getTime() - listingDate.getTime()) / (1000 * 3600 * 24);
          switch (this.activeDateRange) {
            case '1': return diffDays <= 1;
            case '3': return diffDays <= 3;
            case '7': return diffDays <= 7;
            case '30': return diffDays <= 30;
            case '90': return diffDays <= 90;
            case 'more15': return diffDays > 15;
            case 'more30': return diffDays > 30;
            case 'more60': return diffDays > 60;
            case 'more90': return diffDays > 90;
            default: return true;
          }
        });
      }
    }

    // Status filter: Only show Sold if selectedStatus is 'Sold'
   
   
   
   
   
    if (this.selectedStatus === 'Sold') {
      console.log('Applying Sold status filter');

      console.log('Properties before status filter:', filtered.map(p => ({ id: p.id, listingStatus: p.listingStatus })));
      filtered = filtered.filter(p => p.listingStatus === 'Sold');
     
     console.log('Properties after status filter:', filtered.map(p => ({ id: p.id, listingStatus: p.listingStatus })));
      if (this.soldDateRange) {
        const now = new Date();
        filtered = filtered.filter(p => {
          if (!p.soldDate) return false; // skip if no soldDate
          const soldDate = new Date(p.soldDate); // <-- Use soldDate here!
          const diffDays = (now.getTime() - soldDate.getTime()) / (1000 * 3600 * 24);
          switch (this.soldDateRange) {
            case '1': return diffDays <= 1;
            case '3': return diffDays <= 3;
            case '7': return diffDays <= 7;
            case '30': return diffDays <= 30;
            case '90': return diffDays <= 90;
            case '180': return diffDays <= 180;
            case '360': return diffDays <= 360;
            case '2025': return soldDate.getFullYear() === 2025;
            case '2024': return soldDate.getFullYear() === 2024;
            case '2023': return soldDate.getFullYear() === 2023;
            case '2022': return soldDate.getFullYear() === 2022;
            case '2021': return soldDate.getFullYear() === 2021;
            case '2020': return soldDate.getFullYear() === 2020;
            case '2019': return soldDate.getFullYear() === 2019;
            default: return true;
          }
        });
      }
    }



    if (this.selectedStatus === 'De_Listed') {
      filtered = filtered.filter(p => p.listingStatus === 'De_Listed');
    }


    if (this.selectedStatus === 'Pending') {
       filtered = filtered.filter(p => p.listingStatus === 'Pending');
    }

    console.log('Properties after status filter:', filtered.map(p => ({ id: p.id, listingStatus: p.listingStatus })));
    console.log('Properties before date filter:', filtered.map(p => ({ id: p.id, listingDate: p.listingDate })));

    // Property Type filter
    if (this.selectedType !== 'All') {
      filtered = filtered.filter(p => p.propertyTypeCode === this.selectedType);
    }

    // Property Category filter
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.propertyCategoryCode === this.selectedCategory);
    }

   





    
     
      
      
      // Set dynamic min/max price
     // this.minPrice = this.actualMinPrice;
      //this.maxPrice = this.actualMaxPrice;
      //this.minPrice = this.actualMinPrice;
      //this.maxPrice = this.actualMaxPrice;

      


 if (this.moreFilter.minArea != null && this.isUpdateMinArea) {
      filtered = filtered.filter(p => (p.area ?? 0) >= this.moreFilter.minArea!);
    }
    if (this.moreFilter.maxArea != null && this.isUpdateMaxArea) {
      filtered = filtered.filter(p => (p.area ?? 0) <= this.moreFilter.maxArea!);
    }


      // Set dynamic min/max sqft
      const sqfts = filtered.map(p => p.area?? 0).filter(sqft => sqft > 0);
      this.minSqft = Math.min(...sqfts);
      this.maxSqft = Math.max(...sqfts); // Use the actual max sqft from your data
      this.moreFilter.minSqft = null;

      // Calculate min and max area from the property list
      const areas = filtered.map(p => p.area ?? 0).filter(a => a > 0);
      this.minArea = areas.length ? Math.min(...areas) : 0;
      this.maxArea = areas.length ? Math.max(...areas) : 1000;

      // Optionally, set the filter defaults to the full range
      this.moreFilter.minArea = this.minArea;
      this.moreFilter.maxArea = this.maxArea;



   
    // Price filter
    
    

    // Owner type filter
    if (this.selectedOwnerType === 'private') {
      filtered = filtered.filter(p => p.userId != null);
    } else if (this.selectedOwnerType === 'realtor') {
      filtered = filtered.filter(p => p.realtorId != null && (p.userId == null || p.userId === undefined));
    }

    // More filter
    if (this.moreFilter.bedrooms != null) {
      if (this.moreFilter.bedrooms === 5) {
        filtered = filtered.filter(p => (p.bedrooms ?? 0) >= 5);
      } else {
        filtered = filtered.filter(p => (p.bedrooms ?? 0) === this.moreFilter.bedrooms);
      }
    }
    if (this.moreFilter.bathrooms != null) {
      if (this.moreFilter.bathrooms === 5) {
        filtered = filtered.filter(p => (p.bathrooms ?? 0) >= 5);
      } else {
        filtered = filtered.filter(p => (p.bathrooms ?? 0) === this.moreFilter.bathrooms);
      }
    }
    if (this.moreFilter.garageCovered != null) {
      if (this.moreFilter.garageCovered === 5) {
        filtered = filtered.filter(p => (p.garage ?? 0) >= 5);
      } else {
        filtered = filtered.filter(p => (p.garage ?? 0) === this.moreFilter.garageCovered);
      }
    }
    if (this.moreFilter.keyword && this.moreFilter.keyword.trim() !== '') {
      filtered = filtered.filter(p => p.description && p.description.toLowerCase().includes(this.moreFilter.keyword.toLowerCase()));
    }
    if (this.moreFilter.basementFinished) {
      filtered = filtered.filter(p =>
        Array.isArray(p.features) && p.features.some((f: string) => /finished basement/i.test(f))
      );
    }
    if (this.moreFilter.basementSeparate) {
      filtered = filtered.filter(p =>
        Array.isArray(p.features) && p.features.some((f: string) => /separate entrance/i.test(f))
      );
    }
    if (this.moreFilter.basementWalkout) {
      filtered = filtered.filter(p =>
        Array.isArray(p.features) && p.features.some((f: string) => /walk ?out/i.test(f))
      );
    }
    if (this.moreFilter.openHouse && this.moreFilter.openHouse !== 'unspecified') {
      const today = new Date();
      if (this.moreFilter.openHouse === 'today') {
        filtered = filtered.filter(p => p.openHouseDate && new Date(p.openHouseDate).toDateString() === today.toDateString());
      } else if (this.moreFilter.openHouse === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        filtered = filtered.filter(p => p.openHouseDate && new Date(p.openHouseDate).toDateString() === tomorrow.toDateString());
      } else if (this.moreFilter.openHouse === '7days') {
        const week = new Date(today);
        week.setDate(today.getDate() + 7);
        filtered = filtered.filter(p => p.openHouseDate && new Date(p.openHouseDate) >= today && new Date(p.openHouseDate) <= week);
      } else if (this.moreFilter.openHouse === 'all') {
        filtered = filtered.filter(p => !!p.openHouseDate);
      }
    }
    if (this.moreFilter.minSqft != null) {
      filtered = filtered.filter(p => (p.area ?? 0) >= this.moreFilter.minSqft!);
    }

    // Area filter (in m²)
   

console.log('After [more filter]:', filtered.length);
console.log('selectedDistrictId:', this.selectedDistrictId);

   if (this.selectedDistrictId) {
      filtered = filtered.filter(p => p.districtId === +this.selectedDistrictId);
    }

    if (this.selectedCitytId) {
      filtered = filtered.filter(p => p.cityId === +this.selectedCitytId);
    }

const filteredDistrictIds = new Set(filtered.map(p => p.districtId).filter(id => id != null));
this.dropDownDistricts = this.fullDistricts.filter(d => filteredDistrictIds.has(d.id));

// Optionally, reset selectedDistrictId if it is no longer valid
if (
  this.selectedDistrictId &&
  !filteredDistrictIds.has(+this.selectedDistrictId)
) {
  this.selectedDistrictId = '';
}



   if ((this.minPrice != null && this.isUpdateMinPrice) || (this.maxPrice != null && this.isUpdateMaxPrice)) {
      if (this.minPrice != null && this.isUpdateMinPrice) {
        filtered = filtered.filter(p => p.price >= this.minPrice);
      }
      if (this.maxPrice != null && this.isUpdateMaxPrice) {
        filtered = filtered.filter(p => p.price <= this.maxPrice);
      }

      const priceNums = filtered.map(p => Number(p.price)).filter(v => Number.isFinite(v));
      if (priceNums.length) {
        this.actualMinPrice = Math.min(...priceNums);
        this.actualMaxPrice = Math.max(...priceNums);
      } else {
        // fallback values when no numeric prices available
        this.actualMinPrice = 0;
        this.actualMaxPrice = 0;
      }
    }else{
           const prices1 = filtered.map(p => p.price);
          console.log('Filtered prices:', prices1);
          if(!this.isUpdateMinPrice){
            this.actualMinPrice = Math.min(...prices1);
            this.minPrice = this.actualMinPrice;
            this.isUpdateMinPrice = false;

          }
          if(!this.isUpdateMaxPrice){
            this.actualMaxPrice = Math.max(...prices1);
            this.maxPrice = this.actualMaxPrice;  
            this.isUpdateMaxPrice = false;
          } 
    }





    this.isUpdateMinArea = false;
    this.isUpdateMaxArea = false;
    

    console.log('After [filter name]:', filtered.length);
    this.renderMarkers(filtered);
  }

  renderMarkers(properties: Property[]) {
    if (!this.markers) return;
    this.markers.clearLayers();

    console.log('Rendering properties:', properties.map(p => ({ id: p.id, lat: p.lat, lng: p.lng })));

    const markerList = properties
      .filter(p => p.lat && p.lng)
      .map(p => {
        const typeInitial = p.propertyTypeCode ? p.propertyTypeCode.charAt(0) : '';
        let priceLabel = '';
        if (p.listingTypeCode === 'For_Lease') {
          priceLabel = `${p.price?.toLocaleString?.() ?? p.price} JOD / mo`;
        } else {
          priceLabel = (p.price / 1000) + 'K JOD';
        }
        let markerColor = '#43a047'; // green
        if (p.listingStatus === 'Sold') markerColor = '#d32f2f'; // red
        else if (p.listingStatus === 'Pending' ) markerColor = '#757575'; // gray

        const customIcon = new DivIcon({
          className: 'custom-property-marker',
          html: `
            <div style="
             background: ${markerColor};
                color: #fff;
                border-radius: 20px;
                padding: 6px 12px;
                font-size: 0.85em;
                font-weight: bold;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                border: 2px solid #fff;
                display: flex;
                flex-direction: row;
                align-items: center;
                min-width: 50px;
                max-width: 70px;
                gap: 6px;
                overflow: hidden;
                white-space: nowrap;
            ">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${typeInitial}</span>
              <span style="font-size:0.85em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${priceLabel}</span>
            </div>
          `,
          iconSize: [70, 41],
          iconAnchor: [35, 41],
          popupAnchor: [0, -36]
        });

        const leafletMarker = marker([p.lat, p.lng], { icon: customIcon });
        (leafletMarker as any).propertyData = p;
        leafletMarker
          .bindPopup(this.getPropertyPopupHtml(p))
          .on('popupopen', (event: any) => {
            setTimeout(() => {
              const popupContent = event.popup.getElement()?.querySelector('.property-popup-content') as HTMLElement;
              if (popupContent) {
                popupContent.addEventListener('click', () => {
                  // Fetch full property details by ID
                  this.http.get<Property>(`${this.API_BASE_URL}/api/properties/${p.id}`).subscribe(fullProperty => {
                    this.ngZone.run(() => {
                      this.selectedProperty = fullProperty;
                      this.showDetails = true;
                      event.target.closePopup();
                    });
                  });
                }, { once: true });
              }
            }, 0);
          });


           setTimeout(() => {
      if ((this as any).map && typeof (this as any).map.invalidateSize === 'function') {
        try { (this as any).map.invalidateSize(); } catch (e) { /* ignore */ }
      }
    }, 200);

        return leafletMarker;
      });

    this.markers.addLayers(markerList);
  }

  getActiveRangeLabel(): string {
    switch (this.activeDateRange) {
      case '1': return '1d';
      case '3': return '3d';
      case '7': return '7d';
      case '30': return '30d';
      case '90': return '90d';
      case 'all': return 'All';
      case 'more15': return '>15d';
      case 'more30': return '>30d';
      case 'more60': return '>60d';
      case 'more90': return '>90d';
      default: return '';
    }
  }

  getSoldRangeLabel(): string {
    switch (this.soldDateRange) {
      case '1': return '1d';
      case '3': return '3d';
      case '7': return '7d';
      case '30': return '30d';
      case '90': return '90d';
      case '180': return '180d';
      case '360': return '360d';
      case '2025': return '2025';
      case '2024': return '2024';
      case '2023': return '2023';
      case '2022': return '2022';
      case '2021': return '2021';
      case '2020': return '2020';
      case '2019': return '2019';
      default: return '';
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;

    const inside = (ref?: ElementRef) => !!ref && !!ref.nativeElement && ref.nativeElement.contains(target);

    // close active dropdown if click is outside its group/dropdown
    if (!inside(this.activeGroup) && !inside(this.activeDropdown)) {
      this.showActiveDropdown = false;
    }

    // close sold dropdown if click is outside its group/dropdown
    if (!inside(this.soldGroup) && !inside(this.soldDropdown)) {
      this.showSoldDropdown = false;
    }

    // close price slider panel if click is outside its container/panel
    if (!inside(this.priceFilterContainer) && !inside(this.priceSliderPanel)) {
      this.showPriceSlider = false;
    }

    // close more filter if click is outside its panel
    if (!inside(this.moreFilterPanel)) {
      this.showMoreFilter = false;
    }
  }

  setBedroomFilter(val: number | null) {
    this.moreFilter.bedrooms = val;
  }

  setBathroomFilter(val: number | null) {
    this.moreFilter.bathrooms = val;
  }

  setGarageCoveredFilter(val: number | null) {
    this.moreFilter.garageCovered = val;
  }

  setOpenHouseFilter(val: string) {
    this.moreFilter.openHouse = val;
  }

  setMinSqft(val: number) {
    this.moreFilter.minSqft = val;
    this.filterProperties();
  }

  clearMoreFilter() {
    this.moreFilter = {
      bedrooms: null,
      bathrooms: null,
      garageCovered: null,
      keyword: '',
      basementFinished: false,
      basementSeparate: false,
      basementWalkout: false,
      openHouse: 'unspecified',
      minSqft: null,
      minArea: null,
      maxArea: null,
      minPrice: null,
      maxPrice: null
    };
    this.isUpdateMinArea = false;
    this.isUpdateMaxArea = false;
    this.isUpdateMaxPrice = false;
    this.isUpdateMinPrice = false;
    this.filterProperties();
  }

  onMinAreaChange(value: number) {
    this.moreFilter.minArea = value;
    if (this.moreFilter.maxArea != null && value > this.moreFilter.maxArea) {
      this.moreFilter.maxArea = value;
    }
    this.isUpdateMinArea = true;
    this.filterProperties();
  }

  onMaxAreaChange(value: number) {
    this.moreFilter.maxArea = value;
    if (this.moreFilter.minArea != null && value < this.moreFilter.minArea) {
      this.moreFilter.minArea = value;
    }
    this.isUpdateMaxArea = true;
    this.filterProperties();
  }

  onMinPriceChange(value: number) {
    console.log('Min price changed to:', value);
    this.minPrice = value;
    if (this.maxPrice != null && value > this.maxPrice) {
      this.maxPrice = value;
    }
   
    this.isUpdateMinPrice = true;
    this.filterProperties();
  }

  onMaxPriceChange(value: number) {
    console.log('Max price changed to:', value);
    this.maxPrice = value;
    if (this.minPrice != null && value < this.minPrice) {
      this.minPrice = value;
    }
    
    this.isUpdateMaxPrice = true;
    this.filterProperties();
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

  getPropertyPopupHtml(property: Property): string {
    const photoUrl: string | undefined = this.getPhotoUrlNew(property);

    const getLabel = (obj: any, enKey: string, arKey: string, fallback = '') => {
      if (obj == null) return fallback;
      if (typeof obj === 'string') return obj;
      return this.language === 'ar'
        ? (obj[arKey] ?? obj[enKey] ?? obj.value ?? fallback)
        : (obj[enKey] ?? obj[arKey] ?? obj.value ?? fallback);
    };

    // City
    const cityObj = (property as any).city ?? this.fullCities?.find(c => c.id === property.cityId);
    const cityLabel = getLabel(cityObj, 'nameEn', 'nameAr', '');

    // District
    const districtLabel = getLabel(property.district, 'nameEn', 'nameAr', '');

    // Neighborhood
    const neighborhoodLabel = getLabel(property.neighborhood, 'nameEn', 'nameAr', '');

    // Property type / category / listing type labels (prefer label fields, fall back to codes)
    const propertyTypeLabel = this.language === 'ar'
      ? (property.propertyTypeLabelAr ?? property.propertyTypeLabelEn ?? property.propertyTypeCode ?? property.propertyType ?? '')
      : (property.propertyTypeLabelEn ?? property.propertyTypeLabelAr ?? property.propertyTypeCode ?? property.propertyType ?? '');

    const propertyCategoryLabel = this.language === 'ar'
      ? (property.propertyCategoryLabelAr ?? property.propertyCategoryLabelEn ?? property.propertyCategoryCode ?? property.propertyCategory ?? '')
      : (property.propertyCategoryLabelEn ?? property.propertyCategoryLabelAr ?? property.propertyCategoryCode ?? property.propertyCategory ?? '');

    const listingTypeLabel = this.language === 'ar'
      ? (property.listingTypeLabelAr ?? property.listingTypeLabelEn ?? property.listingTypeCode ?? property.listingType ?? '')
      : (property.listingTypeLabelEn ?? property.listingTypeLabelAr ?? property.listingTypeCode ?? property.listingType ?? '');

    const listedText = this.language === 'en' ? 'Listed' : 'تاريخ الإدراج';
    const unitArea = this.language === 'en' ? 'm²' : 'م²';
    const priceLabel = property.listingTypeCode === 'For_Lease' ? `${property.price?.toLocaleString?.() ?? property.price} JOD / mo` : `${property.price?.toLocaleString?.() ?? property.price} JOD`;

    // include data-property-id so a delegated click handler can identify the property
    return `
      <div class="property-popup-content" data-property-id="${property.id}" style="cursor:pointer; display: grid; grid-template-columns: 100px 1fr; gap: 12px; align-items: center; min-width: 320px;">
        <div>
          <img src="${photoUrl ?? ''}" alt="photo" style="width:100px; height:auto; border-radius:6px; object-fit:cover;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div style="font-weight: bold; color: #1976d2;">
            ${priceLabel}
            <span style="font-weight: normal; color: #666; font-size: 0.95em;"> | ${listedText}: ${property.listingDate ?? ''}</span>
          </div>
          <div style="color: #222; font-size: 0.95em;">
            ${property.address ?? ''}${cityLabel ? ', ' + cityLabel : ''}${districtLabel ? ' - ' + districtLabel : ''}${neighborhoodLabel ? ' / ' + neighborhoodLabel : ''}
          </div>
          <!-- category/type on its own line, stats (bed/bath/garage/area) on next line -->
          <div style="color: #444; font-size: 0.92em;">
            <div style="white-space:nowrap; margin-bottom:6px;">
              ${propertyCategoryLabel ? propertyCategoryLabel : ''}${propertyCategoryLabel && propertyTypeLabel ? ' • ' : ''}${propertyTypeLabel ? propertyTypeLabel : ''}
            </div>
            <div style="display:flex; gap:12px; align-items:center; white-space:nowrap; flex-wrap:nowrap;">
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-fill.svg" alt="bed" width="16">
                <strong style="font-weight:600;">${property.bedrooms ?? 0}</strong>
              </span>
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/droplet-half.svg" alt="bath" width="16">
                <strong style="font-weight:600;">${property.bathrooms ?? 0}</strong>
              </span>
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/car-front-fill.svg" alt="garage" width="16">
                <strong style="font-weight:600;">${property.parking ?? 0}</strong>
              </span>
              <span style="display:inline-flex; align-items:center; gap:6px;">
                ${property.area != null ? `<strong style="font-weight:600;">${property.area}</strong> ${unitArea}` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private districtsToGeoJson(districts: any[]): any {
    return {
      type: 'FeatureCollection',
      features: districts.map(d => ({
        type: 'Feature',
        properties: {
          nameEn: d.nameEn,
          nameAr: d.nameAr
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            d.polygons
              .sort((a: any, b: any) => a.coordinateOrder - b.coordinateOrder)
              .map((p: any) => [p.longitude, p.latitude])
          ]
        }
      }))
    };
  }

  onDistrictChange() {
    // Filter properties by selected district
    let filtered = [...this.allProperties];
    if (this.selectedDistrictId) {
      filtered = filtered.filter(p => p.districtId === +this.selectedDistrictId);
    }

    // Recalculate price range for the filtered properties
    const prices = filtered.map(p => p.price).filter(price => price != null && !isNaN(price));
    this.actualMinPrice = prices.length ? Math.min(...prices) : 0;
    this.actualMaxPrice = prices.length ? Math.max(...prices) : 0;

    // Optionally reset sliders to new range
    this.minPrice = this.actualMinPrice;
    this.maxPrice = this.actualMaxPrice;
    this.isUpdateMinPrice = false;
    this.isUpdateMaxPrice = false;

    this.filterProperties();
     this.showDistrictBorder();
  }

  onCityChange() {
    // normalize selection
    const cityRaw = this.selectedCitytId;
    if (cityRaw === '' || cityRaw == null) {
      // no city selected -> reset districts and re-filter
      this.dropDownDistricts = this.fullDistricts.slice();
      this.selectedDistrictId = '';
      this.filterProperties();
      return;
    }

    const cityIdNum = Number(cityRaw);
    if (Number.isNaN(cityIdNum)) {
      console.warn('onCityChange: invalid city id', cityRaw);
      return;
    }

    // fetch districts for the selected city (use provided endpoint)
    this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/city/${cityIdNum}`).subscribe({
      next: (districts) => {
        // optionally keep only districts that have properties
        const propertyDistrictIds = new Set(this.allProperties.map(p => p.districtId).filter(id => id != null));
        this.dropDownDistricts = (districts || []).filter((d: any) => propertyDistrictIds.size ? propertyDistrictIds.has(d.id) : true);
       console.log('Loaded districts for city', cityIdNum, this.dropDownDistricts);
        this.selectedDistrictId = '';
        // update filters and recenter map
        this.filterProperties();
        this.moveMapToCity(cityIdNum, 12);
      },
      error: (err) => {
        console.warn('Failed to load districts for city', cityIdNum, err);
        this.dropDownDistricts = [];
        this.selectedDistrictId = '';
        this.filterProperties();
        this.moveMapToCity(cityIdNum, 12);
      }
    });
   }

  showDistrictBorder() {
    if (this.districtLayer && this.map) {
      this.map.removeLayer(this.districtLayer);
      this.districtLayer = null;
    }
    if (!this.selectedDistrictId) return;

    // Use fullDistricts to get polygons
    const district = this.fullDistricts.find(d => d.id === +this.selectedDistrictId);
    if (district?.polygons && district.polygons.length > 0 && this.map) {
      const coords = district.polygons
        .sort((a: { coordinateOrder: number }, b: { coordinateOrder: number }) => a.coordinateOrder - b.coordinateOrder)
        .map((p: { latitude: number, longitude: number }) => [p.latitude, p.longitude]);
      if (
        coords.length &&
        (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])
      ) {
        coords.push(coords[0]);
      }
      this.districtLayer = L.polygon(coords, { color: '#613f55ff', weight: 2, fillOpacity: 0.08 }).addTo(this.map);
      this.map.fitBounds((this.districtLayer as L.Polygon).getBounds());
    }
  }

  clearPriceFilter() {
    this.minPrice = this.actualMinPrice;
    this.maxPrice = this.actualMaxPrice;
    this.isUpdateMinPrice = false;
    this.isUpdateMaxPrice = false;
    this.filterProperties();
  }

  onPropertyActivated(updatedProperty: Property) {
  // Update the property in allProperties, then re-filter
  const idx = this.allProperties.findIndex((p: Property) => p.id === updatedProperty.id);
  if (idx !== -1) {
    this.allProperties[idx] = updatedProperty;
    this.filterProperties();
  }
}

 fetchPropertiesInBounds(bounds: L.LatLngBounds): void {
    if (!bounds) {
      console.warn('[fetchPropertiesInBounds] bounds is undefined');
      return;
    }

    // Smart caching: Only fetch if bounds extend outside lastFetchedBounds
    if (
      this.lastFetchedBounds &&
      this.lastFetchedBounds.contains(bounds)
    ) {
      // No need to fetch, just filter cached properties
      this.allProperties = this.cachedProperties.filter(p =>
        bounds.contains(L.latLng(p.lat, p.lng))
      );
      // rebuild labels/options from the current property set
      this.updateLabels();
      this.propertyTypes = Array.from(new Set(this.allProperties.map(p => p.propertyTypeCode))).filter(Boolean) as string[];
      //this.listingTypes = Array.from(new Set(this.allProperties.map(p => p.listingTypeCode))).filter(Boolean) as string[];
      //this.propertyCategories = Array.from(new Set(this.allProperties.map(p => p.propertyCategoryCode))).filter(Boolean) as string[];
      
this.listingTypes = Array.from(new Set(
        this.allProperties.map((p: Property) =>
          this.language === 'ar'
           ? (p.listingTypeLabelAr ?? p.listingTypeLabelEn)
            : (p.listingTypeLabelEn ?? p.listingTypeLabelAr)
        )
      )).filter(Boolean) as string[];



       this.propertyCategories = Array.from(new Set(
        this.allProperties.map((p: Property) =>
          this.language === 'ar'
           ? (p.propertyCategoryLabelAr ?? p.propertyCategoryLabelEn)
            : (p.propertyCategoryLabelEn ?? p.propertyCategoryLabelAr)
        )
      )).filter(Boolean) as string[];
      console.log('Property Category2:', this.propertyCategories);
      
      
      
      this.allProperties.forEach((p: Property) => {
        const district = this.fullDistricts?.find((d: any) => d.id === p.districtId);
        p.district = district ?? null;

          // attach full city object if available so popup can show city.nameEn/nameAr
          const cityObj = this.fullCities?.find((c: any) => c.id === p.cityId) ?? null;
          if (cityObj) {
            (p as any).city = cityObj;
          }
        });
      this.filterProperties();
      return;
    }

    // Fetch from backend if bounds are outside cached area
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const endpoint = `${this.API_BASE_URL}/api/properties/bounds?swLat=${sw.lat}&swLng=${sw.lng}&neLat=${ne.lat}&neLng=${ne.lng}`;
    console.log('[fetchPropertiesInBounds] called');
    console.log('Bounds:', {
      swLat: sw.lat,
      swLng: sw.lng,
      neLat: ne.lat,
      neLng: ne.lng
    });
    console.log('Endpoint:', endpoint);
    this.http.get<Property[]>(endpoint)
      .subscribe((properties: Property[] = []) => {
        console.log('[fetchPropertiesInBounds] Properties fetched:', properties.length);
        this.allProperties = properties ?? [];
        this.cachedProperties = this.allProperties;
        this.lastFetchedBounds = bounds;
        // rebuild labels/options from fetched properties
        this.updateLabels();
        this.propertyTypes = Array.from(new Set(this.allProperties.map(p => p.propertyTypeCode))).filter(Boolean) as string[];
       // this.listingTypes = Array.from(new Set(this.allProperties.map(p => p.listingTypeCode))).filter(Boolean) as string[];
       
       this.listingTypes = Array.from(new Set(
        this.allProperties.map((p: Property) =>
          this.language === 'ar'
           ? (p.listingTypeLabelAr ?? p.listingTypeLabelEn)
            : (p.listingTypeLabelEn ?? p.listingTypeLabelAr)
        )
      )).filter(Boolean) as string[];

        // this.propertyCategories = Array.from(new Set(this.allProperties.map(p => p.propertyCategoryCode))).filter(Boolean) as string[];
        
         this.propertyCategories = Array.from(new Set(
        this.allProperties.map((p: Property) =>
          this.language === 'ar'
           ? (p.propertyCategoryLabelAr ?? p.propertyCategoryLabelEn)
            : (p.propertyCategoryLabelEn ?? p.propertyCategoryLabelAr)
        )
      )).filter(Boolean) as string[];

      console.log('Property Category3:', this.propertyCategories);
        
        this.allProperties.forEach((p: Property) => {
          const district = this.fullDistricts?.find((d: any) => d.id === p.districtId);
          p.district = district ?? null;

          // attach full city object if available so popup can show city.nameEn/nameAr
          const cityObj = this.fullCities?.find((c: any) => c.id === p.cityId) ?? null;
          if (cityObj) {
            (p as any).city = cityObj;
          }
        });

        // --- compute dropdown lists from fetched properties and fullCities/fullDistricts ---
        const propertyDistrictIds = new Set(this.allProperties.map(p => p.districtId).filter(id => id != null));
        this.dropDownDistricts = (this.fullDistricts || []).filter(d => propertyDistrictIds.has(d.id));
        
        const propertyCityIds = new Set(this.allProperties.map(p => p.cityId ?? ((p as any).city && (p as any).city.id)).filter(id => id != null));
        if (this.fullCities && this.fullCities.length) {
          this.dropDownCities = this.fullCities.filter(c => propertyCityIds.has(c.id));
        } else {
          // fallback: build minimal city list from properties
          const cityMap = new Map<number, any>();
          this.allProperties.forEach(p => {
            const cid = p.cityId ?? (p as any).city?.id;
            if (cid && !cityMap.has(cid)) {
              const cityObj = (p as any).city;
              cityMap.set(cid, { id: cid, nameEn: cityObj?.nameEn ?? String(cid), nameAr: cityObj?.nameAr ?? '' });
            }
          });
          this.dropDownCities = Array.from(cityMap.values());
        }
        // -------------------------------------------------------------------

        this.filterProperties();
      });
  }

 

closeDetails() {
  this.showDetails = false;
  this.selectedProperty = null;

  // ensure any modal/backdrop is removed
  const backdrop = document.querySelector('.modal-backdrop-custom') as HTMLElement | null;
  if (backdrop) backdrop.remove();

  // allow DOM to update and map container to become visible, then force Leaflet resize
  setTimeout(() => {
    try {
      if (this.map && typeof this.map.invalidateSize === 'function') {
        this.map.invalidateSize();
      } else {
        window.dispatchEvent(new Event('resize'));
      }
    } catch (e) { /* ignore */ }
  }, 250);
}





 moveMapToCity(cityId: number | '' , zoom: number = 12) {
  console.log('moveMapToCity called with cityId:', cityId, 'zoom:', zoom);
    if (!this.map) return;
    // treat empty string as "no selection"
    if (cityId === '' || cityId == null) return;

    const cityIdNum = typeof cityId === 'string' ? Number(cityId) : cityId;
    if (Number.isNaN(cityIdNum)) return;

    // 1) try to find full city object (may contain coordinates)
    const cityObj = (this.fullCities || []).find((c: any) => c.id === cityIdNum) as any | undefined;
   console.log('moveMapToCity: cityObj for cityId', cityIdNum, cityObj);   
    let latLng: [number, number] | null = null;
    if (cityObj) {
      // common property names that might contain center info
      if (cityObj.latitude != null && cityObj.longitude != null) {
        latLng = [Number(cityObj.latitude), Number(cityObj.longitude)];
      }
      console.log('moveMapToCity: latLng from cityObj coords:', latLng);
    }

    // 2) fallback to string name mapping (case-sensitive keys in fallback map)
   

    // 3) final fallback: try to get a property in that city and center on its coords
   

    if (latLng) {
      try {
        console.log('moveMapToCity: moving map to', latLng, 'for cityId', cityIdNum); 
        this.map.setView(latLng, zoom, { animate: true });
      } catch (e) {
        try { this.map.panTo(latLng); } catch {}
      }
    } else {
      console.warn('moveMapToCity: no coordinates for cityId', cityIdNum, cityObj);
    }
  }

  private popupClickInProgress = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    try {
      const target = event.target as HTMLElement;
      const popupEl = target.closest('.property-popup-content[data-property-id]') as HTMLElement | null;
      if (!popupEl) return;

      const idAttr = popupEl.getAttribute('data-property-id');
      if (!idAttr) return;
      const idNum = Number(idAttr);
      if (Number.isNaN(idNum)) return;

      // prevent duplicate fetches
      if (this.popupClickInProgress) return;
      // if already showing same details do nothing
      if (this.showDetails && this.selectedProperty?.id === idNum) return;

      this.popupClickInProgress = true;
      this.http.get<Property>(`${this.API_BASE_URL}/api/properties/${idNum}`).subscribe({
        next: (fullProperty) => {
          this.ngZone.run(() => {
            this.selectedProperty = fullProperty;
            this.showDetails = true;
            // optionally close any open popup
            try { this.map && this.map.closePopup && this.map.closePopup(); } catch {}
            this.popupClickInProgress = false;
          });
        },
        error: () => {
          this.popupClickInProgress = false;
        }
      });
    } catch (err) {
      this.popupClickInProgress = false;
    }
  }

   clearAreaOverlay(): void {
    console.log('clearAreaOverlay called');
    if (!this.map) return;
    if (this.areaLayer) {
      try {
        this.map.removeLayer(this.areaLayer);
      } catch { /* ignore if already removed */ }
      this.areaLayer = null;
      this.areaPolygon = null;
    }
    try { localStorage.removeItem('areaPolygon'); } catch (err) { /* ignore */ }
    // reset any boolean/selection that controls area visibility
    this.showWishlistArea = false;       // if you use such flag
    this.selectedWishlistAreaId = null;  // if you track selection
  }
   private setWishlistArea(layer: L.Layer): void {
    // remove previous if present
    if (this.areaLayer) {
      this.map.removeLayer(this.areaLayer);
    }
    this.areaLayer = layer;
    this.areaLayer.addTo(this.map);
  }
}
