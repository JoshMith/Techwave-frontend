import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { isPlatformBrowser } from '@angular/common';

interface CartState {
  cart_id: number | null;
  item_count: number;
  total_amount: number;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  isBrowser: boolean;
  private cartStateSubject = new BehaviorSubject<CartState>({
    cart_id: null,
    item_count: 0,
    total_amount: 0,
    isLoading: false
  });

  public cartState$ = this.cartStateSubject.asObservable();
  private currentCart: any = null;
  private currentUser: any = null;

  constructor(
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadCurrentUser();
    this.initializeCart();
  }

  private loadCurrentUser(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  public initializeCart(): void {
    this.setLoading(true);

    if (this.currentUser?.user_id) {
      // Load cart for authenticated user
      this.apiService.getCartByUserId(this.currentUser.user_id).subscribe({
        next: (cart) => {
          this.currentCart = cart;
          this.updateCartState(cart);
          this.setLoading(false);
        },
        error: (err) => {
          if (err.status === 404) {
            this.createCart(this.currentUser.user_id, null);
          } else {
            this.setLoading(false);
          }
        }
      });
    } else {
      // Load or create cart for guest
      const sessionId = this.getOrCreateSessionId();
      this.apiService.getCartBySessionId(sessionId).subscribe({
        next: (cart) => {
          this.currentCart = cart;
          this.updateCartState(cart);
          this.setLoading(false);
        },
        error: (err) => {
          if (err.status === 404) {
            this.createCart(null, sessionId);
          } else {
            this.setLoading(false);
          }
        }
      });
    }
  }

  private createCart(userId: number | null, sessionId: string | null): void {
    const cartData = userId ? { user_id: userId } : { session_id: sessionId };

    this.apiService.createCart(cartData).subscribe({
      next: (response) => {
        this.currentCart = response.cart;
        this.updateCartState({
          cart_id: response.cart.cart_id,
          item_count: 0,
          total_amount: 0
        });
        this.setLoading(false);
      },
      error: (err) => {
        console.error('Failed to create cart:', err);
        this.setLoading(false);
      }
    });
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guestSessionId', sessionId);
    }
    return sessionId;
  }

  public addToCart(productId: number, quantity: number = 1): Observable<any> {
    return new Observable(observer => {
      if (!this.currentCart?.cart_id) {
        observer.error({ message: 'Cart is not ready' });
        return;
      }

      const cartItemData = {
        cart_id: this.currentCart.cart_id,
        product_id: productId,
        quantity: quantity
      };

      this.apiService.addCartItem(cartItemData).subscribe({
        next: (response) => {
          this.refreshCartSummary();
          observer.next(response);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  public refreshCartSummary(): void {
    if (!this.currentCart?.cart_id) return;

    this.apiService.getCartSummary(this.currentCart.cart_id.toString()).subscribe({
      next: (summary) => {
        this.updateCartState({
          cart_id: this.currentCart.cart_id,
          item_count: summary.totalItems,
          total_amount: summary.totalAmount
        });
      },
      error: (err) => {
        console.error('Failed to refresh cart summary:', err);
      }
    });
  }

  public getCurrentCartId(): number | null {
    return this.currentCart?.cart_id || null;
  }

  public getCartItemCount(): number {
    return this.cartStateSubject.value.item_count;
  }

  private updateCartState(cart: any): void {
    this.cartStateSubject.next({
      cart_id: cart.cart_id,
      item_count: cart.item_count || 0,
      total_amount: cart.total_amount || 0,
      isLoading: false
    });
  }

  private setLoading(isLoading: boolean): void {
    const currentState = this.cartStateSubject.value;
    this.cartStateSubject.next({
      ...currentState,
      isLoading
    });
  }

  // Method to be called after user logs in to merge guest cart
  public mergeGuestCartOnLogin(userId: number): void {
    const sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      this.initializeCart();
      return;
    }

    // First, try to get guest cart
    this.apiService.getCartBySessionId(sessionId).subscribe({
      next: (guestCart) => {
        // Guest has a cart, need to merge
        this.apiService.getCartByUserId(userId.toString()).subscribe({
          next: (userCart) => {
            // User already has a cart, merge guest cart items into it
            this.mergeCartItems(guestCart.cart_id, userCart.cart_id);
          },
          error: (err) => {
            if (err.status === 404) {
              // User doesn't have a cart, convert guest cart to user cart
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
        // No guest cart, just initialize user cart
        this.initializeCart();
      }
    });
  }

  private mergeCartItems(guestCartId: number, userCartId: number): void {
    // Get all items from guest cart
    this.apiService.getCartItemsByCartId(guestCartId.toString()).subscribe({
      next: (guestItems) => {
        // Add each item to user cart
        const addPromises = guestItems.map((item: any) =>
          this.apiService.addCartItem({
            cart_id: userCartId,
            product_id: item.product_id,
            quantity: item.quantity
          }).toPromise()
        );

        Promise.all(addPromises).then(() => {
          // Delete guest cart
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

  public clearCart(): void {
    if (!this.currentCart?.cart_id) return;

    this.apiService.clearCart(this.currentCart.cart_id.toString()).subscribe({
      next: () => {
        this.updateCartState({
          cart_id: this.currentCart.cart_id,
          item_count: 0,
          total_amount: 0
        });
      },
      error: (err) => {
        console.error('Failed to clear cart:', err);
      }
    });
  }
}