import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousingAccountComponent } from './housing-account.component';

describe('HousingAccountComponent', () => {
  let component: HousingAccountComponent;
  let fixture: ComponentFixture<HousingAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HousingAccountComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HousingAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
