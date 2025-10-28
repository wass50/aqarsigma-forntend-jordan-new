import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormArray, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'; // added
import { RealtorService } from '../realtor-account/RealtorService'; // Adjust the path as needed
import { LanguageService } from '../LanguageService';

@Component({
  selector: 'app-create-listing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-listing.component.html',
  styleUrl: './create-listing.component.css'
})
export class CreateListingComponent implements OnInit {
  readonly API_BASE_URL = environment.apiBaseUrl; // added
  readonly MAX_PHOTOS = environment.listing.maxPhotos; // { changed code }
  readonly MAX_PHOTO_SIZE_MB = environment.listing.maxPhotoSizeMB; // { changed code }
  readonly ALLOWED_PHOTO_TYPES = environment.listing.allowedPhotoTypes; // { changed code }
  readonly DEFAULT_LISTING_STATUS = environment.listing.defaultListingStatus; // { changed code }


  listingForm = new FormGroup({
    lat: new FormControl('', Validators.required),       // <-- Add this
    lng: new FormControl('', Validators.required),       // <-- Add this
    address: new FormControl('', Validators.required),
    cityId: new FormControl('',Validators.required),
    districtId: new FormControl('', Validators.required), // Add this line
    
    neighborhoodId: new FormControl('',Validators.required),

    //city: new FormControl(''),
    district: new FormControl(''), // Add this line
    
    neighborhood: new FormControl(''),
   
    price: new FormControl('', [Validators.required, Validators.min(0)]),
    bedrooms: new FormControl('', Validators.min(0)),
    bathrooms: new FormControl('', Validators.min(0)),
    kitchens: new FormControl('', Validators.min(0)),
    
    rooms: new FormArray([]), // <-- Add this
    roomsCount: new FormControl('', Validators.min(0)), 
   
   
    propertyCategory: new FormControl('', Validators.required), // Add this line
    propertyType: new FormControl(''), // propertyType should NOT be required for Land
    propertyStyle: new FormControl(''),
    listingStatus: new FormControl('Pending', Validators.required),
    listingType: new FormControl('',Validators.required),
    listingDate: new FormControl(''),
    area: new FormControl('', Validators.min(0)),
    landArea: new FormControl('', Validators.min(0)),
    landFrontage: new FormControl(''),
    landDepth: new FormControl(''),
    bathroomsDetail: new FormControl(''), 
    
    
    facade: new FormControl(''),
   
    parking: new FormControl('', Validators.min(0)),
    parkingPlaces: new FormControl('', Validators.min(0)),
    totalParkingSpace: new FormControl('', Validators.min(0)),
    garage: new FormControl('', Validators.min(0)),
    
    waterSupply: new FormControl(''),
    heatingType: new FormControl(''),
    coolingType: new FormControl(''),
    
    floor: new FormControl(''),
   
    description: new FormControl(''),
    descriptionEn: new FormControl(''),
    descriptionAr: new FormControl(''),
    
    
    virtualTourUrl: new FormControl(''),
    yearBuilt: new FormControl(''),
    
    basement: new FormControl(''),
    garageType: new FormControl(''),
    features: new FormControl(''),


    
    
   
    // Add more fields as needed from property-details
   
   
  });


  language: 'en' | 'ar' = 'en';

  get rooms(): FormArray {
    return this.listingForm.get('rooms') as FormArray;
  }

  

  addRoom() {
    this.rooms.push(new FormGroup({
      name: new FormControl('', Validators.required),
      size: new FormControl('', Validators.required),
      level: new FormControl('', Validators.required),
      roomFeature: new FormControl(''),
      measurementSystem: new FormControl('Imperial', Validators.required)
    }));
  }

  removeRoom(index: number) {
    this.rooms.removeAt(index);
  }

 

 
  

  success = false;

  photoFiles: File[] = [];
  photoPreviews: (string | ArrayBuffer | null)[] = [];
  photoBase64: string[] = []; // Add this
  mainPhotoIndex: number = 0;

  submitAttempted = false;

  cities: any[] = [];
  districts: any[] = [];
  neighborhoods: any[] = [];

  districtValidationMessage: string = ''; // <-- Add this line
  districtValidationSuccess: string = '';
  validAddress: boolean = false;


propertyFeaturesList: { value: string, label: string }[] = [];

  amenitiesList: { value: string, label: string }[] = [];
  apartmentFeaturesList: { value: string, label: string }[] = [];
  floorOptions: { value: string, label: string }[] = [];


  constructor(private http: HttpClient, private realtorService: RealtorService, private fb: FormBuilder, private languageService: LanguageService) {

     this.languageService.language$.subscribe(lang => this.language = lang);
  }


  propertyCategories: { id?: number, value: string, labelEn: string, labelAr: string }[] = [];
  listingTypes: { id?: number, value: string, labelEn: string, labelAr: string }[] = [];
  propertyTypes: { id?: number, value: string, labelEn: string, labelAr: string }[] = [];

  private mapLookup = (item: any) => {
    const id = item.id != null ? Number(item.id) : undefined;
    const value = item.value ?? item.id ?? String(item);
    const labelEn = item.labelEn ?? item.nameEn ?? item.label ?? item.value ?? String(value);
    const labelAr = item.labelAr ?? item.nameAr ?? '';
    return { id, value: String(value), labelEn: String(labelEn), labelAr: String(labelAr) };
  };

  ngOnInit(): void {
    this.http.get<any[]>(`${this.API_BASE_URL}/api/cities`).subscribe(data => {
      this.cities = data;
    });

    // load lookup lists
    this.http.get<any[]>(`${this.API_BASE_URL}/api/lookups/property/property-category`)
      .subscribe({ next: d => this.propertyCategories = (d || []).map(this.mapLookup), error: () => this.propertyCategories = [] });

   this.http.get<any[]>(`${this.API_BASE_URL}/api/lookups/property/listing-type`)
      .subscribe({ next: d => this.listingTypes = (d || []).map(this.mapLookup), error: () => this.listingTypes = [] });

    // adjust endpoint if your API uses a different path for property types
    this.http.get<any[]>(`${this.API_BASE_URL}/api/lookups/property/property-type`)
      .subscribe({ next: d => this.propertyTypes = (d || []).map(this.mapLookup), error: () => this.propertyTypes = [] });
  
  const mapOption = (item: any) => {
      const value = item.value ?? item.id ?? String(item);
     const labelEn = item.labelEn ?? item.nameEn ?? item.label ?? item.value ?? '';
     const labelAr = item.labelAr ? ` (${item.labelAr})` : '';
           return { value: String(value), label: `${labelEn}${labelAr}` };
    };

    this.http.get<any[]>(`${this.API_BASE_URL}/api/property-options/category/amenity`)
      .subscribe({
        next: (data) => { this.propertyFeaturesList = (data || []).map(mapOption); },
        error: () => { /* keep empty or fallback if needed */ }
      });

    this.http.get<any[]>(`${this.API_BASE_URL}/api/property-options/category/feature`)
      .subscribe({
        next: (data) => { this.propertyFeaturesList = (data || []).map(mapOption); },
        error: () => { /* keep empty or fallback if needed */ }
      });

    this.http.get<any[]>(`${this.API_BASE_URL}/api/property-options/category/floor`)
      .subscribe({
        next: (data) => { this.floorOptions = (data || []).map(mapOption); },
        error: () => { /* keep empty or fallback if needed */ }
      });
  
  
    }

 // ...existing code...
  onPhotosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      // Limit to configured max photos
      const total = this.photoFiles.length + files.length;
      if (total > this.MAX_PHOTOS) {
        files.splice(this.MAX_PHOTOS - this.photoFiles.length);
      }
      files.forEach(file => {
        this.photoFiles.push(file);
        const reader = new FileReader();
        reader.onload = e => {
          this.photoPreviews.push(reader.result);
          this.photoBase64.push((reader.result as string).split(',')[1]); // Store base64 string only
        };
        reader.readAsDataURL(file);
      });
    }
  }
// ...existing code...
  removePhoto(index: number) {
    this.photoFiles.splice(index, 1);
    this.photoPreviews.splice(index, 1);
    this.photoBase64.splice(index, 1); // Remove base64 string too
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

    let loggedInUserJson = localStorage.getItem('userProfile');
    console.log('User Profile from localStorage:', loggedInUserJson);

if (!loggedInUserJson) {
     loggedInUserJson=localStorage.getItem('user');
     console.log('Realor Profile from localStorage:', loggedInUserJson);
}


  
    this.submitAttempted = true;
    if (this.listingForm.invalid) {
      return;
    }
    if (this.listingForm.valid && this.photoFiles.length <= this.MAX_PHOTOS) { // { changed code }
      const property = this.listingForm.value;

      // Calculate totalParkingSpace for the payload
      const garage = Number(property.garage) || 0;
      const parkingPlaces = Number(property.parkingPlaces) || 0;
      const totalParkingSpace = garage + parkingPlaces;
      const originalPrice = property.price;
      property.listingDate = (() => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
})();

console.log('Listing Date set to:', property.listingDate);

      // Get logged-in user info
     
      let userId = 1;     
      let userRole = '';
      if (loggedInUserJson) {
        try {
          const userObj = JSON.parse(loggedInUserJson);
          userId = userObj.id || userObj.userId || 1;
          userRole = userObj.role || '';
        } catch {}
      }

      // Get realtor info if needed
      let realtorId: number | null = null;
      if (userRole === 'realtor') {
        const realtor = this.realtorService.getRealtor();
        realtorId = Number(realtor?.id) || Number(realtor?.userId) || 1;
      }


      const cityId = property.cityId;
      const districtId= property.districtId;
      const neighborhoodId = property.neighborhoodId;

      const city = this.cities.find(c => c.id === Number(cityId));
      const districtName = this.districts.find(d => d.id === Number(districtId));
      const neighborhood = this.neighborhoods.find(d => d.id === Number(neighborhoodId));

    
      const lat = Number(property.lat);
      const lng = Number(property.lng);

      let validAddress = true; // Default for non-Amman
      if (city.nameEn === 'Amman') {
        const selectedDistrict = this.districts.find(d => d.nameEn === districtName);
        
          console.log('Selected District for validation:', selectedDistrict);
        if (selectedDistrict && lat && lng) {
          // Fetch polygon and validate synchronously
          try {
            const district: any = await this.http.get(`${this.API_BASE_URL}/api/districts/${selectedDistrict.id}/with-polygons`).toPromise();
            validAddress = this.isPointInPolygon(lat, lng, district.polygons);
          } catch {
            validAddress = false;
          }
        } else {
          validAddress = false;
        }
      }

       if (!property.listingDate) {
      property.listingDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }


    for (const file of this.photoFiles) {
        if (file.size > this.MAX_PHOTO_SIZE_MB * 1024 * 1024 || !this.ALLOWED_PHOTO_TYPES.includes(file.type)) {
          // handle invalid photo (set error, return, or skip)
          console.warn('Invalid photo detected', file.name);
          // you may set a user-visible error here and return
        }
      }


      // Build payload based on role
      const payload: any = {
        ...property,
        totalParkingSpace,
        originalPrice,
        userId,
        validAddress,
        photos: this.photoBase64.map((base64, idx) => ({
          url: '',
          imageBlob: base64,
          isMain: idx === this.mainPhotoIndex
        })),
        rooms: property.rooms || []
      };



       const findLookupObject = (list: any[], val: any) => {
        console.log('Finding lookup object for value:', val, 'in list:', list);
       if (!val) return null;
        return (list || []).find(item => String(item.value) === String(val) || String(item.id) === String(val)) || val;
     };

      payload.propertyType = findLookupObject(this.propertyTypes, property.propertyType);
      
      payload.propertyCategory = findLookupObject(this.propertyCategories, property.propertyCategory);
      payload.listingType = findLookupObject(this.listingTypes, property.listingType);
      console.log('Mapped propertyType:', payload.propertyType);
      console.log('Mapped propertyCategory:', payload.propertyCategory);
      console.log('Mapped listingType:', payload.listingType);

      if (userRole === 'realtor') {
        payload.realtor = { id: realtorId };
      }

      console.log('Create Listing Request Payload:', payload);

      this.http.post(`${this.API_BASE_URL}/api/properties`, payload).subscribe({
        next: (res) => {
          this.success = true;
          this.submitAttempted = false;
          this.listingForm.reset({ listingStatus: 'Active', listingType: 'For-Sale' });
          this.photoFiles = [];
          this.photoPreviews = [];
        },
        error: (err) => {
          this.success = false;
          // Handle error (show message, etc.)
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
    // Map form control names to user-friendly labels
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
      // ...add all your form controls here...
    };
    return map[key] || key;
  }

 

  onCityChange() {
    this.districtValidationMessage = '';
    this.districtValidationSuccess = '';
    const selectedCityId = this.listingForm.get('cityId')?.value;
    const cityObj = this.cities.find(c => c.id === Number(selectedCityId));
    if (cityObj) {
      this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/city/${cityObj.id}`).subscribe(data => {
        this.districts = data;
        this.listingForm.get('districtId')?.setValue('');
        this.neighborhoods = [];
        this.listingForm.get('neighborhoodId')?.setValue('');
      });
    } else {
      this.districts = [];
      this.neighborhoods = [];
      this.listingForm.get('districtId')?.setValue('');
      this.listingForm.get('neighborhoodId')?.setValue('');
    }
  }

  onDistrictChange() {
    this.districtValidationMessage = '';
    this.districtValidationSuccess = '';
    const selectedDistrictId = this.listingForm.get('districtId')?.value;
    const selectedDistrict = this.districts.find(d => d.id === Number(selectedDistrictId));
    if (selectedDistrict) {
      this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/${selectedDistrict.id}/neighborhoods`).subscribe(data => {
        this.neighborhoods = data;
        this.listingForm.get('neighborhoodId')?.setValue('');
      });
    } else {
      this.neighborhoods = [];
      this.listingForm.get('neighborhoodId')?.setValue('');
    }
  }

  

  isBedroomsRequired(): boolean {
    const type = this.listingForm.get('propertyType')?.value;
    return type === 'Apartments' || type === 'Villas & Palaces' || type === 'Townhouses';
  }

  isBathroomsRequired(): boolean {
    const type = this.listingForm.get('propertyType')?.value;
    return type === 'Apartments' || type === 'Villas & Palaces' || type === 'Townhouses';
  }

  isKitchensRequired(): boolean {
    const type = this.listingForm.get('propertyType')?.value;
    return type === 'Apartments' || type === 'Villas & Palaces' || type === 'Townhouses';
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
    return inside;
  }

  validateLatLngInDistrict(districtId: number, lat: number, lng: number) {
    this.http.get<any>(`${this.API_BASE_URL}/api/districts/${districtId}/with-polygons`).subscribe(district => {
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

  onLatChange() {
    this.districtValidationMessage = '';
    this.districtValidationSuccess = '';
  }

  onLngChange() {
    this.districtValidationMessage = '';
    this.districtValidationSuccess = '';
  }
}