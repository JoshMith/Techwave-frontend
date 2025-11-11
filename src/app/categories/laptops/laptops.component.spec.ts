import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaptopsComponent } from './laptops.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('LaptopsComponent', () => {
  let component: LaptopsComponent;
  let fixture: ComponentFixture<LaptopsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaptopsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
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
