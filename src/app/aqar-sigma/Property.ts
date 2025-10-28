import { Realtor } from './Realtor';


export type BasementType = 'None' | 'Finished' | 'Partially Finished' | 'Unfinished';

export type MeasurementSystem = 'Imperial' | 'Metric';



export interface PropertyType {
        id : number ;
        code: string;
        labelEn: string;
        labelAr: string;
    }

    export interface PropertyCategory {
        id : number ;
        code: string;
        labelEn: string;
        labelAr: string;
    }

     export interface ListingType {
        id : number ;
        code: string;
        labelEn: string;
        labelAr: string;
    }
   


export interface PropertyPhoto {
  id: number;
  url: string;
  imageBlob?: File | string | null;
  isMain?: boolean;
}

export interface RoomDetail {
  id: number;
  name: string;            // e.g. "Living Room"
  size: string;            // e.g. "22.2 x 19.5 ft" or "6.8 x 5.9 m"
  level: string;           // e.g. "Main", "Second", "Basement"
  features?: string | null;      // e.g. "Open Concept, Pot Lights, Large Window"
  measurementSystem?: string | null; // Optional: 'Imperial' or 'Metric'
}

export interface DescriptionSummary {
  id: number;
  summary: string;
}

export interface ListingHistory {
  id: number;
  dateStart: string; // ISO date string
  dateEnd: string | null;  // ISO date string or null
  price: number;
  event: string;
  listingId: string;
}

export interface City {
  id: number;
  nameEn: string;
  nameAr: string;
  countryId: number;
  latitude: number;
  longitude: number;
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

export interface Property {
  id: number;
  
  address: string;
  city: City;
  districtId: number;
  cityId: number;
  neighborhoodId: number | null;
  
  neighborhood: Neighborhood;
  district: District;
  crossStreet: string;  
  lat: number;
  lng: number;
  price: number;
  originalPrice: number | null;
  soldPrice: number | null;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  roomsCount: number | null;
  area: number | null;

  // legacy flat fields (may be present) kept for backward compatibility
  //propertyType?: string | null;
  propertyStyle: string;
  // support new backend shape: codes, ids and labels for category/type/listing
  propertyTypeCode?: string | null;
  propertyTypeId?: number | null;
  propertyTypeLabelEn?: string | null;
  propertyTypeLabelAr?: string | null;

  //propertyCategory?: 'Residential' | 'Land' | string | null;
  propertyCategoryCode?: string | null;
  propertyCategoryId?: number | null;
  propertyCategoryLabelEn?: string | null;
  propertyCategoryLabelAr?: string | null;

  listingStatus: 'Active' | 'Sold' | 'De_Listed' | 'Pending';

  //listingType?: 'For_Sale' | 'For_Lease' | string | null;
  listingTypeCode?: string | null;
  listingTypeId?: number | null;
  listingTypeLabelEn?: string | null;
  listingTypeLabelAr?: string | null;

  listingDate: string;
  soldDate: string | null;
  daysOnMarket: number | null;
  facade: string | null;          // e.g. "Brick", "Stone", "Stucco"
  
  parking: number | null;
  parkingPlaces: number | null; 
  totalParkingSpace: number | null;  
  floor: string | null;
  garage: number | null;
  yearBuilt: number | null;
  landFrontage: number | null;            // e.g. 87.78
  landDepth: number | null;               // e.g. 148.65
  lotSize: string | null;             // e.g. "87 x 148 feet"
  landArea: string | null;
  lotSizeCode: string | null;
  features?: string | string[] | null;
  photo: string | null;
  photos: PropertyPhoto[];
  description: string;
  //descriptionEn: string;
  descriptionAr: string;
  virtualTourUrl: string;
  openHouseDate: string | null; // ISO date string, e.g. "2025-07-01"
  basement: string | null;
  updatedOn: string | null; // ISO date string, e.g. "2025-06-24"
  bathroomsDetail: string | null;      // e.g. "1, 4pc Main floor"
  waterSupply: string | null;                // e.g. "Municipal"
  heatingType: string | null;       // e.g. "Forced Air"
  coolingType: string | null;       // e.g. "Forced Air"
  roomDetails: RoomDetail[];
  listingHistories: ListingHistory[];
  userId?: number | null;
  realtorId?: number | null;
  
  realtor?: Realtor | null;


  propertyType?: PropertyType;
  propertyCategory?: PropertyCategory;  
  listingType?: ListingType;  
}

export type PropertyStyle =
  | 'Bungalow'
  | '2-Storey'
  | '3-Storey'
  | 'Backsplit'
  | 'Sidesplit'
  | 'Apartment'
  | 'Loft'
  | 'Stacked Townhouse'
  | 'Townhouse'
  | 'Other'; 
export type HeatingType =
  | 'Forced Air'
  | 'Baseboard'
  | 'Radiant'
  | 'Heat Pump'
  | 'Water'
  | 'Other';

  export type CoolingType =
  | 'Forced Air'
  | 'Baseboard'
  | 'Radiant'
  | 'Heat Pump'
  | 'Water'
  | 'Other';



export type WaterSupply =
  | 'Municipal'
  | 'Well'
  | 'Cistern'
  | 'Shared Well'
  | 'Other';



