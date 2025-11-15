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
  latitude?: number;
  longitude?: number;
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

declare var google: any;

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
    is_default: false,
    latitude: 0,
    longitude: 0
  };

  // Google Maps
  map: any = null;
  marker: any = null;
  geocoder: any = null;
  showMapPicker = false;
  isLoadingMap = false;

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
      this.loadCurrentUser();
      this.loadGoogleMaps();
    }
  }

  /**
   * Load Google Maps Script
   */
  loadGoogleMaps(): void {
    if (!this.isBrowser) return;

    // Check if Google Maps is already loaded
    if (typeof google !== 'undefined' && google.maps) {
      this.initializeGoogleMaps();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://api.mapbox.com/mapbox-gl-js/v3.17.0-beta.1/mapbox-gl.js`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.initializeGoogleMaps();
    };
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps');
      alert('Failed to load Google Maps. Please check your internet connection.');
    };
    document.head.appendChild(script);
  }

  /**
   * Initialize Google Maps
   */
  initializeGoogleMaps(): void {
    if (typeof google === 'undefined' || !google.maps) {
      console.error('❌ Google Maps not available');
      return;
    }
    this.geocoder = new google.maps.Geocoder();
    console.log('✅ Google Maps initialized');
  }

  /**
   * Open Map Picker
   */
  openMapPicker(): void {
    this.showMapPicker = true;
    this.isLoadingMap = true;

    // Wait for DOM to render the map container
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  /**
   * Close Map Picker
   */
  closeMapPicker(): void {
    this.showMapPicker = false;
    this.map = null;
    this.marker = null;
  }

  /**
   * Initialize Map
   */
  initializeMap(): void {
    if (!this.isBrowser || typeof google === 'undefined') return;

    const mapElement = document.getElementById('map-canvas');
    if (!mapElement) {
      console.error('❌ Map container not found');
      this.isLoadingMap = false;
      return;
    }

    // Default to Nairobi, Kenya
    const defaultLocation = { lat: -1.286389, lng: 36.817223 };

    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.createMap(mapElement, userLocation);
        },
        (error) => {
          console.log('ℹ️ Could not get user location, using default');
          this.createMap(mapElement, defaultLocation);
        }
      );
    } else {
      this.createMap(mapElement, defaultLocation);
    }
  }

  /**
   * Create Map
   */
  createMap(mapElement: HTMLElement, location: { lat: number, lng: number }): void {
    this.map = new google.maps.Map(mapElement, {
      center: location,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    });

    // Add marker
    this.marker = new google.maps.Marker({
      position: location,
      map: this.map,
      draggable: true,
      animation: google.maps.Animation.DROP
    });

    // Get address for initial location
    this.reverseGeocode(location.lat, location.lng);

    // Add click listener to map
    this.map.addListener('click', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      this.updateMarkerPosition(lat, lng);
    });

    // Add drag listener to marker
    this.marker.addListener('dragend', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      this.reverseGeocode(lat, lng);
    });

    this.isLoadingMap = false;
  }

  /**
   * Update Marker Position
   */
  updateMarkerPosition(lat: number, lng: number): void {
    const position = { lat, lng };
    this.marker.setPosition(position);
    this.map.panTo(position);
    this.reverseGeocode(lat, lng);
  }

  /**
   * Reverse Geocode - Get address from coordinates
   */
  reverseGeocode(lat: number, lng: number): void {
    if (!this.geocoder) return;

    const latlng = { lat, lng };
    
    this.geocoder.geocode({ location: latlng }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        this.parseGoogleAddress(results[0], lat, lng);
      } else {
        console.error('❌ Geocoding failed:', status);
      }
    });
  }

  /**
   * Parse Google Address
   */
  parseGoogleAddress(result: any, lat: number, lng: number): void {
    const addressComponents = result.address_components;
    
    let street = '';
    let city = '';
    let state = '';
    let postalCode = '';
    let country = '';

    // Extract address components
    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('street_number') || types.includes('route')) {
        street = street ? `${street} ${component.long_name}` : component.long_name;
      }
      
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = component.long_name;
      }
      
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      
      if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
      
      if (types.includes('country')) {
        country = component.long_name;
      }
    }

    // Update form fields
    this.newAddress.address_line1 = street || result.formatted_address;
    this.newAddress.city = city || 'Nairobi';
    this.newAddress.state = state || 'Nairobi County';
    this.newAddress.postal_code = postalCode || '00100';
    this.newAddress.country = country || 'Kenya';
    this.newAddress.latitude = lat;
    this.newAddress.longitude = lng;

    console.log('✅ Address parsed:', this.newAddress);
  }

  /**
   * Confirm Location from Map
   */
  confirmLocation(): void {
    if (!this.newAddress.address_line1) {
      alert('Please select a valid location on the map');
      return;
    }

    this.closeMapPicker();
    alert('Location selected! Please review and complete the address details.');
  }

  /**
   * Search Location
   */
  searchLocation(query: string): void {
    if (!query || !this.geocoder) return;

    this.geocoder.geocode({ address: query }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        this.map.setCenter(location);
        this.map.setZoom(15);
        this.updateMarkerPosition(lat, lng);
      } else {
        alert('Location not found. Please try a different search.');
      }
    });
  }

  // ========== EXISTING METHODS (unchanged) ==========

  loadCurrentUser(): void {
    if (!this.isBrowser) return;

    try {
      const storedUser = this.apiService.getCurrentUser().subscribe(user => {
        if (!storedUser) {
          console.log('ℹ️ No user logged in - guest checkout');
          this.setupGuestCheckout();
          this.loadCheckoutData();
          return;
        }

        this.currentUser = user;
        this.isGuest = false;
        this.loadUserProfileAndAddresses(user.user.user_id);
      });
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      this.setupGuestCheckout();
      this.loadCheckoutData();
    }
  }

  private loadUserProfileAndAddresses(userId: number): void {
    this.apiService.getCurrentUserProfile(userId.toString()).subscribe({
      next: (user) => {
        this.currentUser = { ...this.currentUser, ...user };
        this.contactInfo.email = user.email || '';
        this.contactInfo.phone = user.phone || '';
        
        this.loadAddresses(() => {
          console.log('✅ Addresses loaded, now loading checkout data...');
          this.loadCheckoutData();
        });
      },
      error: (err) => {
        console.error('❌ Error loading user profile:', err);
        this.loadAddresses(() => {
          this.loadCheckoutData();
        });
      }
    });
  }

  loadAddresses(callback?: () => void): void {
    if (!this.currentUser?.user_id || this.isGuest) {
      console.log('ℹ️ No addresses to load (guest or no user)');
      this.isLoadingAddresses = false;
      callback?.();
      return;
    }

    this.isLoadingAddresses = true;
    this.addressError = null;

    this.apiService.getAddressByUserId(this.currentUser.user_id.toString()).subscribe({
      next: (res: any) => {
        const addresses: Address[] = Array.isArray(res)
          ? res
          : (res?.addresses || res?.data || []);

        this.addresses = addresses;

        const defaultAddress = addresses.find((addr: Address) => addr.is_default);
        if (defaultAddress) {
          this.selectedAddressId = defaultAddress.address_id;
        } else if (addresses.length > 0) {
          this.selectedAddressId = addresses[0].address_id;
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

  loadCheckoutData(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as any;

    if (state && state.cartId) {
      this.processCheckoutData(state);
      return;
    }

    this.loadCheckoutDataFromStorage();
  }

  private processCheckoutData(data: any): void {
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

    const subtotal = items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);
    const shipping = Number(this.selectedDeliveryOption?.cost ?? data.shipping ?? 0);
    const tax = Number(data.tax ?? 0);
    const couponDiscount = Number(data.couponDiscount ?? 0);
    const total = subtotal + shipping + tax - couponDiscount;
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

    if (this.isBrowser) {
      localStorage.setItem('checkout_data', JSON.stringify(this.orderData));
    }
  }

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

  private showErrorAndRedirect(message: string): void {
    this.error = message;
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 3000);
  }

  private setupGuestCheckout(): void {
    this.isGuest = true;
    this.contactInfo.email = '';
    this.contactInfo.phone = '';
    this.addresses = [];
    this.isLoadingAddresses = false;
    this.showAddressForm = true;
  }

  saveNewAddress(): void {
    if (!this.validateAddress(this.newAddress)) {
      alert('Please fill in all required fields (Address, City, State, Postal Code)');
      return;
    }

    if (this.isGuest || !this.currentUser?.user_id) {
      this.handleGuestAddress();
      return;
    }

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
          is_default: this.newAddress.is_default,
          latitude: this.newAddress.latitude,
          longitude: this.newAddress.longitude
        };

        this.addresses.push(createdAddress);
        this.selectedAddressId = createdAddress.address_id;
        this.showAddressForm = false;
        this.resetAddressForm();

        if (this.orderData) {
          this.orderData.addressId = createdAddress.address_id;
          localStorage.setItem('checkout_data', JSON.stringify(this.orderData));
        }

        alert('Address added successfully!');
      },
      error: (err) => {
        console.error('❌ Error saving address:', err);
        alert('Failed to save address. Please try again.');
      }
    });
  }

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

    if (this.orderData) {
      this.orderData.addressId = guestAddress.address_id;
      localStorage.setItem('checkout_data', JSON.stringify(this.orderData));
    }

    alert('Delivery address saved!');
  }

  selectAddress(addressId: number): void {
    this.selectedAddressId = addressId;

    if (this.orderData) {
      this.orderData.addressId = addressId;
      localStorage.setItem('checkout_data', JSON.stringify(this.orderData));
    }
  }

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

  proceedToPayment(): void {
    if (!this.validateForm()) {
      return;
    }

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

    const paymentData = {
      cartId: this.orderData.cartId,
      addressId: this.selectedAddressId,
      subtotal: this.orderData.subtotal,
      deliveryCost: this.selectedDeliveryOption.cost,
      finalTotal: this.finalTotal,
      deliveryCity: this.selectedAddress?.city || this.newAddress.city
    };

    if (this.isBrowser) {
      localStorage.setItem('payment_data', JSON.stringify(paymentData));
    }

    this.isProcessing = false;
    this.router.navigate(['/checkout/payment'], {
      state: paymentData
    });
  }

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
      is_default: false,
      latitude: 0,
      longitude: 0
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