import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  constructor(private http: HttpClient) {}

  getPreconProperties(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/api/precon-properties');
  }
}