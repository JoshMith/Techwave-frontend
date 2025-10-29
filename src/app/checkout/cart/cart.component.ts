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
  image_url?: string;
}

interface Cart {
  cart_id: number;
  user_id?: number;
  session_id?: string;
  status: string;
  item_count: number;
  total_amount: number;
  created_at?: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
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
  retryCount = 0;
  maxRetries = 3;

  // Delivery information
  deliveryOptions = [
    { id: 'nairobi', location: 'Nairobi', estimate: '1-2 business days', cost: 0 },
    { id: 'nyeri', location: 'Nyeri', estimate: '2-3 business days', cost: 200 },
    { id: 'other', location: 'Other Areas', estimate: '3-5 business days', cost: 500 }
  ];
  selectedDelivery = 'nairobi';

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
      this.loadCart();
    } else {
      this.loading = false;
    }
  }

  /**
   * Enhanced loadCurrentUser with better error handling
   */
  loadCurrentUser(): void {
    if (!this.isBrowser) return;
    
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        console.log('✅ User loaded:', this.currentUser?.user_id);
      } else {
        console.log('ℹ️ No user found in localStorage - proceeding as guest');
      }
    } catch (error) {
      console.error('❌ Failed to load user from localStorage:', error);
      // Don't block cart loading if user loading fails
    }
  }

  /**
   * Enhanced cart loading with retry logic
   */
  loadCart(): void {
    this.loading = true;
    this.error = null;
    this.retryCount = 0;

    if (!this.isBrowser) {
      this.loading = false;
      return;
    }

    console.log('🛒 Starting cart loading process...');

    this.attemptCartLoad();
  }

  /**
   * Attempt cart load with retry logic
   */
  private attemptCartLoad(): void {
    if (this.retryCount >= this.maxRetries) {
      this.handleError('Failed to load cart after multiple attempts. Please refresh the page.');
      return;
    }

    this.retryCount++;
    console.log(`🔄 Cart load attempt ${this.retryCount}/${this.maxRetries}`);

    if (this.currentUser?.user_id) {
      this.loadUserCart();
    } else {
      this.loadGuestCart();
    }
  }

  /**
   * Load user cart with comprehensive error handling
   */
  private loadUserCart(): void {
    console.log('🛒 Loading cart for user:', this.currentUser.user_id);
    
    this.apiService.getCartByUserId(this.currentUser.user_id).subscribe({
      next: (cart) => {
        console.log('✅ User cart loaded successfully:', cart);
        this.cart = cart;
        this.loadCartItems(cart.cart_id);
      },
      error: (err) => {
        console.error('❌ Failed to load user cart:', err);
        
        if (err.status === 404) {
          console.log('🆕 No cart found for user, creating new one...');
          this.createCart(this.currentUser.user_id, null);
        } else if (err.status === 0) {
          this.handleError('Network error. Please check your connection and try again.');
        } else {
          this.retryWithBackoff();
        }
      }
    });
  }

  /**
   * Load guest cart with comprehensive error handling
   */
  private loadGuestCart(): void {
    const sessionId = this.getOrCreateSessionId();
    console.log('🛒 Loading guest cart with session:', sessionId);
    
    this.apiService.getCartBySessionId(sessionId).subscribe({
      next: (cart) => {
        console.log('✅ Guest cart loaded successfully:', cart);
        this.cart = cart;
        this.loadCartItems(cart.cart_id);
      },
      error: (err) => {
        console.error('❌ Failed to load guest cart:', err);
        
        if (err.status === 404) {
          console.log('🆕 No guest cart found, creating new one...');
          this.createCart(null, sessionId);
        } else if (err.status === 0) {
          this.handleError('Network error. Please check your connection and try again.');
        } else {
          this.retryWithBackoff();
        }
      }
    });
  }

  /**
   * Retry with exponential backoff
   */
  private retryWithBackoff(): void {
    const backoffTime = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
    console.log(`⏳ Retrying in ${backoffTime}ms...`);
    
    setTimeout(() => {
      this.attemptCartLoad();
    }, backoffTime);
  }

  /**
   * Create cart with enhanced error handling
   */
  createCart(userId: number | null, sessionId: string | null): void {
    const cartData = userId ? { user_id: userId } : { session_id: sessionId };

    console.log('🛒 Creating new cart:', cartData);

    this.apiService.createCart(cartData).subscribe({
      next: (response) => {
        console.log('✅ New cart created successfully:', response.cart);
        this.cart = response.cart;
        this.cartItems = [];
        this.cartCount = 0;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        console.error('❌ Failed to create cart:', err);
        this.handleError('Failed to create shopping cart. Please try again.');
      }
    });
  }

  /**
   * Load cart items with error handling
   */
  loadCartItems(cartId: number): void {
    console.log('🛒 Loading cart items for cart:', cartId);
    
    this.apiService.getCartItemsByCartId(cartId.toString()).subscribe({
      next: (items) => {
        console.log('✅ Cart items loaded:', items.length, 'items');
        this.cartItems = this.processCartItems(items);
        this.cartCount = this.cartItems.length;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        console.error('❌ Failed to load cart items:', err);
        this.handleError('Failed to load cart items. Some items may not be displayed.');
        
        // Still set loading to false so user can see the interface
        this.loading = false;
      }
    });
  }

  /**
   * Process cart items to ensure data consistency
   */
  private processCartItems(items: any[]): CartItem[] {
    return items.map(item => ({
      ...item,
      subtotal: item.subtotal || (item.quantity * (item.current_sale_price || item.unit_price)),
      current_price: item.current_price || item.unit_price,
      available_stock: item.available_stock || 10 // Default stock if not provided
    }));
  }

  /**
   * Safe session ID creation
   */
  private getOrCreateSessionId(): string {
    if (!this.isBrowser) return 'temp_session_ssr';
    
    try {
      let sessionId = localStorage.getItem('guestSessionId');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guestSessionId', sessionId);
        console.log('🆕 New guest session created:', sessionId);
      }
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to create session ID:', error);
      return 'temp_session_error';
    }
  }

  /**
   * Enhanced error handling
   */
  private handleError(message: string): void {
    this.error = message;
    this.loading = false;
    console.error('🛒 Cart Error:', message);
  }

  /**
   * Retry loading cart (called from template)
   */
  retryLoadCart(): void {
    console.log('🔄 Manual retry requested by user');
    this.loadCart();
  }

  /**
   * Clear error and retry
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Create a new empty cart as fallback
   */
  createEmptyCart(): void {
    if (this.currentUser?.user_id) {
      this.createCart(this.currentUser.user_id, null);
    } else {
      const sessionId = this.getOrCreateSessionId();
      this.createCart(null, sessionId);
    }
  }

  /**
   * Calculate subtotal safely
   */
  get subtotal(): number {
    if (!this.cartItems || this.cartItems.length === 0) return 0;
    return this.cartItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  /**
   * Calculate shipping based on selected option
   */
  get shipping(): number {
    if (this.subtotal > 5000) return 0;
    const selected = this.deliveryOptions.find(opt => opt.id === this.selectedDelivery);
    return selected ? selected.cost : 500;
  }

  get tax(): number {
    return this.subtotal * 0.16; // 16% VAT
  }

  get total(): number {
    return this.subtotal + this.shipping + this.tax - this.couponDiscount;
  }

  /**
   * Update item quantity with validation
   */
  updateQuantity(item: CartItem, change: number): void {
    if (!this.isBrowser) {
      alert('Cart operations not available during server-side rendering');
      return;
    }

    const newQuantity = item.quantity + change;

    if (newQuantity < 1) {
      this.removeItem(item);
      return;
    }

    if (newQuantity > item.available_stock) {
      alert(`Only ${item.available_stock} items available in stock`);
      return;
    }

    console.log(`🔄 Updating quantity for item ${item.cart_item_id}: ${item.quantity} → ${newQuantity}`);

    this.apiService.updateCartItem(item.cart_item_id.toString(), { quantity: newQuantity }).subscribe({
      next: (response) => {
        console.log('✅ Quantity updated successfully');
        item.quantity = newQuantity;
        item.subtotal = item.quantity * (item.current_sale_price || item.unit_price);
        
        // Update cart summary
        this.updateCartSummary();
      },
      error: (err) => {
        console.error('❌ Failed to update quantity:', err);
        const errorMessage = err.error?.message || 'Failed to update quantity';
        alert(errorMessage);
        
        // Reload cart to sync state
        if (this.cart) {
          this.loadCartItems(this.cart.cart_id);
        }
      }
    });
  }

  /**
   * Update cart summary from server
   */
  private updateCartSummary(): void {
    if (!this.cart?.cart_id) return;

    this.apiService.getCartSummary(this.cart.cart_id.toString()).subscribe({
      next: (summary) => {
        if (this.cart) {
          this.cart.item_count = summary.total_items;
          this.cart.total_amount = summary.subtotal;
        }
      },
      error: (err) => {
        console.error('Failed to update cart summary:', err);
      }
    });
  }

  /**
   * Remove item from cart with confirmation
   */
  removeItem(item: CartItem): void {
    if (!this.isBrowser) {
      alert('Cart operations not available during server-side rendering');
      return;
    }

    if (!confirm(`Remove "${item.product_title}" from your cart?`)) {
      return;
    }

    console.log(`🗑️ Removing item from cart: ${item.cart_item_id}`);

    this.apiService.removeCartItem(item.cart_item_id.toString()).subscribe({
      next: () => {
        console.log('✅ Item removed successfully');
        this.cartItems = this.cartItems.filter(i => i.cart_item_id !== item.cart_item_id);
        this.cartCount = this.cartItems.length;
        
        // Update cart summary
        this.updateCartSummary();
        
        // Show success message
        alert(`"${item.product_title}" removed from cart`);
      },
      error: (err) => {
        console.error('❌ Failed to remove item:', err);
        const errorMessage = err.error?.message || 'Failed to remove item';
        alert(errorMessage);
      }
    });
  }

  /**
   * Apply coupon code with validation
   */
  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      alert('Please enter a coupon code');
      return;
    }

    if (this.couponApplied) {
      alert('Coupon already applied');
      return;
    }

    // Simple coupon validation - in real app, this would call an API
    const validCoupons = {
      'SAVE10': 0.1,  // 10% discount
      'WELCOME15': 0.15, // 15% discount
      'FREESHIP': 'free_shipping', // Free shipping
      'TECH20': 0.2 // 20% discount
    };

    const coupon = validCoupons[this.couponCode.toUpperCase() as keyof typeof validCoupons];

    if (coupon) {
      if (coupon === 'free_shipping') {
        this.couponDiscount = this.shipping;
      } else {
        // Ensure coupon is numeric before performing arithmetic
        const rate = typeof coupon === 'number' ? coupon : Number(coupon);
        this.couponDiscount = isNaN(rate) ? 0 : this.subtotal * rate;
      }
      this.couponApplied = true;
      alert('Coupon applied successfully!');
      console.log('✅ Coupon applied:', this.couponCode, 'Discount:', this.couponDiscount);
    } else {
      alert('Invalid coupon code. Try SAVE10, WELCOME15, or FREESHIP.');
    }
  }

  /**
   * Remove applied coupon
   */
  removeCoupon(): void {
    this.couponDiscount = 0;
    this.couponApplied = false;
    this.couponCode = '';
    alert('Coupon removed');
  }

  /**
   * Proceed to checkout with validation
   */
  proceedToCheckout(): void {
    if (!this.isBrowser) {
      alert('Checkout not available during server-side rendering');
      return;
    }

    if (this.cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Check stock availability
    const outOfStockItems = this.cartItems.filter(item => item.available_stock < item.quantity);
    if (outOfStockItems.length > 0) {
      const itemNames = outOfStockItems.map(item => item.product_title).join(', ');
      alert(`The following items have insufficient stock: ${itemNames}. Please update quantities before checkout.`);
      return;
    }

    if (!this.currentUser) {
      // Redirect to login with return URL
      const returnUrl = '/checkout/details';
      this.router.navigate(['/login'], { queryParams: { returnUrl } });
      return;
    }

    console.log('🚀 Proceeding to checkout with cart:', this.cart?.cart_id);

    // Navigate to checkout page with cart info
    this.router.navigate(['/checkout/details'], {
      state: {
        cartId: this.cart?.cart_id,
        total: this.total,
        items: this.cartItems,
        couponDiscount: this.couponDiscount,
        subtotal: this.subtotal,
        shipping: this.shipping,
        tax: this.tax
      }
    });
  }

  /**
   * Continue shopping
   */
  continueShopping(): void {
    this.router.navigate(['/categories']);
  }

  /**
   * Check if cart is empty
   */
  get isCartEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  /**
   * Get display price for an item (sale price or regular price)
   */
  getItemPrice(item: CartItem): number {
    return item.current_sale_price || item.unit_price;
  }

  /**
   * Calculate item subtotal
   */
  getItemSubtotal(item: CartItem): number {
    return item.quantity * this.getItemPrice(item);
  }

  /**
   * Get product image URL with fallback
   */
  getProductImage(item: CartItem): string {
    return item.image_url || 'assets/images/placeholder-product.png';
  }

  /**
   * Debug method to check cart status
   */
  debugCart(): void {
    console.group('🛒 Cart Debug Info');
    console.log('isBrowser:', this.isBrowser);
    console.log('currentUser:', this.currentUser);
    console.log('cart:', this.cart);
    console.log('cartItems:', this.cartItems);
    console.log('cartCount:', this.cartCount);
    console.log('subtotal:', this.subtotal);
    console.log('total:', this.total);
    console.log('retryCount:', this.retryCount);
    
    if (this.isBrowser) {
      console.log('guestSessionId:', localStorage.getItem('guestSessionId'));
      console.log('currentUser from localStorage:', localStorage.getItem('currentUser'));
    }
    console.groupEnd();
  }

  /**
   * Test API connectivity
   */
  testApiConnectivity(): void {
    console.log('🧪 Testing API connectivity...');
    
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        console.log('✅ API is reachable. Categories loaded:', categories.length);
        alert('API connection is working!');
      },
      error: (err) => {
        console.error('❌ API is not reachable:', err);
        alert('API connection failed. Check console for details.');
      }
    });
  }

  // Navigation methods
  onSearch(): void {
    alert('Search functionality is not implemented yet.');
  }

  onCategoryClick(category: string): void {
    this.router.navigate(['/categories', category.toLowerCase()]);
  }

  goToCart(): void {
    // Already on cart page
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    if (!this.cart?.cart_id) return;

    if (!confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }

    this.apiService.clearCart(this.cart.cart_id.toString()).subscribe({
      next: () => {
        this.cartItems = [];
        this.cartCount = 0;
        this.couponApplied = false;
        this.couponDiscount = 0;
        alert('Cart cleared successfully');
      },
      error: (err) => {
        console.error('Failed to clear cart:', err);
        alert('Failed to clear cart');
      }
    });
  }
}