import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

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

interface GuestUser {
  session_id: string;
  created_at: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  cart: Cart | null = null;
  cartCount = 0;
  couponCode = '';
  couponApplied = false;
  couponDiscount = 0;
  loading = false;
  error: string | null = null;
  currentUser: any = null;
  guestUser: GuestUser | null = null;
  isBrowser: boolean;
  isGuest: boolean = true;

  // Delivery information
  deliveryOptions = [
    { id: 'nairobi', location: 'Nairobi', estimate: '1-2 business days', cost: 0 },
    { id: 'nyeri', location: 'Nyeri', estimate: '2-3 business days', cost: 200 },
    { id: 'other', location: 'Other Areas', estimate: '3-5 business days', cost: 500 }
  ];
  selectedDelivery = 'nairobi';

  private cartSubscription?: Subscription;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadCurrentUser();
      this.loadGuestUser();
      this.subscribeToCartState();
      this.loadCart();
    } else {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  /**
   * Subscribe to cart state changes
   */
  private subscribeToCartState(): void {
    this.cartSubscription = this.cartService.cartState$.subscribe(state => {
      this.cartCount = state.item_count;
      this.isGuest = state.isGuest;
      
      if (state.error) {
        this.error = state.error;
      }
    });
  }

  /**
   * Load current authenticated user
   */
  private loadCurrentUser(): void {
    if (!this.isBrowser) return;
    
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        this.isGuest = false;
        console.log('✅ User loaded:', this.currentUser?.user_id);
      } else {
        console.log('ℹ️ No user found - proceeding as guest');
        this.isGuest = true;
      }
    } catch (error) {
      console.error('❌ Failed to load user from localStorage:', error);
      this.isGuest = true;
    }
  }

  /**
   * Load guest user from localStorage
   */
  private loadGuestUser(): void {
    if (!this.isBrowser || this.currentUser) return;
    
    try {
      const guestStr = localStorage.getItem('guestUser');
      if (guestStr) {
        this.guestUser = JSON.parse(guestStr);
        console.log('✅ Guest user loaded:', this.guestUser?.session_id);
      }
    } catch (error) {
      console.error('❌ Failed to load guest user:', error);
    }
  }

  /**
   * Load cart with improved error handling
   */
  async loadCart(): Promise<void> {
    this.loading = true;
    this.error = null;

    if (!this.isBrowser) {
      this.loading = false;
      return;
    }

    console.log('🛒 Starting cart loading process...');

    try {
      // Ensure cart is ready
      const isReady = await this.cartService.ensureCartReady();
      
      if (!isReady) {
        this.showErrorAndCreateEmpty('Unable to load cart. Creating a new cart...');
        return;
      }

      // Get current cart from service
      const currentCart = this.cartService.getCurrentCart();
      
      if (!currentCart) {
        this.showErrorAndCreateEmpty('No cart found. Creating a new cart...');
        return;
      }

      this.cart = currentCart as Cart;
      console.log('✅ Cart loaded:', this.cart);

      // Load cart items
      await this.loadCartItems(this.cart.cart_id);

    } catch (error) {
      console.error('❌ Error loading cart:', error);
      this.handleError('Failed to load cart. Please try again.');
    }
  }

  /**
   * Load cart items
   */
  private async loadCartItems(cartId: number): Promise<void> {
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
        
        if (err.status === 404) {
          // Cart exists but has no items
          this.cartItems = [];
          this.cartCount = 0;
          this.loading = false;
          this.error = null;
        } else {
          this.handleError('Failed to load cart items. Some items may not be displayed.');
          this.loading = false;
        }
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
      available_stock: item.available_stock || 10
    }));
  }

  /**
   * Show error and create empty cart state
   */
  private showErrorAndCreateEmpty(message: string): void {
    this.error = message;
    this.cartItems = [];
    this.cartCount = 0;
    this.loading = false;
    
    // Try to create a cart
    setTimeout(() => {
      this.error = null;
    }, 3000);
  }

  /**
   * Calculate subtotal
   */
  get subtotal(): number {
    if (!this.cartItems || this.cartItems.length === 0) return 0;
    return this.cartItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  /**
   * Calculate shipping
   */
  get shipping(): number {
    if (this.subtotal > 5000) return 0;
    const selected = this.deliveryOptions.find(opt => opt.id === this.selectedDelivery);
    return selected ? selected.cost : 500;
  }

  /**
   * Calculate tax
   */
  get tax(): number {
    return this.subtotal * 0.16; // 16% VAT
  }

  /**
   * Calculate total
   */
  get total(): number {
    return this.subtotal + this.shipping + this.tax - this.couponDiscount;
  }

  /**
   * Update item quantity
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
   * Update cart summary
   */
  private updateCartSummary(): void {
    if (!this.cart?.cart_id) return;

    this.apiService.getCartSummary(this.cart.cart_id.toString()).subscribe({
      next: (summary) => {
        if (this.cart) {
          this.cart.item_count = summary.total_items;
          this.cart.total_amount = summary.subtotal;
        }
        // Also refresh the cart service state
        this.cartService.refreshCartSummary();
      },
      error: (err) => {
        console.error('Failed to update cart summary:', err);
      }
    });
  }

  /**
   * Remove item from cart
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
   * Apply coupon
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

    const validCoupons: { [key: string]: number | string } = {
      'SAVE10': 0.1,
      'WELCOME15': 0.15,
      'FREESHIP': 'free_shipping',
      'TECH20': 0.2
    };

    const coupon = validCoupons[this.couponCode.toUpperCase()];

    if (coupon) {
      if (coupon === 'free_shipping') {
        this.couponDiscount = this.shipping;
      } else {
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
   * Proceed to checkout
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

    console.log('🚀 Proceeding to checkout with cart:', this.cart?.cart_id);

    // Prepare checkout data to pass to details page
    const checkoutData = {
      cartId: this.cart?.cart_id,
      total: this.total,
      items: this.cartItems,
      couponDiscount: this.couponDiscount,
      subtotal: this.subtotal,
      shipping: this.shipping,
      tax: this.tax,
      isGuest: this.isGuest,
      guestUser: this.guestUser
    };

    // Store in localStorage for persistence
    if (this.isBrowser) {
      localStorage.setItem('checkout_data', JSON.stringify(checkoutData));
    }

    // Navigate to checkout details page
    // Guest users can proceed without logging in
    this.router.navigate(['/checkout/details'], {
      state: checkoutData
    });
  }

  /**
   * Continue shopping
   */
  continueShopping(): void {
    this.router.navigate(['/shop']);
  }

  /**
   * Check if cart is empty
   */
  get isCartEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  /**
   * Get display price for an item
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
   * Get product image URL
   */
  getProductImage(item: CartItem): string {
    return item.image_url || 'assets/images/placeholder-product.png';
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
        this.cartService.refreshCartSummary();
        alert('Cart cleared successfully');
      },
      error: (err) => {
        console.error('Failed to clear cart:', err);
        alert('Failed to clear cart');
      }
    });
  }

  /**
   * Retry loading cart
   */
  retryLoadCart(): void {
    console.log('🔄 Manual retry requested by user');
    this.loadCart();
  }

  /**
   * Handle errors
   */
  private handleError(message: string): void {
    this.error = message;
    this.loading = false;
    console.error('🛒 Cart Error:', message);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Debug cart status
   */
  debugCart(): void {
    console.group('🛒 Cart Debug Info');
    console.log('isBrowser:', this.isBrowser);
    console.log('currentUser:', this.currentUser);
    console.log('guestUser:', this.guestUser);
    console.log('isGuest:', this.isGuest);
    console.log('cart:', this.cart);
    console.log('cartItems:', this.cartItems);
    console.log('cartCount:', this.cartCount);
    console.log('subtotal:', this.subtotal);
    console.log('total:', this.total);
    
    if (this.isBrowser) {
      console.log('guestUser from localStorage:', localStorage.getItem('guestUser'));
      console.log('currentUser from localStorage:', localStorage.getItem('currentUser'));
    }
    console.groupEnd();
    
    // Also debug cart service
    this.cartService.debugCartStatus();
  }

  // Navigation methods
  onSearch(): void {
    alert('Search functionality is not implemented yet.');
  }

  onCategoryClick(category: string): void {
    this.router.navigate(['/categories', category.toLowerCase()]);
  }

  goToCart(): void {
    // Already on cart page - refresh
    this.loadCart();
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}