import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface CartItem {
  cart_item_id: number;
  product_id: number;
  product_title: string;
  product_description: string;
  category_name: string;
  quantity: number;
  unit_price: number;
  current_price: number;
  current_sale_price: number;
  available_stock: number;
  subtotal: number;
  rating: number;
}

interface Cart {
  cart_id: number;
  user_id?: number;
  session_id?: string;
  status: string;
  item_count: number;
  total_amount: number;
}

@Component({
  selector: 'app-cart',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  cart: Cart | null = null;
  cartCount = 0;
  couponCode = '';
  couponApplied = false;
  couponDiscount = 0;
  loading = false;
  error: string | null = null;
  currentUser: any = null;
  isBrowser: boolean;

  // Delivery information
  deliveryOptions = [
    { location: 'Nairobi', estimate: '1-2 business days' },
    { location: 'Nyeri', estimate: '2-3 business days' },
    { location: 'Other Areas', estimate: '3-5 business days' }
  ];

  constructor(
    private router: Router,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }


  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCart();
  }

  loadCurrentUser(): void {
    // Try to get user from localStorage
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  loadCart(): void {
    this.loading = true;
    this.error = null;

    if (this.currentUser?.user_id) {
      // Load cart for logged-in user
      this.apiService.getCartByUserId(this.currentUser.user_id).subscribe({
        next: (cart) => {
          this.cart = cart;
          this.loadCartItems(cart.cart_id);
        },
        error: (err) => {
          if (err.status === 404) {
            // No active cart, create one
            this.createCart(this.currentUser.user_id, null);
          } else {
            this.error = 'Failed to load cart';
            this.loading = false;
          }
        }
      });
    } else {
      // Load cart for guest using session
      const sessionId = this.getOrCreateSessionId();
      this.apiService.getCartBySessionId(sessionId).subscribe({
        next: (cart) => {
          this.cart = cart;
          this.loadCartItems(cart.cart_id);
        },
        error: (err) => {
          if (err.status === 404) {
            // No active cart, create one
            this.createCart(null, sessionId);
          } else {
            this.error = 'Failed to load cart';
            this.loading = false;
          }
        }
      });
    }
  }

  createCart(userId: number | null, sessionId: string | null): void {
    const cartData = userId ? { user_id: userId } : { session_id: sessionId };

    this.apiService.createCart(cartData).subscribe({
      next: (response) => {
        this.cart = response.cart;
        this.cartItems = [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to create cart';
        this.loading = false;
      }
    });
  }

  loadCartItems(cartId: number): void {
    this.apiService.getCartItemsByCartId(cartId.toString()).subscribe({
      next: (items) => {
        this.cartItems = items;
        this.cartCount = items.length;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load cart items';
        this.loading = false;
      }
    });
  }

  getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guestSessionId', sessionId);
    }
    return sessionId;
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get shipping(): number {
    return this.subtotal > 5000 ? 0 : 500;
  }

  get tax(): number {
    return this.subtotal * 0.16; // 16% VAT
  }

  get total(): number {
    return this.subtotal + this.shipping + this.tax - this.couponDiscount;
  }

  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;

    if (newQuantity < 1) {
      return;
    }

    if (newQuantity > item.available_stock) {
      alert(`Only ${item.available_stock} items available in stock`);
      return;
    }

    this.apiService.updateCartItem(item.cart_item_id.toString(), { quantity: newQuantity }).subscribe({
      next: (response) => {
        item.quantity = newQuantity;
        item.subtotal = item.quantity * item.unit_price;
        // Reload cart to get updated totals
        if (this.cart) {
          this.loadCartItems(this.cart.cart_id);
        }
      },
      error: (err) => {
        alert('Failed to update quantity: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  removeItem(item: CartItem): void {
    if (!confirm('Remove this item from cart?')) {
      return;
    }

    this.apiService.removeCartItem(item.cart_item_id.toString()).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(i => i.cart_item_id !== item.cart_item_id);
        this.cartCount = this.cartItems.length;
      },
      error: (err) => {
        alert('Failed to remove item: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  applyCoupon(): void {
    if (this.couponCode.toUpperCase() === 'SAVE10' && !this.couponApplied) {
      this.couponDiscount = this.subtotal * 0.1; // 10% discount
      this.couponApplied = true;
      alert('Coupon applied successfully!');
    } else if (this.couponApplied) {
      alert('Coupon already applied');
    } else {
      alert('Invalid coupon code');
    }
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!this.currentUser) {
      // Redirect to login with return URL
      const returnUrl = '/checkout/details';
      this.router.navigate(['/login'], { queryParams: { returnUrl } });
      return;
    }

    // Navigate to details page with cart info
    this.router.navigate(['/checkout/details'], {
      state: {
        cartId: this.cart?.cart_id,
        total: this.total
      }
    });
  }

  onSearch(): void {
    console.log('Search functionality to be implemented');
  }

  onCategoryClick(category: string): void {
    this.router.navigate(['/categories', category]);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}