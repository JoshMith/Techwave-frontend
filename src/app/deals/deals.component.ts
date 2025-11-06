// deals.component.ts
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
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
  product_ids?: number[];
}

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css'
})
export class DealsComponent implements OnInit {
  constructor(
    private router: Router, 
    private apiService: ApiService,
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

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading = true;
    this.errorMessage = null;

    this.apiService.getProducts().pipe(
      switchMap((products: Product[]) => {
        // Filter products with discounts (sale_price)
        const discountedProducts = products.filter(product => product.sale_price !== null);

        // Calculate discount percentage
        this.allProducts = discountedProducts.map(product => ({
          ...product,
          discount_percentage: Math.round(((product.price - (product.sale_price || product.price)) / product.price) * 100)
        }));

        // Fetch images for each product
        const imageRequests = this.allProducts.map(product =>
          this.apiService.serveProductImages(product.product_id.toString()).pipe(
            map(images => ({
              ...product,
              images: this.processImages(images)
            }))
          )
        );

        return forkJoin(imageRequests);
      })
    ).subscribe({
      next: (productsWithImages: Product[]) => {
        this.allProducts = productsWithImages;
        this.generateDealsFromProducts();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading products:', err);
        this.errorMessage = 'Failed to load deals. Please try again later.';
        this.loading = false;
      }
    });
  }

  private processImages(images: any[]): ProductImage[] {
    if (!images || !Array.isArray(images)) return [];

    return images.map(img => ({
      image_url: this.ensureAbsoluteUrl(img.image_url),
      alt_text: img.alt_text || 'Product image',
      is_primary: img.is_primary || false
    }));
  }

  private ensureAbsoluteUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Assuming API base URL is set in environment
    const apiBaseUrl = this.apiService.getApiBaseUrl();
    return `${apiBaseUrl}/${url}`;
  }

  private getFallbackImage(): string {
    return 'assets/images/product-placeholder.png';
  }

  private generateDealsFromProducts(): void {
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
    this.featuredDeals = Object.entries(productsByCategory)
      .map(([category, products]) => {
        const topProducts = products
          .sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0))
          .slice(0, 2);

        return {
          id: Math.floor(Math.random() * 1000),
          title: `Flash Sale: ${category}`,
          description: `Up to ${Math.max(...topProducts.map(p => p.discount_percentage || 0))}% off on ${category.toLowerCase()}`,
          discount: Math.max(...topProducts.map(p => p.discount_percentage || 0)),
          expiration: this.generateFutureDate(7), // 7 days from now
          category,
          products: products.length,
          image: category.toLowerCase().replace(/\s+/g, '-'),
          product_ids: topProducts.map(p => p.product_id)
        };
      })
      .slice(0, 2); // Limit to 2 featured deals

    // Generate active deals
    this.activeDeals = Object.entries(productsByCategory)
      .map(([category, products]) => {
        const discount = Math.round(
          products.reduce((sum, product) => sum + (product.discount_percentage || 0), 0) / products.length
        );

        return {
          id: Math.floor(Math.random() * 1000),
          title: `${category} Special`,
          description: `Premium ${category.toLowerCase()} at discounted prices`,
          discount,
          expiration: this.generateFutureDate(14), // 14 days from now
          category,
          products: products.length,
          image: category.toLowerCase().replace(/\s+/g, '-'),
          product_ids: products.map(p => p.product_id)
        };
      });

    // Generate expiring deals (within 3 days)
    this.expiringDeals = Object.entries(productsByCategory)
      .map(([category, products]) => {
        const discount = Math.round(
          products.reduce((sum, product) => sum + (product.discount_percentage || 0), 0) / products.length
        );

        return {
          id: Math.floor(Math.random() * 1000),
          title: `Last Chance: ${category}`,
          description: `Final discounts on ${category.toLowerCase()}`,
          discount,
          expiration: this.generateFutureDate(3), // 3 days from now
          category,
          products: products.length,
          image: category.toLowerCase().replace(/\s+/g, '-'),
          product_ids: products.map(p => p.product_id)
        };
      })
      .slice(0, 2); // Limit to 2 expiring deals

    // Update category counts
    this.categories = this.categories.map(category => {
      if (category.name === 'All Deals') {
        return { ...category, count: this.activeDeals.length + this.expiringDeals.length };
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
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  onSearch(): void {
    alert('Search functionality is not implemented yet.');
  }

  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase().replace(' ', '-')}`]);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  // Add to cart method
  addToCart(productId: number): void {
    const product = this.allProducts.find(p => p.product_id === productId);
    if (product) {
      console.log('Adding to cart:', product.title);
      this.cartCount++;
      alert(`${product.title} added to cart!`);
    }
  }

  // Navigate to product details
  viewProduct(productId: number): void {
    this.router.navigate([`/product/${productId}`]);
  }

  // Navigate to category with deals
  viewDealCategory(deal: Deal): void {
    if (deal.product_ids && deal.product_ids.length > 0) {
      this.router.navigate([`/categories/${deal.category.toLowerCase().replace(' ', '-')}`], {
        queryParams: { deal: deal.id }
      });
    }
  }
}