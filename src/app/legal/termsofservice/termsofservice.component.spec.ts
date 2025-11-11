import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsofserviceComponent } from './termsofservice.component';
import { ActivatedRoute } from '@angular/router';
import { mockActivatedRoute } from '../../test-utils';

describe('TermsofserviceComponent', () => {
  let component: TermsofserviceComponent;
  let fixture: ComponentFixture<TermsofserviceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsofserviceComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute() }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermsofserviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
