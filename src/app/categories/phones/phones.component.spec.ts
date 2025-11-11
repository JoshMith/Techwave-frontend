import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhonesComponent } from './phones.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('PhonesComponent', () => {
  let component: PhonesComponent;
  let fixture: ComponentFixture<PhonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhonesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
