import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousingCompaniesComponent } from './housing-companies.component';

describe('HousingCompaniesComponent', () => {
  let component: HousingCompaniesComponent;
  let fixture: ComponentFixture<HousingCompaniesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HousingCompaniesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HousingCompaniesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
