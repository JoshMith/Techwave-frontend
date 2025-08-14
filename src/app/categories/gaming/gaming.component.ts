// gaming.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Product {
  id: number;
  name: string;
  brand: string;
  specs: string;
  price: number;
  features: string[];
  discount?: number;
  rating?: number;
}

@Component({
  selector: 'app-gaming',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gaming.component.html',
  styleUrls: ['./gaming.component.css'] // Reuse accessories styles
})
export class GamingComponent implements OnInit {
  constructor(private router: Router) { }

  products: Product[] = [];
  filteredProducts: Product[] = [];

  // Filters
  priceRange = { min: 5000, max: 150000 };
  brands: string[] = ['Sony', 'Microsoft', 'Nintendo', 'Razer', 'SteelSeries', 'Logitech'];
  selectedBrands: string[] = [];
  features: string[] = ['4K Gaming', 'VR Ready', 'Wireless', 'RGB Lighting', 'Mechanical Keys'];
  selectedFeatures: string[] = [];

  // Sorting
  sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' }
  ];
  selectedSort = 'popularity';

  ngOnInit() {
    this.loadProducts();
    this.applyFilters();
  }

  loadProducts() {
    this.products = [
      {
        id: 1,
        name: 'PlayStation 5 Console',
        brand: 'Sony',
        specs: '825GB SSD, 4K UHD Blu-ray, Ray Tracing',
        price: 89999,
        discount: 10,
        rating: 4.9,
        features: ['4K Gaming', 'VR Ready']
      },
      {
        id: 2,
        name: 'Xbox Series X',
        brand: 'Microsoft',
        specs: '1TB SSD, 4K Gaming, 120 FPS',
        price: 84999,
        rating: 4.8,
        features: ['4K Gaming', 'Wireless']
      },
      {
        id: 3,
        name: 'Nintendo Switch OLED',
        brand: 'Nintendo',
        specs: '7-inch OLED screen, 64GB storage',
        price: 49999,
        discount: 5,
        rating: 4.7,
        features: ['Wireless']
      },
      {
        id: 4,
        name: 'Razer Blade 15 Gaming Laptop',
        brand: 'Razer',
        specs: 'RTX 3070 Ti, 16GB RAM, 1TB SSD',
        price: 249999,
        rating: 4.8,
        features: ['4K Gaming', 'RGB Lighting', 'VR Ready']
      },
      {
        id: 5,
        name: 'SteelSeries Apex Pro Keyboard',
        brand: 'SteelSeries',
        specs: 'OmniPoint switches, OLED display',
        price: 18999,
        discount: 15,
        rating: 4.6,
        features: ['RGB Lighting', 'Mechanical Keys']
      },
      {
        id: 6,
        name: 'Logitech G Pro X Wireless Headset',
        brand: 'Logitech',
        specs: '7.1 Surround, Blue VO!CE, 20+ hour battery',
        price: 15999,
        rating: 4.7,
        features: ['Wireless', 'RGB Lighting']
      },
      {
        id: 7,
        name: 'Meta Quest 3 VR Headset',
        brand: 'Meta',
        specs: '128GB, Mixed Reality, Touch Controllers',
        price: 64999,
        rating: 4.5,
        features: ['VR Ready', 'Wireless']
      },
      {
        id: 8,
        name: 'Sony DualSense Edge Controller',
        brand: 'Sony',
        specs: 'Customizable controls, replaceable sticks',
        price: 12999,
        discount: 20,
        rating: 4.4,
        features: ['Wireless']
      }
    ];
  }

  toggleBrand(brand: string) {
    const index = this.selectedBrands.indexOf(brand);
    if (index > -1) {
      this.selectedBrands.splice(index, 1);
    } else {
      this.selectedBrands.push(brand);
    }
    this.applyFilters();
  }

  toggleFeature(feature: string) {
    const index = this.selectedFeatures.indexOf(feature);
    if (index > -1) {
      this.selectedFeatures.splice(index, 1);
    } else {
      this.selectedFeatures.push(feature);
    }
    this.applyFilters();
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      // Price filter
      if (product.price < this.priceRange.min || product.price > this.priceRange.max) {
        return false;
      }

      // Brand filter
      if (this.selectedBrands.length > 0 && !this.selectedBrands.includes(product.brand)) {
        return false;
      }

      // Feature filter
      if (this.selectedFeatures.length > 0) {
        return this.selectedFeatures.every(feature => product.features.includes(feature));
      }

      return true;
    });

    this.sortProducts();
  }

  sortProducts() {
    this.filteredProducts.sort((a, b) => {
      switch (this.selectedSort) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0) || a.id - b.id;
        default:
          return a.id - b.id;
      }
    });
  }

  resetFilters() {
    this.selectedBrands = [];
    this.selectedFeatures = [];
    this.priceRange = { min: 5000, max: 150000 };
    this.selectedSort = 'popularity';
    this.applyFilters();
  }

  getDiscountedPrice(price: number, discount?: number): number {
    return discount ? price * (1 - discount / 100) : price;
  }

  // Navigation methods
  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase().replace(' ', '-')}`]);
  }

  onSearch() {
    // Implement actual search functionality
    console.log('Search initiated');
  }
  cartCount = 3;
  goToCart() {
    this.router.navigate(['/cart']);
  }
}