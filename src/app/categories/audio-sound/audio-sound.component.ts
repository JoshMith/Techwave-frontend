// audio-sound.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription, forkJoin, map, switchMap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';

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
}

interface ProductImage {
  image_url: string;
  alt_text: string;
  is_primary: boolean;
}

@Component({
  selector: 'app-audio-sound',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audio-sound.component.html',
  styleUrls: ['./audio-sound.component.css']
})
export class AudioSoundComponent implements OnInit {
  // Products data
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  errorMessage: string | null = null;

  // Filters
  priceRange = { min: 1000, max: 100000 };
  brands: string[] = [];
  selectedBrands: string[] = [];
  features: string[] = ['Wireless', 'Noise Cancelling', 'Water Resistant', 'Bluetooth 5.0+', 'True Wireless', 'Surround Sound'];
  selectedFeatures: string[] = [];

  // Sorting
  sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' }
  ];
  selectedSort = 'popularity';

  cartCount = 0;
  addingToCart = false;
  private cartSubscription?: Subscription;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    // Subscribe to cart state
    this.cartSubscription = this.cartService.cartState$.subscribe(state => {
      this.cartCount = state.item_count;
    });

    this.loadProducts();
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

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

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  private loadProducts(): void {
    this.loading = true;
    this.errorMessage = null;

    this.apiService.getProductsByCategoryName('Audio & Sound').pipe(
      switchMap((products: Product[]) => {
        this.allProducts = products;
        this.extractBrands();

        // Fetch images for each product
        const imageRequests = products.map(product =>
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
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.errorMessage = 'Failed to load products. Please try again later.';
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
    if (!url) return this.getFallbackImage();

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }

    return this.apiService.getProductImageUrl(url);
  }

  private extractBrands(): void {
    const brands = new Set(
      this.allProducts
        .map(product => {
          // Try to get brand from specs first, then from title
          if (product.specs.brand) return product.specs.brand;
          return product.title.split(' ')[0]; // Get first word as brand
        })
        .filter(brand => brand)
    );
    this.brands = Array.from(brands).sort() as string[];
  }

  // Filter methods
  toggleBrand(brand: string): void {
    const index = this.selectedBrands.indexOf(brand);
    if (index > -1) {
      this.selectedBrands.splice(index, 1);
    } else {
      this.selectedBrands.push(brand);
    }
    this.applyFilters();
  }

  toggleFeature(feature: string): void {
    const index = this.selectedFeatures.indexOf(feature);
    if (index > -1) {
      this.selectedFeatures.splice(index, 1);
    } else {
      this.selectedFeatures.push(feature);
    }
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredProducts = this.allProducts.filter(product => {
      const price = product.sale_price || product.price;

      // Price filter - only filter by price if the range is valid
      if (this.priceRange.min !== 1000 || this.priceRange.max !== 100000) {
        if (price < this.priceRange.min || price > this.priceRange.max) {
          return false;
        }
      }

      // Brand filter - only apply if brands are selected
      if (this.selectedBrands.length > 0) {
        const productBrand = product.specs.brand || product.title.split(' ')[0];
        if (!this.selectedBrands.includes(productBrand)) {
          return false;
        }
      }

      // Feature filter - only apply if features are selected
      if (this.selectedFeatures.length > 0) {
        const productFeatures = product.specs.features || '';
        const hasMatchingFeature = this.selectedFeatures.some(feature =>
          productFeatures.toLowerCase().includes(feature.toLowerCase())
        );
        if (!hasMatchingFeature) return false;
      }

      return true;
    });

    this.sortProducts();
  }

  resetFilters(): void {
    this.priceRange = { min: 1000, max: 100000 };
    this.selectedBrands = [];
    this.selectedFeatures = [];
    this.selectedSort = 'popularity';
    this.applyFilters();
  }

  private sortProducts(): void {
    switch (this.selectedSort) {
      case 'price-low':
        this.filteredProducts.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
        break;
      case 'rating':
        this.filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        this.filteredProducts.sort((a, b) => b.product_id - a.product_id);
        break;
      case 'popularity':
      default:
        this.filteredProducts.sort((a, b) => b.review_count - a.review_count);
        break;
    }
  }

  // Product display methods
  getProductImage(product: Product): string | null {
    if (!product.images || product.images.length === 0) {
      return null;
    }
    const image = product.images.find(img => img.is_primary) || product.images[0];
    return this.ensureAbsoluteUrl(image.image_url);
  }

  private getFallbackImage(): string {
    return 'assets/images/audio-placeholder.png';
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

  // Navigation methods
  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase().replace(' ', '-')}`]);
  }

  onSearch(): void {
    alert('Search functionality is not implemented yet.');
  }

}