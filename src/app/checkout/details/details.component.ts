import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface Address {
  address_id: number;
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
  unit_price: number;
  subtotal: number;
  image_url?: string;
  current_sale_price?: number;
}

interface CheckoutData {
  cartId: number;
  addressId: number;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  couponDiscount: number;
  items: OrderItem[];
  isGuest: boolean;
}

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})
export class DetailsComponent implements OnInit {
  isBrowser: boolean;
  currentUser: any = null;
  isGuest: boolean = true;

  // Order data from cart
  orderData: CheckoutData | null = null;
  orderItems: OrderItem[] = [];

  // Addresses
  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  isLoadingAddresses = false;
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
      // console.log('🔄 DetailsComponent initialized - starting user load');
      this.loadCurrentUser();
    }
  }

  /**
   * Load current user - MAIN ENTRY POINT
   */
  loadCurrentUser(): void {
    if (!this.isBrowser) return;

    try {
      const storedUser = this.apiService.getCurrentUser().subscribe(user => {
        if (!storedUser) {
          console.log('ℹ️ No user logged in - guest checkout');
          this.setupGuestCheckout();
          // For guest, load checkout data immediately
          this.loadCheckoutData();
          return;
        }

        this.currentUser = user;
        this.isGuest = false;

        // console.log('✅ User loaded, loading profile and addresses...');

        // Load user profile and addresses FIRST, then checkout data
        this.loadUserProfileAndAddresses(user.user.user_id);
      });
      } catch (error) {
        console.error('❌ Error loading user data:', error);
        this.setupGuestCheckout();
        this.loadCheckoutData();
      }
    }

  /**
   * Load user profile and addresses, then checkout data
   */
  private loadUserProfileAndAddresses(userId: number): void {
    this.apiService.getCurrentUserProfile(userId.toString()).subscribe({
      next: (user) => {
        this.currentUser = { ...this.currentUser, ...user };
        this.contactInfo.email = user.email || '';
        this.contactInfo.phone = user.phone || '';
        // console.log('✅ User profile loaded, now loading addresses...');

        // Now load addresses, then checkout data
        this.loadAddresses(() => {
          console.log('✅ Addresses loaded, now loading checkout data...');
          this.loadCheckoutData();
        });
      },
      error: (err) => {
        console.error('❌ Error loading user profile:', err);
        // Still try to load addresses
        this.loadAddresses(() => {
          this.loadCheckoutData();
        });
      }
    });
  }

  /**
   * Load addresses with callback - FIXED to ensure completion
   */
  loadAddresses(callback?: () => void): void {
    if (!this.currentUser?.user_id || this.isGuest) {
      console.log('ℹ️ No addresses to load (guest or no user)');
      this.isLoadingAddresses = false;
      callback?.();
      return;
    }

    this.isLoadingAddresses = true;
    this.addressError = null;

    // console.log('🔄 Loading addresses for user:', this.currentUser.user_id);

    this.apiService.getAddressByUserId(this.currentUser.user_id.toString()).subscribe({
      next: (res: any) => {
        const addresses: Address[] = Array.isArray(res)
          ? res
          : (res?.addresses || res?.data || []);

        // console.log('✅ Addresses loaded:', addresses);
        this.addresses = addresses;

        // Auto-select default address
        const defaultAddress = addresses.find((addr: Address) => addr.is_default);
        if (defaultAddress) {
          this.selectedAddressId = defaultAddress.address_id;
          // console.log('✅ Auto-selected default address:', this.selectedAddressId);
        } else if (addresses.length > 0) {
          this.selectedAddressId = addresses[0].address_id;
          // console.log('✅ Auto-selected first address:', this.selectedAddressId);
        } else {
          console.log('ℹ️ No addresses found, showing address form');
          this.showAddressForm = true;
        }

        this.isLoadingAddresses = false;
        callback?.();
      },
      error: (err) => {
        console.error('❌ Error loading addresses:', err);
        this.addressError = 'Failed to load addresses. You can add a new address below.';
        this.isLoadingAddresses = false;
        this.addresses = [];
        this.showAddressForm = true;
        callback?.();
      }
    });
  }

  /**
   * Load checkout data from navigation state or localStorage
   */
  loadCheckoutData(): void {
    // console.log('🔄 Loading checkout data...');
    // console.log('📌 Current selectedAddressId:', this.selectedAddressId);

    // Try navigation state first
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as any;

    if (state && state.cartId) {
      this.processCheckoutData(state);
      return;
    }

    // Fallback to localStorage
    this.loadCheckoutDataFromStorage();
  }

  /**
   * Process checkout data - FIXED to use current selectedAddressId
   */
  private processCheckoutData(data: any): void {
    // console.log('🔄 Processing checkout data...');
    // console.log('📌 Using selectedAddressId:', this.selectedAddressId);

    // Normalize items and compute subtotals
    const items: OrderItem[] = (data.items || []).map((it: any) => {
      const qty = Number(it.quantity ?? 1);
      const price = Number(it.current_sale_price ?? it.unit_price ?? 0);
      const computedSubtotal = Number(it.subtotal ?? price * qty);
      return {
        product_id: Number(it.product_id ?? 0),
        product_title: String(it.product_title ?? it.title ?? ''),
        quantity: qty,
        unit_price: price,
        subtotal: computedSubtotal,
        image_url: it.image_url,
        current_sale_price: it.current_sale_price
      } as OrderItem;
    });

    // Sum values
    const subtotal = items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);
    const shipping = Number(this.selectedDeliveryOption?.cost ?? data.shipping ?? 0);
    const tax = Number(data.tax ?? 0);
    const couponDiscount = Number(data.couponDiscount ?? 0);

    const total = subtotal + shipping + tax - couponDiscount;

    // CRITICAL FIX: Use the CURRENT selectedAddressId, don't default to 0
    const addressId = this.selectedAddressId ? Number(this.selectedAddressId) : 0;

    this.orderData = {
      cartId: Number(data.cartId ?? data.cart_id ?? 0),
      addressId: addressId,
      total,
      subtotal,
      shipping,
      tax,
      couponDiscount,
      items,
      isGuest: data.isGuest !== undefined ? !!data.isGuest : true
    };

    this.orderItems = this.orderData.items;
    this.isGuest = this.orderData.isGuest;

    // Save to localStorage for persistence
    if (this.isBrowser) {
      localStorage.setItem('checkout_data', JSON.stringify(this.orderData));
    }

    // console.log('✅ Checkout data loaded with addressId:', this.orderData.addressId);
    // console.log('✅ Full orderData:', this.orderData);
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
   * Show error and redirect
   */
  private showErrorAndRedirect(message: string): void {
    this.error = message;
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 3000);
  }

  /**
   * Setup guest checkout
   */
  private setupGuestCheckout(): void {
    this.isGuest = true;
    this.contactInfo.email = '';
    this.contactInfo.phone = '';
    this.addresses = [];
    this.isLoadingAddresses = false;
    this.showAddressForm = true;
  }

  /**
   * Save new address - FIXED to update orderData
   */
  saveNewAddress(): void {
    if (!this.validateAddress(this.newAddress)) {
      alert('Please fill in all required fields (Address, City, State, Postal Code)');
      return;
    }

    // For guest users, store address locally
    if (this.isGuest || !this.currentUser?.user_id) {
      this.handleGuestAddress();
      return;
    }

    // For authenticated users, save to database
    this.apiService.createAddress({
      city: this.newAddress.city,
      street: this.newAddress.address_line1,
      building: this.newAddress.address_line2,
      postal_code: this.newAddress.postal_code,
      is_default: this.newAddress.is_default
    }).subscribe({
      next: (res: any) => {
        const newId = res?.address_id;
        if (!newId) {
          console.error('❌ Unexpected response creating address:', res);
          alert('Address saved but server response was unexpected. Please refresh addresses.');
          this.showAddressForm = false;
          this.resetAddressForm();
          return;
        }

        const createdAddress: Address = {
          address_id: newId,
          user_id: this.currentUser?.user_id || 0,
          address_line1: this.newAddress.address_line1,
          address_line2: this.newAddress.address_line2,
          city: this.newAddress.city,
          state: this.newAddress.state,
          postal_code: this.newAddress.postal_code,
          country: this.newAddress.country,
          is_default: this.newAddress.is_default
        };

        this.addresses.push(createdAddress);
        this.selectedAddressId = createdAddress.address_id;
        this.showAddressForm = false;
        this.resetAddressForm();

        // CRITICAL: Update orderData with the new address
        if (this.orderData) {
          this.orderData.addressId = createdAddress.address_id;
          localStorage.setItem('checkout_data', JSON.stringify(this.orderData));
          console.log('✅ Updated orderData with new addressId:', this.orderData.addressId);
        }

        alert('Address added successfully!');
      },
      error: (err) => {
        console.error('❌ Error saving address:', err);
        alert('Failed to save address. Please try again.');
      }
    });
  }

  /**
   * Handle guest address - FIXED to update orderData
   */
  private handleGuestAddress(): void {
    const guestAddress: Address = {
      address_id: Date.now(),
      user_id: 0,
      ...this.newAddress,
      is_default: true
    };

    this.addresses = [guestAddress];
    this.selectedAddressId = guestAddress.address_id;
    this.showAddressForm = false;
    this.resetAddressForm();

    // CRITICAL: Update orderData with the new address
    if (this.orderData) {
      this.orderData.addressId = guestAddress.address_id;
      localStorage.setItem('checkout_data', JSON.stringify(this.orderData));
      console.log('✅ Updated orderData with guest addressId:', this.orderData.addressId);
    }

    alert('Delivery address saved!');
  }

  /**
   * Select address - FIXED to update orderData
   */
  selectAddress(addressId: number): void {
    console.log('📍 Selecting address:', addressId);
    this.selectedAddressId = addressId;

    // CRITICAL: Update orderData with the selected address
    if (this.orderData) {
      this.orderData.addressId = addressId;
      localStorage.setItem('checkout_data', JSON.stringify(this.orderData));
      console.log('✅ Updated orderData with selected addressId:', this.orderData.addressId);
    }
  }

  /**
   * Validate form - ENHANCED to check for valid addressId
   */
  validateForm(): boolean {
    if (!this.selectedAddressId || this.selectedAddressId === 0) {
      alert('Please select or add a delivery address');
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.contactInfo.email)) {
      alert('Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
    if (!phoneRegex.test(this.contactInfo.phone.replace(/\s/g, ''))) {
      alert('Please enter a valid phone number');
      return false;
    }

    return true;
  }

  /**
   * Proceed to payment - FIXED to use addressId
   */
  proceedToPayment(): void {
    console.log('🔄 Proceeding to payment...');
    console.log('📌 Current selectedAddressId:', this.selectedAddressId);

    if (!this.validateForm()) {
      return;
    }

    // Double-check we have a valid address ID
    if (!this.selectedAddressId || this.selectedAddressId === 0) {
      alert('Please select a valid delivery address');
      return;
    }

    if (!this.orderData) {
      alert('Order data is missing. Please restart your order.');
      this.router.navigate(['/cart']);
      return;
    }

    this.isProcessing = true;
    this.error = '';

    // Prepare data for payment page - FIXED: use addressId
    const paymentData = {
      cartId: this.orderData.cartId,
      addressId: this.selectedAddressId, // This is the key fix
      subtotal: this.orderData.subtotal,
      deliveryCost: this.selectedDeliveryOption.cost,
      finalTotal: this.finalTotal,
      deliveryCity: this.selectedAddress?.city || this.newAddress.city
    };

    console.log('📦 Sending payment data:', paymentData);
    console.log('📍 addressId being sent:', paymentData.addressId);

    // Store for payment page
    if (this.isBrowser) {
      localStorage.setItem('payment_data', JSON.stringify(paymentData));
    }

    this.isProcessing = false;

    // Navigate to payment
    this.router.navigate(['/checkout/payment'], {
      state: paymentData
    });
  }

  // ========== REST OF THE METHODS (unchanged) ==========

  /**
   * Apply delivery cost to order
   */
  private applyDeliveryToOrder(): void {
    if (!this.orderData) return;

    const cost = Number(this.selectedDeliveryOption?.cost ?? 0);
    this.orderData.shipping = cost;
    this.orderData.total = this.orderData.subtotal + cost + this.orderData.tax - this.orderData.couponDiscount;

    if (this.isBrowser) {
      try {
        localStorage.setItem('checkout_data', JSON.stringify(this.orderData));
      } catch (err) {
        console.error('❌ Failed to persist checkout_data with updated delivery:', err);
      }
    }
  }

  changeDelivery(optionId: string): void {
    if (!optionId || this.selectedDelivery === optionId) return;
    this.selectedDelivery = optionId;
    this.applyDeliveryToOrder();
  }

  toggleAddressForm(): void {
    this.showAddressForm = !this.showAddressForm;
    if (!this.showAddressForm) {
      this.resetAddressForm();
    }
  }

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

  validateAddress(address: any): boolean {
    return !!(
      address.address_line1?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      address.postal_code?.trim()
    );
  }

  get selectedDeliveryOption() {
    return this.deliveryOptions.find(opt => opt.id === this.selectedDelivery) || this.deliveryOptions[0];
  }

  get finalTotal(): number {
    if (!this.orderData) return 0;
    return this.orderData.subtotal + this.selectedDeliveryOption.cost + this.orderData.tax - this.orderData.couponDiscount;
  }

  goBack(): void {
    this.router.navigate(['/cart']);
  }

  get selectedAddress(): Address | undefined {
    return this.addresses.find(addr => addr.address_id === this.selectedAddressId);
  }

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

  debugCheckout(): void {
    console.group('🔧 Checkout Debug Info');
    console.log('isBrowser:', this.isBrowser);
    console.log('currentUser:', this.currentUser);
    console.log('isGuest:', this.isGuest);
    console.log('orderData:', this.orderData);
    console.log('addresses:', this.addresses);
    console.log('selectedAddressId:', this.selectedAddressId);
    console.log('contactInfo:', this.contactInfo);
    console.log('selectedDelivery:', this.selectedDelivery);
    console.groupEnd();
  }
}