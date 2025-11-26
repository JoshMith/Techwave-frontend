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
  user_id: number;
  full_name: string;
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
  status: string; // Changed from order_status to status
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
  method: string; // Changed from payment_method to method
  amount: number;
  mpesa_code?: string;
  mpesa_phone?: string;
  transaction_reference?: string; // Changed from transaction_id to transaction_reference
  is_confirmed: boolean;
  confirmed_at?: string;
  // Additional fields from API
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

  // Form data
  editUserData: Partial<User> = {};
  editAddressData: Partial<Address> = {};
  newAddress: Partial<Address> = {
    country: 'Kenya',
    full_name: '',
    phone: ''
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

          // Load user-specific data
          this.loadOrders();
          this.loadAddresses();
          this.loadPayments();
          this.loadRecommendedProducts();
          
          // Load seller profile ONLY if user role is 'seller'
          // Admin role does NOT have access to seller features
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
   * Load seller profile
   * Only called for users with 'seller' role
   */
  loadSellerProfile(): void {
    if (!this.user) return;

    this.isLoadingSeller = true;
    this.sellerError = null;

    // Get all sellers and find the one for this user
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
        // Initialize new seller data with user_id
        this.editSellerData = {
          user_id: this.user?.user_id,
          business_name: '',
          business_license: '',
          tax_id: ''
        };
      }
    }
    // Clear messages when toggling
    this.sellerError = null;
    this.sellerSuccess = null;
  }

  /**
   * Save seller profile (create or update)
   */
  saveSeller(): void {
    if (!this.user || !this.editSellerData) return;

    // Validate required fields
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
      // Update existing seller profile
      this.apiService.updateSeller(this.sellerProfile.seller_id.toString(), sellerData).subscribe({
        next: (response) => {
          this.sellerProfile = response.seller || response;
          this.isEditingSeller = false;
          this.sellerSuccess = 'Seller profile updated successfully!';
          this.isLoadingSeller = false;
          
          // Clear success message after 3 seconds
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
      // Create new seller profile
      this.apiService.createSeller(sellerData).subscribe({
        next: (response) => {
          this.sellerProfile = response.seller || response;
          this.isEditingSeller = false;
          this.sellerSuccess = 'Seller profile created successfully!';
          this.isLoadingSeller = false;
          
          // Clear success message after 3 seconds
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
   * Note: Only users with 'seller' role can access seller features
   * Admin role does NOT have seller access
   */
  isSeller(): boolean {
    return this.user?.role === 'seller';
  }

  /**
   * Load user orders using new API
   */
  loadOrders(): void {
    if (!this.user) return;

    this.apiService.getOrdersByUserId().subscribe({
      next: (response) => {
        // Transform the API response to match our interface
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
 * Active orders are those that are not completed, cancelled, or delivered
 */
  getActiveOrdersCount(): number {
    if (!this.orders || this.orders.length === 0) return 0;

    const activeStatuses = ['pending', 'processing', 'shipped', 'confirmed', 'accepted'];

    return this.orders.filter(order =>
      activeStatuses.includes(order.status?.toLowerCase())
    ).length;
  }

  /**
   * Get active orders
   */
  getActiveOrders(): Order[] {
    if (!this.orders || this.orders.length === 0) return [];

    const activeStatuses = ['pending', 'processing', 'shipped', 'confirmed', 'accepted'];

    return this.orders.filter(order =>
      activeStatuses.includes(order.status?.toLowerCase())
    );
  }

  /**
   * Get completed orders
   */
  getCompletedOrders(): Order[] {
    if (!this.orders || this.orders.length === 0) return [];

    const completedStatuses = ['delivered', 'completed'];

    return this.orders.filter(order =>
      completedStatuses.includes(order.status?.toLowerCase())
    );
  }

  /**
   * Get cancelled orders
   */
  getCancelledOrders(): Order[] {
    if (!this.orders || this.orders.length === 0) return [];

    const cancelledStatuses = ['cancelled', 'refunded', 'failed'];

    return this.orders.filter(order =>
      cancelledStatuses.includes(order.status?.toLowerCase())
    );
  }

  /**
   * Check if an order is active
   */
  isOrderActive(order: Order): boolean {
    const activeStatuses = ['pending', 'processing', 'shipped', 'confirmed', 'accepted'];
    return activeStatuses.includes(order.status?.toLowerCase());
  }

  /**
   * Check if an order is completed
   */
  isOrderCompleted(order: Order): boolean {
    const completedStatuses = ['delivered', 'completed'];
    return completedStatuses.includes(order.status?.toLowerCase());
  }

  /**
   * Check if an order is cancelled
   */
  isOrderCancelled(order: Order): boolean {
    const cancelledStatuses = ['cancelled', 'refunded', 'failed'];
    return cancelledStatuses.includes(order.status?.toLowerCase());
  }

  /**
   * Transform orders API response to match our Order interface
   */
  private transformOrdersResponse(apiResponse: any[]): Order[] {
    // Group by order_id since API returns multiple rows per order (one per order item)
    const ordersMap = new Map<number, Order>();

    apiResponse.forEach((row: any) => {
      if (!ordersMap.has(row.order_id)) {
        // Create new order entry
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

      // Add order item to the order
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
        // Handle different response formats
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
        // Don't show error if it's just a 404 (no addresses found)
        if (err.status !== 404) {
          console.error('Error loading addresses:', err.message);
        }
        this.addresses = [];
      }
    });
  }

  /**
   * Load user payments using new API
   */
  loadPayments(): void {
    if (!this.user) return;

    this.apiService.getPaymentByUserId().subscribe({
      next: (response) => {
        // Transform the API response to match our Payment interface
        this.payments = this.transformPaymentsResponse(response);
      },
      error: (err) => {
        console.error('Failed to load payments:', err);
        this.payments = [];
      }
    });
  }

  /**
   * Transform payments API response to match our Payment interface
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
        // Get random 4 products
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
        // current user is non-null because of the guard above
        const current = this.user as User;

        // API may return either the updated user directly or an object with a `user` property.
        // Treat response as a partial user and merge with existing required fields to produce a full User.
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
  }

  /**
   * Save address changes
   */
  saveAddress(addressId: number): void {
    if (!this.editAddressData || Object.keys(this.editAddressData).length === 0) {
      alert('No changes to save.');
      return;
    }

    this.apiService.updateAddress(addressId.toString(), this.editAddressData).subscribe({
      next: (response) => {
        // Handle different response formats
        const updatedAddress = response.address || response;
        
        const index = this.addresses.findIndex(a => a.address_id === addressId);
        if (index !== -1) {
          // Merge the updated data with existing address
          this.addresses[index] = {
            ...this.addresses[index],
            ...updatedAddress
          };
        }
        
        this.editingAddressId = null;
        this.editAddressData = {};
        alert('Address updated successfully!');
      },
      error: (err) => {
        console.error('Failed to update address:', err);
        alert(err.error?.message || 'Failed to update address. Please try again.');
      }
    });
  }

  /**
   * Cancel address edit
   */
  cancelEditAddress(): void {
    this.editingAddressId = null;
    this.editAddressData = {};
  }

  /**
   * Add new address
   */
  addNewAddress(): void {
    if (!this.user) return;

    // Validate required fields
    if (!this.newAddress.street || !this.newAddress.city || !this.newAddress.postal_code) {
      alert('Please fill in all required fields: Street, City, and Postal Code.');
      return;
    }

    // Prepare address data with all required fields
    const addressData: any = {
      user_id: this.user.user_id,
      full_name: this.newAddress.full_name || this.user.name,
      phone: this.newAddress.phone || this.user.phone || '',
      street: this.newAddress.street,
      building: this.newAddress.building || '',
      city: this.newAddress.city,
      state: this.newAddress.state || this.newAddress.city, // Default state to city if not provided
      county: this.newAddress.county || this.newAddress.city, // Default county to city if not provided
      postal_code: this.newAddress.postal_code,
      country: this.newAddress.country || 'Kenya',
      is_default: this.addresses.length === 0
    };

    this.apiService.createAddress(addressData).subscribe({
      next: (response) => {
        // Handle different response formats
        const newAddress = response.address || response;
        this.addresses.push(newAddress);
        
        // Reset form
        this.newAddress = { 
          country: 'Kenya',
          full_name: this.user?.name,
          phone: this.user?.phone
        };
        
        alert('Address added successfully!');
      },
      error: (err) => {
        console.error('Failed to add address:', err);
        alert(err.error?.message || 'Failed to add address. Please try again.');
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
        alert('Address deleted successfully!');
      },
      error: (err) => {
        console.error('Failed to delete address:', err);
        alert('Failed to delete address. Please try again.');
      }
    });
  }

  /**
   * Set default address
   */
  setDefaultAddress(addressId: number): void {
    // First, update all addresses to not default
    this.addresses.forEach(addr => {
      if (addr.address_id === addressId) {
        this.apiService.updateAddress(addr.address_id.toString(), { is_default: true }).subscribe({
          next: () => {
            addr.is_default = true;
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
   * View order details - toggle expanded view
   */
  viewOrderDetails(orderId: number): void {
    // Toggle the expanded state for the clicked order
    this.orders = this.orders.map(order => {
      if (order.order_id === orderId) {
        return {
          ...order,
          isExpanded: !order.isExpanded
        };
      }
      // Optionally collapse other orders when one is expanded
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
   * Get order subtotal (sum of all items)
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
   * Get order status class - updated for new status field
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
 * Get payment status class - updated for new structure
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
   * Get payment status text
   */
  getPaymentStatusText(payment: Payment): string {
    if (payment.is_confirmed) {
      return 'completed';
    } else if (payment.method === 'mpesa' && !payment.is_confirmed) {
      return 'pending';
    } else {
      return 'failed';
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
        // Still navigate to login even if API fails
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
  }
}