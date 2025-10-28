// details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
}

@Component({
  selector: 'app-details',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})
export class DetailsComponent implements OnInit {
  // User and authentication
  currentUser: any = null;
  
  // Order data from cart
  orderData: any = null;
  orderItems: any[] = [];
  
  // Addresses
  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  isLoadingAddresses = true;
  
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
  deliveryMethod = 'standard';
  
  isProcessing = false;
  error = '';

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadCheckoutData();
    this.loadCurrentUser();
    this.loadAddresses();
  }

  loadCheckoutData(): void {
    const checkoutData = localStorage.getItem('checkout_data');
    if (!checkoutData) {
      alert('No order data found. Redirecting to cart...');
      this.router.navigate(['/cart']);
      return;
    }

    this.orderData = JSON.parse(checkoutData);
    this.orderItems = this.orderData.items || [];
  }

  loadCurrentUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    const userId = storedUser ? JSON.parse(storedUser).user_id : null;
    if (!userId) {
      // Allow guest checkout
      return;
    }
    this.apiService.getCurrentUserProfile(userId.toString()).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.contactInfo.email = user.email || '';
        this.contactInfo.phone = user.phone || '';
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        // Allow guest checkout
      }
    });
  }

  loadAddresses(): void {
    this.isLoadingAddresses = true;
    this.apiService.getAddresses().subscribe({
      next: (addresses) => {
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
        console.error('Error loading addresses:', err);
        this.isLoadingAddresses = false;
      }
    });
  }

  toggleAddressForm(): void {
    this.showAddressForm = !this.showAddressForm;
  }

  saveNewAddress(): void {
    if (!this.validateAddress(this.newAddress)) {
      alert('Please fill in all required fields');
      return;
    }

    this.apiService.createAddress(this.newAddress).subscribe({
      next: (address) => {
        this.addresses.push(address);
        this.selectedAddressId = address.id;
        this.showAddressForm = false;
        // Reset form
        this.newAddress = {
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'Kenya',
          is_default: false
        };
        alert('Address added successfully!');
      },
      error: (err) => {
        console.error('Error saving address:', err);
        alert('Failed to save address. Please try again.');
      }
    });
  }

  validateAddress(address: any): boolean {
    return !!(
      address.address_line1 &&
      address.city &&
      address.state &&
      address.postal_code &&
      address.country
    );
  }

  selectAddress(addressId: number): void {
    this.selectedAddressId = addressId;
  }

  proceedToPayment(): void {
    if (!this.selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }

    if (!this.contactInfo.email || !this.contactInfo.phone) {
      alert('Please provide contact information');
      return;
    }

    this.isProcessing = true;
    this.error = '';

    // Create order in the backend
    const orderPayload = {
      user_id: this.currentUser?.id || null,
      address_id: this.selectedAddressId,
      total_amount: this.orderData.total,
      subtotal: this.orderData.subtotal,
      tax_amount: this.orderData.tax,
      shipping_cost: this.orderData.shipping,
      discount_amount: this.orderData.couponDiscount,
      status: 'pending',
      payment_status: 'pending',
      delivery_method: this.deliveryMethod,
      contact_email: this.contactInfo.email,
      contact_phone: this.contactInfo.phone
    };

    this.apiService.createOrder(orderPayload).subscribe({
      next: (order) => {
        // Create order items
        this.createOrderItems(order.id);
      },
      error: (err) => {
        console.error('Error creating order:', err);
        this.error = 'Failed to create order. Please try again.';
        this.isProcessing = false;
      }
    });
  }

  createOrderItems(orderId: number): void {
    const orderItemPromises = this.orderItems.map(item => {
      const orderItemPayload = {
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      };
      return this.apiService.createOrderItem(orderItemPayload).toPromise();
    });

    Promise.all(orderItemPromises)
      .then(() => {
        // Clear the cart after successful order creation
        if (this.orderData.cartId) {
          return this.apiService.clearCart(this.orderData.cartId.toString()).toPromise();
        }
        // Always return a resolved promise if no cartId
        return Promise.resolve();
      })
      .then(() => {
        // Store order ID and navigate to payment
        localStorage.setItem('current_order_id', orderId.toString());
        localStorage.removeItem('checkout_data');
        this.isProcessing = false;
        this.router.navigate(['/checkout/payment']);
      })
      .catch(err => {
        console.error('Error creating order items:', err);
        this.error = 'Failed to complete order. Please try again.';
        this.isProcessing = false;
      });
  }

  goBack(): void {
    this.router.navigate(['/cart']);
  }

  get selectedAddress(): Address | undefined {
    return this.addresses.find(addr => addr.id === this.selectedAddressId);
  }
}