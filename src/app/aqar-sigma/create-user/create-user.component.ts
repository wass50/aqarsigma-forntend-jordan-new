import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../LanguageService';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css',
})
export class CreateUserComponent {
  username = '';
  password = '';
  email = '';
  phone = '';
  watchList = '';
  notification = '';
  success = false;
  firstName = '';
  lastName = '';
  errorMsg: string = '';
  readonly API_BASE_URL = environment.apiBaseUrl;
  readonly DEFAULT_USER_ROLE = environment.user?.defaultRole ?? 'user';
  readonly DEFAULT_USER_STATUS = environment.user?.defaultStatus ?? 'Pending';  readonly DEFAULT_USER_ACTIVE = environment.user?.defaultActive ?? true;
  
  

  language: 'en' | 'ar' = 'en';

  constructor(private router: Router, private http: HttpClient, private languageService: LanguageService,) {

     this.languageService.language$.subscribe(lang => this.language = lang);
  }

  createUser() {
    const userPayload = {
      firstName: this.firstName,
      lastName: this.lastName,
      username: this.username,
      password: this.password,
      email: this.email,
      phoneNumber: this.phone,
     
      status: this.DEFAULT_USER_STATUS,
      role: this.DEFAULT_USER_ROLE,
     active: this.DEFAULT_USER_ACTIVE
    };

    console.log('Create User Payload:', userPayload);

    this.http.post(`${this.API_BASE_URL}/api/users`, userPayload).subscribe({
      next: () => {
        this.success = true;
        this.errorMsg = '';
        // Show verification message before redirect
        alert(
          this.language === 'ar'
            ? 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.'
            : 'Account created successfully. Please check your email to verify your account.'
        );
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.success = false;
        let errorMsg = this.language === 'ar'
          ? 'تعذر إنشاء المستخدم. يرجى التحقق من البيانات والمحاولة مرة أخرى.'
          : 'Failed to create user. Please check your information and try again.';

        // Log error for debugging
        console.log('User creation error:', err);

        // Show backend error if available
        if (err && err.status === 409) {
          if (typeof err.error === 'string' && err.error.trim().length > 0) {
            errorMsg = err.error;
          } else if (err.error?.message) {
            errorMsg = err.error.message;
          }
        }
        this.errorMsg = errorMsg; // Set error message to show on page
      }
    });
  }
}
