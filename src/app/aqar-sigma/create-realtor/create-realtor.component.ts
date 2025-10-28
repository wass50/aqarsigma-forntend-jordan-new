import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../LanguageService';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-realtor',
  templateUrl: './create-realtor.component.html',
  styleUrls: ['./create-realtor.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule]
})
export class CreateRealtorComponent implements OnInit {
  realtorForm: FormGroup;
  language: 'en' | 'ar' = 'en';
  photoPreview: string | ArrayBuffer | null = null;
  selectedPhotoFile: File | null = null;

  cities: any[] = [];
  districtsForSelectedCity: any[] = [];
  selectedCityId: number | null = null;
  selectedDistrictIds: number[] = [];
  districts: any[] = [];
  success = false;

  readonly API_BASE_URL = environment.apiBaseUrl;

  constructor(
    private fb: FormBuilder,
    private languageService: LanguageService,
    private http: HttpClient
  ) {
    this.realtorForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      brokerageName: ['', Validators.required],
      brokerageAddress: [''],
      profilePhotoUrl: [''],
      username: ['', Validators.required],
      password: ['', Validators.required],
      bio: [''],
      websiteUrl: [''],
      socialLinks: [''],
      cityId: ['', Validators.required],
      districtIds: [[]],
    });

    this.languageService.language$.subscribe(lang => this.language = lang);
  }

  ngOnInit() {
    this.http.get<any[]>(`${this.API_BASE_URL}/api/cities`).subscribe(data => {
       this.cities = data;
     });
  }

  onCityChange() {
    const selectedCityId = this.realtorForm.get('cityId')?.value;
    const cityObj = this.cities.find(c => c.id === Number(selectedCityId));
    if (cityObj) {
      this.http.get<any[]>(`${this.API_BASE_URL}/api/districts/city/${cityObj.id}`).subscribe(data => {
        this.districts = data;
        this.realtorForm.get('districtIds')?.setValue([]);
      });
    } else {
      this.districts = [];
      this.realtorForm.get('districtIds')?.setValue([]);
    }
  }

  onDistrictChange() {
    if (this.selectedDistrictIds.length > 3) {
      this.selectedDistrictIds = this.selectedDistrictIds.slice(0, 3);
    }
  }

  onSubmit() {
    if (this.realtorForm.valid) {
      const formValue = this.realtorForm.value;

      // Step 1: Create user
      const userPayload = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber,
        username: formValue.username,
        password: formValue.password,
        status: 'Pending',
        role: 'realtor',
        active: true
      };

      this.http.post<any>(`${this.API_BASE_URL}/api/users`, userPayload).subscribe({
        next: (userRes) => {

          console.log('User created:', userRes);
          if (!userRes || !userRes.id) {
            this.success = false;
            alert(
              this.language === 'ar'
                ? 'تعذر إنشاء المستخدم. يرجى التحقق من البيانات والمحاولة مرة أخرى.'
                : 'Failed to create user. Please check your information and try again.'
            );
            return;
          }

          // Step 2: Create realtor with user ID from response
          const realtorPayload = {
            userId: userRes.id,
            licenseNumber: formValue.licenseNumber,
            brokerageName: formValue.brokerageName,
            brokerageAddress: formValue.brokerageAddress,
            profilePhotoUrl: formValue.profilePhotoUrl,
            profilePhoto: this.photoPreview ? (this.photoPreview as string).split(',')[1] : null,
            bio: formValue.bio,
            websiteUrl: formValue.websiteUrl,
            socialLinks: this.formatSocialLinks(formValue.socialLinks ?? ''),
            verificationStatus: 'pending',
            cityId: formValue.cityId,
            districtIds: formValue.districtIds || []
          };

          this.http.post(`${this.API_BASE_URL}/api/realtors`, realtorPayload).subscribe({
            next: () => {
              this.success = true;
              this.realtorForm.reset();
            },
            error: () => {
              this.success = false;
            }
          });
        },
        error: (err) => {
          this.success = false;
          let errorMsg = this.language === 'ar'
            ? 'تعذر إنشاء المستخدم. يرجى التحقق من البيانات والمحاولة مرة أخرى.'
            : 'Failed to create user. Please check your information and try again.';
          // Always log the error for debugging
          console.log('User creation error:', err);

          // Show backend error if available
          if (err && err.status === 409) {
            if (typeof err.error === 'string' && err.error.trim().length > 0) {
              errorMsg = err.error;
            } else if (err.error?.message) {
              errorMsg = err.error.message;
            }
          }
          alert(errorMsg);
        }
      });
    }
  }

  formatSocialLinks(links: string): string {
    // Convert comma-separated links to JSON string if needed
    // Example: "linkedin:https://linkedin.com/in/realtor,twitter:https://twitter.com/realtor"
    if (!links) return '{}';
    try {
      const obj: any = {};
      links.split(',').forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) obj[key] = value;
      });
      return JSON.stringify(obj);
    } catch {
      return '{}';
    }
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedPhotoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = e => this.photoPreview = reader.result;
      reader.readAsDataURL(this.selectedPhotoFile);
      // You can now upload selectedPhotoFile to your backend or cloud storage
    }
  }

  removePhoto(photoInput: HTMLInputElement) {
    this.selectedPhotoFile = null;
    this.photoPreview = null;
    this.realtorForm.patchValue({ profilePhotoUrl: '' });
    photoInput.value = '';
  }
}
