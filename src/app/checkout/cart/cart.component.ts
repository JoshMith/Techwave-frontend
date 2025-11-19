import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

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
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
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
      this.subscribeToCartState();
      this.initializeCart();
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
   * Subscribe to cart state changes from service
   */
  private subscribeToCartState(): void {
    this.cartSubscription = this.cartService.cartState$.subscribe(state => {
      // console.log('🔄 Cart state updated:', state);

      // Update local state from service
      this.cartCount = state.item_count;
      this.isGuest = state.isGuest;

      if (state.error) {
        this.error = state.error;
      }

      // If cart_id changed, reload items
      if (state.cart_id && state.cart_id !== this.cart?.cart_id) {
        this.cart = this.cart || {} as Cart;
        this.cart.cart_id = state.cart_id;
        this.cart.item_count = state.item_count;
        this.cart.total_amount = state.total_amount;
      }
    });
  }

  /**
   * Load current authenticated user
   */
  private loadCurrentUser(): void {
    if (!this.isBrowser) return;

    try {
      const userStr = this.apiService.getCurrentUser().subscribe(user => {
        this.currentUser = user;
        if (userStr) {
          this.isGuest = false;
          console.log('✅ User loaded:', this.currentUser.user?.user_id);
        } else {
          console.log('ℹ️ No user found - proceeding as guest');
          this.isGuest = true;
        }
      });
      } catch (error) {
        console.error('❌ Failed to load user. Login again:', error);
        this.isGuest = true;
      }
    }

  /**
   * Initialize cart using CartService
   */
  async initializeCart(): Promise < void> {
      this.loading = true;
      this.error = null;

      if(!this.isBrowser) {
      this.loading = false;
      return;
    }

    // console.log('🛒 Starting cart initialization...');

    try {
      // Use CartService to ensure cart is ready
      const isReady = await this.cartService.ensureCartReady();

      if (!isReady) {
        this.showErrorAndCreateEmpty('Unable to initialize cart. Please refresh the page.');
        return;
      }

      // Get current cart from service
      const currentCart = this.cartService.getCurrentCart();

      if (!currentCart) {
        this.showErrorAndCreateEmpty('No cart found. Creating a new cart...');
        return;
      }

      this.cart = {
        cart_id: currentCart.cart_id,
        user_id: currentCart.user_id,
        session_id: currentCart.session_id,
        status: currentCart.status,
        item_count: 0,
        total_amount: 0,
        created_at: currentCart.created_at
      };

      // console.log('✅ Cart initialized:', this.cart);

      // Load cart items
      await this.loadCartItems(this.cart.cart_id);

    } catch (error) {
      console.error('❌ Error initializing cart:', error);
      this.handleError('Failed to initialize cart. Please try again.');
    }
  }

  loadCart(): void {
    if (this.cart && this.cart.cart_id) {
      this.loadCartItems(this.cart.cart_id);
    }
  }

  /**
   * Load cart items and update summary
   */
  private async loadCartItems(cartId: number): Promise<void> {
    // console.log('🛒 Loading cart items for cart:', cartId);

    this.apiService.getCartItemsByCartId(cartId.toString()).subscribe({
      next: (items) => {
        // console.log('✅ Cart items loaded:', items.length, 'items');
        this.cartItems = this.processCartItems(items);
        this.cartCount = this.cartItems.length;

        // Update cart summary from service
        this.cartService.refreshCartSummary();

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
          this.handleError('Failed to load cart items.');
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
   * Calculate subtotal from items
   */
  get subtotal(): number {
    if (!this.cartItems || this.cartItems.length === 0) return 0;

    const total = this.cartItems.reduce((sum, item) => {
      const price = item.current_sale_price ?? item.current_price ?? item.unit_price ?? 0;
      const qty = item.quantity ?? 0;
      const itemSubtotal = qty * price;

      // keep item.subtotal in sync
      item.subtotal = Number(itemSubtotal || 0);

      return sum + item.subtotal;
    }, 0);

    // round to 2 decimals
    return Math.round(total * 100) / 100;
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
    return this.subtotal * 0; // 16% VAT
  }

  /**
   * Calculate total
   */
  get total(): number {
    return this.subtotal + this.shipping + this.tax - this.couponDiscount;
  }

  /**
   * Update item quantity with service sync
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

    // console.log(`🔄 Updating quantity for item ${item.cart_item_id}: ${item.quantity} → ${newQuantity}`);

    // Store old quantity for rollback
    const oldQuantity = item.quantity;
    const oldSubtotal = item.subtotal;

    // Optimistic update
    item.quantity = newQuantity;
    item.subtotal = item.quantity * (item.current_sale_price || item.unit_price);

    this.apiService.updateCartItem(item.cart_item_id.toString(), { quantity: newQuantity }).subscribe({
      next: (response) => {
        // console.log('✅ Quantity updated successfully');

        // Update cart summary via service
        this.cartService.refreshCartSummary();

        // Reload items to ensure consistency
        if (this.cart) {
          this.loadCartItems(this.cart.cart_id);
        }
      },
      error: (err) => {
        console.error('❌ Failed to update quantity:', err);

        // Rollback optimistic update
        item.quantity = oldQuantity;
        item.subtotal = oldSubtotal;

        const errorMessage = err.error?.message || 'Failed to update quantity';
        alert(errorMessage);
      }
    });
  }

  /**
   * Remove item from cart with service sync
   */
  removeItem(item: CartItem): void {
    if (!this.isBrowser) {
      alert('Cart operations not available during server-side rendering');
      return;
    }

    if (!confirm(`Remove "${item.product_title}" from your cart?`)) {
      return;
    }

    // console.log(`🗑️ Removing item from cart: ${item.cart_item_id}`);

    this.apiService.removeCartItem(item.cart_item_id.toString()).subscribe({
      next: () => {
        console.log('✅ Item removed successfully');

        // Remove from local array
        this.cartItems = this.cartItems.filter(i => i.cart_item_id !== item.cart_item_id);
        this.cartCount = this.cartItems.length;

        // Update cart summary via service
        this.cartService.refreshCartSummary();

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

    // console.log('🚀 Proceeding to checkout with cart:', this.cart?.cart_id);

    // Prepare checkout data
    const checkoutData = {
      cartId: this.cart?.cart_id,
      total: this.total,
      items: this.cartItems,
      couponDiscount: this.couponDiscount,
      subtotal: this.subtotal,
      shipping: this.shipping,
      tax: this.tax,
      isGuest: this.isGuest,
      guestUser: this.cartService.getGuestUser()
    };

    // Store in localStorage
    if (this.isBrowser) {
      localStorage.setItem('checkout_data', JSON.stringify(checkoutData));
    }

    // Navigate to checkout
    this.router.navigate(['/checkout/details'], {
      state: checkoutData
    });
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

        // Update service
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
   * Show error and create empty cart state
   */
  private showErrorAndCreateEmpty(message: string): void {
    this.error = message;
    this.cartItems = [];
    this.cartCount = 0;
    this.loading = false;

    setTimeout(() => {
      this.error = null;
    }, 3000);
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
   * Get display price for an item
   */
  getItemPrice(item: CartItem): number {
    return item.current_sale_price || item.unit_price;
  }

  /**
   * Check if cart is empty
   */
  get isCartEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  // Navigation methods
  onSearch(): void {
    alert('Search functionality is not implemented yet.');
  }

  onCategoryClick(category: string): void {
    this.router.navigate(['/categories', category.toLowerCase()]);
  }

  goToCart(): void {
    this.initializeCart();
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  debugCart(): void {
    console.group('🛒 Cart Component Debug');
    console.log('cartItems:', this.cartItems);
    console.log('cartCount:', this.cartCount);
    console.log('subtotal:', this.subtotal);
    console.log('total:', this.total);
    console.log('cart:', this.cart);
    console.groupEnd();

    this.cartService.debugCartStatus();
  }
}