export interface PropertyPhoto {
  id: number;
  url: string;
  imageBlob?: File | string | null;
  isMain?: boolean;
}

export interface AppartmentDetail {
 unitNumber: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  features: string;
  floorPlan: File | null;

}





export interface PropertyPrecon {
  lat: number;
  lng: number;
  address: string;
  city?: any;
  district?: any;
  neighborhood?: any;

  cityId: number;
  districtId: number;
  neighborhoodId?: number;

  priceRange?: string;
  apartments: ApartmentPrecon[];
  listingStatus: string;
  listingDate?: string;
  propertyType?: string;
  waterSupply?: string;
  heatingType?: string;
  coolingType?: string;

  description?: string;
  descriptionAr?: string;

  virtualTourUrl?: string;
  yearBuilt?: string;
  features?: string | string[];
  projectName?: string;
  builder?: string;
  completionDate?: string;
  numberOfUnits?: number;
  numberOfFloors?: number;
  areaRange?: string;
  saleStarted?: string;
  bedroomRange?: string;
  bathroomRange?: string;
  masterBedrooms?: string;
  amenities: string[];
}

// Define ApartmentPrecon interface if needed
export interface ApartmentPrecon {
  unitNumber?: string;
  floor?: string;
  bedrooms?: string;
  bathrooms?: string;
  area?: string;
  features?: string | string[];
  floorPlan?: File | null;
  price?: string;
  facade?: string;
}

export interface District {
  id: number;
  nameEn: string;
  nameAr: string;
  cityId: number;
  polygons?: { id: number; coordinateOrder: number; longitude: number; latitude: number }[];
}






