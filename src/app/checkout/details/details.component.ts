import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface Address {
  id: number;
  user_id: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

interface OrderItem {
  product_id: number;
  product_title: string;
  quantity: number;
  price: number;
  subtotal: number;
  image_url?: string;
}

interface CheckoutData {
  cartId: number;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  couponDiscount: number;
  items: OrderItem[];
}

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})
export class DetailsComponent implements OnInit {
  // Platform check
  isBrowser: boolean;

  // User and authentication
  currentUser: any = null;
  
  // Order data from cart
  orderData: CheckoutData | null = null;
  orderItems: OrderItem[] = [];
  
  // Addresses
  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  isLoadingAddresses = true;
  addressError: string | null = null;
  
  // New address form
  showAddressForm = false;
  newAddress = {
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Kenya',
    is_default: false
  };
  
  // Contact information
  contactInfo = {
    email: '',
    phone: ''
  };
  
  // Delivery options
  deliveryOptions = [
    { id: 'standard', name: 'Standard Delivery', cost: 300, estimate: '3-5 business days' },
    { id: 'express', name: 'Express Delivery', cost: 700, estimate: '1-2 business days' },
    { id: 'same_day', name: 'Same Day Delivery', cost: 1200, estimate: 'Within Nairobi only' }
  ];
  selectedDelivery = 'standard';
  
  // Processing states
  isProcessing = false;
  error = '';
  isLoading = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadCheckoutData();
      this.loadCurrentUser();
    }
  }

  /**
   * Load checkout data from localStorage or navigation state
   */
  loadCheckoutData(): void {
    // Try to get data from navigation state first
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as any;

    if (state) {
      this.processCheckoutData(state);
    } else {
      // Fallback to localStorage
      this.loadCheckoutDataFromStorage();
    }
  }

  /**
   * Process checkout data from any source
   */
  private processCheckoutData(data: any): void {
    this.orderData = {
      cartId: data.cartId,
      total: data.total || 0,
      subtotal: data.subtotal || 0,
      shipping: data.shipping || 0,
      tax: data.tax || 0,
      couponDiscount: data.couponDiscount || 0,
      items: data.items || []
    };
    this.orderItems = this.orderData.items;

    // Also save to localStorage for persistence
    if (this.isBrowser) {
      localStorage.setItem('checkout_data', JSON.stringify(this.orderData));
    }

    console.log('✅ Checkout data loaded:', this.orderData);
  }

  /**
   * Load checkout data from localStorage
   */
  private loadCheckoutDataFromStorage(): void {
    if (!this.isBrowser) return;

    const checkoutData = localStorage.getItem('checkout_data');
    if (!checkoutData) {
      this.showErrorAndRedirect('No order data found. Please add items to your cart first.');
      return;
    }

    try {
      const data = JSON.parse(checkoutData);
      this.processCheckoutData(data);
    } catch (error) {
      console.error('❌ Error parsing checkout data:', error);
      this.showErrorAndRedirect('Invalid order data. Please restart your order.');
    }
  }

  /**
   * Show error and redirect to cart
   */
  private showErrorAndRedirect(message: string): void {
    this.error = message;
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 3000);
  }

  /**
   * Load current user with enhanced error handling
   */
  loadCurrentUser(): void {
    if (!this.isBrowser) return;

    try {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        console.log('ℹ️ No user logged in - proceeding as guest');
        this.setupGuestCheckout();
        return;
      }

      const userData = JSON.parse(storedUser);
      this.currentUser = userData;
      
      // Load user profile and addresses
      this.loadUserProfile(userData.user_id);
      this.loadAddresses();

    } catch (error) {
      console.error('❌ Error loading user data:', error);
      this.setupGuestCheckout();
    }
  }

  /**
   * Load user profile data
   */
  private loadUserProfile(userId: number): void {
    this.apiService.getCurrentUserProfile(userId.toString()).subscribe({
      next: (user) => {
        this.currentUser = { ...this.currentUser, ...user };
        this.contactInfo.email = user.email || '';
        this.contactInfo.phone = user.phone || '';
        console.log('✅ User profile loaded:', user);
      },
      error: (err) => {
        console.error('❌ Error loading user profile:', err);
        // Continue with basic user data
      }
    });
  }

  /**
   * Setup guest checkout
   */
  private setupGuestCheckout(): void {
    this.contactInfo.email = '';
    this.contactInfo.phone = '';
    this.addresses = [];
    this.isLoadingAddresses = false;
  }

  /**
   * Load addresses with error handling
   */
  loadAddresses(): void {
    if (!this.currentUser?.user_id) {
      this.isLoadingAddresses = false;
      return;
    }

    this.isLoadingAddresses = true;
    this.addressError = null;

    this.apiService.getAddresses().subscribe({
      next: (addresses) => {
        console.log('✅ Addresses loaded:', addresses);
        this.addresses = addresses;
        
        // Auto-select default address
        const defaultAddress = addresses.find((addr: Address) => addr.is_default);
        if (defaultAddress) {
          this.selectedAddressId = defaultAddress.id;
        } else if (addresses.length > 0) {
          this.selectedAddressId = addresses[0].id;
        }
        
        this.isLoadingAddresses = false;
      },
      error: (err) => {
        console.error('❌ Error loading addresses:', err);
        this.addressError = 'Failed to load addresses. You can add a new address below.';
        this.isLoadingAddresses = false;
        this.addresses = [];
      }
    });
  }

  /**
   * Toggle address form visibility
   */
  toggleAddressForm(): void {
    this.showAddressForm = !this.showAddressForm;
    if (!this.showAddressForm) {
      this.resetAddressForm();
    }
  }

  /**
   * Reset address form to initial state
   */
  resetAddressForm(): void {
    this.newAddress = {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Kenya',
      is_default: false
    };
  }

  /**
   * Save new address with validation
   */
  saveNewAddress(): void {
    if (!this.validateAddress(this.newAddress)) {
      alert('Please fill in all required fields (Address, City, State, Postal Code)');
      return;
    }

    // For guest users, we'll store the address locally
    if (!this.currentUser?.user_id) {
      this.handleGuestAddress();
      return;
    }

    this.apiService.createAddress(this.newAddress).subscribe({
      next: (address) => {
        console.log('✅ New address saved:', address);
        this.addresses.push(address);
        this.selectedAddressId = address.id;
        this.showAddressForm = false;
        this.resetAddressForm();
        alert('Address added successfully!');
      },
      error: (err) => {
        console.error('❌ Error saving address:', err);
        alert('Failed to save address. Please try again.');
      }
    });
  }

  /**
   * Handle address for guest users
   */
  private handleGuestAddress(): void {
    const guestAddress: Address = {
      id: Date.now(), // Temporary ID
      user_id: 0,
      ...this.newAddress,
      is_default: true
    };

    this.addresses = [guestAddress];
    this.selectedAddressId = guestAddress.id;
    this.showAddressForm = false;
    this.resetAddressForm();
    alert('Delivery address saved!');
  }

  /**
   * Validate address form
   */
  validateAddress(address: any): boolean {
    return !!(
      address.address_line1?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      address.postal_code?.trim()
    );
  }

  /**
   * Select address
   */
  selectAddress(addressId: number): void {
    this.selectedAddressId = addressId;
  }

  /**
   * Get selected delivery option
   */
  get selectedDeliveryOption() {
    return this.deliveryOptions.find(opt => opt.id === this.selectedDelivery) || this.deliveryOptions[0];
  }

  /**
   * Calculate final total with delivery
   */
  get finalTotal(): number {
    if (!this.orderData) return 0;
    return this.orderData.total - this.orderData.shipping + this.selectedDeliveryOption.cost;
  }

  /**
   * Validate form before proceeding
   */
  validateForm(): boolean {
    if (!this.selectedAddressId) {
      alert('Please select a delivery address');
      return false;
    }

    if (!this.contactInfo.email?.trim()) {
      alert('Please provide your email address');
      return false;
    }

    if (!this.contactInfo.phone?.trim()) {
      alert('Please provide your phone number');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.contactInfo.email)) {
      alert('Please enter a valid email address');
      return false;
    }

    // Basic phone validation
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
    if (!phoneRegex.test(this.contactInfo.phone.replace(/\s/g, ''))) {
      alert('Please enter a valid phone number');
      return false;
    }

    return true;
  }

  /**
   * Proceed to payment with comprehensive validation
   */
  proceedToPayment(): void {
    if (!this.validateForm()) {
      return;
    }

    if (!this.orderData) {
      alert('Order data is missing. Please restart your order.');
      this.router.navigate(['/cart']);
      return;
    }

    this.isProcessing = true;
    this.error = '';

    // Prepare order data for payment page
    const paymentData = {
      ...this.orderData,
      selectedAddress: this.selectedAddress,
      contactInfo: this.contactInfo,
      deliveryMethod: this.selectedDelivery,
      deliveryCost: this.selectedDeliveryOption.cost,
      finalTotal: this.finalTotal
    };

    // For guest checkout, we'll create the order during payment
    if (this.currentUser?.user_id) {
      this.createOrderForUser(paymentData);
    } else {
      this.proceedToGuestPayment(paymentData);
    }
  }

  /**
   * Create order for authenticated user
   */
  private createOrderForUser(paymentData: any): void {
    const orderPayload = {
      user_id: this.currentUser.user_id,
      address_id: this.selectedAddressId,
      total_amount: paymentData.finalTotal,
      subtotal: paymentData.subtotal,
      tax_amount: paymentData.tax,
      shipping_cost: paymentData.deliveryCost,
      discount_amount: paymentData.couponDiscount,
      status: 'pending',
      payment_status: 'pending',
      delivery_method: paymentData.deliveryMethod,
      contact_email: paymentData.contactInfo.email,
      contact_phone: paymentData.contactInfo.phone
    };

    this.apiService.createOrder(orderPayload).subscribe({
      next: (order) => {
        console.log('✅ Order created:', order);
        this.createOrderItems(order.id, paymentData);
      },
      error: (err) => {
        console.error('❌ Error creating order:', err);
        this.handleOrderError(err);
      }
    });
  }

  /**
   * Create order items
   */
  private createOrderItems(orderId: number, paymentData: any): void {
    const orderItemPromises = paymentData.items.map((item: OrderItem) => {
      const orderItemPayload = {
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      };
      return this.apiService.createOrderItem(orderItemPayload).toPromise();
    });

    Promise.all(orderItemPromises)
      .then(() => {
        console.log('✅ Order items created');
        this.finalizeOrderCreation(orderId, paymentData);
      })
      .catch(err => {
        console.error('❌ Error creating order items:', err);
        this.handleOrderError(err);
      });
  }

  /**
   * Finalize order creation and proceed to payment
   */
  private finalizeOrderCreation(orderId: number, paymentData: any): void {
    // Clear the cart after successful order creation
    if (paymentData.cartId) {
      this.apiService.clearCart(paymentData.cartId.toString()).subscribe({
        next: () => {
          console.log('✅ Cart cleared');
          this.navigateToPayment(orderId, paymentData);
        },
        error: (err) => {
          console.error('❌ Error clearing cart:', err);
          // Still proceed to payment even if cart clearing fails
          this.navigateToPayment(orderId, paymentData);
        }
      });
    } else {
      this.navigateToPayment(orderId, paymentData);
    }
  }

  /**
   * Proceed to payment for guest users
   */
  private proceedToGuestPayment(paymentData: any): void {
    // For guest users, we'll create the order during payment processing
    const tempOrderId = 'guest_' + Date.now();
    this.navigateToPayment(tempOrderId, paymentData);
  }

  /**
   * Navigate to payment page
   */
  private navigateToPayment(orderId: any, paymentData: any): void {
    // Store order data for payment page
    if (this.isBrowser) {
      localStorage.setItem('current_order_id', orderId.toString());
      localStorage.setItem('payment_data', JSON.stringify(paymentData));
    }

    this.isProcessing = false;
    this.router.navigate(['/checkout/payment'], { 
      state: { 
        orderId,
        paymentData
      }
    });
  }

  /**
   * Handle order creation errors
   */
  private handleOrderError(err: any): void {
    this.isProcessing = false;
    
    if (err.status === 401) {
      this.error = 'Please log in to complete your order.';
      setTimeout(() => {
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: '/checkout/details' } 
        });
      }, 2000);
    } else if (err.status === 400) {
      this.error = 'Invalid order data. Please check your information and try again.';
    } else if (err.status === 0) {
      this.error = 'Network error. Please check your connection and try again.';
    } else {
      this.error = 'Failed to create order. Please try again.';
    }
  }

  /**
   * Go back to cart
   */
  goBack(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Get selected address
   */
  get selectedAddress(): Address | undefined {
    return this.addresses.find(addr => addr.id === this.selectedAddressId);
  }

  /**
   * Format address for display
   */
  formatAddress(address: Address): string {
    const parts = [
      address.address_line1,
      address.address_line2,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(part => part && part.trim());
    
    return parts.join(', ');
  }

  /**
   * Debug method for development
   */
  debugCheckout(): void {
    console.group('🔧 Checkout Debug Info');
    console.log('isBrowser:', this.isBrowser);
    console.log('currentUser:', this.currentUser);
    console.log('orderData:', this.orderData);
    console.log('addresses:', this.addresses);
    console.log('selectedAddressId:', this.selectedAddressId);
    console.log('contactInfo:', this.contactInfo);
    console.log('selectedDelivery:', this.selectedDelivery);
    console.groupEnd();
  }
}