import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Realtor } from '../Realtor';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Add this import
import { environment } from '../../../environments/environment'; // { changed code }
import { LanguageService } from '../LanguageService';


@Component({
  selector: 'app-realtors',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- Add FormsModule here
  templateUrl: './realtors.component.html',
  styleUrls: ['./realtors.component.css']
})
export class RealtorsComponent implements OnInit {
  realtors: Realtor[] = [];
  @Output() realtorSelected = new EventEmitter<Realtor>();
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
      this.realtors.forEach(r => (r.districts || []).forEach((d: any) => districtsSet.set(d.id, d)));
    } else {
      this.realtors
        .filter(r => r.city && r.city.id === value)
        .forEach(r => (r.districts || []).forEach((d: any) => districtsSet.set(d.id, d)));
    }
    this.districts = Array.from(districtsSet.values());

    // Filter realtors by city (and all districts)
    this.onDistrictChange(null);
  }
  selectedDistrictId: number | null = null;
  filteredRealtors: Realtor[] = [];

  // current UI language: 'en' | 'ar'
  language$ = this.languageService.language$;

  constructor(
    private languageService: LanguageService,
    private http: HttpClient,
    private router: Router) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${this.API_BASE_URL}/api/realtors`).subscribe(res => {
      this.realtors = res.map(r => ({
        ...r,
        ...r.user,
        id: r.id,         // <-- ensure realtor.id is preserved!
        userId: r.user.id // <-- keep userId for reference
      }));

      // Extract unique cities
      this.cities = this.realtors
        .map(r => r.city)
        .filter((city, i, arr) => city && arr.findIndex(c => c.id === city.id) === i);

      this.filteredRealtors = [...this.realtors];
    });
  }

  getProfilePhotoSrc(photo: any): string | undefined {
    if (!photo) return undefined;
    if (typeof photo === 'string' && photo.length > 100) {
      return `data:image/jpeg;base64,${photo}`;
    }
    return photo;
  }

  selectRealtor(realtor: Realtor) {
    this.realtorSelected.emit(realtor);
  }

  goToRealtorAccount(realtor: Realtor) {
    this.router.navigate(['/realtor-account', realtor.id], { queryParams: { view: 'true' } });
  }

  onCityChange(cityId: number | null) {
    this.selectedCityId = cityId;
  }

  onDistrictChange(districtId: number | null) {
    this.selectedDistrictId = districtId;
    this.filteredRealtors = this.realtors.filter(r => {
      const cityMatch = this.selectedCityId === null || (r.city && r.city.id === this.selectedCityId);
      const districtMatch = districtId === null || (r.districts || []).some((d: any) => d.id === districtId);
      return cityMatch && districtMatch;
    });
  }
}
