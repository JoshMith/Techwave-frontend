import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ApiService } from '../services/api.service'; // Import the API service
import { CartService } from '../services/cart.service';

// Define the Product interface matching the API structure
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
  colors?: string[];
  discount?: number;
  reviews?: { user: string; rating: number; comment: string }[];
  brand?: string;
}

interface ProductImage {
  image_url: string;
  alt_text: string;
  is_primary: boolean;
}

interface SpecialOffer {
  title: string;
  description: string;
  category: string;
  discount: number | null;
}

@Component({
  selector: 'app-shop',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent implements OnInit {
  constructor(
    private router: Router,
    private apiService: ApiService, // Inject the API service
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: any,
  ) { }

  private cartSubscription?: Subscription;
  addingToCart = false;

  // All products data - will be populated from API
  allProducts: Product[] = [];

  // State variables
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchQuery: string = '';
  selectedCategory: string = 'all';
  selectedBrand: string = 'all';
  minPrice: number = 0;
  maxPrice: number = 200000;
  sortOption: string = 'featured';
  isLoading: boolean = true; // Loading state
  errorMessage: any; // Error message

  // Filter options
  categories: string[] = ['all'];
  brands: string[] = ['all'];
  sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' }
  ];

  // Special offers - will be populated from API
  specialOffers: SpecialOffer[] = [];

  // Featured categories
  featuredCategories = [
    { name: 'Phones', icon: '📱', count: 0 },
    { name: 'Laptops', icon: '💻', count: 0 },
    { name: 'Accessories', icon: '🎧', count: 0 },
    { name: 'Home Appliances', icon: '🏠', count: 0 },
    { name: 'Gaming', icon: '🎮', count: 0 },
    { name: 'Audio & Sound', icon: '🔊', count: 0 }
  ];

  // Cart
  cartCount = 0;

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.cartSubscription = this.cartService.cartState$.subscribe(state => {
      this.cartCount = state.item_count;
    });
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.getProductsByCategoryName('Gaming').subscribe({
      next: (products: Product[]) => {
        // Store products first
        this.allProducts = products;
        this.extractCategoriesAndBrands();

        // Create image requests for all products with individual error handling
        const imageRequests = products.map(product =>
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

        // Wait for all image requests (or their fallbacks)
        if (imageRequests.length > 0) {
          forkJoin(imageRequests).subscribe({
            next: (productsWithImages: Product[]) => {
              this.allProducts = productsWithImages;
              this.applyFilters();
              this.isLoading = false;
            },
            error: (err) => {
              // This should rarely happen due to individual catchError above
              console.error('Unexpected error in image loading:', err);
              this.allProducts = products.map(p => ({ ...p, images: [] }));
              this.applyFilters();
              this.isLoading = false;
            }
          });
        } else {
          // No products, just finish loading
          this.applyFilters();
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.errorMessage = 'Failed to load products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private loadSpecialOffers(): void {
    this.apiService.getSpecialOffers().subscribe({
      next: (offersData: any) => {
        this.specialOffers = this.processSpecialOffers(offersData).slice(0, 3);
      },
      error: (err) => {
        console.error('Error loading special offers:', err);
        // Use sample offers if API fails
        this.specialOffers = [
          {
            title: '50% Off Headphones',
            description: 'Premium noise-cancelling headphones',
            category: 'Accessories',
            discount: 50
          },
          {
            title: 'Free Delivery in Nairobi',
            description: 'On orders over KSh 5,000',
            category: 'All',
            discount: null
          }
        ].slice(0, 2);
      }
    });
  }

  private processImages(imagesResponse: any): ProductImage[] {
    // Handle different response formats
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
      // Use full_url if available, otherwise construct from image_url
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

    // If already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Remove leading slash if present
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;

    // Construct absolute URL
    const apiBaseUrl = this.apiService.getApiBaseUrl();
    return `${apiBaseUrl}/${cleanUrl}`;
  }

  // Process special offers from API response
  private processSpecialOffers(offersData: any): SpecialOffer[] {
    if (!offersData || !Array.isArray(offersData)) return [];

    return offersData
      .filter((offer: any) => offer.isActive)
      .map((offer: any) => ({
        title: offer.title || 'Special Offer',
        description: offer.description || 'Limited time offer',
        category: offer.appliesToCategory?.name || 'All',
        discount: offer.discountPercentage || null
      }));
  }

  // Extract categories and brands from products
  private extractCategoriesAndBrands(): void {
    const uniqueCategories = new Set<string>();
    const uniqueBrands = new Set<string>();

    // Add categories and brands from products
    this.allProducts.forEach(product => {
      if (product.category_name) {
        uniqueCategories.add(product.category_name);
      }

      // Try to get brand from specs first, then from title
      const brand = product.specs.brand || product.title.split(' ')[0];
      if (brand) {
        uniqueBrands.add(brand);
      }
    });

    // Update categories and brands arrays
    this.categories = ['all', ...Array.from(uniqueCategories)];
    this.brands = ['all', ...Array.from(uniqueBrands)];
  }

  // Update featured categories count
  private updateFeaturedCategoriesCount(): void {
    this.featuredCategories = this.featuredCategories.map(category => {
      const count = this.allProducts.filter(p => p.category_name === category.name).length;
      return { ...category, count };
    });
  }

  // Fallback to sample data if API fails
  private loadSampleData(): void {
    this.allProducts = [
      {
        product_id: 1,
        title: 'Samsung Galaxy S24',
        description: 'Latest Samsung flagship phone',
        price: 89999,
        sale_price: 80999,
        stock: 10,
        specs: {
          type: 'Smartphone',
          brand: 'Samsung',
          connectivity: '5G, Wi-Fi 6',
          features: '128GB Storage, 8GB RAM, OLED Display'
        },
        rating: 4.8,
        review_count: 342,
        category_name: 'Phones',
        seller_name: 'TechWave Kenya',
        images: []
      },
      {
        product_id: 2,
        title: 'iPhone 15 Pro',
        description: 'Apple premium smartphone',
        price: 129999,
        sale_price: null,
        stock: 15,
        specs: {
          type: 'Smartphone',
          brand: 'Apple',
          connectivity: '5G, Wi-Fi 6E',
          features: '256GB Storage, Face ID, iOS'
        },
        rating: 4.9,
        review_count: 487,
        category_name: 'Phones',
        seller_name: 'TechWave Kenya',
        images: []
      },
      {
        product_id: 3,
        title: 'Dell XPS 15',
        description: 'Premium performance laptop',
        price: 149999,
        sale_price: 127499,
        stock: 5,
        specs: {
          type: 'Laptop',
          brand: 'Dell',
          connectivity: 'Wi-Fi 6, Bluetooth 5.2',
          features: 'Intel Core i9, 32GB RAM, 1TB SSD'
        },
        rating: 4.7,
        review_count: 231,
        category_name: 'Laptops',
        seller_name: 'TechWave Kenya',
        images: []
      }
    ];

    this.products = [...this.allProducts];
    this.filteredProducts = [...this.allProducts];

    this.extractCategoriesAndBrands();
    this.updateFeaturedCategoriesCount();
  }

  // Filter products based on selections
  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      // Category filter
      if (this.selectedCategory !== 'all' && product.category_name !== this.selectedCategory) {
        return false;
      }

      // Brand filter
      if (this.selectedBrand !== 'all') {
        const productBrand = product.specs.brand || product.title.split(' ')[0];
        if (productBrand !== this.selectedBrand) {
          return false;
        }
      }

      // Price range filter
      const price = product.sale_price || product.price;
      if (price < this.minPrice || price > this.maxPrice) {
        return false;
      }

      // Search query filter
      if (this.searchQuery &&
        !product.title.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
        !product.description.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
        !this.formatSpecs(product.specs).toLowerCase().includes(this.searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });

    this.sortProducts();
  }

  // Sort products based on selected option
  sortProducts() {
    switch (this.sortOption) {
      case 'price-low':
        this.filteredProducts.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
        break;
      case 'rating':
        this.filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Featured order (original order)
        this.filteredProducts = [...this.filteredProducts];
    }
  }

  // Reset all filters
  resetFilters() {
    this.selectedCategory = 'all';
    this.selectedBrand = 'all';
    this.minPrice = 0;
    this.maxPrice = 200000;
    this.searchQuery = '';
    this.sortOption = 'featured';
    this.applyFilters();
  }

  // Add to cart functionality
  addToCart(product: Product): void {
    if (this.addingToCart) return;

    if (product.stock < 1) {
      alert('This product is out of stock.');
      return;
    }

    this.addingToCart = true;

    this.cartService.addToCart(product.product_id, 1).subscribe({
      next: (response) => {
        this.addingToCart = false;
        const message = response.message === 'Cart item quantity updated'
          ? `${product.title} quantity updated in cart!`
          : `${product.title} added to cart!`;
        alert(message);
      },
      error: (err) => {
        this.addingToCart = false;
        const errorMessage = err.error?.message || 'Failed to add item to cart';
        alert(errorMessage);
      }
    });
  }

  // View product details
  viewDetails(product: Product) {
    console.log(`Viewing details for: ${product.title}`);
    // Navigate to product detail page
    this.router.navigate(['/product', product.product_id]);
  }

  // Get product image
  getProductImage(product: Product): string | null {
    if (!product.images || product.images.length === 0) {
      return null;
    }
    const image = product.images.find(img => img.is_primary) || product.images[0];
    return image ? this.ensureAbsoluteUrl(image.image_url) : null;
  }

  private getFallbackImage(): string {
    return 'assets/images/gaming-placeholder.png';
  }

  onImageError(event: any): void {
    event.target.src = this.getFallbackImage();
  }

  formatSpecs(specs: any): string {
    const parts = [];
    if (specs.brand) parts.push(specs.brand);
    if (specs.type) parts.push(specs.type);
    if (specs.connectivity) parts.push(specs.connectivity);
    if (specs.features) parts.push(specs.features);
    return parts.join(' • ');
  }

  getColorCode(color: string): string {
    const colorMap: { [key: string]: string } = {
      Black: '#222',
      Silver: '#C0C0C0',
      Blue: '#2196F3',
      Gold: '#FFD700',
      'Space Black': '#1a1a1a',
      'Space Gray': '#4B4B4B',
      'Product Red': '#D32F2F',
      Green: '#4CAF50',
      Platinum: '#E5E4E2',
      Midnight: '#191970',
      Starlight: '#F8F8FF'
    };
    return colorMap[color] || color;
  }

  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Handle category card clicks
   * @param category - The category that was clicked
   */
  onCategoryClick(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }
}