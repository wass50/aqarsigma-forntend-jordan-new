import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // { changed code }



export interface LoginRequest {
  username: string;
  password: string;
}

export interface HousingCompany {
  id: number;
  user: {
    id: number;
    username: string;
    password: string | null;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  licenseNumber: string;
  companyName: string;
  companyAddress: string;
  profilePhotoUrl: string;
  bio: string;
  websiteUrl: string;
  socialLinks: string;
  verificationStatus: string;
  properties: any[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    username: string;
    password: string | null;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    status: string;
  } | null;
  realtor?: {
    id: number;
    user: {
      id: number;
      username: string;
      password: string | null;
      role: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
    licenseNumber: string;
    brokerageName: string;
    brokerageAddress: string;
    profilePhotoUrl: string;
    bio: string;
    websiteUrl: string;
    socialLinks: string;
    verificationStatus: string;
    properties: any[];
    districts: any[];
  } | null;
  housingCompany?: {
    id: number;
    user: {
      id: number;
      username: string;
      password: string | null;
      role: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
    licenseNumber: string;
    companyName: string;
    companyAddress: string;
    profilePhotoUrl: string;
    bio: string;
    websiteUrl: string;
    socialLinks: string;
    verificationStatus: string;
    properties: any[];
    districts: any[];
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }

  private apiUrl = `${this.API_BASE_URL}/api/auth/login`;

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, data);
  }
}