// filepath: /src/app/auth/login.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoginService, LoginResponse } from './LoginService';
import { Router } from '@angular/router';
import { Realtor } from '../Realtor';
import { AuthService } from './AuthService';
import { RealtorService } from '../realtor-account/RealtorService';
import { HousingService } from '../housing-account/HousingService';
import { UserService } from '../user-account/UserService';
import { AdminService } from '../admin/AdminService';
import { environment } from '../../../environments/environment'; // { changed code }
import { LanguageService } from '../LanguageService';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  message: string = '';
  loginSuccess: boolean = false;
  loginError: string | null = null;
  invalidAttempts: number = 0;
  lockUntil: number | null = null;
readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }
readonly LOGIN_ENDPOINT = environment.auth.loginEndpoint;
  readonly REFRESH_ENDPOINT = environment.auth.refreshEndpoint;
  readonly AUTH_STORAGE_KEY = environment.auth.authStorageKey;
  readonly USER_STORAGE_KEY = environment.auth.userStorageKey;
  readonly LOGIN_REDIRECT = environment.auth.loginRedirect;
  readonly SESSION_TIMEOUT_MIN = environment.auth.sessionTimeoutMin;
  readonly MAX_LOGIN_ATTEMPTS = environment.auth.maxLoginAttempts;
  readonly MS_PER_MIN = 60000;
  readonly LOCK_DURATION_MIN = environment.auth.lockDurationMin ?? 30;

language: 'en' | 'ar' = 'en';

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private authService: AuthService,
    private realtorService: RealtorService,
    private housingService: HousingService,
    private userService: UserService,
     private languageService: LanguageService,
    private adminService: AdminService
  ) {
    this.loginForm = this.fb.group({
      username: [''],
      password: ['']
    });
 this.languageService.language$.subscribe(lang => this.language = lang);
    // Load lockUntil from localStorage if exists
    const lock = localStorage.getItem('loginLockUntil');
    if (lock) this.lockUntil = +lock;
  }

  onLogin() {
    // Check if locked
    if (this.lockUntil && Date.now() < this.lockUntil) {
     const mins = Math.ceil((this.lockUntil - Date.now()) / this.MS_PER_MIN);
           this.loginError = `Too many failed attempts. Please try again in ${mins} minute(s).`;
      return;
   }



    this.loginService.login(this.loginForm.value).subscribe({
      next: res => {
        this.message = res.message;
        this.loginSuccess = res.success;

        if (!res.success) {
          
          this.invalidAttempts++;
           if (this.invalidAttempts >= this.MAX_LOGIN_ATTEMPTS) {
           this.lockUntil = Date.now() + this.LOCK_DURATION_MIN * this.MS_PER_MIN;
           localStorage.setItem('loginLockUntil', this.lockUntil.toString());
            this.loginError = `Too many failed attempts. Please try again in ${this.LOCK_DURATION_MIN} minutes.`;
          } else {
            this.loginError = res.message || 'Invalid email or password.';
          }
          return;
        }

        // Reset attempts on successful login
        this.invalidAttempts = 0;
        this.lockUntil = null;
        localStorage.removeItem('loginLockUntil');
        this.loginError = null;

        if (res.user?.status !== 'Active') {
          this.loginError = 'Only users with Active status can log in.'; // Add language support if needed
          return;
        }

        console.log('Login response:', res);

        localStorage.setItem('loginTime', Date.now().toString()); // <-- Add this line
        if (res.user?.role === 'realtor' && res.realtor) {
          // Flatten user fields into realtor object
          console.log('Realtor response:', res.realtor);
          const { user, socialLinks, ...rest } = res.realtor!;
          let parsedSocialLinks: string[] = [];

          if (typeof socialLinks === 'string') {
            try {
              const obj = JSON.parse(socialLinks);
              parsedSocialLinks = Object.values(obj);
            } catch {
              parsedSocialLinks = [];
            }
          } else if (Array.isArray(socialLinks)) {
            parsedSocialLinks = socialLinks;
          }

          const flatRealtor = {
            ...rest,
            ...user,
            id: String(res.realtor!.id),
            userId: res.user.id,
            role: "realtor" as "realtor",
            socialLinks: parsedSocialLinks,
            verificationStatus: 
              (["pending", "verified", "rejected"].includes(rest.verificationStatus)
                ? rest.verificationStatus
                : undefined) as "pending" | "verified" | "rejected" | undefined,
            districts: res.realtor.districts || []
          };

          this.realtorService.setRealtor(flatRealtor);
          this.authService.login('realtor');
          localStorage.setItem('user', JSON.stringify(res.user));
          console.log('Navigating to /realtor-account');
          this.router.navigate(['/realtor-account']);
        }

        if (res.user?.role === 'housing_company' && res.housingCompany) {
          // Treat housing_company as realtor
          console.log('Housing Company response:', res.housingCompany);
          const { user, socialLinks, ...rest } = res.housingCompany!;
          let parsedSocialLinks: string[] = [];

          if (typeof socialLinks === 'string') {
            try {
              const obj = JSON.parse(socialLinks);
              parsedSocialLinks = Object.values(obj);
            } catch {
              parsedSocialLinks = [];
            }
          } else if (Array.isArray(socialLinks)) {
            parsedSocialLinks = socialLinks;
          }

          const flatHousing = {
            ...rest,
            ...user,
            id: String(res.housingCompany!.id),
            userId: res.user.id,
            role: "housing_company" as "housing_company",
            socialLinks: parsedSocialLinks,
            verificationStatus: 
              (["pending", "verified", "rejected"].includes(rest.verificationStatus)
                ? rest.verificationStatus
                : undefined) as "pending" | "verified" | "rejected" | undefined,
                 districts: res.housingCompany.districts|| []
          };

          this.housingService.setHousing(flatHousing);
          this.authService.login('housing_company');
          localStorage.setItem('user', JSON.stringify(res.user));
          console.log('Navigating to /housing-account');
          this.router.navigate(['/housing-account']);
        }

        if (res.user?.role === 'user') {
          this.userService.setUser(res.user);
          this.authService.login('user');
          this.router.navigate(['/user-account']);
        }

        if (res.user?.role === 'admin') {
          this.adminService.setAdmin(res.user);
          this.authService.login('admin');
          this.router.navigate(['/admin']);
        }
      },
      error: err => {
        this.invalidAttempts++;
         if (this.invalidAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          this.lockUntil = Date.now() + this.LOCK_DURATION_MIN * this.MS_PER_MIN;
          localStorage.setItem('loginLockUntil', this.lockUntil.toString());
         this.loginError = `Too many failed attempts. Please try again in ${this.LOCK_DURATION_MIN} minutes.`;
       } else {
          this.loginError = 'Invalid email or password.';
        }
      }
    });
  }

  onSubmit() {

    console.log('Current user:', localStorage.getItem('user'));
   console.log('Current user: Profile', localStorage.getItem('userProfile'));
   console.log('Current realtor: Profile', localStorage.getItem('realtorProfile'));

    this.loginService.login(this.loginForm.value).subscribe((res: LoginResponse) => {
      this.message = res.message;
      this.loginSuccess = res.success;

    console.log('Current user:', localStorage.getItem('user'));
     console.log('Current user: Profile', localStorage.getItem('userProfile'));
     console.log('Current realtor: Profile', localStorage.getItem('realtorProfile'));

      // Optionally store user info or redirect
    });
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  onCreateUser() {
    this.router.navigate(['/create-user']);
  }
}