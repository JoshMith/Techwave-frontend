import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
    brand: string;
    [key: string]: any;
  };
  rating: number;
  review_count: number;
  category_id: number;
  seller_id: number;
  images: ProductImage[];
}

interface ProductImage {
  image_url: string;
  alt_text: string;
  is_primary: boolean;
}

@Component({
  selector: 'app-accessories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accessories.component.html',
  styleUrls: ['./accessories.component.css']
})
export class AccessoriesComponent implements OnInit, OnDestroy {

  // Products data
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  errorMessage: string | null = null;

  // Filters
  priceRange = { min: 500, max: 50000 };
  brands: string[] = [];
  selectedBrands: string[] = [];
  accessoryTypes = ['Cases', 'Chargers', 'Headphones', 'Screen Protectors', 'Stands'];
  selectedTypes: string[] = [];

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

    this.apiService.getProductsByCategoryName('accessories').pipe(
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

    if (typeof window !== 'undefined') {

      if (url.startsWith('/')) {
        return `${window.location.origin}${url}`;
      }

      return this.apiService.getProductImageUrl(url);
    }
    return url;
  }

  private extractBrands(): void {
    const brands = new Set(
      this.allProducts
        .map(product => product.specs.brand)
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

  toggleType(type: string): void {
    const index = this.selectedTypes.indexOf(type);
    if (index > -1) {
      this.selectedTypes.splice(index, 1);
    } else {
      this.selectedTypes.push(type);
    }
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredProducts = this.allProducts.filter(product => {
      const price = product.sale_price || product.price;

      // Price filter
      if (price < this.priceRange.min || price > this.priceRange.max) {
        return false;
      }

      // Brand filter
      if (this.selectedBrands.length > 0 &&
        (!product.specs.brand || !this.selectedBrands.includes(product.specs.brand))) {
        return false;
      }

      // Type filter
      if (this.selectedTypes.length > 0) {
        const productType = product.specs || '';
        // if (!this.selectedTypes.some(type => productType.toLowerCase().includes(type.toLowerCase()))) {
        return false;
      }

      return true;
    });

    this.sortProducts();
  }

  resetFilters(): void {
    this.priceRange = { min: 500, max: 50000 };
    this.selectedBrands = [];
    this.selectedTypes = [];
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
    return 'assets/images/accessory-placeholder.png';
  }

  onImageError(event: any): void {
    event.target.src = this.getFallbackImage();
  }

  formatSpecs(specs: any): string {
    // Skip these known properties that we handle separately
    const skipProperties = ['brand', 'type', 'color', 'compatibility'];

    const parts = [];

    // First add the standard properties if they exist
    if (specs.brand) parts.push(specs.brand);
    if (specs.type) parts.push(specs.type);
    if (specs.color) parts.push(specs.color);
    if (specs.compatibility) parts.push(`For ${specs.compatibility}`);

    // Then add all other properties dynamically
    for (const key in specs) {
      if (
        specs.hasOwnProperty(key) &&
        !skipProperties.includes(key) &&
        specs[key] !== null &&
        specs[key] !== undefined &&
        specs[key] !== ''
      ) {
        parts.push(`${key}: ${specs[key]}`);
      }
    }

    return parts.join(' • ');
  }

  getDiscountedPrice(price: number, salePrice: number | null | undefined): number {
    return salePrice !== null && salePrice !== undefined ? salePrice : price;
  }


  // Navigation methods
  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase().replace(' ', '-')}`]);
  }

  onSearch(): void {
    alert('Search functionality is not implemented yet.');
  }
  
}