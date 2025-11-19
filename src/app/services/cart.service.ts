import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { isPlatformBrowser } from '@angular/common';

interface CartState {
  cart_id: number | null;
  item_count: number;
  total_amount: number;
  isLoading: boolean;
  error: string | null;
  isGuest: boolean;
}

interface Cart {
  cart_id: number;
  user_id?: number;
  session_id?: string;
  status: string;
  created_at: string;
}

interface GuestUser {
  session_id: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private isBrowser: boolean;
  private cartStateSubject = new BehaviorSubject<CartState>({
    cart_id: null,
    item_count: 0,
    total_amount: 0,
    isLoading: false,
    error: null,
    isGuest: true
  });

  public cartState$ = this.cartStateSubject.asObservable();
  private currentCart: Cart | null = null;
  private currentUser: any = null;
  private guestUser: GuestUser | null = null;
  private initializationPromise: Promise<boolean> | null = null;

  constructor(
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.loadCurrentUser();
      this.loadGuestUser();
    } else {
      this.setLoading(false);
    }
  }


  /**
* Load authenticated user from API
*/
  private loadCurrentUser(): void {
    if (!this.isBrowser) return;

    try {
      const userStr = localStorage.getItem('currentUser');
      const sellerStr = sessionStorage.getItem('sellerData');

      if (userStr) {
        const storedUser = JSON.parse(userStr);
        // Reconstruct shape similar to the former API response
        this.currentUser = {
          authenticated: true,
          user: storedUser,
          ...(sellerStr ? { seller: JSON.parse(sellerStr) } : {})
        };

        this.updateCartState({ isGuest: false });

        // Best-effort logging of available user id(s)
        const uid =
          storedUser?.user_id ?? storedUser?.user?.user_id ?? storedUser;
        console.log('✅ Authenticated user loaded from storage:', uid);
      } else {
        this.currentUser = null;
        this.updateCartState({ isGuest: true });
        console.log('ℹ️ No authenticated user in storage - continuing as guest');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load current user from storage:', error);
      this.currentUser = null;
      this.updateCartState({ isGuest: true });
    }
  }

  /**
   * Load or create guest user session
   */
  private loadGuestUser(): void {
    if (!this.isBrowser) return;

    try {
      const guestStr = localStorage.getItem('guestUser');

      if (guestStr) {
        this.guestUser = JSON.parse(guestStr);
        console.log('✅ Guest user loaded:', this.guestUser?.session_id);
      } else {
        this.guestUser = this.createGuestUser();
        localStorage.setItem('guestUser', JSON.stringify(this.guestUser));
        console.log('🆕 New guest user created:', this.guestUser.session_id);
      }

      if (!this.currentUser) {
        this.updateCartState({ isGuest: true });
      }
    } catch (error) {
      console.warn('⚠️ Failed to load/create guest user:', error);
      this.guestUser = this.createGuestUser();
    }
  }

  /**
   * Create a new guest user with unique session ID
   */
  private createGuestUser(): GuestUser {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 11);
    const session_id = `session_${timestamp}_${randomStr}`;

    return {
      session_id,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Initialize cart with proper error handling
   */
  public initializeCart(): Promise<boolean> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (!this.isBrowser) {
      console.log('⚠️ SSR: Skipping cart initialization');
      return Promise.resolve(false);
    }

    if (this.currentCart?.cart_id) {
      console.log('✅ Cart already initialized:', this.currentCart.cart_id);
      this.refreshCartSummary();
      return Promise.resolve(true);
    }

    this.setLoading(true);
    this.clearError();

    // console.log('🛒 Starting cart initialization...');

    this.initializationPromise = new Promise<boolean>((resolve) => {
      if (this.currentUser?.user_id) {
        this.loadUserCart().then(result => resolve(result));
      } else {
        this.loadGuestCart().then(result => resolve(result));
      }
    }).finally(() => {
      this.initializationPromise = null;
    });

    return this.initializationPromise;
  }

  /**
   * Load cart for authenticated user
   */
  private loadUserCart(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🛒 Loading cart for user:', this.currentUser.user.user.user_id);

      this.apiService.getCartByUserId(this.currentUser.user.user_id).subscribe({
        next: (cart) => {
          this.handleCartLoaded(cart);
          resolve(true);
        },
        error: (err) => {
          console.warn('⚠️ User cart not found:', err.status);
          if (err.status === 404) {
            this.createCartForUser(this.currentUser.user.user_id).then(resolve);
          } else {
            this.handleError('Failed to load user cart');
            resolve(false);
          }
        }
      });
    });
  }

  /**
   * Load cart for guest user
   */
  private loadGuestCart(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.guestUser) {
        this.loadGuestUser();
      }

      const sessionId = this.guestUser?.session_id;

      if (!sessionId) {
        console.error('❌ No session ID available for guest');
        this.handleError('Failed to create guest session');
        resolve(false);
        return;
      }

      // console.log('🛒 Loading guest cart with session:', sessionId);

      this.apiService.getCartBySessionId(sessionId).subscribe({
        next: (cart) => {
          console.log('✅ Guest cart found:', cart);
          this.handleCartLoaded(cart);
          resolve(true);
        },
        error: (err) => {
          console.warn('⚠️ Guest cart not found:', err.status);
          if (err.status === 404) {
            this.createCartForGuest(sessionId).then(resolve);
          } else {
            this.handleError('Failed to load guest cart');
            resolve(false);
          }
        }
      });
    });
  }

  /**
   * Create cart for authenticated user
   */
  private createCartForUser(userId: number): Promise<boolean> {
    return new Promise((resolve) => {
      const cartData = { user_id: userId };
      console.log('🛒 Creating cart for user:', cartData);

      this.apiService.createCart(cartData).subscribe({
        next: (response) => {
          console.log('✅ User cart created:', response.cart);
          this.handleCartLoaded(response.cart);
          resolve(true);
        },
        error: (err) => {
          console.error('❌ Failed to create user cart:', err);
          this.handleError('Failed to create cart');
          resolve(false);
        }
      });
    });
  }

  /**
   * Create cart for guest user
   */
  private createCartForGuest(sessionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const cartData = { session_id: sessionId };
      console.log('🛒 Creating cart for guest:', cartData);

      this.apiService.createCart(cartData).subscribe({
        next: (response) => {
          console.log('✅ Guest cart created:', response.cart);
          this.handleCartLoaded(response.cart);
          resolve(true);
        },
        error: (err) => {
          console.error('❌ Failed to create guest cart:', err);
          this.handleError('Failed to create cart');
          resolve(false);
        }
      });
    });
  }

  /**
   * Handle successful cart loading
   */
  private handleCartLoaded(cart: Cart): void {
    console.log('✅ Cart loaded successfully:', cart);
    this.currentCart = cart;
    this.updateCartState({
      cart_id: cart.cart_id,
      item_count: 0,
      total_amount: 0,
      isGuest: !cart.user_id
    });
    this.refreshCartSummary();
    this.setLoading(false);
  }

  /**
   * Ensure cart is ready before operations
   */
  public async ensureCartReady(): Promise<boolean> {
    if (!this.isBrowser) {
      console.log('⚠️ SSR: Cart operations not available');
      return false;
    }

    if (this.currentCart?.cart_id) {
      console.log('✅ Cart already ready:', this.currentCart.cart_id);
      return true;
    }

    // console.log('🔄 Ensuring cart is ready...');
    return await this.initializeCart();
  }

  /**
   * Add item to cart with proper initialization
   */
  public addToCart(productId: number, quantity: number = 1): Observable<any> {
    return new Observable(observer => {
      if (!this.isBrowser) {
        observer.error({ message: 'Cart operations not available during SSR' });
        observer.complete();
        return;
      }

      this.ensureCartReady().then(isReady => {
        if (!isReady || !this.currentCart?.cart_id) {
          observer.error({ message: 'Failed to initialize cart. Please try again.' });
          observer.complete();
          return;
        }

        const cartItemData = {
          cart_id: this.currentCart.cart_id,
          product_id: productId,
          quantity: quantity
        };

        console.log('🛒 Adding to cart:', cartItemData);

        this.apiService.addCartItem(cartItemData).subscribe({
          next: (response) => {
            console.log('✅ Item added to cart:', response);

            // Refresh cart summary immediately after adding
            this.refreshCartSummary();

            observer.next(response);
            observer.complete();
          },
          error: (err) => {
            console.error('❌ Add to cart failed:', err);

            if (err.status === 404) {
              console.log('🔄 Cart not found, reinitializing...');
              this.currentCart = null;
              this.initializeCart();
            }

            observer.error(err);
            observer.complete();
          }
        });
      }).catch(err => {
        observer.error(err);
        observer.complete();
      });
    });
  }

  /**
   * Refresh cart summary - ENHANCED with debouncing
   */
  private refreshTimeout: any = null;

  public refreshCartSummary(): void {
    if (!this.currentCart?.cart_id) {
      console.log('⚠️ No cart to refresh');
      return;
    }

    // Clear any pending refresh
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    // Debounce refresh to avoid excessive API calls
    this.refreshTimeout = setTimeout(() => {
      console.log('🔄 Refreshing cart summary for cart:', this.currentCart!.cart_id);

      this.apiService.getCartSummary(this.currentCart!.cart_id.toString()).subscribe({
        next: (summary) => {
          const newState = {
            cart_id: this.currentCart!.cart_id,
            item_count: summary.totalItems || 0,
            total_amount: summary.subtotal || 0,
            isGuest: !this.currentCart!.user_id
          };

          this.updateCartState(newState);
          console.log('✅ Cart summary refreshed:', newState);
        },
        error: (err) => {
          console.error('❌ Failed to refresh cart summary:', err);

          // If cart not found, reset
          if (err.status === 404) {
            console.log('🔄 Cart not found, resetting...');
            this.currentCart = null;
            this.updateCartState({
              cart_id: null,
              item_count: 0,
              total_amount: 0
            });
          }
        }
      });
    }, 300); // 300ms debounce
  }

  /**
   * Force immediate refresh (no debouncing)
   */
  public forceRefreshCartSummary(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }

    if (!this.currentCart?.cart_id) {
      console.log('⚠️ No cart to refresh');
      return;
    }

    console.log('🔄 Force refreshing cart summary for cart:', this.currentCart.cart_id);

    this.apiService.getCartSummary(this.currentCart.cart_id.toString()).subscribe({
      next: (summary) => {
        const newState = {
          cart_id: this.currentCart!.cart_id,
          item_count: summary.total_items || 0,
          total_amount: summary.subtotal || 0,
          isGuest: !this.currentCart!.user_id
        };

        this.updateCartState(newState);
        console.log('✅ Cart summary force refreshed:', newState);
      },
      error: (err) => {
        console.error('❌ Failed to refresh cart summary:', err);
      }
    });
  }

  /**
   * Get current cart ID
   */
  public getCurrentCartId(): number | null {
    return this.currentCart?.cart_id || null;
  }

  /**
   * Get current cart
   */
  public getCurrentCart(): Cart | null {
    return this.currentCart;
  }

  /**
   * Get guest user info
   */
  public getGuestUser(): GuestUser | null {
    return this.guestUser;
  }

  /**
   * Check if operating as guest
   */
  public isGuestUser(): boolean {
    return !this.currentUser.user && !!this.guestUser;
  }

  /**
   * Update cart state
   */
  private updateCartState(updates: Partial<CartState>): void {
    const currentState = this.cartStateSubject.value;
    const newState = {
      ...currentState,
      ...updates,
      isLoading: false
    };

    console.log('📊 Updating cart state:', newState);
    this.cartStateSubject.next(newState);
  }

  /**
   * Set loading state
   */
  private setLoading(isLoading: boolean): void {
    const currentState = this.cartStateSubject.value;
    this.cartStateSubject.next({
      ...currentState,
      isLoading
    });
  }

  /**
   * Handle errors
   */
  private handleError(message: string): void {
    const currentState = this.cartStateSubject.value;
    this.cartStateSubject.next({
      ...currentState,
      error: message,
      isLoading: false
    });
    console.error('🛒 Cart Error:', message);
  }

  /**
   * Clear errors
   */
  private clearError(): void {
    const currentState = this.cartStateSubject.value;
    if (currentState.error) {
      this.cartStateSubject.next({
        ...currentState,
        error: null
      });
    }
  }

  /**
   * Clear cart
   */
  public clearCart(): void {
    if (!this.currentCart?.cart_id) return;

    this.apiService.clearCart(this.currentCart.cart_id.toString()).subscribe({
      next: () => {
        this.updateCartState({
          item_count: 0,
          total_amount: 0
        });
        console.log('✅ Cart cleared');
      },
      error: (err) => {
        console.error('❌ Failed to clear cart:', err);
      }
    });
  }

  /**
   * Debug cart status
   */
  public debugCartStatus(): void {
    console.group('🛒 Cart Service Debug');
    console.log('isBrowser:', this.isBrowser);
    console.log('currentCart:', this.currentCart);
    console.log('currentUser:', this.currentUser);
    console.log('guestUser:', this.guestUser);
    console.log('cartState:', this.cartStateSubject.value);

    if (this.isBrowser) {
      console.log('guestUser (localStorage):', localStorage.getItem('guestUser'));
      // console.log('currentUser (localStorage):', localStorage.getItem('currentUser'));
    }
    console.groupEnd();
  }

  /**
   * Logout - clear user data but keep guest session
   */
  public logout(): void {
    this.currentUser = null;
    this.currentCart = null;

    if (this.isBrowser) {
      this.guestUser = this.createGuestUser();
      localStorage.setItem('guestUser', JSON.stringify(this.guestUser));
    }

    this.updateCartState({
      cart_id: null,
      item_count: 0,
      total_amount: 0,
      isGuest: true
    });

    // if (this.isBrowser) {
    //   try {
    //     localStorage.removeItem('currentUser');
    //   } catch (error) {
    //     console.warn('⚠️ Failed to clear localStorage:', error);
    //   }
    // }

    console.log('✅ Logged out, new guest session created');
  }
}