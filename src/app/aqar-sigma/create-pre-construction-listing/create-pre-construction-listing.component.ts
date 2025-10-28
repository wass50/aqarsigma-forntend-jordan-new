import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormArray, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RealtorService } from '../realtor-account/RealtorService'; // Adjust the path as needed
import { HousingService } from '../housing-account/HousingService';
import { LanguageService } from '../LanguageService';
import { ApartmentPrecon } from '../PropertyPreCon';
import { environment } from '../../../environments/environment'; // { changed code }
@Component({
  selector: 'app-create-pre-construction-listing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-pre-construction-listing.component.html',
  styleUrl: './create-pre-construction-listing.component.css'
})
export class CreatePreConstructionListingComponent implements OnInit, OnDestroy {
 
 readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }
  readonly MAX_PHOTOS = environment.listing?.maxPhotos ?? 10; // { changed code }
  readonly MAX_PHOTO_SIZE_MB = environment.listing?.maxPhotoSizeMB ?? 5; // { changed code }
  readonly ALLOWED_PHOTO_TYPES = environment.listing?.allowedPhotoTypes ?? ['image/png','image/jpeg']; // { changed code }
  readonly DEFAULT_LISTING_STATUS = environment.listing?.defaultListingStatus ?? 'Active'; // { changed code }

 
 
 
  listingForm = new FormGroup({
    lat: new FormControl('', Validators.required),
    lng: new FormControl('', Validators.required),
    address: new FormControl('', Validators.required),
    city: new FormControl(''),
    district: new FormControl(''),
    neighborhood: new FormControl(''),

     cityId: new FormControl('',Validators.required),
     districtId: new FormControl('', Validators.required),
     neighborhoodId: new FormControl(''),


 
    priceRange: new FormControl(''),
    apartments: new FormArray([]),
    listingStatus: new FormControl('Pending', Validators.required),
    listingDate: new FormControl(''),
    propertyType: new FormControl(''),
    waterSupply: new FormControl(''),
    heatingType: new FormControl(''),
    coolingType: new FormControl(''), 
    
   
    description: new FormControl(''),
    descriptionAr: new FormControl(''),
    
    virtualTourUrl: new FormControl(''),
    yearBuilt: new FormControl(''),
    //features: new FormControl(''),
    projectName: new FormControl(''),
    builder: new FormControl(''),
    completionDate: new FormControl(''),
    numberOfUnits: new FormControl(''),
    numberOfFloors: new FormControl(''),
    areaRange: new FormControl(''),
    saleStarted: new FormControl(''),
    bedroomRange: new FormControl(''),
    bathroomRange: new FormControl(''),
    masterBedrooms: new FormControl(''),
    amenities: new FormControl([], Validators.required),
  });


  language: 'en' | 'ar' = 'en';

  validAddress: boolean = false;
  get apartments(): FormArray {
    return this.listingForm.get('apartments') as FormArray;
  }

  public floorPlanPreviews: string[] = [];

  addApartment() {
    this.apartments.push(new FormGroup({
      unitNumber: new FormControl(''),
      floor: new FormControl(''),
      bedrooms: new FormControl(''),
      bathrooms: new FormControl(''),
      area: new FormControl(''),
      features: new FormControl(''),
      floorPlan: new FormControl(null),
      price: new FormControl(''),
      facade: new FormControl('')
    }));
  }

  removeApartment(index: number) {
    this.apartments.removeAt(index);
  }

  onFloorPlanSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Store the file object in the form
      this.apartments.at(index).get('floorPlan')?.setValue(file);

      // For image preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.floorPlanPreviews[index] = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.floorPlanPreviews[index] = '';
      }
    }
  }

  removeFloorPlan(index: number) {
    if (this.floorPlanPreviews[index]) {
      delete this.floorPlanPreviews[index];
    }
    this.apartments.at(index).get('floorPlan')?.setValue(null);
  }

  getFloorPlanPreview(file: File, index: number): string | null {
    console.log('Getting floor plan preview for index:', index, 'file:', file);
    if (!file) return null;

    console.log('File type:', file.type);
    if (file.type.startsWith('image/')) {
      if (!this.floorPlanPreviews[index]) {
        this.floorPlanPreviews[index] = URL.createObjectURL(file);
      }
      return this.floorPlanPreviews[index];
    }
    return null;
  }

  success = false;

  photoFiles: File[] = [];
  photoPreviews: (string | ArrayBuffer | null)[] = [];
  photoBase64: string[] = [];
  mainPhotoIndex: number = 0;

  submitAttempted = false;

  cities: any[] = [];
  districts: any[] = [];
  neighborhoods: any[] = [];

 
  

  amenitiesList: { value: string, label: string }[] = [];
  apartmentFeaturesList: { value: string, label: string }[] = [];
  floorOptions: { value: string, label: string }[] = [];
  constructor(private http: HttpClient, private realtorService: RealtorService, private housingService: HousingService, private fb: FormBuilder, private languageService: LanguageService) {
  
       this.languageService.language$.subscribe(lang => this.language = lang);
    }
  

  ngOnInit(): void {
    this.http.get<any[]>(`${this.API_BASE_URL}/api/cities`).subscribe(data => { // { changed code }
      this.cities = data;
    });



 const mapOption = (item: any) => {
      const value = item.value ?? item.id ?? String(item);
     const labelEn = item.labelEn ?? item.nameEn ?? item.label ?? item.value ?? '';
     const labelAr = item.labelAr ? ` (${item.labelAr})` : '';
           return { value: String(value), label: `${labelEn}${labelAr}` };
    };

    this.http.get<any[]>(`${this.API_BASE_URL}/api/property-options/category/amenity`)
      .subscribe({
        next: (data) => { this.amenitiesList = (data || []).map(mapOption); },
        error: () => { /* keep empty or fallback if needed */ }
      });

    this.http.get<any[]>(`${this.API_BASE_URL}/api/property-options/category/feature`)
      .subscribe({
        next: (data) => { this.apartmentFeaturesList = (data || []).map(mapOption); },
        error: () => { /* keep empty or fallback if needed */ }
      });

    this.http.get<any[]>(`${this.API_BASE_URL}/api/property-options/category/floor`)
      .subscribe({
        next: (data) => { this.floorOptions = (data || []).map(mapOption); },
        error: () => { /* keep empty or fallback if needed */ }
      });





    // Get housing company info if user is housing_company
    const userJson = localStorage.getItem('housingProfile');
    let userRole = '';
    if (userJson) {
      try {
        const userObj = JSON.parse(userJson);
        userRole = userObj.role || '';
      } catch {}
    }

    if (userRole === 'housing_company') {
      const housing = this.housingService.getHousing();
      // If company name is available, set it as builder
      if (housing?.companyName) {
        this.listingForm.get('builder')?.setValue(housing.companyName);
        this.listingForm.get('builder')?.disable(); // Disable editing
      }
    }
  }

  onPhotosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const total = this.photoFiles.length + files.length;
      if (total > 10) {
        files.splice(10 - this.photoFiles.length);
      }
      files.forEach(file => {
        this.photoFiles.push(file);
        const reader = new FileReader();
        reader.onload = e => {
          this.photoPreviews.push(reader.result);
          this.photoBase64.push((reader.result as string).split(',')[1]);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removePhoto(index: number) {
    this.photoFiles.splice(index, 1);
    this.photoPreviews.splice(index, 1);
    this.photoBase64.splice(index, 1);
  }

  isMainPhoto(index: number): boolean {
    return this.mainPhotoIndex === index;
  }

  setMainPhoto(index: number) {
    this.mainPhotoIndex = index;
  }

  async onSubmit() {

    console.log('All localStorage content:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key) {
    console.log(`${key}:`, localStorage.getItem(key));
  }
}
    const userJson = localStorage.getItem('housingProfile');
    console.log('User Profile from localStorage:', userJson);

    
   
    let userId = 1;     
    let userRole = '';
      if (userJson) {
        try {
          const userObj = JSON.parse(userJson);
          console.log('Parsed user object:', userObj);
          userId =  userObj.userId || 1;
          userRole = userObj.role || '';
          console.log('Extracted userId:', userId, 'userRole:', userRole);
        } catch {}
      }


 let housingId: number | null = null;

 console.log('Determining housing ID for role:', userRole);
      if (userRole === 'housing_company') {
        const housing = this.housingService.getHousing();
        housingId = Number(housing?.id) || Number(housing?.userId) || 1;
      }

console.log('User ID:', userId, 'Role:', userRole, 'Housing ID:', housingId);



    this.submitAttempted = true;
   /* if (this.listingForm.invalid) {
      return;
    }*/
    if (this.listingForm.valid && this.photoFiles.length <= 10) {
      // Use getRawValue to include disabled controls like 'builder'
      const property = this.listingForm.getRawValue();
      property.listingDate = new Date().toISOString().slice(0, 10);

     // const housing = this.housingService.getHousing();
     // const housingId = housing?.id || housing?.userId || 1;


  

      // Get realtor info if needed
      let housingId: number | null = null;
      if (userRole === 'housing_company') {
        const housing = this.housingService.getHousing();
        housingId = Number(housing?.id) || Number(housing?.userId) || 1;
      }

console.log('User ID:', userId, 'Role:', userRole, 'Housing ID:', housingId);
    

      const cityId = property.cityId;
      const districtId= property.districtId;
      const neighborhoodId = property.neighborhoodId;


     

     const city = this.cities.find(c => c.id === Number(cityId));
      const districtName = this.districts.find(d => d.id === Number(districtId));
      const lat = Number(property.lat);
      const lng = Number(property.lng);
     let validAddress = true; // Default for non-Amman
     console.log('Validating address for city:', city?.nameEn, 'district:', districtName?.nameEn, 'lat:', lat, 'lng:', lng);
      if (city.nameEn === 'Amman') {
       const selectedDistrict = districtName;
       console.log('Selected District for validation:', selectedDistrict);
        if (selectedDistrict && lat && lng) {
          // Fetch polygon and validate synchronously
          try {
            const district: any = await this.http.get(`${this.API_BASE_URL}/api/districts/${selectedDistrict.id}/with-polygons`).toPromise(); // { changed code }
           console.log('District polygons:', district.polygons);
           
            validAddress = this.isPointInPolygon(lat, lng, district.polygons);
          
          
          
          } catch {
            validAddress = false;
          }
        } else {
          validAddress = false;
        }
      }

   



const apartments: ApartmentPrecon[] = await Promise.all(
  (property.apartments || []).map(async (apartment: ApartmentPrecon) => {
    let featuresArray: string[] = [];
    if (typeof apartment.features === 'string') {
      featuresArray = apartment.features.split(',').map((f: string) => f.trim());
    } else if (Array.isArray(apartment.features)) {
      featuresArray = apartment.features;
    }

    let floorPlanString: string | null = null;
    if (apartment.floorPlan instanceof File) {
      const base64 = await fileToBase64(apartment.floorPlan);
      floorPlanString = base64.split(',')[1]; // Only the Base64 part
    } else if (typeof apartment.floorPlan === 'string') {
      floorPlanString = apartment.floorPlan;
    }

    return {
      ...apartment,
      features: featuresArray,
      floorPlan: floorPlanString
    } as ApartmentPrecon;
  })
);




      const payload: any = {
        ...property,
        
        userId,
        housingId,
        validAddress,
        //propertyType:'Apartment',
        apartments,
        photos: this.photoBase64.map((base64, idx) => ({
          url: '',
          imageBlob: base64,
          isMain: idx === this.mainPhotoIndex
        })),
      };

       

      console.log('Create Listing Request Payload:', payload);

      this.http.post(`${this.API_BASE_URL}/api/precon-properties`, payload).subscribe({ // { changed code }
        next: (res) => {
          this.success = true;
          this.submitAttempted = false;
          this.photoFiles = [];
          this.photoPreviews = [];
        },
        error: (err) => {
          this.success = false;
        }
      });
    }
  }

  listingFormErrors(): string[] {
    const errors: string[] = [];
    Object.keys(this.listingForm.controls).forEach(key => {
      const control = this.listingForm.get(key);
      if (control && control.invalid) {
        errors.push(this.prettyFieldName(key));
      }
    });
    return errors;
  }

  prettyFieldName(key: string): string {
    const map: any = {
      address: 'Address',
      city: 'City',
      province: 'Province',
      postalCode: 'Postal Code',
      neighborhood: 'Neighborhood',
      crossStreet: 'Cross Street',
      yearBuilt: 'Year Built',
      lat: 'Latitude',
      lng: 'Longitude',
      price: 'Price',
      listingStatus: 'Listing Status',
      listingType: 'Listing Type',
      propertyType: 'Property Type',
    };
    return map[key] || key;
  }

  onCityChange() {
    
    const selectedCityId = this.listingForm.get('cityId')?.value;
    const cityObj = this.cities.find(c => c.id === Number(selectedCityId));
    if (cityObj) {
      this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/city/${cityObj.id}`).subscribe(data => { // { changed code }
        this.districts = data;
        //this.listingForm.get('districtId')?.setValue('');
        this.neighborhoods = [];
        //this.listingForm.get('neighborhoodId')?.setValue('');
      });
    } else {
      this.districts = [];
      this.neighborhoods = [];
     // this.listingForm.get('districtId')?.setValue('');
     // this.listingForm.get('neighborhoodId')?.setValue('');
    }
  }

  onDistrictChange() {
   
    const selectedDistrictId = this.listingForm.get('districtId')?.value;
    const selectedDistrict = this.districts.find(d => d.id === Number(selectedDistrictId));
    if (selectedDistrict) {
      this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/${selectedDistrict.id}/neighborhoods`).subscribe(data => { // { changed code }
        this.neighborhoods = data;
       // this.listingForm.get('neighborhoodId')?.setValue('');
      });
    } else {
      this.neighborhoods = [];
     // this.listingForm.get('neighborhoodId')?.setValue('');
    }
  }
  ngOnDestroy() {
    Object.values(this.floorPlanPreviews).forEach(url => URL.revokeObjectURL(url));
  }

  districtValidationMessage: string = '';
districtValidationSuccess: string = '';






  validateLatLngInDistrict(districtId: number, lat: number, lng: number) {
    this.http.get<any>(`${this.API_BASE_URL}/api/districts/${districtId}/with-polygons`).subscribe(district => { // { changed code }
      const isInside = this.isPointInPolygon(lat, lng, district.polygons);
      if (!isInside) {
        this.districtValidationMessage = 'The selected coordinates are not inside the selected district. (الإحداثيات المدخلة ليست ضمن حدود المنطقة المختارة)';
        this.districtValidationSuccess = '';
        this.validAddress = false;
      } else {
        this.districtValidationMessage = '';
        this.districtValidationSuccess = 'The selected coordinates are inside the selected district. (الإحداثيات المدخلة ضمن حدود المنطقة المختارة)';
        this.validAddress = true;
      }
    });
  }


  isPointInPolygon(lat: number, lng: number, polygon: {latitude: number, longitude: number}[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude, yi = polygon[i].latitude;
      const xj = polygon[j].longitude, yj = polygon[j].latitude;
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-10) + xi);
      if (intersect) inside = !inside;
    }

    console.log(`Point (${lat}, ${lng}) is ${inside ? 'inside' : 'outside'} the polygon.`); 
    return inside;
  }





onValidateAddress() {
    const selectedCityId = this.listingForm.get('cityId')?.value;
    const selectedDistrictId = this.listingForm.get('districtId')?.value;
    const lat = Number(this.listingForm.get('lat')?.value);
    const lng = Number(this.listingForm.get('lng')?.value);

    const cityObj = this.cities.find(c => c.id === Number(selectedCityId));
    const districtObj = this.districts.find(d => d.id === Number(selectedDistrictId));

    if (cityObj && cityObj.nameEn === 'Amman' && districtObj && lat && lng) {
      this.validateLatLngInDistrict(districtObj.id, lat, lng);
    } else {
      this.districtValidationMessage = '';
      this.districtValidationSuccess = '';
    }
  }


  

}

async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}
