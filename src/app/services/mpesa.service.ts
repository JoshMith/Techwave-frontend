// ============================================
// M-PESA SERVICE (Angular)
// ============================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile, of } from 'rxjs';
import { ApiService } from './api.service';

export interface MPesaInitiateResponse {
  success: boolean;
  message: string;
  checkoutRequestID: string;
  merchantRequestID: string;
  customerMessage: string;
}

export interface MPesaStatusResponse {
  status: 'pending' | 'completed' | 'failed';
  resultCode: string;
  resultDesc: string;
  mpesaReceiptNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MpesaService {
  apiUrl: string = ''

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {
    this.apiUrl = this.apiService.apiUrl;
  }


  /**
   * Initiate M-Pesa STK Push
   */
  initiateSTKPush(phoneNumber: string, amount: number, orderId: string): Observable<MPesaInitiateResponse> {
    return this.http.post<MPesaInitiateResponse>(`${this.apiUrl}/mpesa/stkpush`, {
      phoneNumber,
      amount,
      orderId,
      accountReference: 'TechWave'
    });
  }

  /**
   * Query M-Pesa payment status
   */
  queryPaymentStatus(checkoutRequestID: string): Observable<MPesaStatusResponse> {
    return this.http.post<MPesaStatusResponse>(`${this.apiUrl}/mpesa/query`, {
      checkoutRequestID
    });
  }

  /**
   * Poll payment status until completed or timeout
   * Checks every 5 seconds for up to 2 minutes
   */
  pollPaymentStatus(checkoutRequestID: string, maxAttempts: number = 24): Observable<MPesaStatusResponse> {
    let attempts = 0;

    return interval(5000).pipe(
      switchMap(() => {
        attempts++;
        console.log(`🔄 Polling M-Pesa status... Attempt ${attempts}/${maxAttempts}`);
        return this.queryPaymentStatus(checkoutRequestID);
      }),
      takeWhile((response) => {
        // Continue polling if status is pending and haven't exceeded max attempts
        if (attempts >= maxAttempts) {
          console.log('⏰ Max polling attempts reached');
          return false;
        }
        if (response.status === 'pending') {
          console.log('⏳ Payment still pending...');
          return true;
        }
        console.log('✅ Payment status final:', response.status);
        return false;
      }, true) // inclusive: emit the last value even if condition is false
    );
  }

  /**
   * Format phone number for M-Pesa (254XXXXXXXXX)
   */
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('+254')) {
      return cleaned.substring(1);
    } else if (!cleaned.startsWith('254') && cleaned.length === 9) {
      return '254' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate Kenyan phone number
   */
  isValidKenyanPhone(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    // Kenyan numbers: 254 7XX XXX XXX or 254 1XX XXX XXX
    return /^254[71]\d{8}$/.test(formatted);
  }
}