// deals.component.ts
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, OnDestroy } from '@angular/core';
import { RouterModule, Router, RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { CartService } from '../services/cart.service';

interface Product {
  product_id: number;
  title: string;
  description: string;
  price: number;
  sale_price: number | null;
  stock: number;
  specs: {
    type?: string;
    brand?: string;
    connectivity?: string;
    features?: string;
    [key: string]: any;
  };
  rating: number;
  review_count: number;
  category_name: string;
  seller_name: string;
  images: ProductImage[];
  discount_percentage?: number;
}

interface ProductImage {
  image_url: string;
  alt_text: string;
  is_primary: boolean;
}

interface Deal {
  id: number;
  title: string;
  description: string;
  discount: number;
  expiration: string;
  category: string;
  products: number;
  image: string;
  product_ids: number[];
}

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RouterLink],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css'
})
export class DealsComponent implements OnInit, OnDestroy {
  private cartSubscription?: Subscription;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  // Products data
  allProducts: Product[] = [];
  loading = true;
  errorMessage: string | null = null;

  // Deals data
  featuredDeals: Deal[] = [];
  activeDeals: Deal[] = [];
  expiringDeals: Deal[] = [];

  // Categories for filtering
  categories = [
    { name: 'All Deals', icon: '🔥', count: 0 },
    { name: 'Phones', icon: '📱', count: 0 },
    { name: 'Laptops', icon: '💻', count: 0 },
    { name: 'Accessories', icon: '🎧', count: 0 },
    { name: 'Home Appliances', icon: '🏠', count: 0 },
    { name: 'Gaming', icon: '🎮', count: 0 },
    { name: 'Audio & Sound', icon: '🔊', count: 0 }
  ];

  selectedCategory = 'All Deals';
  cartCount = 0;

  // Countdown timer
  countdownInterval: any;
  countdown = {
    days: 2,
    hours: 14,
    minutes: 38,
    seconds: 22
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAllProducts();
      this.subscribeToCart();
      this.startCountdown();
    }
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  /**
   * Subscribe to cart state for live updates
   */
  private subscribeToCart(): void {
    this.cartSubscription = this.cartService.cartState$.subscribe(state => {
      this.cartCount = state.item_count;
    });

    // Initialize cart
    this.cartService.initializeCart();
  }

  /**
   * Start countdown timer
   */
  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      if (this.countdown.seconds > 0) {
        this.countdown.seconds--;
      } else if (this.countdown.minutes > 0) {
        this.countdown.minutes--;
        this.countdown.seconds = 59;
      } else if (this.countdown.hours > 0) {
        this.countdown.hours--;
        this.countdown.minutes = 59;
        this.countdown.seconds = 59;
      } else if (this.countdown.days > 0) {
        this.countdown.days--;
        this.countdown.hours = 23;
        this.countdown.minutes = 59;
        this.countdown.seconds = 59;
      }
    }, 1000);
  }

  /**
   * Load all products from all categories
   */
  private loadAllProducts(): void {
    this.loading = true;
    this.errorMessage = null;

    // Load products from all categories
    const categoryNames = this.categories
      .filter(cat => cat.name !== 'All Deals')
      .map(cat => cat.name);

    // Create requests for all categories
    const categoryRequests = categoryNames.map(categoryName =>
      this.apiService.getProductsByCategoryName(categoryName).pipe(
        catchError(error => {
          console.warn(`Failed to load ${categoryName}:`, error);
          return of([]);
        })
      )
    );

    // Load all products from all categories
    forkJoin(categoryRequests).subscribe({
      next: (results: Product[][]) => {
        // Flatten all products and calculate discounts
        this.allProducts = results.flat().map(product => ({
          ...product,
          discount_percentage: this.calculateDiscount(product)
        }));

        console.log('✅ Loaded products:', this.allProducts.length);

        // Load images for all products
        this.loadProductImages();
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.errorMessage = 'Failed to load products. Please try again later.';
        this.loading = false;
      }
    });
  }

  /**
   * Calculate discount percentage
   */
  private calculateDiscount(product: Product): number {
    if (!product.sale_price || product.sale_price >= product.price) {
      return 0;
    }
    return Math.round(((product.price - product.sale_price) / product.price) * 100);
  }

  /**
   * Load images for all products
   */
  private loadProductImages(): void {
    const imageRequests = this.allProducts.map(product =>
      this.apiService.serveProductImagesSafe(product.product_id.toString()).pipe(
        map(imagesResponse => ({
          ...product,
          images: this.processImages(imagesResponse)
        })),
        catchError(error => {
          console.warn(`Failed to load images for product ${product.product_id}:`, error);
          return of({
            ...product,
            images: []
          });
        })
      )
    );

    if (imageRequests.length > 0) {
      forkJoin(imageRequests).subscribe({
        next: (productsWithImages: Product[]) => {
          this.allProducts = productsWithImages;
          
          // Generate deals after products are loaded with images
          this.generateDealsFromProducts();
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Unexpected error in image loading:', err);
          this.allProducts = this.allProducts.map(p => ({ ...p, images: [] }));
          
          // Generate deals even if images fail
          this.generateDealsFromProducts();
          
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  private processImages(imagesResponse: any): ProductImage[] {
    let images: any[] = [];

    if (Array.isArray(imagesResponse)) {
      images = imagesResponse;
    } else if (imagesResponse?.images && Array.isArray(imagesResponse.images)) {
      images = imagesResponse.images;
    }

    if (!images || images.length === 0) {
      return [];
    }

    return images.map(img => {
      const imageUrl = img.full_url || img.image_url;
      return {
        image_url: this.ensureAbsoluteUrl(imageUrl),
        alt_text: img.alt_text || 'Product image',
        is_primary: img.is_primary || false
      };
    });
  }

  private ensureAbsoluteUrl(url: string): string {
    if (!url) return this.getFallbackImage();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const apiBaseUrl = this.apiService.getApiBaseUrl();
    return `${apiBaseUrl}/${cleanUrl}`;
  }

  getProductImage(product: Product): string | null {
    if (!product.images || product.images.length === 0) {
      return null;
    }
    const image = product.images.find(img => img.is_primary) || product.images[0];
    return image ? this.ensureAbsoluteUrl(image.image_url) : null;
  }

  private getFallbackImage(): string {
    return '/images/product-placeholder.jpg';
  }

  onImageError(event: any): void {
    event.target.src = this.getFallbackImage();
  }

  /**
   * Generate deals from loaded products
   */
  private generateDealsFromProducts(): void {
    if (this.allProducts.length === 0) {
      console.warn('⚠️ No products to generate deals from');
      return;
    }

    // Filter products with discounts
    const productsWithDiscounts = this.allProducts.filter(p => 
      p.discount_percentage && p.discount_percentage > 0
    );

    // Group products by category
    const productsByCategory = this.allProducts.reduce((acc, product) => {
      const category = product.category_name;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    // Generate featured deals (highest discounts)
    const potentialFeaturedDeals = Object.entries(productsByCategory)
      .map(([category, products]) => {
        const discountedProducts = products.filter(p => p.discount_percentage && p.discount_percentage > 0);
        
        if (discountedProducts.length === 0) return null;

        const topProducts = discountedProducts
          .sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0))
          .slice(0, 3);

        const maxDiscount = Math.max(...topProducts.map(p => p.discount_percentage || 0));

        return {
          id: Math.floor(Math.random() * 10000),
          title: `Flash Sale: ${category}`,
          description: `Up to ${maxDiscount}% off on premium ${category.toLowerCase()}`,
          discount: maxDiscount,
          expiration: this.generateFutureDate(7),
          category,
          products: discountedProducts.length,
          image: this.getCategoryEmoji(category),
          product_ids: topProducts.map(p => p.product_id)
        };
      })
      .filter((deal): deal is NonNullable<typeof deal> => deal !== null);

    this.featuredDeals = potentialFeaturedDeals
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 2);

    // Generate active deals
    this.activeDeals = Object.entries(productsByCategory)
      .map(([category, products]) => {
        const discountedProducts = products.filter(p => p.discount_percentage && p.discount_percentage > 0);
        
        const avgDiscount = discountedProducts.length > 0
          ? Math.round(
              discountedProducts.reduce((sum, p) => sum + (p.discount_percentage || 0), 0) / 
              discountedProducts.length
            )
          : 10; // Default 10% for categories without discounts

        return {
          id: Math.floor(Math.random() * 10000),
          title: `${category} Special`,
          description: `Premium ${category.toLowerCase()} at special prices`,
          discount: avgDiscount,
          expiration: this.generateFutureDate(14),
          category,
          products: products.length,
          image: this.getCategoryEmoji(category),
          product_ids: products.map(p => p.product_id)
        };
      });

    // Generate expiring deals (within 3 days)
    this.expiringDeals = Object.entries(productsByCategory)
      .filter(([_, products]) => products.some(p => p.discount_percentage && p.discount_percentage > 0))
      .map(([category, products]) => {
        const discountedProducts = products.filter(p => p.discount_percentage && p.discount_percentage > 0);
        
        const avgDiscount = Math.round(
          discountedProducts.reduce((sum, p) => sum + (p.discount_percentage || 0), 0) / 
          discountedProducts.length
        );

        return {
          id: Math.floor(Math.random() * 10000),
          title: `Last Chance: ${category}`,
          description: `Final discounts on ${category.toLowerCase()} - Don't miss out!`,
          discount: avgDiscount,
          expiration: this.generateFutureDate(3),
          category,
          products: discountedProducts.length,
          image: this.getCategoryEmoji(category),
          product_ids: discountedProducts.map(p => p.product_id)
        };
      })
      .slice(0, 4);

    // Update category counts
    this.updateCategoryCounts();

    console.log('✅ Deals generated:', {
      featured: this.featuredDeals.length,
      active: this.activeDeals.length,
      expiring: this.expiringDeals.length
    });
  }

  /**
   * Get emoji for category
   */
  private getCategoryEmoji(category: string): string {
    const cat = this.categories.find(c => c.name === category);
    return cat?.icon || '🎁';
  }

  /**
   * Update category counts
   */
  private updateCategoryCounts(): void {
    this.categories = this.categories.map(category => {
      if (category.name === 'All Deals') {
        return { 
          ...category, 
          count: this.activeDeals.length + this.expiringDeals.length 
        };
      }

      const matchingDeals = [...this.activeDeals, ...this.expiringDeals].filter(
        deal => deal.category === category.name
      );

      return { ...category, count: matchingDeals.length };
    });
  }

  private generateFutureDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  // Filter deals by category
  filterDeals(category: string): void {
    this.selectedCategory = category;
  }

  // Get filtered deals based on selection
  get filteredDeals(): Deal[] {
    if (this.selectedCategory === 'All Deals') {
      return [...this.activeDeals, ...this.expiringDeals];
    }
    return [...this.activeDeals, ...this.expiringDeals].filter(
      deal => deal.category === this.selectedCategory
    );
  }

  // Calculate days remaining for a deal
  daysRemaining(expiration: string): number {
    const expDate = new Date(expiration);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }

  onSearch(): void {
    alert('Search functionality coming soon!');
  }

  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase().replace(' ', '-')}`]);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Navigate to deal category
   */
  viewDealCategory(deal: Deal): void {
    if (deal.product_ids.length > 0) {
      this.router.navigate([`/categories/${deal.category.toLowerCase().replace(/\s+/g, '-')}`], {
        queryParams: { deal: deal.id }
      });
    }
  }

  /**
   * Shop now button - navigate to category
   */
  shopNow(): void {
    this.router.navigate(['/shop']);
  }
}