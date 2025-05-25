import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeAppliancesComponent } from './home-appliances.component';

describe('HomeAppliancesComponent', () => {
  let component: HomeAppliancesComponent;
  let fixture: ComponentFixture<HomeAppliancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeAppliancesComponent]
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
