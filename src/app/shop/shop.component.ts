import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { ApiService } from '../services/api.service'; // Import the API service

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
    private apiService: ApiService // Inject the API service
  ) { }

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
  errorMessage: string = ''; // Error message

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

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Get products from all categories
    const categories = ['Phones', 'Laptops', 'Accessories', 'Home Appliances', 'Gaming', 'Audio & Sound'];
    const requests = categories.map(category =>
      this.apiService.getProductsByCategoryName(category)
    );

    forkJoin(requests).pipe(
      switchMap((productsByCategory: Product[][]) => {
        // Flatten the array and get random products (max 3 per category)
        const allProducts = productsByCategory.flat();

        // Get random products (limit to 15 total)
        const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
        this.allProducts = shuffled.slice(0, 15);

        // Extract categories and brands
        this.extractCategoriesAndBrands();

        // Update featured categories counts
        this.updateFeaturedCategoriesCount();

        // Fetch images for each product
        const imageRequests = this.allProducts.map(product =>
          this.apiService.getProductImages(product.product_id.toString()).pipe(
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
        this.products = [...this.allProducts];
        this.filteredProducts = [...this.allProducts];
        this.isLoading = false;

        // Load special offers
        this.loadSpecialOffers();
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.errorMessage = 'Failed to load products. Please try again later.';
        this.isLoading = false;

        // Fallback to sample data if API fails
        this.loadSampleData();
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

  private processImages(images: any[]): ProductImage[] {
    if (!images || !Array.isArray(images)) return [];

    return images.map(img => ({
      image_url: this.ensureAbsoluteUrl(img.image_url),
      alt_text: img.alt_text || 'Product image',
      is_primary: img.is_primary || false
    }));
  }

  private ensureAbsoluteUrl(url: string): string {
    if (!url) return this.getFallbackImage();

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }

    return this.apiService.getProductImageUrl(url);
  }

  private getFallbackImage(): string {
    return 'assets/images/product-placeholder.png';
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
  addToCart(product: Product) {
    console.log(`Added to cart: ${product.title}`);
    this.cartCount++;
    alert(`Added ${product.title} to your cart!`);
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
    return this.ensureAbsoluteUrl(image.image_url);
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