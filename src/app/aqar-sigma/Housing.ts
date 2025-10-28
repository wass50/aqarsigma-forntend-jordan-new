export interface Housing {
  id: string;
  userId: number; // <-- Changed userId to number
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  role: 'housing_company' | 'admin';
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  licenseNumber?: string;
  companyName?: string;
  companyAddress?: string;
  profilePhotoUrl?: string;
  profilePhoto?: File | string;
  passwordHash?: string;
  bio?: string;
  websiteUrl?: string;
  socialLinks?: string[];
  listings?: string[];
  notificationPreferences?: any;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  lastLogin?: Date;
   districts: District[];
   city?: any;
}


export interface District {
  id: number;
  nameEn: string;
  nameAr: string;
  cityId: number;
  polygons: { lat: number; lng: number }[][]; // array of arrays for multipolygon support
}