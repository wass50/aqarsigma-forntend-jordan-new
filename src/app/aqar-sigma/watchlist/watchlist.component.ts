import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-draw';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyListViewComponent } from '../property-list-view/property-list-view.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { PropertyDetailsComponent } from '../property-details/property-details.component';
import { Property } from '../Property';
import { environment } from '../../../environments/environment'; // { changed code }
import { LanguageService } from '../LanguageService';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PropertyListViewComponent,
    PropertyDetailsComponent, // <-- Add this line
    LeafletModule,
  ],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit {
  activeWatchTab: 'property' | 'community' | 'area' = 'property';
  propertyWatchLists: { id: number, name: string, properties: any[], privacy: 'shareable' | 'private' }[] = [];
  communityWatchLists: { id: number, name: string, communities: any[], privacy: 'shareable' | 'private' }[] = [];
  areaWatchLists: { id: number, name: string, areas: any[], privacy: 'shareable' | 'private' ,polygonPoints?: string }[] = [];
  user: any;
  readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }
readonly WATCHLIST_MAX_PROPERTIES = environment.watchlist?.maxPropertiesPerList ?? 10;
  readonly WATCHLIST_MINI_MAP_ZOOM = environment.map?.defaultZoom ?? 12;
  readonly WATCHLIST_AREA_MAP_ZOOM = environment.watchlist?.miniMapAreaZoom ?? 11;
  readonly WATCHLIST_DEFAULT_CENTER = environment.watchlist?.defaultCenter ?? { lat: 31.9516, lng: 35.9237 };
language: 'en' | 'ar' = 'en';
  // .

  newWatchlistName = '';
  newWatchlistPrivacy: 'shareable' | 'private' = 'private';
  newWatchlistType: 'property' | 'community' = 'property';

  newPropertyWatchlistName = '';
  newPropertyWatchlistPrivacy: 'shareable' | 'private' = 'private';

  newAreaWatchlistName = '';
   areaMapOptions = {
    center: [this.WATCHLIST_DEFAULT_CENTER.lat, this.WATCHLIST_DEFAULT_CENTER.lng] as L.LatLngTuple,
   zoom: this.WATCHLIST_AREA_MAP_ZOOM,
    layers: [L.tileLayer(environment.map?.tileUrl ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')]
  };
  areaMapLayers: any[] = [];
  drawnAreaPolygon: any = null;
  mapInstance: L.Map | null = null;

  newCommunityWatchlistName = '';
  selectedCity: number | null = null;
  selectedDistrict: number | null = null;
  cities: any[] = [];
  districts: any[] = [];
  filteredDistricts: { id: number, name: string, cityId: number, polygon: any }[] = [];
  communityMapOptions = {
    center: [this.WATCHLIST_DEFAULT_CENTER.lat, this.WATCHLIST_DEFAULT_CENTER.lng] as L.LatLngTuple,
    zoom: this.WATCHLIST_MINI_MAP_ZOOM,
    layers: [L.tileLayer(environment.map?.tileUrl ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')]
  };
  districtMapLayers: any[] = [];
  districtMapInstance: L.Map | null = null;
  communityMapLayers: any[] = [];
  communityMapInstance: L.Map | null = null;
  districtLayer: L.Layer | null = null;
  fullDistricts: any[] = []; // This should be populated with district data including polygons

  userWatchlists: any[] = [];

  selectedPropertyWatchlist: any = null;

  selectedProperty: any = null;

  selectedCommunityWatchlist: any = null;
  selectedCommunityProperties: any[] = [];
  
  showCommunityPropertiesList = false;

  selectedAreaWatchlist: any = null;
  selectedAreaProperties: any[] = [];
  showAreaPropertiesList = false;


  constructor(private router: Router, private http: HttpClient,private languageService: LanguageService) {
    const nav = this.router.getCurrentNavigation();
    this.user = nav?.extras.state?.['user'];
    if (!this.user) {
    // Fallback to localStorage if navigation state is missing
    this.user = JSON.parse(localStorage.getItem('userProfile') || '{}');
  }
   this.languageService.language$.subscribe(lang => this.language = lang);
  }

  ngOnInit(): void {

     if (!this.user || !this.user.id) {
    this.router.navigate(['/login']);
    return;
  }
    this.http.get<any[]>(`${this.API_BASE_URL}/api/cities`).subscribe({
      next: (data) => {
        console.log('Fetched cities:', data);
        this.cities = data;
      },
      error: (err) => {
        console.error('Error fetching cities', err);
      }
    });

    this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/with-polygons`).subscribe({
    next: (data) => {
      this.districts = data;
      // ...other logic
    }
  });

    const userId = this.user?.id;
    this.http.get<any[]>(`${this.API_BASE_URL}/api/users/${userId}/watchlists`).subscribe(lists => {
      this.userWatchlists = lists;
      this.propertyWatchLists = lists.filter(w => w.type === 'PROPERTY').map(w => ({
        ...w,
        properties: Array.isArray(w.properties) ? w.properties : []
      }));
      this.communityWatchLists = lists.filter(w => w.type === 'COMMUNITY').map(w => ({
        ...w,
        communities: Array.isArray(w.communities) ? w.communities : []
      }));
      this.areaWatchLists = lists.filter(w => w.type === 'AREA').map(w => ({
        ...w,
        areas: Array.isArray(w.areas) ? w.areas : []
      }));
    });
  }

  createNewWatchList(type: 'property' | 'community' | 'area') {
    const name = prompt(`Enter ${type} watch list name:`);
    if (name) {
      if (type === 'property') {
        this.propertyWatchLists.push({ id: Date.now(), name, properties: [], privacy: 'private' });
      } else if (type === 'community') {
        this.communityWatchLists.push({ id: Date.now(), name, communities: [], privacy: 'private' });
      } else if (type === 'area') {
        this.areaWatchLists.push({ id: Date.now(), name, areas: [], privacy: 'private' });
      }
    }
  }


  getDistrictName(districtId: number, lang: 'en' | 'ar' = 'en'): string {
  const district = this.districts.find(d => d.id === districtId);
  if (!district) return '';
  return lang === 'ar' ? district.nameAr : district.nameEn;
}


  addToPropertyWatchList(list: any, property: any) {
    if (!list.properties.some((p: any) => p.id === property.id)) {
      list.properties.push(property);
    }
  }

  removeFromWatchList(list: any, property: any) {
    list.properties = list.properties.filter((p: any) => p.id !== property.id);
  }

  addToCommunityWatchList(list: any, community: any) {
    if (!list.communities.some((c: any) => c.id === community.id)) {
      list.communities.push(community);
    }
  }

  removeCommunityFromWatchList(list: any) {
     this.http.delete(`${this.API_BASE_URL}/api/watchlists/${list.id}`).subscribe(() => {
    this.communityWatchLists = this.communityWatchLists.filter(w => w.id !== list.id);
  });
  }

  removeAreaFromWatchList(list: any) {
    this.http.delete(`${this.API_BASE_URL}/api/watchlists/${list.id}`).subscribe(() => {
    this.areaWatchLists = this.areaWatchLists.filter(w => w.id !== list.id);
  });
  }

  getPhotoUrl(photos: any[]): string {
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return 'assets/default-property.jpg';
    }
    const mainPhoto = photos.find(p => p.isMain) || photos[0];
    // Use imageBlob if url is empty
    if (mainPhoto.url && mainPhoto.url.trim() !== '') {
      return mainPhoto.url;
    }
    if (mainPhoto.imageBlob && mainPhoto.imageBlob.trim() !== '') {
      return `data:image/jpeg;base64,${mainPhoto.imageBlob}`;
    }
    return 'assets/default-property.jpg';
  }

  openCreateWatchlistModal(type: 'property' | 'community') {
    this.newWatchlistType = type;
    this.newWatchlistName = '';
    this.newWatchlistPrivacy = 'private';
    console.log('Opening create watchlist modal for type:', type);
    // Show modal using Bootstrap JS
    const modal = document.getElementById('createPropertyWatchlistModal');
    console.log('Modal element:', modal);
    if (modal) {
      // @ts-ignore
      new window.bootstrap.Modal(modal).show();
    }
  }

 /* confirmCreateWatchList() {
    if (!this.newWatchlistName) return;

    const userId = this.user?.id;

    if (this.newWatchlistType === 'property') {
      const payload = {
        name: this.newWatchlistName,
        type: 'PROPERTY',
        propertyIds: [],
        districtId: null,
        polygonPoints: null,
        privacy: this.newWatchlistPrivacy
      };

      console.log('Creating property watchlist with payload:', payload);

      this.http.post(`http://localhost:8080/api/users/${userId}/watchlists`, payload).subscribe({
        next: (res) => {
          console.log('Property watchlist created!', res);
          this.propertyWatchLists.push({
            id: res.id,
            name: this.newWatchlistName,
            properties: [],
            privacy: this.newWatchlistPrivacy
          });
          const modal = document.getElementById('createWatchlistModal');
          if (modal) {
            // @ts-ignore
            window.bootstrap.Modal.getInstance(modal).hide();
          }
        },
        error: (err) => {
          console.error('Error creating property watchlist', err);
        }
      });
    } else {
      // Community watchlist logic (unchanged)
      this.communityWatchLists.push({
        name: this.newWatchlistName,
        communities: [],
        privacy: this.newWatchlistPrivacy
      });
      const modal = document.getElementById('createWatchlistModal');
      if (modal) {
        // @ts-ignore
        window.bootstrap.Modal.getInstance(modal).hide();
      }
    }
  }

  */

  openCreateAreaWatchlistModal() {
    this.newAreaWatchlistName = '';
    this.areaMapLayers = [];
    this.drawnAreaPolygon = null;
    const modal = document.getElementById('createAreaWatchlistModal');
    if (modal) {
      modal.addEventListener('shown.bs.modal', () => {
        if (this.mapInstance) {
          this.mapInstance.invalidateSize();
        }
      }, { once: true });
      // @ts-ignore
      const bsModal = new window.bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  onAreaPolygonCreated(event: any) {
    this.drawnAreaPolygon = event.layer;
    this.areaMapLayers = [event.layer];
  }

  onAreaMapReady(map: L.Map) {
    this.mapInstance = map;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new (L as any).Control.Draw({
      edit: { featureGroup: drawnItems },
      draw: {
        polygon: true,
        marker: false,
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false
      }
    });
    map.addControl(drawControl);

    map.on('draw:created', (e: any) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      this.drawnAreaPolygon = e.layer;
      this.areaMapLayers = [e.layer];

      // Log polygon points to console
      if (e.layer instanceof L.Polygon) {
        const latlngs = e.layer.getLatLngs()[0].map((latlng: L.LatLng) => ({
          lat: latlng.lat,
          lng: latlng.lng
        }));
        console.log('Polygon points:', latlngs);
      }
    });
  }

  confirmCreateAreaWatchList() {
    if (!this.newAreaWatchlistName || !this.drawnAreaPolygon) return;

    const polygonPoints = JSON.stringify(
      this.drawnAreaPolygon.getLatLngs()[0].map((latlng: any) => ({
        lat: latlng.lat,
        lng: latlng.lng
      }))
    );

    const payload = {
      name: this.newAreaWatchlistName,
      type: 'AREA',
      propertyIds: [],
      districtId: null,
      polygonPoints
    };

    const userId = this.user?.id;
    this.http.post<{ id: number, name: string, polygonPoints?: string, privacy?: 'shareable' | 'private' }>(
      `${this.API_BASE_URL}/api/users/${userId}/watchlists`,
      payload
    ).subscribe({
      next: (res) => {
        console.log('Watchlist created!', res);
        this.areaWatchLists.push({
          id: res.id,
          name: this.newAreaWatchlistName,
          areas: [{ name: this.newAreaWatchlistName, coordinates: JSON.parse(polygonPoints) }],
          privacy: res.privacy ?? 'private',
          polygonPoints: res.polygonPoints
        });
        const modal = document.getElementById('createAreaWatchlistModal');
        if (modal) {
          // @ts-ignore
          window.bootstrap.Modal.getInstance(modal).hide();
        }
      },
      error: (err) => {
        console.error('Error creating watchlist', err);
      }
    });
  }

  openCreateCommunityWatchlistModal() {
    this.newCommunityWatchlistName = '';
    this.selectedCity = null;
    this.selectedDistrict = null;
    this.filteredDistricts = [];
    this.communityMapLayers = [];
    const modal = document.getElementById('createCommunityWatchlistModal');
    if (modal) {
      modal.addEventListener('shown.bs.modal', () => {
        if (this.districtMapInstance) {
          this.districtMapInstance.invalidateSize();
          this.districtMapInstance.setView([this.WATCHLIST_DEFAULT_CENTER.lat, this.WATCHLIST_DEFAULT_CENTER.lng], this.WATCHLIST_MINI_MAP_ZOOM); // Force center/zoom from config
        }
      }, { once: true });
      // @ts-ignore
      const bsModal = new window.bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  onCommunityMapReady(map: L.Map) {
    this.communityMapInstance = map;
  }

  onCityChange() {
    const cityObj = this.cities.find(c => c.id === Number(this.selectedCity));
    if (cityObj) {
      this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/city/${cityObj.id}`).subscribe(data => {
        this.districts = data;
        this.selectedDistrict = null;
        this.fullDistricts = data; // 
        // Optionally clear map layers here
      });
    } else {
      this.districts = [];
      this.selectedDistrict = null;
    }
  }

  onDistrictMapReady(map: L.Map) {
    this.districtMapInstance = map;
    map.setView([this.WATCHLIST_DEFAULT_CENTER.lat, this.WATCHLIST_DEFAULT_CENTER.lng], this.WATCHLIST_MINI_MAP_ZOOM);
  }

  onDistrictChange() {
    // Remove previous layer if exists

    console.log('Selected district changed to:', this.selectedDistrict);
    if (this.districtLayer && this.districtMapInstance) {
      this.districtMapInstance.removeLayer(this.districtLayer);
      this.districtLayer = null;
    }
    if (!this.selectedDistrict) return;

    // Use fullDistricts to get polygons
    const district = this.fullDistricts.find(d => d.id === +this.selectedDistrict!);
    console.log('Selected district object:', district);
    
    if (district?.polygons && district.polygons.length > 0 && this.districtMapInstance) {
      console.log('District polygons found:', district.polygons);
      const coords = district.polygons
        .sort((a: { coordinateOrder: number }, b: { coordinateOrder: number }) => a.coordinateOrder - b.coordinateOrder)
        .map((p: { latitude: number, longitude: number }) => [p.latitude, p.longitude]);
      // Ensure polygon is closed
      if (
        coords.length &&
        (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])
      ) {
        coords.push(coords[0]);
      }

      console.log('District polygon coords:', coords);
      this.districtLayer = L.polygon(coords, { color: '#1976d2', weight: 2, fillOpacity: 0.08 }).addTo(this.districtMapInstance);
      this.districtMapInstance.fitBounds((this.districtLayer as L.Polygon).getBounds());
    }
  }

  confirmCreateCommunityWatchList() {
    if (!this.newCommunityWatchlistName || !this.selectedDistrict) return;

    const payload = {
      name: this.newCommunityWatchlistName,
      type: 'COMMUNITY',
      propertyIds: [],
      districtId: this.selectedDistrict,
      polygonPoints: null
    };

    const userId = this.user?.id;
    this.http.post<{ id: number, name: string, privacy?: 'shareable' | 'private' }>(
     `${this.API_BASE_URL}/api/users/${userId}/watchlists`,
      payload
    ).subscribe({
      next: (res) => {
        this.communityWatchLists.push({
          id: res.id,
          name: this.newCommunityWatchlistName,
          communities: [],
          privacy: res.privacy ?? 'private'
        });
        const modal = document.getElementById('createCommunityWatchlistModal');
        if (modal) {
          // @ts-ignore
          window.bootstrap.Modal.getInstance(modal).hide();
        }
      },
      error: (err) => {
        console.error('Error creating community watchlist', err);
      }
    });
  }

  confirmCreatePropertyWatchList() {
    if (!this.newPropertyWatchlistName) return;
    const userId = this.user?.id;
    const payload = {
      name: this.newPropertyWatchlistName,
      type: 'PROPERTY',
      propertyIds: [],
      districtId: null,
      polygonPoints: null,
      privacy: this.newPropertyWatchlistPrivacy
    };
    this.http.post<{ id: number, name: string, privacy?: 'shareable' | 'private' }>(
      `${this.API_BASE_URL}/api/users/${userId}/watchlists`,
      payload
    ).subscribe({
      next: (res) => {
        this.propertyWatchLists.push({
          id: res.id,
          name: this.newPropertyWatchlistName,
          properties: [],
          privacy: res.privacy ?? 'private'
        });
        const modal = document.getElementById('createPropertyWatchlistModal');
        if (modal) {
          // @ts-ignore
          window.bootstrap.Modal.getInstance(modal).hide();
        }
      },
      error: (err) => {
        console.error('Error creating property watchlist', err);
      }
    });
  }

  getMiniMapOptions(watchlist: any) {
    return {
      center: [this.WATCHLIST_DEFAULT_CENTER.lat, this.WATCHLIST_DEFAULT_CENTER.lng] as L.LatLngTuple,
      zoom: this.WATCHLIST_MINI_MAP_ZOOM,
      dragging: false,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      layers: [L.tileLayer(environment.map?.tileUrl ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')]
    };
  }

  getMiniMapLayers(watchlist: any) {
    let points = watchlist?.polygonPoints;
    if (!points) return [];
    if (typeof points === 'string') {
      try {
        points = JSON.parse(points);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(points)) return [];
    if (points.length <= 2) return [];
    const coords = points.map((p: any) => [p.lat, p.lng]);
    return [L.polygon(coords, { color: '#1976d2', weight: 2, fillOpacity: 0.15 })];
  }

  getAreaMiniMapOptions(watchlist: any) {
    let points = watchlist?.polygonPoints;
    if (typeof points === 'string') {
      try {
        points = JSON.parse(points);
      } catch {
        points = [];
      }
    }
    let center: L.LatLngTuple = [31.9516, 35.9237]; // Default center (Amman)
    if (Array.isArray(points) && points.length > 2) {
      // Calculate center of polygon
      const latSum = points.reduce((sum: number, p: any) => sum + p.lat, 0);
      const lngSum = points.reduce((sum: number, p: any) => sum + p.lng, 0);
      center = [
        latSum / points.length,
        lngSum / points.length
      ] as L.LatLngTuple;
    }
    return {
      center,
      zoom: this.WATCHLIST_AREA_MAP_ZOOM,
      dragging: true,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      layers: [L.tileLayer(environment.map?.tileUrl ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')]
    };
  }

  getCommunityMiniMapOptions(watchlist: any) {
    return this.getAreaMiniMapOptions(watchlist);
  }

  getCommunityMiniMapLayers(watchlist: any) {
    if (watchlist.district && watchlist.district.polygons && watchlist.district.polygons.length > 2) {
      const coords = watchlist.district.polygons
        .sort((a: any, b: any) => a.coordinateOrder - b.coordinateOrder)
        .map((p: any) => [p.latitude, p.longitude]);
      return [L.polygon(coords, { color: '#1976d2', weight: 2, fillOpacity: 0.15 })];
    }
    return [];
  }

  getAreaMiniMapLayers(watchlist: any) {
    let points = watchlist?.polygonPoints;
    if (!points) return [];
    if (typeof points === 'string') {
      try {
        points = JSON.parse(points);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(points) || points.length <= 2) return [];
    const coords = points.map((p: any) => [p.lat, p.lng]);
    return [L.polygon(coords, { color: '#1976d2', weight: 2, fillOpacity: 0.15 })];
  }

  softDeleteWatchlist(list: any) {
    this.http.put(
      `${this.API_BASE_URL}/api/users/watchlists/${list.id}/delete`,
      
      {}
    ).subscribe({
      next: () => {
        // Remove from UI (or mark as deleted)
        this.propertyWatchLists = this.propertyWatchLists.filter(w => w.id !== list.id);
        this.communityWatchLists = this.communityWatchLists.filter(w => w.id !== list.id);
        this.areaWatchLists = this.areaWatchLists.filter(w => w.id !== list.id);
      },
      error: (err) => {
        console.error('Error soft deleting watchlist', err);
      }
    });
  }

  addPropertyToWatchlist(list: any, property: any) {
   if (list.properties.length >= this.WATCHLIST_MAX_PROPERTIES) {
      alert(`You can only add up to ${this.WATCHLIST_MAX_PROPERTIES} properties in this watch list.`);
      return;
    }
    if (!list.properties.some((p: any) => p.id === property.id)) {
      list.properties.push(property);
    }
  }

  onWatchlistClick(list: any) {
    this.selectedPropertyWatchlist = list;
  }

  onBackToWatchlists() {
    this.selectedPropertyWatchlist = null;
    this.selectedProperty = null;
  }
  onBackToListView() {
    this.selectedProperty = null;
  }

  onPropertySelected(property: any) {
    console.log('Selected property:', property);

    if ((this.activeWatchTab === 'community' || this.activeWatchTab === 'area') && property?.id) {
      // Fetch full property details for community or area watch list
      this.http.get<any>(`${this.API_BASE_URL}/api/properties/${property.id}`)
        .subscribe(fullProperty => {
          console.log('Fetched full property details:', fullProperty);
          this.selectedProperty = fullProperty;
        }, error => {
          console.error('Error fetching full property details:', error);
          this.selectedProperty = property; // fallback to partial property
        });
    } else {
      // For property watch lists, just use the selected property as is
      this.selectedProperty = property;
    }
  }

  onCommunityMapClick(list: any) {
    const watchlistId = list.id;
    console.log('Map clicked for community watchlist:', watchlistId);
    this.http.get<any[]>(`${this.API_BASE_URL}/api/properties/watchlists/${watchlistId}/community-properties`)
      .subscribe(properties => {
        console.log('Fetched community properties:', properties);
        this.selectedCommunityProperties = properties;
        this.showCommunityPropertiesList = true;
      }, error => {
        console.error('Error fetching community properties:', error);
      });
  }

  onCommunityWatchlistClick(list: any) {
    console.log('Community watchlist clicked:', list);
    this.selectedCommunityWatchlist = list;
    this.showCommunityPropertiesList = false;
  }

  onBackToCommunityWatchlists() {
    console.log('Navigating back to community watchlists');
    this.selectedCommunityWatchlist = null;
    this.selectedCommunityProperties = [];
    this.showCommunityPropertiesList = false;
    this.selectedProperty = null;
  }

  onBackToCommunityListView() {
    console.log('Navigating back to community list view');
    // Only reset selectedProperty, keep showCommunityPropertiesList as is
    this.selectedProperty = null;
  }
  onBackToAreaWatchlists() {
    this.selectedAreaWatchlist = null;
    this.selectedAreaProperties = [];
    this.showAreaPropertiesList = false;
    this.selectedProperty = null;
  }
  onBackToAreaListView() {
    this.selectedProperty = null;
  }

  onAreaWatchlistClick(areaWatchlist: any) {
    console.log('Area watchlist clicked:', areaWatchlist);

    // Parse polygonPoints from JSON string to array
    let polygon: { lat: number, lng: number }[] = [];
    try {
      polygon = JSON.parse(areaWatchlist.polygonPoints);
    } catch (e) {
      console.error('Invalid polygonPoints JSON:', areaWatchlist.polygonPoints, e);
      this.selectedAreaProperties = [];
      this.selectedAreaWatchlist = areaWatchlist;
      this.showAreaPropertiesList = true;
      return;
    }

    if (!Array.isArray(polygon) || polygon.length < 3) {
      console.error('Invalid or missing polygon for area watchlist:', polygon);
      this.selectedAreaProperties = [];
      this.selectedAreaWatchlist = areaWatchlist;
      this.showAreaPropertiesList = true;
      return;
    }

    this.http.get<any[]>(`${this.API_BASE_URL}/api/properties/thumbnails`)
      .subscribe(properties => {
        const filtered = properties.filter(p =>
          p.lat != null && p.lng != null &&
          this.isPointInPolygon(p.lat, p.lng, polygon)&&
          // show only active properties (support different possible fields)
          (
            (p.listingStatus && String(p.listingStatus).toLowerCase() === 'active')
            
          )
        );
        console.log('Filtered area properties:', filtered);
        this.selectedAreaProperties = filtered;
        this.selectedAreaWatchlist = areaWatchlist;
        this.showAreaPropertiesList = true;
      }, error => {
        console.error('Error fetching area properties:', error);
        this.selectedAreaProperties = [];
        this.showAreaPropertiesList = true;
      });
  }



  


  isPointInPolygon(lat: number, lng: number, polygon: {lat: number, lng: number}[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng, yi = polygon[i].lat;
      const xj = polygon[j].lng, yj = polygon[j].lat;
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-10) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }


 showAreaOnMap(areaWatchlist: any) {
  let polygon: any[] = [];
  try {
    polygon = JSON.parse(areaWatchlist.polygonPoints);
  } catch (e) {
    console.error('Invalid polygonPoints JSON:', areaWatchlist.polygonPoints, e);
    return;
  }
  localStorage.setItem('areaPolygon', JSON.stringify(polygon));
  this.router.navigate(['/Map-Search']);
}
}
