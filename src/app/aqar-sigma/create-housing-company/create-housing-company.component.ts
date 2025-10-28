import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'; // { changed code }
@Component({
  selector: 'app-create-housing-company',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-housing-company.component.html',
  styleUrl: './create-housing-company.component.css'
})
export class CreateHousingCompanyComponent implements OnInit {
  readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }
  readonly DEFAULT_ROLE = environment.housingCompany.defaultUserRole;
  readonly DEFAULT_USER_STATUS = environment.housingCompany.defaultUserStatus;
  readonly DEFAULT_VERIFICATION_STATUS = environment.housingCompany.defaultVerificationStatus;
  readonly MAX_PHOTO_SIZE_MB = environment.housingCompany.maxPhotoSizeMB;
  readonly ALLOWED_PHOTO_TYPES = environment.housingCompany.allowedPhotoTypes;

  companyForm: FormGroup;
  language: 'en' | 'ar' = 'en';

  photoPreview: string | ArrayBuffer | null = null;
  selectedPhotoFile: File | null = null;
  success = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
  ) {
    this.companyForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      companyName: ['', Validators.required],
      companyAddress: [''],
      profilePhotoUrl: [''],
      username: ['', Validators.required],
      password: ['', Validators.required],
      bio: [''],
      websiteUrl: [''],
      socialLinks: [''],
    });
  }

  ngOnInit(): void {
    // If you want to set initial value from service
   // this.language = this.languageService.getLanguage();
  }

  onSubmit() {
    if (this.companyForm.valid) {
      const formValue = this.companyForm.value;

      // Step 1: Create user
      const userPayload = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber,
        username: formValue.username,
        password: formValue.password,
        role: this.DEFAULT_ROLE,                    // { changed code }
        status: this.DEFAULT_USER_STATUS,           // { changed code }
        active: true
      };

      this.http.post<any>(`${this.API_BASE_URL}/api/users`, userPayload).subscribe({
        next: (userRes) => {
          // Step 2: Create housing company with user ID from response
          const housingCompanyPayload = {
            userId: userRes.id,
            licenseNumber: formValue.licenseNumber,
            companyName: formValue.companyName,
            companyAddress: formValue.companyAddress,
            profilePhotoUrl: formValue.profilePhotoUrl,
            profilePhoto: this.photoPreview ? (this.photoPreview as string).split(',')[1] : null,
            bio: formValue.bio,
            websiteUrl: formValue.websiteUrl,
            socialLinks: this.formatSocialLinks(formValue.socialLinks ?? ''),
            verificationStatus: this.DEFAULT_VERIFICATION_STATUS // { changed code }
          };

          this.http.post(`${this.API_BASE_URL}/api/housing-companies`, housingCompanyPayload).subscribe({
            next: () => {
              this.success = true;
              this.companyForm.reset();
            },
            error: () => {
              this.success = false;
            }
          });
        },
        error: () => {
          this.success = false;
        }
      });
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
    this.companyForm.patchValue({ profilePhotoUrl: '' });
    photoInput.value = '';
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

  // optional: validate photo size/type using config
  private isPhotoValid(file: File | null): boolean {
    if (!file) return true;
    const sizeOK = file.size <= this.MAX_PHOTO_SIZE_MB * 1024 * 1024;
    const typeOK = this.ALLOWED_PHOTO_TYPES.includes(file.type);
    return sizeOK && typeOK;
  }
}
