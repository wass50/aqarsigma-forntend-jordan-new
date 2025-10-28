import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Realtor } from '../Realtor';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Add this import
import { HousingCompany } from '../login/LoginService';
import { Housing } from '../Housing';
import { environment } from '../../../environments/environment'; // { changed code }



@Component({
  selector: 'app-housing-companies',
  standalone: true,
   imports: [CommonModule, FormsModule], 
  templateUrl: './housing-companies.component.html',
  styleUrl: './housing-companies.component.css'
})
export class HousingCompaniesComponent implements OnInit {
  housings: Housing[] = [];
  @Output() housingSelected = new EventEmitter<Housing>();
readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }

  cities: any[] = [];
  districts: any[] = [];
  private _selectedCityId: number | null = null;
  get selectedCityId(): number | null {
    return this._selectedCityId;
  }
  set selectedCityId(value: number | null) {
    this._selectedCityId = value;
    this.selectedDistrictId = null;

    // Update districts for the selected city
    const districtsSet = new Map<number, any>();
    if (value === null) {
      this.housings.forEach(r => (r.districts || []).forEach((d: any) => districtsSet.set(d.id, d)));
    } else {
      this.housings
        .filter(r => r.city && r.city.id === value)
        .forEach(r => (r.districts || []).forEach((d: any) => districtsSet.set(d.id, d)));
    }
    this.districts = Array.from(districtsSet.values());

    // Filter realtors by city (and all districts)
    this.onDistrictChange(null);
  }
  selectedDistrictId: number | null = null;
  filteredHousings: Housing[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${this.API_BASE_URL}/api/housing-companies/noProperties`).subscribe(res => {
      this.housings = res.map(r => ({
        ...r,
        ...r.user,
        id: r.id,         // <-- ensure realtor.id is preserved!
        userId: r.user.id // <-- keep userId for reference
      }));

      // Extract unique cities
      this.cities = this.housings
        .map(r => r.city)
        .filter((city, i, arr) => city && arr.findIndex(c => c.id === city.id) === i);

      this.filteredHousings = [...this.housings];
    });
  }

  getProfilePhotoSrc(photo: any): string | undefined {
    if (!photo) return undefined;
    if (typeof photo === 'string' && photo.length > 100) {
      return `data:image/jpeg;base64,${photo}`;
    }
    return photo;
  }

  selectHousing(housing: Housing) {
    this.housingSelected.emit(housing);
  }

  goToHousingAccount(housing: Housing) {
    this.router.navigate(['/housing-account', housing.id], { queryParams: { view: 'true' } });
  }

  onCityChange(cityId: number | null) {
    this.selectedCityId = cityId;
  }

  onDistrictChange(districtId: number | null) {
    this.selectedDistrictId = districtId;
    this.filteredHousings = this.housings.filter(r => {
      const cityMatch = this.selectedCityId === null || (r.city && r.city.id === this.selectedCityId);
      const districtMatch = districtId === null || (r.districts || []).some((d: any) => d.id === districtId);
      return cityMatch && districtMatch;
    });
  }
}
