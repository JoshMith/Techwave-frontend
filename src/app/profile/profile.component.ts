import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CartService } from '../services/cart.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../shared/header/header.component';
import { FooterComponent } from '../shared/footer/footer.component';

interface User {
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  role?: string;
}

interface Address {
  address_id: number;
  user_id: any;
  full_name: string;
  email: string,
  phone: string;
  street: string;
  building?: string;
  city: string;
  state: string;
  county: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface Order {
  order_id: number;
  user_id: number;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  order_items?: OrderItem[];
  name?: string;
  email?: string;
  phone?: string;
  isExpanded?: boolean
}

interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  product_title?: string;
  product_description?: string;
}

interface Payment {
  payment_id: number;
  order_id: number;
  method: string;
  amount: number;
  mpesa_code?: string;
  mpesa_phone?: string;
  transaction_reference?: string;
  is_confirmed: boolean;
  confirmed_at?: string;
  total_amount?: number;
  status?: string;
  created_at: string;
}

interface Seller {
  seller_id: number;
  user_id: number;
  business_name: string;
  business_license: string;
  tax_id: string;
  total_sales?: number;
  created_at?: string;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  // User data
  user: User | null = null;
  isLoading = true;
  error: string | null = null;

  // Seller data
  sellerProfile: Seller | null = null;
  isEditingSeller = false;
  editSellerData: Partial<Seller> = {};
  sellerError: string | null = null;
  sellerSuccess: string | null = null;
  isLoadingSeller = false;

  // Edit modes
  isEditingProfile = false;
  isEditingAddress = false;
  editingAddressId: number | null = null;
  showAddAddressForm = false;
  isAddingAddress = false;

  // Form data
  editUserData: Partial<User> = {};
  editAddressData: Partial<Address> = {};
  newAddress: Partial<Address> = {
    country: 'Kenya',
    full_name: '',
    user_id: '',
    phone: '',
    street: '',
    building: '',
    city: '',
    county: '',
    state: '',
    postal_code: ''
  };

  // Account stats
  stats = {
    orders: 0,
    wishlist: 0,
    points: 0
  };

  // Data arrays
  orders: Order[] = [];
  addresses: Address[] = [];
  payments: Payment[] = [];
  recommendedProducts: any[] = [];

  // Cart
  cartCount = 0;

  // Active section
  activeSection: 'overview' | 'orders' | 'addresses' | 'payments' | 'settings' | 'seller' = 'overview';

  // Success/Error messages for addresses
  addressSuccess: string | null = null;
  addressError: string | null = null;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadCartCount();
  }

  /**
   * Load current user and their data
   */
  loadUserData(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.getCurrentUser().subscribe({
      next: (response) => {
        if (response && response.user) {
          this.user = response.user;
          this.editUserData = { ...this.user };

          // Initialize newAddress with user data
          this.newAddress = {
            country: 'Kenya',
            user_id: this.user?.user_id,
            full_name: this.user?.name,
            phone: this.user?.phone || '',
            street: '',
            building: '',
            city: '',
            county: '',
            state: '',
            postal_code: ''
          };

          // Load user-specific data
          this.loadOrders();
          this.loadAddresses();
          this.loadPayments();
          this.loadRecommendedProducts();
          
          // Load seller profile ONLY if user role is 'seller'
          if (this.user?.role === 'seller') {
            this.loadSellerProfile();
          }

          this.isLoading = false;
        } else {
          this.error = 'User not found. Please login.';
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        }
      },
      error: (err) => {
        console.error('Failed to load user data:', err);
        this.error = 'Failed to load user data. Please login.';
        this.isLoading = false;
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      }
    });
  }

  /**
   * Toggle add address form visibility
   */
  toggleAddAddressForm(): void {
    this.showAddAddressForm = !this.showAddAddressForm;
    if (this.showAddAddressForm) {
      // Reset form when opening
      this.newAddress = {
        country: 'Kenya',
        full_name: this.user?.name || '',
        user_id: this.user?.user_id || '',
        phone: this.user?.phone || '',
        street: '',
        building: '',
        city: '',
        county: '',
        state: '',
        postal_code: ''
      };
      this.addressError = null;
      this.addressSuccess = null;
    }
  }

  /**
   * Load seller profile
   */
  loadSellerProfile(): void {
    if (!this.user) return;

    this.isLoadingSeller = true;
    this.sellerError = null;

    this.apiService.getSellers().subscribe({
      next: (response) => {
        const sellers = Array.isArray(response) ? response : [response];
        const sellerData = sellers.find((s: Seller) => s.user_id === this.user!.user_id);
        
        if (sellerData) {
          this.sellerProfile = sellerData;
          this.editSellerData = { ...sellerData };
        }
        
        this.isLoadingSeller = false;
      },
      error: (err) => {
        console.error('Failed to load seller profile:', err);
        this.sellerError = 'Failed to load seller profile.';
        this.isLoadingSeller = false;
      }
    });
  }

  /**
   * Toggle edit seller mode
   */
  toggleEditSeller(): void {
    this.isEditingSeller = !this.isEditingSeller;
    if (this.isEditingSeller) {
      if (this.sellerProfile) {
        this.editSellerData = { ...this.sellerProfile };
      } else {
        this.editSellerData = {
          user_id: this.user?.user_id,
          business_name: '',
          business_license: '',
          tax_id: ''
        };
      }
    }
    this.sellerError = null;
    this.sellerSuccess = null;
  }

  /**
   * Save seller profile
   */
  saveSeller(): void {
    if (!this.user || !this.editSellerData) return;

    if (!this.editSellerData.business_name || !this.editSellerData.business_license || !this.editSellerData.tax_id) {
      this.sellerError = 'Please fill in all required fields.';
      return;
    }

    this.isLoadingSeller = true;
    this.sellerError = null;
    this.sellerSuccess = null;

    const sellerData = {
      user_id: this.user.user_id,
      business_name: this.editSellerData.business_name,
      business_license: this.editSellerData.business_license,
      tax_id: this.editSellerData.tax_id
    };

    if (this.sellerProfile) {
      this.apiService.updateSeller(this.sellerProfile.seller_id.toString(), sellerData).subscribe({
        next: (response) => {
          this.sellerProfile = response.seller || response;
          this.isEditingSeller = false;
          this.sellerSuccess = 'Seller profile updated successfully!';
          this.isLoadingSeller = false;
          
          setTimeout(() => {
            this.sellerSuccess = null;
          }, 3000);
        },
        error: (err) => {
          console.error('Failed to update seller profile:', err);
          this.sellerError = err.error?.message || 'Failed to update seller profile. Please try again.';
          this.isLoadingSeller = false;
        }
      });
    } else {
      this.apiService.createSeller(sellerData).subscribe({
        next: (response) => {
          this.sellerProfile = response.seller || response;
          this.isEditingSeller = false;
          this.sellerSuccess = 'Seller profile created successfully!';
          this.isLoadingSeller = false;
          
          setTimeout(() => {
            this.sellerSuccess = null;
          }, 3000);
        },
        error: (err) => {
          console.error('Failed to create seller profile:', err);
          this.sellerError = err.error?.message || 'Failed to create seller profile. Please try again.';
          this.isLoadingSeller = false;
        }
      });
    }
  }

  /**
   * Cancel seller edit
   */
  cancelEditSeller(): void {
    this.isEditingSeller = false;
    if (this.sellerProfile) {
      this.editSellerData = { ...this.sellerProfile };
    } else {
      this.editSellerData = {};
    }
    this.sellerError = null;
    this.sellerSuccess = null;
  }

  /**
   * Check if user is a seller
   */
  isSeller(): boolean {
    return this.user?.role === 'seller';
  }

  /**
   * Load user orders
   */
  loadOrders(): void {
    if (!this.user) return;

    this.apiService.getOrdersByUserId().subscribe({
      next: (response) => {
        this.orders = this.transformOrdersResponse(response);
        this.stats.orders = this.orders.filter(o =>
          o.status === 'pending' || o.status === 'processing'
        ).length;
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.orders = [];
      }
    });
  }

  /**
   * Get count of active orders
   */
  getActiveOrdersCount(): number {
    if (!this.orders || this.orders.length === 0) return 0;
    const activeStatuses = ['pending', 'processing', 'shipped', 'confirmed', 'accepted'];
    return this.orders.filter(order =>
      activeStatuses.includes(order.status?.toLowerCase())
    ).length;
  }

  /**
   * Transform orders API response
   */
  private transformOrdersResponse(apiResponse: any[]): Order[] {
    const ordersMap = new Map<number, Order>();

    apiResponse.forEach((row: any) => {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          user_id: row.user_id,
          total_amount: row.total_amount,
          status: row.status,
          notes: row.notes,
          created_at: row.created_at,
          name: row.name,
          email: row.email,
          phone: row.phone,
          order_items: []
        });
      }

      const order = ordersMap.get(row.order_id);
      if (order && row.order_item_id) {
        order.order_items!.push({
          order_item_id: row.order_item_id,
          order_id: row.order_id,
          product_id: row.product_id,
          quantity: row.quantity,
          unit_price: row.unit_price,
          discount: row.discount,
          product_title: row.product_title,
          product_description: row.product_description
        });
      }
    });

    return Array.from(ordersMap.values()).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Load user addresses
   */
  loadAddresses(): void {
    if (!this.user) return;

    this.apiService.getAddressByUserId(this.user.user_id.toString()).subscribe({
      next: (response) => {
        if (!response) {
          this.addresses = [];
        } else if (Array.isArray(response)) {
          this.addresses = response;
        } else if (response.address) {
          this.addresses = [response.address];
        } else if (response.addresses) {
          this.addresses = response.addresses;
        } else {
          this.addresses = [response];
        }
      },
      error: (err) => {
        console.error('Failed to load addresses:', err);
        if (err.status !== 404) {
          console.error('Error loading addresses:', err.message);
        }
        this.addresses = [];
      }
    });
  }

  /**
   * Load user payments
   */
  loadPayments(): void {
    if (!this.user) return;

    this.apiService.getPaymentByUserId().subscribe({
      next: (response) => {
        this.payments = this.transformPaymentsResponse(response);
      },
      error: (err) => {
        console.error('Failed to load payments:', err);
        this.payments = [];
      }
    });
  }

  /**
   * Transform payments API response
   */
  private transformPaymentsResponse(apiResponse: any[]): Payment[] {
    return apiResponse.map((row: any) => ({
      payment_id: row.payment_id,
      order_id: row.order_id,
      method: row.method,
      amount: row.amount,
      mpesa_code: row.mpesa_code,
      mpesa_phone: row.mpesa_phone,
      transaction_reference: row.transaction_reference,
      is_confirmed: row.is_confirmed,
      confirmed_at: row.confirmed_at,
      total_amount: row.total_amount,
      status: row.status,
      created_at: row.created_at
    })).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Load recommended products
   */
  loadRecommendedProducts(): void {
    this.apiService.getProducts().subscribe({
      next: (response) => {
        const shuffled = response.sort(() => 0.5 - Math.random());
        this.recommendedProducts = shuffled.slice(0, 4);
      },
      error: (err) => {
        console.error('Failed to load products:', err);
      }
    });
  }

  /**
   * Load cart count
   */
  loadCartCount(): void {
    this.cartService.cartState$.subscribe(state => {
      this.cartCount = state.item_count;
    });
  }

  /**
   * Toggle edit profile mode
   */
  toggleEditProfile(): void {
    this.isEditingProfile = !this.isEditingProfile;
    if (this.isEditingProfile) {
      this.editUserData = { ...this.user };
    }
  }

  /**
   * Save profile changes
   */
  saveProfile(): void {
    if (!this.user || !this.editUserData) return;

    this.apiService.updateUser(this.user.user_id.toString(), this.editUserData).subscribe({
      next: (response) => {
        const current = this.user as User;
        const apiUser = (response && (response.user ?? response)) as Partial<User> | undefined;

        this.user = {
          user_id: apiUser?.user_id ?? current.user_id,
          name: apiUser?.name ?? current.name,
          email: apiUser?.email ?? current.email,
          phone: apiUser?.phone ?? current.phone,
          created_at: apiUser?.created_at ?? current.created_at,
          role: apiUser?.role ?? current.role
        };

        this.isEditingProfile = false;
        alert('Profile updated successfully!');
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        alert('Failed to update profile. Please try again.');
      }
    });
  }

  /**
   * Cancel profile edit
   */
  cancelEditProfile(): void {
    this.isEditingProfile = false;
    this.editUserData = { ...this.user };
  }

  /**
   * Start editing address
   */
  startEditAddress(address: Address): void {
    this.editingAddressId = address.address_id;
    this.editAddressData = { ...address };
    this.addressError = null;
    this.addressSuccess = null;
  }

  /**
   * Save address changes
   */
  saveAddress(addressId: number): void {
    if (!this.editAddressData || Object.keys(this.editAddressData).length === 0) {
      this.addressError = 'No changes to save.';
      setTimeout(() => this.addressError = null, 3000);
      return;
    }

    this.apiService.updateAddress(addressId.toString(), this.editAddressData).subscribe({
      next: (response) => {
        const updatedAddress = response.address || response;
        
        const index = this.addresses.findIndex(a => a.address_id === addressId);
        if (index !== -1) {
          this.addresses[index] = {
            ...this.addresses[index],
            ...updatedAddress
          };
        }
        
        this.editingAddressId = null;
        this.editAddressData = {};
        this.addressSuccess = 'Address updated successfully!';
        setTimeout(() => this.addressSuccess = null, 3000);
      },
      error: (err) => {
        console.error('Failed to update address:', err);
        this.addressError = err.error?.message || 'Failed to update address. Please try again.';
        setTimeout(() => this.addressError = null, 3000);
      }
    });
  }

  /**
   * Cancel address edit
   */
  cancelEditAddress(): void {
    this.editingAddressId = null;
    this.editAddressData = {};
    this.addressError = null;
    this.addressSuccess = null;
  }

  /**
   * Add new address - Enhanced version
   */
  addNewAddress(): void {
    if (!this.user) return;

    // Validate required fields
    if (!this.newAddress.full_name?.trim()) {
      this.addressError = 'Full name is required.';
      setTimeout(() => this.addressError = null, 3000);
      return;
    }

    if (!this.newAddress.phone?.trim()) {
      this.addressError = 'Phone number is required.';
      setTimeout(() => this.addressError = null, 3000);
      return;
    }

    if (!this.newAddress.street?.trim()) {
      this.addressError = 'Street address is required.';
      setTimeout(() => this.addressError = null, 3000);
      return;
    }

    if (!this.newAddress.city?.trim()) {
      this.addressError = 'City is required.';
      setTimeout(() => this.addressError = null, 3000);
      return;
    }

    if (!this.newAddress.postal_code?.trim()) {
      this.addressError = 'Postal code is required.';
      setTimeout(() => this.addressError = null, 3000);
      return;
    }

    this.isAddingAddress = true;
    this.addressError = null;

    // Prepare address data
    const addressData: any = {
      user_id: this.user.user_id,
      full_name: this.newAddress.full_name.trim(),
      phone: this.newAddress.phone.trim(),
      street: this.newAddress.street.trim(),
      building: this.newAddress.building?.trim() || '',
      city: this.newAddress.city.trim(),
      state: this.newAddress.state?.trim() || this.newAddress.city.trim(),
      county: this.newAddress.county?.trim() || this.newAddress.city.trim(),
      postal_code: this.newAddress.postal_code.trim(),
      country: this.newAddress.country || 'Kenya',
      is_default: this.addresses.length === 0 // First address is default
    };

    this.apiService.createAddress(addressData).subscribe({
      next: (response) => {
        const newAddress = response.address || response;
        this.addresses.push(newAddress);
        
        // Reset form
        this.newAddress = { 
          country: 'Kenya',
          full_name: this.user?.name || '',
          phone: this.user?.phone || '',
          street: '',
          building: '',
          city: '',
          county: '',
          state: '',
          postal_code: ''
        };
        
        this.showAddAddressForm = false;
        this.isAddingAddress = false;
        this.addressSuccess = 'Address added successfully!';
        setTimeout(() => this.addressSuccess = null, 3000);
      },
      error: (err) => {
        console.error('Failed to add address:', err);
        this.addressError = err.error?.message || 'Failed to add address. Please try again.';
        this.isAddingAddress = false;
        setTimeout(() => this.addressError = null, 3000);
      }
    });
  }

  /**
   * Delete address
   */
  deleteAddress(addressId: number): void {
    if (!confirm('Are you sure you want to delete this address?')) return;

    this.apiService.deleteAddress(addressId.toString()).subscribe({
      next: () => {
        this.addresses = this.addresses.filter(a => a.address_id !== addressId);
        this.addressSuccess = 'Address deleted successfully!';
        setTimeout(() => this.addressSuccess = null, 3000);
      },
      error: (err) => {
        console.error('Failed to delete address:', err);
        this.addressError = 'Failed to delete address. Please try again.';
        setTimeout(() => this.addressError = null, 3000);
      }
    });
  }

  /**
   * Set default address
   */
  setDefaultAddress(addressId: number): void {
    this.addresses.forEach(addr => {
      if (addr.address_id === addressId) {
        this.apiService.updateAddress(addr.address_id.toString(), { is_default: true }).subscribe({
          next: () => {
            addr.is_default = true;
            this.addressSuccess = 'Default address updated successfully!';
            setTimeout(() => this.addressSuccess = null, 3000);
          }
        });
      } else if (addr.is_default) {
        this.apiService.updateAddress(addr.address_id.toString(), { is_default: false }).subscribe({
          next: () => {
            addr.is_default = false;
          }
        });
      }
    });
  }

  /**
   * View order details
   */
  viewOrderDetails(orderId: number): void {
    this.orders = this.orders.map(order => {
      if (order.order_id === orderId) {
        return {
          ...order,
          isExpanded: !order.isExpanded
        };
      }
      return {
        ...order,
        isExpanded: false
      };
    });
  }

  /**
   * Get order item total
   */
  getOrderItemTotal(item: OrderItem): number {
    return (item.unit_price * item.quantity) - (item.discount || 0);
  }

  /**
   * Get order subtotal
   */
  getOrderSubtotal(order: Order): number {
    if (!order.order_items) return 0;
    return order.order_items.reduce((total, item) => total + this.getOrderItemTotal(item), 0);
  }

  /**
   * Get order discount total
   */
  getOrderDiscountTotal(order: Order): number {
    if (!order.order_items) return 0;
    return order.order_items.reduce((total, item) => total + (item.discount || 0), 0);
  }

  /**
   * Get order status class
   */
  getOrderStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status.toLowerCase()] || '';
  }

  /**
   * Get payment status class
   */
  getPaymentStatusClass(payment: Payment): string {
    if (payment.is_confirmed) {
      return 'status-completed';
    } else if (payment.method === 'mpesa' && !payment.is_confirmed) {
      return 'status-pending';
    } else {
      return 'status-failed';
    }
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('KES', 'KSh');
  }

  /**
   * Get user initials
   */
  getUserInitials(): string {
    if (!this.user?.name) return '?';
    const names = this.user.name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  /**
   * Get member since date
   */
  getMemberSince(): string {
    if (!this.user?.created_at) return 'Unknown';
    return this.formatDate(this.user.created_at);
  }

  /**
   * Navigate to cart
   */
  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Logout
   */
  logout(): void {
    this.apiService.logout().subscribe({
      next: () => {
        this.cartService.logout();
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('sellerData');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout failed:', err);
        this.cartService.logout();
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('sellerData');
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Switch active section
   */
  setActiveSection(section: 'overview' | 'orders' | 'addresses' | 'payments' | 'settings' | 'seller'): void {
    this.activeSection = section;
    
    // Reset form states when switching sections
    if (section === 'addresses') {
      this.showAddAddressForm = false;
      this.editingAddressId = null;
      this.addressError = null;
      this.addressSuccess = null;
    }
  }
}