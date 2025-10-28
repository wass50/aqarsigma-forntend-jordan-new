import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



export interface AppartmentDetail {
 unitNumber: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  features?: string | string[] | null;
  floorPlan: File | null;
  price: number;
  listingStatus: string;
  id?: number;  

}


export interface HousingProperty {
  
  
    
    apartments: AppartmentDetail[];
    listingStatus: string;
    
    waterSupply: string;
    heatingType: string;
    coolingType: string;
    heatingFuel: string;
    description: string;
    descriptionAr: string;
    virtualTourUrl: string;
    yearBuilt: string;
    features: string;
    projectName: string;
    builder: string;
    estimatedCompletionDate: string;
    numberOfUnits: string;
    numberOfFloors: string;
    areaRange: string;
    saleStarted: string;
    
    masterBedrooms: string;
    amenities ?: string | string[] | null;
    userId?: number | null;
    housingId?: number | null;
      
  photos: HousingPropertyPhoto[];
  updatedOn: string | null; // ISO date string, e.g. "2025-06-24"
  
  id: number;
  address: string;
  city: City;
    districtId: number;
    cityId: number;
    neighborhoodId: number | null;
    
  neighborhood: Neighborhood;
  district: District;
  priceRange: string;
  bedroomRange: string;
  bathroomRange: string;
  propertyType: string;
  
  
  lat: number;
  lng: number;
  mainPhotoBlob: string;
  listingDate: string;
}





export interface City {
  id: number;
  nameEn: string;
  nameAr: string;
  countryId: number;
}

export interface District {
  id: number;
  nameEn: string;
  nameAr: string;
  cityId: number;
  polygons?: { id: number; coordinateOrder: number; longitude: number; latitude: number }[];
}

export interface Neighborhood {
  id: number;
  nameEn: string;
  nameAr: string;
  districtId: number;
}
export interface HousingPropertyPhoto {
  id: number;
  url: string;
  imageBlob?: File | string | null;
  isMain?: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class HousingPropertyService {
  private apiUrl = 'http://localhost:8080/api/precon-properties/thumbnails';

  constructor(private http: HttpClient) {}

  getThumbnails(): Observable<HousingProperty[]> {
    return this.http.get<HousingProperty[]>(this.apiUrl);
  }
}