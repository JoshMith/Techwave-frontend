import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap, switchMap, take } from 'rxjs/operators';
import { ApiService } from './api.service';
import { isPlatformBrowser } from '@angular/common';

interface CartState {
  cart_id: number | null;
  item_count: number;
  total_amount: number;
  isLoading: boolean;
  error: string | null;
}

interface Cart {
  cart_id: number;
  user_id?: number;
  session_id?: string;
  created_at: string;
}

interface CartItem {
  cart_item_id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  added_at: string;
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
    error: null
  });

  public cartState$ = this.cartStateSubject.asObservable();
  private currentCart: Cart | null = null;
  private currentUser: any = null;

  constructor(
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Only initialize cart in browser environment
    if (this.isBrowser) {
      this.loadCurrentUser();
      this.initializeCart();
    } else {
      // For SSR, set loading to false immediately
      this.setLoading(false);
    }
  }

  /**
   * Safe localStorage access for current user
   */
  private loadCurrentUser(): void {
    if (!this.isBrowser) return;
    
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        console.log('🔄 User loaded from localStorage:', this.currentUser?.user_id);
      }
    } catch (error) {
      console.warn('Failed to load user from localStorage:', error);
    }
  }

  /**
   * Initialize cart with proper error handling and state management
   */
  public initializeCart(): void {
    if (!this.isBrowser) {
      console.log('SSR: Skipping cart initialization');
      return;
    }

    this.setLoading(true);
    this.clearError();

    console.log('🛒 Starting cart initialization...');

    if (this.currentUser?.user_id) {
      this.loadUserCart();
    } else {
      this.loadGuestCart();
    }
  }

  /**
   * Load cart for authenticated user
   */
  private loadUserCart(): void {
    console.log('🛒 Loading cart for user:', this.currentUser.user_id);
    
    this.apiService.getCartByUserId(this.currentUser.user_id).pipe(
      catchError((err) => {
        console.warn('User cart not found, creating new one:', err);
        if (err.status === 404) {
          return this.createCart(this.currentUser.user_id, null);
        }
        this.handleError('Failed to load user cart');
        return throwError(() => err);
      })
    ).subscribe({
      next: (cart) => {
        this.handleCartLoaded(cart);
      },
      error: (err) => {
        this.handleError('Failed to initialize user cart');
      }
    });
  }

  /**
   * Load cart for guest user
   */
  private loadGuestCart(): void {
    const sessionId = this.getOrCreateSessionId();
    console.log('🛒 Loading guest cart with session:', sessionId);
    
    this.apiService.getCartBySessionId(sessionId).pipe(
      catchError((err) => {
        console.warn('Guest cart not found, creating new one:', err);
        if (err.status === 404) {
          return this.createCart(null, sessionId);
        }
        this.handleError('Failed to load guest cart');
        return throwError(() => err);
      })
    ).subscribe({
      next: (cart) => {
        this.handleCartLoaded(cart);
      },
      error: (err) => {
        this.handleError('Failed to initialize guest cart');
      }
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
      item_count: 0, // Will be updated by refreshCartSummary
      total_amount: 0
    });
    this.refreshCartSummary();
    this.setLoading(false);
  }

  /**
   * Create a new cart with proper error handling
   */
  private createCart(userId: number | null, sessionId: string | null): Observable<Cart> {
    const cartData = userId ? { user_id: userId } : { session_id: sessionId };
    
    console.log('🛒 Creating new cart:', cartData);

    return this.apiService.createCart(cartData).pipe(
      tap(response => {
        console.log('✅ New cart created:', response.cart);
        this.currentCart = response.cart;
        this.updateCartState({
          cart_id: response.cart.cart_id,
          item_count: 0,
          total_amount: 0
        });
        this.setLoading(false);
      }),
      catchError(err => {
        console.error('❌ Failed to create cart:', err);
        this.handleError('Failed to create cart');
        return throwError(() => err);
      })
    );
  }

  /**
   * Safe session ID creation with error handling
   */
  private getOrCreateSessionId(): string {
    if (!this.isBrowser) {
      return 'temp_session_ssr';
    }
    
    try {
      let sessionId = localStorage.getItem('guestSessionId');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guestSessionId', sessionId);
        console.log('🆕 New guest session created:', sessionId);
      }
      return sessionId;
    } catch (error) {
      console.warn('Failed to create session ID:', error);
      return 'temp_session_error';
    }
  }

  /**
   * Improved addToCart with better error handling and cart readiness check
   */
  public addToCart(productId: number, quantity: number = 1): Observable<any> {
    return new Observable(observer => {
      // Check if we're in browser environment
      if (!this.isBrowser) {
        observer.error({ message: 'Cart operations not available during server-side rendering' });
        return;
      }

      // Ensure cart is ready before proceeding
      if (!this.currentCart?.cart_id) {
        console.warn('🛒 Cart not ready, attempting to initialize...');
        this.initializeCart();
        
        // Wait a bit for cart to initialize, then retry
        setTimeout(() => {
          if (!this.currentCart?.cart_id) {
            observer.error({ message: 'Cart is not ready. Please try again in a moment.' });
            return;
          }
          this.performAddToCart(productId, quantity, observer);
        }, 1000);
        return;
      }

      this.performAddToCart(productId, quantity, observer);
    });
  }

  /**
   * Perform the actual add to cart operation
   */
  private performAddToCart(productId: number, quantity: number, observer: any): void {
    const cartItemData = {
      cart_id: this.currentCart!.cart_id,
      product_id: productId,
      quantity: quantity
    };

    console.log('🛒 Adding to cart:', cartItemData);

    this.apiService.addCartItem(cartItemData).subscribe({
      next: (response) => {
        console.log('✅ Add to cart successful:', response);
        this.refreshCartSummary();
        observer.next(response);
        observer.complete();
      },
      error: (err) => {
        console.error('❌ Add to cart failed:', err);
        
        // Handle specific error cases
        if (err.status === 404) {
          // Cart might have been deleted, reinitialize
          console.log('🔄 Cart not found, reinitializing...');
          this.currentCart = null;
          this.initializeCart();
          observer.error({ message: 'Cart session expired. Please try adding the item again.' });
        } else {
          observer.error(err);
        }
      }
    });
  }

  /**
   * Ensure cart is ready before performing operations
   */
  public ensureCartReady(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.currentCart?.cart_id) {
        resolve(true);
        return;
      }

      if (!this.isBrowser) {
        resolve(false);
        return;
      }

      // If cart is already loading, wait for it
      if (this.cartStateSubject.value.isLoading) {
        const subscription = this.cartState$.subscribe(state => {
          if (!state.isLoading) {
            subscription.unsubscribe();
            resolve(!!state.cart_id);
          }
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          resolve(false);
        }, 5000);
      } else {
        // Start initialization
        this.initializeCart();
        
        const subscription = this.cartState$.subscribe(state => {
          if (!state.isLoading) {
            subscription.unsubscribe();
            resolve(!!state.cart_id);
          }
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          resolve(false);
        }, 5000);
      }
    });
  }

  /**
   * Refresh cart summary with error handling
   */
  public refreshCartSummary(): void {
    if (!this.currentCart?.cart_id) return;

    this.apiService.getCartSummary(this.currentCart.cart_id.toString()).subscribe({
      next: (summary) => {
        this.updateCartState({
          cart_id: this.currentCart!.cart_id,
          item_count: summary.total_items,
          total_amount: summary.subtotal
        });
        console.log('🛒 Cart summary refreshed:', summary);
      },
      error: (err) => {
        console.error('Failed to refresh cart summary:', err);
      }
    });
  }

  /**
   * Get current cart ID safely
   */
  public getCurrentCartId(): number | null {
    return this.currentCart?.cart_id || null;
  }

  /**
   * Get cart item count from state
   */
  public getCartItemCount(): number {
    return this.cartStateSubject.value.item_count;
  }

  /**
   * Check if cart is ready for operations
   */
  public isCartReady(): boolean {
    return !!this.currentCart?.cart_id && !this.cartStateSubject.value.isLoading;
  }

  /**
   * Update cart state with proper typing
   */
  private updateCartState(cart: Partial<CartState>): void {
    const currentState = this.cartStateSubject.value;
    this.cartStateSubject.next({
      ...currentState,
      ...cart,
      isLoading: false
    });
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
   * Handle errors with state update
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
   * Clear any existing errors
   */
  private clearError(): void {
    const currentState = this.cartStateSubject.value;
    this.cartStateSubject.next({
      ...currentState,
      error: null
    });
  }

  /**
   * Method to be called after user logs in to merge guest cart
   */
  public mergeGuestCartOnLogin(userId: number): void {
    if (!this.isBrowser) return;

    try {
      const sessionId = localStorage.getItem('guestSessionId');
      if (!sessionId) {
        this.initializeCart();
        return;
      }

      console.log('🔄 Merging guest cart for user:', userId);

      this.apiService.getCartBySessionId(sessionId).subscribe({
        next: (guestCart) => {
          this.apiService.getCartByUserId(userId.toString()).subscribe({
            next: (userCart) => {
              this.mergeCartItems(guestCart.cart_id, userCart.cart_id);
            },
            error: (err) => {
              if (err.status === 404) {
                this.apiService.updateCart(guestCart.cart_id.toString(), {
                  user_id: userId
                }).subscribe({
                  next: () => {
                    localStorage.removeItem('guestSessionId');
                    this.initializeCart();
                  },
                  error: (err) => console.error('Failed to convert cart:', err)
                });
              }
            }
          });
        },
        error: () => {
          this.initializeCart();
        }
      });
    } catch (error) {
      console.warn('Failed to merge guest cart:', error);
      this.initializeCart();
    }
  }

  /**
   * Merge cart items from guest to user cart
   */
  private mergeCartItems(guestCartId: number, userCartId: number): void {
    this.apiService.getCartItemsByCartId(guestCartId.toString()).subscribe({
      next: (guestItems) => {
        const addPromises = guestItems.map((item: CartItem) =>
          this.apiService.addCartItem({
            cart_id: userCartId,
            product_id: item.product_id,
            quantity: item.quantity
          }).toPromise()
        );

        Promise.all(addPromises).then(() => {
          this.apiService.deleteCart(guestCartId.toString()).subscribe({
            next: () => {
              localStorage.removeItem('guestSessionId');
              this.initializeCart();
            },
            error: (err) => console.error('Failed to delete guest cart:', err)
          });
        });
      },
      error: (err) => {
        console.error('Failed to get guest cart items:', err);
        this.initializeCart();
      }
    });
  }

  /**
   * Clear cart with error handling
   */
  public clearCart(): void {
    if (!this.currentCart?.cart_id) return;

    this.apiService.clearCart(this.currentCart.cart_id.toString()).subscribe({
      next: () => {
        this.updateCartState({
          cart_id: this.currentCart!.cart_id,
          item_count: 0,
          total_amount: 0
        });
        console.log('🛒 Cart cleared successfully');
      },
      error: (err) => {
        console.error('Failed to clear cart:', err);
      }
    });
  }

  /**
   * Debug method to check cart status
   */
  public debugCartStatus(): void {
    console.group('🛒 Cart Service Debug Info');
    console.log('isBrowser:', this.isBrowser);
    console.log('currentCart:', this.currentCart);
    console.log('currentUser:', this.currentUser);
    console.log('cartState:', this.cartStateSubject.value);
    
    if (this.isBrowser) {
      console.log('guestSessionId:', localStorage.getItem('guestSessionId'));
      console.log('currentUser from localStorage:', localStorage.getItem('currentUser'));
    }
    console.groupEnd();
  }

  /**
   * Manually set current user (useful for testing)
   */
  public setCurrentUser(user: any): void {
    this.currentUser = user;
    if (this.isBrowser) {
      try {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch (error) {
        console.warn('Failed to save user to localStorage:', error);
      }
    }
  }

  /**
   * Clear current user and cart
   */
  public logout(): void {
    this.currentUser = null;
    this.currentCart = null;
    this.updateCartState({
      cart_id: null,
      item_count: 0,
      total_amount: 0
    });
    
    if (this.isBrowser) {
      try {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('guestSessionId');
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  }
}