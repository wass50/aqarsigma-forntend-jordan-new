import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe, CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment'; // { changed code }
import { LanguageService } from '../LanguageService'; // adjust path if needed


@Component({
  selector: 'app-property-list-view',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './property-list-view.component.html',
  styleUrls: ['./property-list-view.component.css']
})
export class PropertyListViewComponent implements OnInit {
  @Input() properties: any[] = [];
  @Input() type: 'property' | 'community' | 'area' | null = null;
  @Input() districtName?: string;
  @Output() propertySelected = new EventEmitter<any>();
  @Input() districts: any[] = [];
language: 'en' | 'ar' = 'en';
  constructor(private http: HttpClient, private languageService: LanguageService,) {

    this.languageService.language$.subscribe(lang => this.language = lang);
  }

readonly API_BASE_URL = environment.apiBaseUrl; // { changed code }

  ngOnInit() {
    if (!this.properties.length && this.type) {
      // Fetch properties based on type
      this.http.get<any[]>(`${this.API_BASE_URL}/api/properties/by-type?type=${this.type}`)
        .subscribe(props => this.properties = props);
    }
  }

  getPhotoUrl(property: any): string {
    if (property.mainPhotoThumbnail && property.mainPhotoThumbnail.length > 100) {
      return `data:image/jpeg;base64,${property.mainPhotoThumbnail}`;
    }
    if (property.mainPhotoUrl) {
      return property.mainPhotoUrl;
    }
    if (property.photos && property.photos.length > 0) {
      const mainPhoto = property.photos.find((ph: any) => ph.isMain) || property.photos[0];
      if (mainPhoto.imageBlob && typeof mainPhoto.imageBlob === 'string' && mainPhoto.imageBlob.length > 100) {
        return `data:image/jpeg;base64,${mainPhoto.imageBlob}`;
      }
      if (mainPhoto.url) {
        return mainPhoto.url;
      }
    }
    return 'assets/default-property.jpg';
  }

  onPropertyClick(property: any) {
    console.log('Tile clicked:', property); // Add this log for debugging
    this.propertySelected.emit(property);
  }

  getDistrictNames(districtId: number): string {
  const district = this.districts?.find(d => d.id === districtId);
  if (!district) return '';
  return `${district.nameEn || ''} ${district.nameAr || ''}`.trim();
}
}
