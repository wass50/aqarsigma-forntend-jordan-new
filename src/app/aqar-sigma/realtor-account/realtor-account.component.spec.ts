import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealtorAccountComponent } from './realtor-account.component';

describe('RealtorAccountComponent', () => {
  let component: RealtorAccountComponent;
  let fixture: ComponentFixture<RealtorAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealtorAccountComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RealtorAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
