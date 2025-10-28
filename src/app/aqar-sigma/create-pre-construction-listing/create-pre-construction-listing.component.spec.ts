import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePreConstructionListingComponent } from './create-pre-construction-listing.component';

describe('CreatePreConstructionListingComponent', () => {
  let component: CreatePreConstructionListingComponent;
  let fixture: ComponentFixture<CreatePreConstructionListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePreConstructionListingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreatePreConstructionListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
