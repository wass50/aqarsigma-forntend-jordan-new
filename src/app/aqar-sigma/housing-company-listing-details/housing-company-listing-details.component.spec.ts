import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousingCompanyListingDetailsComponent } from './housing-company-listing-details.component';

describe('HousingCompanyListingDetailsComponent', () => {
  let component: HousingCompanyListingDetailsComponent;
  let fixture: ComponentFixture<HousingCompanyListingDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HousingCompanyListingDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HousingCompanyListingDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
