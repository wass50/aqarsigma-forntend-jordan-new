import { Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { MapSearchComponent } from './aqar-sigma/map-search/map-search.component';
import { CreateListingComponent } from './aqar-sigma/create-listing/create-listing.component';
import { AuthGuard } from './aqar-sigma/login/AuthGuard';
import { LoginComponent } from './aqar-sigma/login/login.component';
import { CreateUserComponent } from './aqar-sigma/create-user/create-user.component';
import { CreateRealtorComponent } from './aqar-sigma/create-realtor/create-realtor.component';
import { AdminGuard } from './aqar-sigma/login/AdminGuard';
import { RealtorAccountComponent } from './aqar-sigma/realtor-account/realtor-account.component';
import { UserAccountComponent } from './aqar-sigma/user-account/user-account.component';
import { RealtorGuard } from './aqar-sigma/login/RealtorGuard';
import { AdminComponent } from './aqar-sigma/admin/admin.component';
import { HousingAccountComponent } from './aqar-sigma/housing-account/housing-account.component';
import { RealtorsComponent } from './aqar-sigma/realtors/realtors.component';
import { HousingCompanyMapSearchComponent } from './aqar-sigma/housing-company-map-search/housing-company-map-search.component';
import { HousingCompaniesComponent } from './aqar-sigma/housing-companies/housing-companies.component';
import { WatchlistComponent } from './aqar-sigma/watchlist/watchlist.component';

export const routes: Routes = [
  { path: '', component: MapSearchComponent },
  { path: 'Map-Search', component: MapSearchComponent }, // <-- details route
  { path: 'login', component: LoginComponent },
  { path: 'create-user', component: CreateUserComponent },
  { path: 'create-realtor', component: CreateRealtorComponent, canActivate: [AdminGuard] },
  { path: 'realtor-account', component: RealtorAccountComponent, canActivate: [RealtorGuard] },
  { path: 'realtor-account/:id', component: RealtorAccountComponent,canActivate: [RealtorGuard] },
  { path: 'housing-account', component: HousingAccountComponent },
  { path: 'realtors', component: RealtorsComponent },
  { path: 'user-account', component: UserAccountComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'housing-company-map-search', component: HousingCompanyMapSearchComponent },
   { path: 'housing-companies', component: HousingCompaniesComponent }, // <-- Add this line
   { path: 'housing-account/:id', component: HousingAccountComponent }, // <-- Add this line
  { path: 'watchlist', component: WatchlistComponent },
   { path: '**', component: NotFoundComponent }
];
