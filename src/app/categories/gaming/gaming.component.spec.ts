import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamingComponent } from './gaming.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('GamingComponent', () => {
  let component: GamingComponent;
  let fixture: ComponentFixture<GamingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
