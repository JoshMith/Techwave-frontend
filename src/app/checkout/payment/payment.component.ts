import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { forkJoin } from 'rxjs';

interface PaymentInfo {
  cartId: number;
  addressId: number;
  subtotal: number;
  deliveryCost: number;
  finalTotal: number;
  deliveryCity: string;
}

@Component({
  selector: 'app-payment',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  paymentInfo: PaymentInfo | null = null;
  selectedPaymentMethod: 'mpesa' | 'card' | 'cash_on_delivery' | null = null;

  isBrowser: boolean;
  currentUser: any = null;
  loading = false;
  error: string | null = null;
  processingPayment = false;
  orderCreated = false;
  orderId: number | null = null;

  // Add new state tracking variables
  currentStep: 'creating_order' | 'creating_items' | 'processing_payment' | 'completed' = 'creating_order';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Get payment info from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.paymentInfo = {
        cartId: navigation.extras.state['cartId'],
        addressId: navigation.extras.state['addressId'],
        subtotal: navigation.extras.state['subtotal'],
        deliveryCost: navigation.extras.state['deliveryCost'],
        finalTotal: navigation.extras.state['finalTotal'],
        deliveryCity: navigation.extras.state['deliveryCity']
      };
      console.log('📦 Payment info received:', this.paymentInfo);
    }

    this.paymentForm = this.fb.group({
      mpesaPhone: ['', [Validators.pattern(/^\+254[0-9]{9}$/)]],
      cardNumber: ['', [Validators.pattern(/^[0-9]{16}$/)]],
      cardName: [''],
      cardExpiry: ['', [Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)]],
      cardCvv: ['', [Validators.pattern(/^[0-9]{3,4}$/)]]
    });
  }

  ngOnInit(): void {
    if (!this.paymentInfo) {
      console.error('❌ No payment info found');
      // Try to get from localStorage as fallback
      const storedPaymentData = localStorage.getItem('payment_data');
      if (storedPaymentData) {
        try {
          const data = JSON.parse(storedPaymentData);
          this.paymentInfo = {
            cartId: data.cartId,
            addressId: data.addressId,
            subtotal: data.subtotal,
            deliveryCost: data.deliveryCost,
            finalTotal: data.finalTotal,
            deliveryCity: data.deliveryCity
          };
          console.log('✅ Loaded payment info from localStorage:', this.paymentInfo);
        } catch (e) {
          console.error('❌ Error parsing stored payment data:', e);
        }
      }

      if (!this.paymentInfo) {
        this.router.navigate(['/cart']);
        return;
      }
    }
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }
    const userId = JSON.parse(userStr).user_id;
    this.apiService.getCurrentUserProfile(userId).subscribe({
      next: (user) => {
        this.currentUser = user;
        // Pre-fill phone number for M-Pesa
        if (user.phone) {
          this.paymentForm.patchValue({ mpesaPhone: user.phone });
        }
      },
      error: (err) => {
        this.router.navigate(['/login']);
      }
    });
  }

  selectPaymentMethod(method: 'mpesa' | 'card' | 'cash_on_delivery'): void {
    this.selectedPaymentMethod = method;
    this.error = null;

    // Update validators based on payment method
    this.clearValidators();

    if (method === 'mpesa') {
      this.paymentForm.get('mpesaPhone')?.setValidators([
        Validators.required,
        Validators.pattern(/^\+254[0-9]{9}$/)
      ]);
    } else if (method === 'card') {
      this.paymentForm.get('cardNumber')?.setValidators([
        Validators.required,
        Validators.pattern(/^[0-9]{16}$/)
      ]);
      this.paymentForm.get('cardName')?.setValidators([Validators.required]);
      this.paymentForm.get('cardExpiry')?.setValidators([
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)
      ]);
      this.paymentForm.get('cardCvv')?.setValidators([
        Validators.required,
        Validators.pattern(/^[0-9]{3,4}$/)
      ]);
    }

    this.paymentForm.updateValueAndValidity();
  }

  clearValidators(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      this.paymentForm.get(key)?.clearValidators();
      this.paymentForm.get(key)?.updateValueAndValidity();
    });
  }

  processPayment(): void {
    if (!this.selectedPaymentMethod) {
      this.error = 'Please select a payment method';
      return;
    }

    if (!this.paymentInfo) {
      this.error = 'Payment information missing';
      return;
    }

    // Validate form for non-COD methods
    if (this.selectedPaymentMethod !== 'cash_on_delivery') {
      if (this.paymentForm.invalid) {
        Object.keys(this.paymentForm.controls).forEach(key => {
          this.paymentForm.get(key)?.markAsTouched();
        });
        return;
      }
    }

    this.processingPayment = true;
    this.error = null;
    this.currentStep = 'creating_order';

    // Step 1: Create the order
    this.createOrder();
  }

  createOrder(): void {
    if (!this.paymentInfo || !this.currentUser) {
      this.handleError('Missing payment info or user data');
      return;
    }

    console.log('🔄 Creating order...');
    this.currentStep = 'creating_order';

    const orderData = {
      user_id: this.currentUser.user_id,
      address_id: this.paymentInfo.addressId,
      total_amount: this.paymentInfo.finalTotal,
      status: 'pending',
      notes: `Payment method: ${this.selectedPaymentMethod}`
    };

    console.log('📦 Sending order data:', orderData);

    this.apiService.createOrder(orderData).subscribe({
      next: (response) => {
        console.log('✅ Order created:', response);
        this.orderId = response.order.order_id;

        // Step 2: Create order items from cart
        this.currentStep = 'creating_items';
        this.createOrderItems();
      },
      error: (err) => {
        this.handleError('Failed to create order: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  createOrderItems(): void {
    if (!this.paymentInfo || !this.orderId) {
      this.handleError('Missing payment info or order ID');
      return;
    }

    console.log('🔄 Creating order items...');

    // Get cart items first
    this.apiService.getCartItemsByCartId(this.paymentInfo.cartId.toString()).subscribe({
      next: (cartItems) => {
        console.log('📦 Cart items loaded:', cartItems);

        // Create order items for each cart item
        const orderItemRequests = cartItems.map((item: any) => {
          const orderItemData = {
            order_id: this.orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount || 0
          };
          return this.apiService.createOrderItem(orderItemData);
        });

        // Use forkJoin for all order item requests
        forkJoin(orderItemRequests).subscribe({
          next: (results) => {
            console.log('✅ Order items created:', results);

            // Step 3: Process payment
            this.currentStep = 'processing_payment';
            this.processPaymentRecord();
          },
          error: (err) => {
            this.handleError('Failed to create order items: ' + (err.error?.message || 'Unknown error'));
          }
        });
      },
      error: (err) => {
        this.handleError('Failed to load cart items: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  processPaymentRecord(): void {
    if (!this.orderId || !this.paymentInfo) {
      this.handleError('Missing order ID or payment info');
      return;
    }

    console.log('🔄 Processing payment...');

    let paymentData: any = {
      orderId: this.orderId,
      method: this.selectedPaymentMethod,
      amount: this.paymentInfo.finalTotal
    };

    // Add method-specific data
    if (this.selectedPaymentMethod === 'mpesa') {
      paymentData.mpesaPhone = this.paymentForm.value.mpesaPhone;
      paymentData.mpesaCode = 'MPX' + Date.now();
    } else if (this.selectedPaymentMethod === 'card') {
      paymentData.transactionReference = 'CARD' + Date.now();
    }

    this.apiService.createPayment(paymentData).subscribe({
      next: (response) => {
        console.log('✅ Payment created:', response);

        // For demo purposes, auto-confirm payment
        if (this.selectedPaymentMethod !== 'cash_on_delivery') {
          this.confirmPaymentRecord(response.payment_id);
        } else {
          this.finalizeOrder();
        }
      },
      error: (err) => {
        this.handleError('Payment processing failed: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  confirmPaymentRecord(paymentId: number): void {
    console.log('🔄 Confirming payment...');

    this.apiService.confirmPayment(paymentId.toString()).subscribe({
      next: () => {
        console.log('✅ Payment confirmed');

        // Update order status to processing
        if (this.orderId) {
          this.updateOrderStatus();
        } else {
          this.finalizeOrder();
        }
      },
      error: (err) => {
        console.warn('⚠️ Payment confirmation failed, continuing with order...');
        // Continue even if confirmation fails
        this.finalizeOrder();
      }
    });
  }

  updateOrderStatus(): void {
    if (!this.orderId) {
      this.finalizeOrder();
      return;
    }

    console.log('🔄 Updating order status...');

    this.apiService.updateOrder(this.orderId.toString(), {
      status: 'processing'
    }).subscribe({
      next: () => {
        console.log('✅ Order status updated');
        this.finalizeOrder();
      },
      error: (err) => {
        console.warn('⚠️ Order status update failed, continuing...');
        this.finalizeOrder();
      }
    });
  }

  finalizeOrder(): void {
    console.log('✅ Finalizing order...');

    // Mark order as created and completed
    this.orderCreated = true;
    this.currentStep = 'completed';

    // Complete the checkout process
    this.completeCheckout();
  }

  completeCheckout(): void {
    console.log('🎉 Checkout completed!');

    // Short delay to show success state
    setTimeout(() => {
      this.processingPayment = false;
      this.router.navigate(['/orders', this.orderId], {
        state: { orderSuccess: true }
      });
    }, 2000);
  }

  private handleError(message: string): void {
    console.error('❌ Error:', message);
    this.error = message;
    this.processingPayment = false;
    this.currentStep = 'creating_order';
  }

  goBack(): void {
    this.router.navigate(['/checkout/details']);
  }

  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    this.paymentForm.patchValue({ cardNumber: formattedValue.replace(/\s/g, '') });
    event.target.value = formattedValue;
  }

  formatExpiry(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    event.target.value = value;
    this.paymentForm.patchValue({ cardExpiry: value });
  }

  // Helper method for template to check current step
  isStepActive(step: string): boolean {
    return this.currentStep === step;
  }

  // Helper method for template to check if step is completed
  isStepCompleted(step: string): boolean {
    const steps = ['creating_order', 'creating_items', 'processing_payment', 'completed'];
    const currentIndex = steps.indexOf(this.currentStep);
    const stepIndex = steps.indexOf(step);
    return currentIndex > stepIndex;
  }

}