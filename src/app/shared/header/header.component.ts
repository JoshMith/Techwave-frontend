import { Component, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';


interface GuestUser {
  session_id: string;
  created_at: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
constructor(
    private router: Router,
    private apiService: ApiService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Cart related
  cartCount = 0;
  currentUser: any = null;
  guestUser: GuestUser | null = null;
  isBrowser: boolean;

private cartSubscription?: Subscription;


ngOnInit(): void {
    if (this.isBrowser) {
      this.loadCurrentUser();
      this.loadGuestUser();
      this.subscribeToCartState();
    }
  }

ngOnDestroy(): void {
  if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
}

  /**
   * Subscribe to cart state from CartService
   */
  private subscribeToCartState(): void {
    this.cartSubscription = this.cartService.cartState$.subscribe(state => {
      this.cartCount = state.item_count;
    });
    // Initialize cart
    this.cartService.initializeCart();
  }

  /**
     * Load authenticated user from server
     */
  private loadCurrentUser(): void {
    if (!this.isBrowser) return;

    try {
      const userStr = this.apiService.getCurrentUser().subscribe(response => {
        if (userStr) {
          this.currentUser = response;
          console.log('✅ User loaded in homepage:', this.currentUser);
        }
      });
    } catch (error) {
      console.error('❌ Failed to load user from localStorage:', error);
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
        console.log('✅ Guest user loaded in homepage:', this.guestUser?.session_id);
      } else if (!this.currentUser) {
        // Create new guest user if no authenticated user
        this.guestUser = this.createGuestUser();
        localStorage.setItem('guestUser', JSON.stringify(this.guestUser));
        console.log('🆕 New guest user created in homepage:', this.guestUser.session_id);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load/create guest user:', error);
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




  // Add these properties to your component class
  isMobileMenuOpen: boolean = false;
  isMobileCategoriesOpen: boolean = false;

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Close categories when closing main menu
    if (!this.isMobileMenuOpen) {
      this.isMobileCategoriesOpen = false;
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.isMobileCategoriesOpen = false;
  }

  /**
   * Toggle mobile categories dropdown
   */
  toggleMobileCategories(): void {
    this.isMobileCategoriesOpen = !this.isMobileCategoriesOpen;
  }

  /**
   * Handle window resize to close mobile menu on larger screens
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (window.innerWidth > 1024 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  /**
   * Handle escape key to close mobile menu
   */
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  /**
   * Navigate to cart
   */
  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}