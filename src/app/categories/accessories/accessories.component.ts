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
  selector: 'app-accessories',
  imports: [CommonModule, FormsModule],
  templateUrl: './accessories.component.html',
  styleUrl: './accessories.component.css'
})
export class AccessoriesComponent implements OnInit {
  constructor(private router: Router) { }

  products: Product[] = [];
  filteredProducts: Product[] = [];

  // Filters
  priceRange = { min: 500, max: 50000 };
  brands: string[] = ['Samsung', 'Apple', 'Sony', 'JBL', 'Bose', 'Logitech'];
  selectedBrands: string[] = [];
  features: string[] = ['Wireless', 'Noise Cancelling', 'Water Resistant', 'Bluetooth 5.0+'];
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
        name: 'Sony WH-1000XM5 Headphones',
        brand: 'Sony',
        specs: 'Wireless Noise Cancelling, 30h battery',
        price: 29999,
        discount: 20,
        rating: 4.8,
        features: ['Wireless', 'Noise Cancelling', 'Bluetooth 5.0+']
      },
      {
        id: 2,
        name: 'Apple AirPods Pro (2nd Gen)',
        brand: 'Apple',
        specs: 'Active Noise Cancellation, Spatial Audio',
        price: 34999,
        rating: 4.9,
        features: ['Wireless', 'Noise Cancelling', 'Water Resistant']
      },
      {
        id: 3,
        name: 'Samsung Galaxy Buds2 Pro',
        brand: 'Samsung',
        specs: 'Intelligent ANC, 360 Audio, 5h battery',
        price: 24999,
        discount: 15,
        rating: 4.7,
        features: ['Wireless', 'Bluetooth 5.0+', 'Water Resistant']
      },
      {
        id: 4,
        name: 'JBL Flip 6 Portable Speaker',
        brand: 'JBL',
        specs: 'IP67 Waterproof, 12h playtime, PartyBoost',
        price: 12999,
        rating: 4.6,
        features: ['Water Resistant', 'Bluetooth 5.0+']
      },
      {
        id: 5,
        name: 'Logitech MX Master 3S',
        brand: 'Logitech',
        specs: 'Wireless Mouse, 8000 DPI, MagSpeed Scrolling',
        price: 12499,
        discount: 10,
        rating: 4.8,
        features: ['Wireless', 'Bluetooth 5.0+']
      },
      {
        id: 6,
        name: 'Bose QuietComfort Earbuds II',
        brand: 'Bose',
        specs: 'Customizable Noise Cancellation, 6h battery',
        price: 39999,
        rating: 4.7,
        features: ['Wireless', 'Noise Cancelling', 'Water Resistant']
      },
      {
        id: 7,
        name: 'Anker PowerCore 26800 Power Bank',
        brand: 'Anker',
        specs: '26800mAh, 30W Fast Charging, 3 ports',
        price: 8999,
        rating: 4.5,
        features: []
      },
      {
        id: 8,
        name: 'Samsung Wireless Charger',
        brand: 'Samsung',
        specs: '15W Fast Charging, LED indicator',
        price: 3499,
        discount: 25,
        rating: 4.4,
        features: ['Wireless']
      }
    ];
  }

  toggleBrand(brand: string) {
    if (this.selectedBrands.includes(brand)) {
      this.selectedBrands = this.selectedBrands.filter(b => b !== brand);
    } else {
      this.selectedBrands.push(brand);
    }
    this.applyFilters();
  }

  toggleFeature(feature: string) {
    if (this.selectedFeatures.includes(feature)) {
      this.selectedFeatures = this.selectedFeatures.filter(f => f !== feature);
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
          // Fallback to price if rating is missing
          return (b.rating || 0) - (a.rating || 0) || a.id - b.id;
        default: // popularity
          return a.id - b.id;
      }
    });
  }

  resetFilters() {
    this.selectedBrands = [];
    this.selectedFeatures = [];
    this.priceRange = { min: 500, max: 50000 };
    this.selectedSort = 'popularity';
    this.applyFilters();
  }

  onSearch(): void {
    alert('Search functionality is not implemented yet.');
    console.log('Search button clicked');
  }

  onCategoryClick(category: string): void {
    console.log(`Category clicked: ${category}`);
    switch (category) {
      case 'phones':
        this.router.navigate(['/phones']);
        break;
      case 'laptops':
        this.router.navigate(['/laptops']);
        break;
      case 'accessories':
        this.router.navigate(['/accessories']);
        break;
      case 'appliances':
        this.router.navigate(['/home-appliances']);
        break;
      case 'gaming':
        this.router.navigate(['/gaming']);
        break;
      case 'audio':
        this.router.navigate(['/audio-sound']);
        break;
      default:
        console.warn('Unknown category:', category);
    }
  }

  // Calculate discounted price
  getDiscountedPrice(price: number, discount?: number): number {
    if (!discount) return price;
    return price - (price * discount / 100);
  }

  cartCount = 3;
  goToCart() {
    this.router.navigate(['/cart']);
  }
}
