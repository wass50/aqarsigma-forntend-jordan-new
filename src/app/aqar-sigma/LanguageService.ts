import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private languageSubject = new BehaviorSubject<'en' | 'ar'>('en');
  language$ = this.languageSubject.asObservable();

  setLanguage(lang: 'en' | 'ar') {
    this.languageSubject.next(lang);
  }

  getLanguage() {
    return this.languageSubject.value;
  }
}