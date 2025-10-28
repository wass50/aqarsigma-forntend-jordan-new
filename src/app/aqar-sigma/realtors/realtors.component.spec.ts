import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealtorsComponent } from './realtors.component';

describe('RealtorsComponent', () => {
  let component: RealtorsComponent;
  let fixture: ComponentFixture<RealtorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealtorsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RealtorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
