import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapService {
  private centerSubject = new BehaviorSubject<[number, number] | null>(null);
  center$ = this.centerSubject.asObservable();

  setMapCenter(center: [number, number]) {
    this.centerSubject.next(center);
  }
}