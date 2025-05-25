import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaptopsComponent } from './laptops.component';

describe('LaptopsComponent', () => {
  let component: LaptopsComponent;
  let fixture: ComponentFixture<LaptopsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaptopsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaptopsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
