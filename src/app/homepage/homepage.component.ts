import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { finalize } from 'rxjs/operators';

interface Category {
  category_id: number;
  name: string;
  description: string;
  featured: boolean;
  icon_path: string;
  created_at: string;
  // For display purposes
  icon?: string;
  count?: number;
  key?: string;
}

@Component({
  selector: 'app-homepage',
  imports: [CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent implements OnInit {
  isBrowser: boolean;

  constructor(
    private router: Router,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { 
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  featuredCategories: Category[] = [];
  isLoading = true;
  error: string | null = null;

  // Cart related
  cartCount = 0;
  currentUser: any = null;
  currentCart: any = null;

  ngOnInit(): void {
    this.loadCategories();
    if (this.isBrowser) {
      this.loadCurrentUser();
      this.loadOrCreateCart();
    }
  }

  /**
   * Load categories from API
   */
  loadCategories(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.featuredCategories = categories.map(category => ({
          ...category,
          icon: this.getCategoryIcon(category.name),
          key: this.createCategoryKey(category.name),
          count: 0 // Initialize with 0, will be updated
        }));

        // Fetch product counts for each category
        this.loadProductCounts();
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.error = 'Failed to load categories. Please try again later.';
        this.isLoading = false;
        this.featuredCategories = this.getDefaultCategories();
      }
    });
  }

  /**
   * Load product counts for all categories
   */
  private loadProductCounts(): void {
    const countRequests = this.featuredCategories.map(category =>
      this.apiService.getProductCountByCategory(category.category_id.toString()).pipe(
        finalize(() => {
          // When all requests complete, set loading to false
          if (this.featuredCategories.every(c => c.count !== undefined)) {
            this.isLoading = false;
          }
        })
      )
    );

    countRequests.forEach((request, index) => {
      request.subscribe({
        next: (response) => {
          this.featuredCategories[index].count = response.data.product_count;
        },
        error: (err) => {
          console.error(`Failed to load product count for category ${this.featuredCategories[index].name}:`, err);
          // Fallback to random count if API fails
          this.featuredCategories[index].count = this.getRandomProductCount();
        }
      });
    });
  }


  /**
   * Handle category card clicks
   */
  selectCategory(category: any): void {
    this.router.navigate(['/categories', category.name]);
  }

  /**
   * Create a URL-friendly key from category name
   */
  private createCategoryKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  /**
   * Get an emoji icon based on category name
   */
  private getCategoryIcon(name: string): string {
    const iconMap: { [key: string]: string } = {
      'Phones': '📱',
      'Laptops': '💻',
      'Accessories': '🎧',
      'Home Appliances': '🏠',
      'Gaming': '🎮',
      'Audio & Sound': '🔊',
      'Computers': '🖥️',
      'Tablets': '📱',
      'Cameras': '📷'
    };

    return iconMap[name] || '🛍️';
  }

  /**
   * Generate random product count (fallback when API fails)
   */
  private getRandomProductCount(): number {
    return Math.floor(Math.random() * 50) + 10;
  }

  /**
   * Default categories in case API fails
   */
  private getDefaultCategories(): Category[] {
    return [
      { name: 'Phones', icon: '📱', count: 24, key: 'Phones', category_id: 1, description: '', featured: true, icon_path: '', created_at: '' },
      { name: 'Laptops', icon: '💻', count: 17, key: 'Laptops', category_id: 2, description: '', featured: true, icon_path: '', created_at: '' },
      { name: 'Accessories', icon: '🎧', count: 42, key: 'Accessories', category_id: 3, description: '', featured: true, icon_path: '', created_at: '' },
      { name: 'Home Appliances', icon: '🏠', count: 15, key: 'Home Appliances', category_id: 4, description: '', featured: true, icon_path: '', created_at: '' },
      { name: 'Gaming', icon: '🎮', count: 32, key: 'Gaming', category_id: 5, description: '', featured: true, icon_path: '', created_at: '' },
      { name: 'Audio & Sound', icon: '🔊', count: 13, key: 'Audio & Sound', category_id: 6, description: '', featured: true, icon_path: '', created_at: '' },
    ];
  }

  /**
   * Handle category click
   */
  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase()}`]);
  }

  /**
   * Handle Shop Now button click
   */
  onShopNow(): void {
    this.router.navigate(['/shop']);
  }

  sellerPortal(): void {
    this.router.navigate(['/login']);
  }

  onSearch(): void {
    alert('Search functionality is not implemented yet.');
  }

  private loadCurrentUser(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  private loadOrCreateCart(): void {
    if (this.currentUser?.user_id) {
      // Load cart for authenticated user
      this.apiService.getCartByUserId(this.currentUser.user_id).subscribe({
        next: (cart) => {
          this.currentCart = cart;
          this.updateCartCount();
        },
        error: (err) => {
          if (err.status === 404) {
            // Create new cart for user
            this.createCart(this.currentUser.user_id, null);
          }
        }
      });
    } else {
      // Load or create cart for guest
      const sessionId = this.getOrCreateSessionId();
      this.apiService.getCartBySessionId(sessionId).subscribe({
        next: (cart) => {
          this.currentCart = cart;
          this.updateCartCount();
        },
        error: (err) => {
          if (err.status === 404) {
            // Create new cart for guest
            this.createCart(null, sessionId);
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
        this.cartCount = 0;
      },
      error: (err) => {
        console.error('Failed to create cart:', err);
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

  private updateCartCount(): void {
    if (!this.currentCart?.cart_id) return;

    this.apiService.getCartSummary(this.currentCart.cart_id.toString()).subscribe({
      next: (summary) => {
        this.cartCount = summary.totalItems;
      },
      error: (err) => {
        console.error('Failed to update cart count:', err);
      }
    });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}

  