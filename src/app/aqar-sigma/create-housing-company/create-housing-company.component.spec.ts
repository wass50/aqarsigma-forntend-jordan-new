import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateHousingCompanyComponent } from './create-housing-company.component';

describe('CreateHousingCompanyComponent', () => {
  let component: CreateHousingCompanyComponent;
  let fixture: ComponentFixture<CreateHousingCompanyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateHousingCompanyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateHousingCompanyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
