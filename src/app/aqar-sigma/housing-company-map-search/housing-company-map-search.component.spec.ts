import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousingCompanyMapSearchComponent } from './housing-company-map-search.component';

describe('HousingCompanyMapSearchComponent', () => {
  let component: HousingCompanyMapSearchComponent;
  let fixture: ComponentFixture<HousingCompanyMapSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HousingCompanyMapSearchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HousingCompanyMapSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
