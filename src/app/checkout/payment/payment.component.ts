import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface PaymentInfo {
  cartId: number;
  addressId: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
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
  
  currentUser: any = null;
  loading = false;
  error: string | null = null;
  processingPayment = false;
  orderCreated = false;
  orderId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService
  ) {
    // Get payment info from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.paymentInfo = {
        cartId: navigation.extras.state['cartId'],
        addressId: navigation.extras.state['addressId'],
        subtotal: navigation.extras.state['subtotal'],
        deliveryFee: navigation.extras.state['deliveryFee'],
        total: navigation.extras.state['total'],
        deliveryCity: navigation.extras.state['deliveryCity']
      };
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
      // Redirect back to cart if no payment info
      this.router.navigate(['/cart']);
      return;
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

    // Step 1: Create the order
    this.createOrder();
  }

  createOrder(): void {
    if (!this.paymentInfo || !this.currentUser) return;

    const orderData = {
      user_id: this.currentUser.user_id,
      address_id: this.paymentInfo.addressId,
      total_amount: this.paymentInfo.total,
      status: 'pending',
      notes: `Payment method: ${this.selectedPaymentMethod}`
    };

    this.apiService.createOrder(orderData).subscribe({
      next: (response) => {
        this.orderId = response.orderId;
        this.orderCreated = true;
        
        // Step 2: Create order items from cart
        this.createOrderItems();
      },
      error: (err) => {
        this.processingPayment = false;
        this.error = 'Failed to create order: ' + (err.error?.message || 'Unknown error');
      }
    });
  }

  createOrderItems(): void {
    if (!this.paymentInfo || !this.orderId) return;

    // Get cart items first
    this.apiService.getCartItemsByCartId(this.paymentInfo.cartId.toString()).subscribe({
      next: (cartItems) => {
        // Create order items for each cart item
        const orderItemPromises = cartItems.map((item: any) => {
          const orderItemData = {
            order_id: this.orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: 0
          };
          return this.apiService.createOrderItem(orderItemData).toPromise();
        });

        Promise.all(orderItemPromises)
          .then(() => {
            // Step 3: Process payment
            this.processPaymentRecord();
          })
          .catch((err) => {
            this.processingPayment = false;
            this.error = 'Failed to create order items';
          });
      },
      error: (err) => {
        this.processingPayment = false;
        this.error = 'Failed to load cart items';
      }
    });
  }

  processPaymentRecord(): void {
    if (!this.orderId || !this.paymentInfo) return;

    let paymentData: any = {
      orderId: this.orderId,
      method: this.selectedPaymentMethod,
      amount: this.paymentInfo.total
    };

    // Add method-specific data
    if (this.selectedPaymentMethod === 'mpesa') {
      paymentData.mpesaPhone = this.paymentForm.value.mpesaPhone;
      paymentData.mpesaCode = 'MPX' + Date.now(); // Simulated code
    } else if (this.selectedPaymentMethod === 'card') {
      paymentData.transactionReference = 'CARD' + Date.now();
    }

    this.apiService.createPayment(paymentData).subscribe({
      next: (response) => {
        // For demo purposes, auto-confirm payment
        if (this.selectedPaymentMethod !== 'cash_on_delivery') {
          this.confirmPaymentRecord(response.payment_id);
        } else {
          this.completeCheckout();
        }
      },
      error: (err) => {
        this.processingPayment = false;
        this.error = 'Payment processing failed: ' + (err.error?.message || 'Unknown error');
      }
    });
  }

  confirmPaymentRecord(paymentId: number): void {
    this.apiService.confirmPayment(paymentId.toString()).subscribe({
      next: () => {
        // Update order status to processing
        if (this.orderId) {
          this.updateOrderStatus();
        }
      },
      error: (err) => {
        this.processingPayment = false;
        this.error = 'Failed to confirm payment';
      }
    });
  }

  updateOrderStatus(): void {
    if (!this.orderId) return;

    this.apiService.updateOrder(this.orderId.toString(), { 
      status: 'processing' 
    }).subscribe({
      next: () => {
        // Update cart status to converted
        if (this.paymentInfo) {
          this.convertCart();
        }
      },
      error: (err) => {
        // Continue even if status update fails
        this.completeCheckout();
      }
    });
  }

  convertCart(): void {
    if (!this.paymentInfo) return;

    this.apiService.updateCart(this.paymentInfo.cartId.toString(), { 
      status: 'converted' 
    }).subscribe({
      next: () => {
        this.completeCheckout();
      },
      error: () => {
        // Continue even if cart update fails
        this.completeCheckout();
      }
    });
  }

  completeCheckout(): void {
    this.processingPayment = false;
    
    // Show success message and redirect
    setTimeout(() => {
      this.router.navigate(['/orders', this.orderId], {
        state: { orderSuccess: true }
      });
    }, 1500);
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
}