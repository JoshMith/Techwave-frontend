import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessoriesComponent } from './accessories.component';
import { HttpClientTestingModule, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('AccessoriesComponent', () => {
  let component: AccessoriesComponent;
  let fixture: ComponentFixture<AccessoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessoriesComponent, HttpClientTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccessoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
