import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private cityCache = new Map<number, any>();
  private districtCache = new Map<number, any>();
  private neighborhoodCache = new Map<number, any>();

  constructor(private http: HttpClient) {}

  async getCity(id: number): Promise<any> {
    if (!id) return null;
    if (this.cityCache.has(id)) return this.cityCache.get(id);
    const res = await lastValueFrom(this.http.get<any>(`${environment.apiBaseUrl}/api/cities/${id}`));
    this.cityCache.set(id, res);
    return res;
  }

  async getDistrict(id: number): Promise<any> {
    if (!id) return null;
    if (this.districtCache.has(id)) return this.districtCache.get(id);
    const res = await lastValueFrom(this.http.get<any>(`${environment.apiBaseUrl}/api/districts/${id}`));
    this.districtCache.set(id, res);
    return res;
  }

  async getNeighborhood(id: number): Promise<any> {
    if (!id) return null;
    if (this.neighborhoodCache.has(id)) return this.neighborhoodCache.get(id);
    const res = await lastValueFrom(this.http.get<any>(`${environment.apiBaseUrl}/api/neighborhoods/${id}`));
    this.neighborhoodCache.set(id, res);
    return res;
  }

  // Populate property.city/district/neighborhood.nameEn/nameAr when only ids exist
  async ensurePropertyNames(property: any): Promise<void> {
    if (!property) return;
    const hasNames = property.city?.nameEn || property.district?.nameEn || property.neighborhood?.nameEn;
    if (hasNames) return;

    const cityId = property.cityId ?? property.city?.id;
    const districtId = property.districtId ?? property.district?.id;
    const neighborhoodId = property.neighborhoodId ?? property.neighborhood?.id;

    const [city, district, neighborhood] = await Promise.all([
      cityId ? this.getCity(Number(cityId)) : Promise.resolve(null),
      districtId ? this.getDistrict(Number(districtId)) : Promise.resolve(null),
      neighborhoodId ? this.getNeighborhood(Number(neighborhoodId)) : Promise.resolve(null)
    ]);

    if (city) { property.city = property.city || {}; property.city.nameEn = city.nameEn; property.city.nameAr = city.nameAr; }
    if (district) { property.district = property.district || {}; property.district.nameEn = district.nameEn; property.district.nameAr = district.nameAr; }
    if (neighborhood) { property.neighborhood = property.neighborhood || {}; property.neighborhood.nameEn = neighborhood.nameEn; property.neighborhood.nameAr = neighborhood.nameAr; }
  }
}