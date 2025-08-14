import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { ApiService } from '../../services/api.service';

interface Product {
  product_id: number;
  title: string;
  description: string;
  price: number;
  sale_price: number | null;
  stock: number;
  specs: {
    brand: string;
    os?: string;
    ram?: string;
    storage?: string;
    processor?: string;
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
  selector: 'app-laptops',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './laptops.component.html',
  styleUrls: ['./laptops.component.css']
})
export class LaptopsComponent implements OnInit {
  constructor(private router: Router, private apiService: ApiService) { }

  // Products data
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  errorMessage: string | null = null;

  // Filters
  priceRange = { min: 10000, max: 300000 };
  brands: string[] = [];
  selectedBrands: string[] = [];
  features = ['Windows', 'MacOS', '8GB+ RAM', 'SSD Storage'];
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

  // Cart
  cartCount = 0;

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading = true;
    this.errorMessage = null;

    this.apiService.getProductsByCategoryName('laptops').pipe(
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

      // Price filter
      if (price < this.priceRange.min || price > this.priceRange.max) {
        return false;
      }

      // Brand filter
      if (this.selectedBrands.length > 0 &&
        (!product.specs.brand || !this.selectedBrands.includes(product.specs.brand))) {
        return false;
      }

      // Feature filters
      if (this.selectedFeatures.includes('Windows') &&
        (!product.specs.os || !product.specs.os.toLowerCase().includes('windows'))) {
        return false;
      }

      if (this.selectedFeatures.includes('MacOS') &&
        (!product.specs.os || !product.specs.os.toLowerCase().includes('mac'))) {
        return false;
      }

      if (this.selectedFeatures.includes('8GB+ RAM') &&
        (!product.specs.ram || !product.specs.ram.includes('8'))) {
        return false;
      }

      if (this.selectedFeatures.includes('SSD Storage') &&
        (!product.specs.storage || !product.specs.storage.toLowerCase().includes('ssd'))) {
        return false;
      }

      return true;
    });

    this.sortProducts();
  }

  resetFilters(): void {
    this.priceRange = { min: 10000, max: 300000 };
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
    return 'assets/images/laptop-placeholder.png';
  }

  onImageError(event: any): void {
    event.target.src = this.getFallbackImage();
  }

  formatSpecs(specs: any): string {
    const parts = [];
    if (specs.processor) parts.push(specs.processor);
    if (specs.ram) parts.push(specs.ram);
    if (specs.storage) parts.push(specs.storage);
    if (specs.os) parts.push(specs.os);
    // for (const key in specs) {
    //   if (
    //     specs.hasOwnProperty(key) &&
    //     specs[key] !== null &&
    //     specs[key] !== undefined &&
    //     specs[key] !== ''
    //   ) {
    //     parts.push(`${key}: ${specs[key]}`);
    //   }
    // }
    return parts.join(' • ');
  }

  // Navigation methods
  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase().replace(' ', '-')}`]);
  }

  onSearch(): void {
    alert('Search functionality is not implemented yet.');
  }

  addToCart(product: Product): void {
    console.log('Adding to cart:', product.title);
    this.cartCount++;
    alert(`${product.title} added to cart!`);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}