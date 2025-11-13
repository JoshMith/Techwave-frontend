import { TestBed } from '@angular/core/testing';

import { MpesaService } from './mpesa.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('MpesaService', () => {
  let service: MpesaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(MpesaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
