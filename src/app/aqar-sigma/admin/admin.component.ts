import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../login/AuthService';
import { CreateRealtorComponent } from '../create-realtor/create-realtor.component';
import { Router } from '@angular/router';
import { AdminService } from './AdminService';
import { CreateHousingCompanyComponent } from '../create-housing-company/create-housing-company.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'; // added

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, CreateRealtorComponent, CreateHousingCompanyComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
   readonly API_BASE_URL = environment.apiBaseUrl; // added

  admin: any = null;
  isLoggedIn = false;
  activeTab: string = 'dashboard';
  inactiveUsers: any[] = [];
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(val => {
      this.isLoggedIn = val;
      if (this.isLoggedIn) {
        this.admin = this.adminService.getAdmin();
      } else {
        this.admin = null;
      }
    });

    console.log('Admin info:', this.admin);
    this.loadInactiveUsers();
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onLogout() {
    this.authService.logout();
    this.adminService.clearAdmin();
    this.router.navigate(['/login']);
  }

  loadInactiveUsers() {
    this.loading = true;
    this.http.get<any[]>(`${this.API_BASE_URL}/api/users/inactive`).subscribe({
      next: users => {
        this.inactiveUsers = users;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  activateUser(user: any) {
    const updatedUser = { ...user, status: 'Active' };
    this.http.put(`${this.API_BASE_URL}/api/users/${user.id}`, updatedUser).subscribe({
      next: () => {
        user.status = 'Active';
      }
    });
  }

  inactivateUser(user: any) {
    const updatedUser = { ...user, status: 'Inactive' };
    this.http.put(`${this.API_BASE_URL}/api/users/${user.id}`, updatedUser).subscribe({
      next: () => {
        user.status = 'Inactive';
      }
    });
  }

  removeUser(user: any) {
    this.http.delete(`${this.API_BASE_URL}/api/users/${user.id}`).subscribe({
      next: () => {
        this.inactiveUsers = this.inactiveUsers.filter(u => u.id !== user.id);
      }
    });
  }
}
