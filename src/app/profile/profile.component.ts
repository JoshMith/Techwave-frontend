import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CartService } from '../services/cart.service';
import { FormsModule } from '@angular/forms';

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
  order_status: string;
  total_amount: number;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_title?: string;
}

interface Payment {
  payment_id: number;
  order_id: number;
  payment_method: string;
  amount: number;
  payment_status: string;
  transaction_id?: string;
  created_at: string;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  // User data
  user: User | null = null;
  isLoading = true;
  error: string | null = null;

  // Edit modes
  isEditingProfile = false;
  isEditingAddress = false;
  editingAddressId: number | null = null;

  // Form data
  editUserData: Partial<User> = {};
  editAddressData: Partial<Address> = {};
  newAddress: Partial<Address> = {
    country: 'Kenya'
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
  activeSection: 'overview' | 'orders' | 'addresses' | 'payments' | 'settings' = 'overview';

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
          
          this.isLoading = false;
        } else {
          this.error = 'User not found. Please login.';
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        console.error('Failed to load user data:', err);
        this.error = 'Failed to load user data. Please login.';
        this.isLoading = false;
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Load user orders
   */
  loadOrders(): void {
    if (!this.user) return;

    this.apiService.getOrdersByUserId().subscribe({
      next: (response) => {
        // Filter orders for current user
        this.orders = response.filter((order: Order) => 
          order.user_id === this.user!.user_id
        ).sort((a: Order, b: Order) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        this.stats.orders = this.orders.filter(o => 
          o.order_status === 'pending' || o.order_status === 'processing'
        ).length;
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
      }
    });
  }

  /**
   * Load user addresses
   */
  loadAddresses(): void {
    if (!this.user) return;

    this.apiService.getAddressByUserId(this.user.user_id.toString()).subscribe({
      next: (response) => {
        this.addresses = Array.isArray(response) ? response : [response];
      },
      error: (err) => {
        console.error('Failed to load addresses:', err);
        this.addresses = [];
      }
    });
  }

  /**
   * Load user payments
   */
  loadPayments(): void {
    if (!this.user) return;

    this.apiService.getPayments().subscribe({
      next: (response) => {
        // Filter payments for user's orders
        const userOrderIds = this.orders.map(o => o.order_id);
        this.payments = response.filter((payment: Payment) => 
          userOrderIds.includes(payment.order_id)
        ).sort((a: Payment, b: Payment) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      },
      error: (err) => {
        console.error('Failed to load payments:', err);
      }
    });
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
        // this.user = { ...this.user, ...this.editUserData };
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
    this.apiService.updateAddress(addressId.toString(), this.editAddressData).subscribe({
      next: (response) => {
        const index = this.addresses.findIndex(a => a.address_id === addressId);
        if (index !== -1) {
          this.addresses[index] = { ...this.addresses[index], ...this.editAddressData };
        }
        this.editingAddressId = null;
        alert('Address updated successfully!');
      },
      error: (err) => {
        console.error('Failed to update address:', err);
        alert('Failed to update address. Please try again.');
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

    const addressData = {
      ...this.newAddress,
      user_id: this.user.user_id,
      is_default: this.addresses.length === 0
    };

    this.apiService.createAddress(addressData).subscribe({
      next: (response) => {
        this.addresses.push(response.address);
        this.newAddress = { country: 'Kenya' };
        alert('Address added successfully!');
      },
      error: (err) => {
        console.error('Failed to add address:', err);
        alert('Failed to add address. Please try again.');
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
   * View order details
   */
  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
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
  getPaymentStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'status-pending',
      'completed': 'status-completed',
      'failed': 'status-failed'
    };
    return statusMap[status.toLowerCase()] || '';
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
  setActiveSection(section: 'overview' | 'orders' | 'addresses' | 'payments' | 'settings'): void {
    this.activeSection = section;
  }
}