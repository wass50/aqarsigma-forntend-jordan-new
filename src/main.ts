import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app/app.routes';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { importProvidersFrom } from '@angular/core';
bootstrapApplication(AppComponent, {
  providers: [
     importProvidersFrom(NgxSliderModule),
    provideRouter(routes),
    provideHttpClient()
  ]
});
