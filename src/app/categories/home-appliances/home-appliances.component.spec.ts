import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeAppliancesComponent } from './home-appliances.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { mockActivatedRoute } from '../../test-utils';

describe('HomeAppliancesComponent', () => {
  let component: HomeAppliancesComponent;
  let fixture: ComponentFixture<HomeAppliancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeAppliancesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute() }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeAppliancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
