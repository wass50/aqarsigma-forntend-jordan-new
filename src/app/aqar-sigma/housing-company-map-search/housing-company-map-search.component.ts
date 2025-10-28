import { Component, OnInit, AfterViewInit, NgZone, HostListener } from '@angular/core';
import { HousingPropertyService, HousingProperty,District } from '../HousingProperty';
import { JsonPipe, NgIf, NgFor } from '@angular/common';
import * as L from 'leaflet';
import { forkJoin, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MapService } from './MapService';
import { marker, DivIcon } from 'leaflet';
import { HousingCompanyListingDetailsComponent } from '../housing-company-listing-details/housing-company-listing-details.component';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment'; // { changed code }
import { City } from '../Property';
import { LanguageService } from '../LanguageService';


// Fix Leaflet marker icon paths (same as in map-search)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png'
});

@Component({
  selector: 'app-housing-company-map-search',
  templateUrl: './housing-company-map-search.component.html',
  styleUrls: ['./housing-company-map-search.component.css'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    JsonPipe,
    HousingCompanyListingDetailsComponent,
    FormsModule
  ]
})
export class HousingCompanyMapSearchComponent implements  AfterViewInit, OnInit {
  housingProperties: HousingProperty[] = [];
  fullDistricts: any[] = [];
  fullCities: any[] = []; 
  districts: District[] = [];
 
   language: 'en' | 'ar' = 'en';
  // city/district lists & selections
  cities: City[] = [];
 
  selectedCityId: number | null = null;
  selectedDistrictId: number | null = null;
  
  readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }
  propertyDetailsInlineMode: boolean = environment.showDetailsInline ?? false;
  private markers: any;
  
  map: any;
   districtLayer: L.Layer | null = null;

   allProperties: HousingProperty[] = [];
   dropDownDistricts: District[] = [];
   dropDownCities: City[] = [];
   selectedProperty: HousingProperty | null = null; // For summary panel
  showDetails: boolean = false;             // For full details panel

  propertyTypeFilter: string = '';
  housingCompanyFilter: string = '';
  districtFilter: string = '';
  cityFilter: string = '';

  housingCompanies: any[] = []; // Store fetched housing companies

  selectedHousingCompany: string | null = null;
  selectedDistrict: string | null = null;
  selectedPropertyType: string | null = null;

  allDistricts: District[] = [];
  allHousingCompanies: any[] = [];
  allPropertyTypes: string[] = [];

  filteredDistricts: District[] = [];
  filteredHousingCompanies: any[] = [];
  filteredPropertyTypes: string[] = [];
  
  isAdmin: boolean = false;
  statusFilter: string = ''; // 'Pending', 'Active', etc.
  selectedStatus: string = ''; // <-- Add this line
  private popupClickInProgress = false;
  private langSub: Subscription | null = null;
  constructor(
    private housingService: HousingPropertyService,
    private http: HttpClient, // <-- Add this
    private mapService: MapService,
    private languageService: LanguageService,
    private ngZone: NgZone
  ) {
    const user = JSON.parse(localStorage.getItem('adminProfile') || '{}');
    this.isAdmin = user?.role === 'admin';

    // single subscription: update language and refresh existing popups
    this.langSub = this.languageService.language$.subscribe(lang => {
      this.language = lang;
      this.refreshPopupsForLanguage();
    });
  }

  // delegated click handler — works even when Leaflet replaces popup DOM on setContent
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
      const url = `${this.API_BASE_URL}/api/precon-properties/${idNum}`;
      this.http.get<HousingProperty>(url).subscribe({
        next: (fullProperty) => {
          this.ngZone.run(() => {
            this.selectedProperty = fullProperty;
            this.showDetails = true;
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

  // refresh popup HTML for all markers so language switch updates content immediately
  private refreshPopupsForLanguage() {
    if (!this.markers || typeof (this.markers as any).getLayers !== 'function') return;
    try {
      const layers = (this.markers as any).getLayers();
      layers.forEach((layer: any) => {
        const p: HousingProperty | undefined = layer.propertyData;
        if (!p) return;
        const html = this.getPropertyPopupHtml(p);
        if (layer.getPopup && layer.getPopup()) {
          try { layer.getPopup().setContent(html); } catch { layer.bindPopup(html); }
        } else {
          layer.bindPopup(html);
        }
        // if popup is currently open, reopen it to ensure content refresh
        if (typeof layer.isPopupOpen === 'function' && layer.isPopupOpen()) {
          try { layer.openPopup(); } catch { /* ignore */ }
        }
      });
    } catch (err) {
      console.warn('refreshPopupsForLanguage error', err);
    }
  }
  

  

ngAfterViewInit() {
    this.map = L.map('map').setView([31.95, 35.91], 12); // Amman coordinates

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Use marker cluster group instead of plain layer group
    this.markers = L.markerClusterGroup();
    this.map.addLayer(this.markers);

    forkJoin({
      housingProperties: this.http.get<HousingProperty[]>(`${this.API_BASE_URL}/api/precon-properties/thumbnails`),
      fullDistricts: this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/with-polygons`),
      fullCities: this.http.get<any[]>(`${this.API_BASE_URL}/api/cities`)
   
    }).subscribe(({ housingProperties, fullDistricts,fullCities }) => {
      console.log('Fetched properties:', housingProperties);
      console.log('Fetched districts:', fullDistricts);
      
      this.allProperties = housingProperties;
      this.fullDistricts = fullDistricts;
      this.districts=fullDistricts;
      this.fullCities = fullCities;

      // Get unique district IDs from properties
      const propertyDistrictIds = new Set(housingProperties.map(p => p.districtId).filter(id => id != null));
      const propertyCityIds = new Set(housingProperties.map(p => p.cityId).filter(id => id != null));
      
      this.dropDownDistricts = this.fullDistricts.filter(d => propertyDistrictIds.has(d.id));
     this.dropDownCities=this.fullCities.filter(c => propertyCityIds.has(c.id));
      console.log('Drop-down districts:', this.dropDownDistricts);
      console.log('Drop-down cities:', this.dropDownCities);
      this.allProperties = housingProperties;
      this.filteredDistricts = [...this.dropDownDistricts];
     

      //const propertyDistrictIds = new Set(properties.map(p => p.districtId).filter(id => id != null));
      this.districts = this.fullDistricts.filter(d => propertyDistrictIds.has(d.id));


      // Set dynamic min/max price
      

     // this.filterProperties(); // <-- Only show filtered properties (For-Sale by default)

      // After fetching fullDistricts (with polygons)
      this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/with-polygons`).subscribe(districts => {
        this.fullDistricts = districts;

        // Get unique district IDs from properties
        const propertyDistrictIds = new Set(housingProperties.map(p => p.district?.id).filter(id => id != null));

        // Only districts that have properties
        this.districts = this.fullDistricts.filter(d => propertyDistrictIds.has(d.id));
      });

      // Remove existing markers from the cluster group
     this.housingProperties = housingProperties;
     this.renderMarkers(this.housingProperties);
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

          // get language-aware city/district labels from pre-fetched lists
          const cityLabel = this.getCityLabel(p.cityId ?? p.city);
          const districtLabel = this.getDistrictLabel(p.districtId ?? p.district);

           return `
             <div class="cluster-property-item" data-idx="${idx}" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; cursor: pointer;">
               <img src="${photoUrl ?? ''}" alt="photo" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px;">
               <div>
                <div style="font-weight:bold;">${p.address}${(cityLabel ? ', ' + cityLabel : '')}${(districtLabel ? ' - ' + districtLabel : '')}</div>
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
        onEachFeature: (feature, layer) => {
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

 //this.renderMarkers(this.housingProperties);
   }

   ngOnInit() {
    // Fetch all housing companies for dropdown/filter
    this.http.get<any[]>(`${this.API_BASE_URL}/api/housing-companies`).subscribe(data => {
      this.housingCompanies = data;
      this.filteredHousingCompanies=data;
    });



  
  this.filteredDistricts = [...this.dropDownDistricts];
   // or whatever your source is
  }

  /*ngAfterViewInit(): void {
    this.initMap();
    this.addMarkers();
  }*/

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



   private getCityLabel(cityIdOrObj: any): string {
    if (!cityIdOrObj && cityIdOrObj !== 0) return '';
    let city: any = null;
    if (typeof cityIdOrObj === 'object') city = cityIdOrObj;
    else city = (this.fullCities || []).find((c: any) => Number(c.id) === Number(cityIdOrObj));
    if (!city) return '';
    return this.language === 'ar' ? (city.nameAr ?? city.nameEn ?? '') : (city.nameEn ?? city.nameAr ?? '');
  }

  // helper: return language-aware district label by id or object
  private getDistrictLabel(districtIdOrObj: any): string {
    if (!districtIdOrObj && districtIdOrObj !== 0) return '';
    let district: any = null;
    if (typeof districtIdOrObj === 'object') district = districtIdOrObj;
    else district = (this.fullDistricts || []).find((d: any) => Number(d.id) === Number(districtIdOrObj));
    if (!district) return '';
    const label=this.language === 'ar' ? (district.nameAr ?? district.nameEn ?? '') : (district.nameEn ?? district.nameAr ?? '');
   
   console.log('District label for', districtIdOrObj, 'is', label);
    return label;
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


  renderMarkers(properties: HousingProperty[]) {
      if (!this.markers) return;
      this.markers.clearLayers();
      console.log('Rendering properties:', properties.map(p => ({ id: p.id, lat: p.lat, lng: p.lng })));
  
      const markerList = properties
        .filter(p => p.lat && p.lng)
        .map(p => {
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

  //const priceLabel = (priceLow / 1000).toFixed(1).replace(/\.0$/, '') + 'K JOD';







         
          let markerColor = '#43a047'; // green
         
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
                <span style="font-size:0.95em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${priceLabel}</span>
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
            .on('popupopen', (event) => {
              setTimeout(() => {
                const popupContent = event.popup.getElement()?.querySelector('.property-popup-content') as HTMLElement;
                if (popupContent) {
                  popupContent.addEventListener('click', () => {
                    // Fetch full property details by ID
                    this.http.get<HousingProperty>(`${this.API_BASE_URL}/api/precon-properties/${p.id}`).subscribe(fullProperty => {
                      this.ngZone.run(() => {
                        this.selectedProperty = fullProperty;
                        console.log('Selected property for details:', this.selectedProperty);
                        this.showDetails = true;
                        event.target.closePopup();
                      });
                    });
                  }, { once: true });
                }
              }, 0);
            });
  
          return leafletMarker;
        });
  
      this.markers.addLayers(markerList);

      
    }


     getPropertyPopupHtml(property: HousingProperty): string {
    const photoUrl = this.getPhotoUrlNew(property);
    const cityLabel = this.getCityLabel(property.cityId ?? property.city);
    const districtLabel = this.getDistrictLabel(property.districtId ?? property.district);
    const listedLabel = this.language === 'en' ? 'Listed' : 'تاريخ الإدراج';
    return `
      <div class="property-popup-content" data-property-id="${property.id}" style="cursor:pointer; display: grid; grid-template-columns: 100px 1fr; gap: 12px; align-items: center; min-width: 320px;">
        <div>
          <img src="${photoUrl ?? ''}" alt="photo" style="width:100px; height:auto; border-radius:6px;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="font-weight: bold; color: #1976d2;">
            <div>
                ${property.priceRange?.toLocaleString?.() ?? property.priceRange} JOD
            </div>
            <div>
                 <span style="font-weight: normal; color: #666; font-size: 0.95em;">${listedLabel}: ${property.listingDate ?? ''}</span>
            </div>
            
           <div style="color: #222;">${property.address ?? ''}${cityLabel ? ', ' + cityLabel : ''}${districtLabel ? ' - ' + districtLabel : ''}${property.neighborhood ? ' / ' + property.neighborhood : ''}</div>
          
          
          
          
           <div style="color: #444; font-size: 0.95em;">
            <span style="margin-right:8px;">
              <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-fill.svg" alt="bed" width="16" style="vertical-align:middle; margin-right:2px;">
              ${property.bedroomRange != null ? property.bedroomRange : 0}
            </span>
            <span style="margin-right:8px;">
              <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/droplet-half.svg" alt="bath" width="16" style="vertical-align:middle; margin-right:2px;">
              ${property.bathroomRange != null ? property.bathroomRange : 0}
            </span>
            <span style="margin-right:8px;">
              <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/rulers.svg" alt="area" width="16" style="vertical-align:middle; margin-right:2px;">
              ${property.areaRange ? property.areaRange : 'N/A'} ${this.language === 'en' ? 'm²' : 'م²'}
            </span>
          </div>
        </div>
      </div>
    `;
   }

      applyFilters() {
        let filtered = this.housingProperties;
  
        if (this.propertyTypeFilter) {
          filtered = filtered.filter(p => p.propertyType === this.propertyTypeFilter);
        }
        if (this.housingCompanyFilter) {
          const housingCompanyId = Number(this.housingCompanyFilter);
          filtered = filtered.filter(p => p.housingId === housingCompanyId);
        }

        // if a city is selected, restrict properties and fetch districts for that city
        if (this.cityFilter) {
          const cityIdNum = Number(this.cityFilter);
          if (!Number.isNaN(cityIdNum)) {
            console.log('Filtering by cityId:', cityIdNum);
            filtered = filtered.filter(p => p.cityId === cityIdNum);

            // fetch districts for selected city and update district dropdown (API: /api/districts/city/{cityId})
            this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/city/${cityIdNum}`).subscribe({
              next: (districts) => {
                // optionally restrict to districts that have properties in the current filtered set
                const propertyDistrictIds = new Set(filtered.map(p => p.districtId).filter(id => id != null));
                this.dropDownDistricts = (districts || []).filter((d: any) => propertyDistrictIds.size ? propertyDistrictIds.has(d.id) : true);
                // if current selectedDistrictId isn't in the new list, clear it
                if (!this.dropDownDistricts.some(d => String(d.id) === String(this.districtFilter))) {
                  this.districtFilter = '';
                }
              },
              error: (err) => {
                console.warn('Failed to load districts for city', cityIdNum, err);
                this.dropDownDistricts = [];
                this.districtFilter = '';
              }
            });

            // move/center map to selected city
            this.moveMapToCity(cityIdNum, 12);
          }
        }
         console.log('District filter value:', this.districtFilter);
         if (this.districtFilter) {
           const districtId = Number(this.districtFilter);
           console.log('Filtering by districtId:', districtId);
           console.log('Properties before district filter:', filtered);
           filtered = filtered.filter(p => p.districtId=== districtId);
           console.log('Properties after district filter:', filtered);
         }
 
         
 
         const filteredCityIds = new Set(filtered.map(p => p.cityId));
          this.dropDownCities = this.fullCities.filter(c => filteredCityIds.has(c.id));
         const filteredCompanyIds1 = new Set(filtered.map(p => p.housingId));
         this.filteredHousingCompanies = this.housingCompanies.filter(hc => filteredCompanyIds1.has(hc.id));
        


         const filteredDistrictIds = new Set(filtered.map(p => p.districtId));
         this.dropDownDistricts = this.fullDistricts.filter(d => filteredDistrictIds.has(d.id));
        const filteredCompanyIds = new Set(filtered.map(p => p.housingId));
        this.filteredHousingCompanies = this.housingCompanies.filter(hc => filteredCompanyIds.has(hc.id));
         this.showDistrictBorder();





          if (this.selectedStatus === 'Pending') {
            filtered = filtered.filter(p => p.listingStatus === 'Pending');
         }
  
        this.renderMarkers(filtered);
      }

      filterDropdowns() {
        // Filter properties based on current selections
        let filtered = this.allProperties;

        if (this.selectedHousingCompany) {
          filtered = filtered.filter(p => p.housingId === this.selectedHousingCompany);
        }
       if (this.selectedDistrict) {
            const districtIdNum = Number(this.selectedDistrict);
            filtered = filtered.filter(p => p.districtId === districtIdNum);
          }
        if (this.selectedPropertyType) {
          filtered = filtered.filter(p => p.propertyType === this.selectedPropertyType);
        }

        // Update districts to only those with properties in filtered
        this.filteredDistricts = this.allDistricts.filter(d =>
          filtered.some(p => p.districtId === d.id)
        );

        // Update housing companies to only those with properties in filtered
        this.filteredHousingCompanies = this.allHousingCompanies.filter(hc =>
          filtered.some(p => p.housingId === hc.id)
        );

        // Update property types to only those with properties in filtered
        this.filteredPropertyTypes = this.allPropertyTypes.filter(type =>
          filtered.some(p => p.propertyType === type)
        );
      }

      onHousingCompanyChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.selectedHousingCompany = value;
        this.filterDropdowns();
      }

      onDistrictChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.selectedDistrict = value;
        this.districtFilter = value; 

        console.log('District changed to:', value);
        console.log('districtFilter set to:', this.districtFilter);
        console.log('selectedDistrict', this.selectedDistrict);
        this.showDistrictBorder();
        this.filterDropdowns();
      }

      onPropertyTypeChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.selectedPropertyType = value;
        this.filterDropdowns();
      }


      showDistrictBorder() {
          // remove previous selection if any
    if (this.districtLayer && this.map) {
      try { this.map.removeLayer(this.districtLayer); } catch (e) { /* ignore */ }
      this.districtLayer = null;
    }

    if (!this.districtFilter) return;

    // find selected district object
    const district = this.fullDistricts.find(d => d.id === +this.districtFilter);
    if (!district || !district.polygons || district.polygons.length === 0 || !this.map) return;

    // build coords (Leaflet expects [lat, lng])
    const coords = district.polygons
      .sort((a: any, b: any) => (a.coordinateOrder ?? 0) - (b.coordinateOrder ?? 0))
      .map((p: any) => [Number(p.latitude), Number(p.longitude)]);

    if (coords.length < 3) return;
    // ensure closed ring
    const first = coords[0], last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);

    // draw polygon (ensure interactive so tooltips/mouse events fire) and try to bring to front
    const strokeColor = '#613f55ff';
    const fallbackColor = 'rgba(97,63,85,1)';
    const options = { color: strokeColor, fillColor: strokeColor, weight: 2, fillOpacity: 0.08, interactive: true };

    try {
      this.districtLayer = L.polygon(coords, options).addTo(this.map);
    } catch (err) {
      this.districtLayer = L.polygon(coords, { ...options, color: fallbackColor, fillColor: fallbackColor }).addTo(this.map);
    }

    try {
      // ensure visual priority
      (this.districtLayer as any).bringToFront?.();

      // language-aware label
      const label = this.getDistrictLabel(district) || `${district.nameEn || ''} ${district.nameAr ? '(' + district.nameAr + ')' : ''}`;
   
      // bind tooltip (sticky so it follows mouse) and also open at polygon center so it's visible immediately
      (this.districtLayer as any).bindTooltip?.(label, { sticky: true, direction: 'center', offset: [0, 0], className: 'selected-district-tooltip' });

      // open tooltip at polygon center (ensures tooltip visible even if user doesn't mouseover)
      const bounds = (this.districtLayer as L.Polygon).getBounds();
      if (bounds && typeof bounds.getCenter === 'function') {
        const center = bounds.getCenter();
        try { (this.districtLayer as any).openTooltip(center); } catch { /* ignore */ }
      }

      // Also keep tooltip reactive to hover at mouse position
      (this.districtLayer as any).on?.('mouseover', (e: any) => {
        // open tooltip at the mouse position for a sticky/follow experience
        try { (this.districtLayer as any).openTooltip(e.latlng); } catch {}
      });
      (this.districtLayer as any).on?.('mouseout', () => {
        try { (this.districtLayer as any).closeTooltip(); } catch {}
      });

      // fit bounds (use a safe guard so map won't jump excessively)
      if (bounds && bounds.isValid && bounds.isValid()) {
        try { this.map.fitBounds(bounds); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore tooltip/bounds errors */ }
   }
      
      onPropertyActivated(updatedProperty: HousingProperty) {
        // Option 1: Reload all properties from backend
        // Update the property in allProperties, then re-filter
         const idx = this.allProperties.findIndex((p: HousingProperty) => p.id === updatedProperty.id);
         if (idx !== -1) {
           this.allProperties[idx] = updatedProperty;
           this.applyFilters();
         }
      }

      setPendingStatus() {
        this.selectedStatus = 'Pending';
        this.applyFilters();
      }


    closeDetails() {
          this.showDetails = false;
        this.selectedProperty = null;
        // remove any leftover custom backdrop if used
          const backdrop = document.querySelector('.modal-backdrop-custom') as HTMLElement | null;
          if (backdrop) backdrop.remove();
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
}
