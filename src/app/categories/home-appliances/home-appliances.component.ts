// home-appliances.component.ts
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
  capacity?: string;
}

@Component({
  selector: 'app-home-appliances',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home-appliances.component.html',
  styleUrls: ['./home-appliances.component.css']
})
export class HomeAppliancesComponent implements OnInit {
  constructor(private router: Router) { }

  products: Product[] = [];
  filteredProducts: Product[] = [];

  // Filters
  priceRange = { min: 5000, max: 200000 };
  brands: string[] = ['Samsung', 'LG', 'Hisense', 'Bosch', 'Whirlpool', 'Midea'];
  selectedBrands: string[] = [];
  features: string[] = ['Energy Efficient', 'Smart Features', 'Large Capacity', 'Inverter Technology'];
  selectedFeatures: string[] = [];

  // Sorting
  sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'capacity', label: 'Capacity' }
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
        name: 'Samsung 65" 4K Smart TV',
        brand: 'Samsung',
        specs: 'Crystal UHD, Smart TV with Streaming',
        price: 89999,
        discount: 15,
        rating: 4.7,
        features: ['Smart Features', 'Energy Efficient'],
        capacity: '65 inch'
      },
      {
        id: 2,
        name: 'LG Inverter Refrigerator',
        brand: 'LG',
        specs: 'Side by Side, 623L, Smart Cooling',
        price: 149999,
        rating: 4.8,
        features: ['Inverter Technology', 'Large Capacity', 'Energy Efficient'],
        capacity: '623L'
      },
      {
        id: 3,
        name: 'Hisense Front Load Washing Machine',
        brand: 'Hisense',
        specs: '9kg, 1400 RPM, Steam Care',
        price: 64999,
        discount: 10,
        rating: 4.5,
        features: ['Large Capacity', 'Energy Efficient'],
        capacity: '9kg'
      },
      {
        id: 4,
        name: 'Bosch Built-in Oven',
        brand: 'Bosch',
        specs: '60cm, Pyrolytic Cleaning, 8 Functions',
        price: 79999,
        rating: 4.6,
        features: ['Energy Efficient', 'Smart Features'],
        capacity: '60cm'
      },
      {
        id: 5,
        name: 'Midea Microwave Oven',
        brand: 'Midea',
        specs: '25L, Grill, Convection, 10 Power Levels',
        price: 18999,
        discount: 20,
        rating: 4.4,
        features: ['Energy Efficient'],
        capacity: '25L'
      },
      {
        id: 6,
        name: 'Whirlpool Top Load Washing Machine',
        brand: 'Whirlpool',
        specs: '7kg, 6th Sense Technology, ZPF',
        price: 42999,
        rating: 4.3,
        features: ['Inverter Technology', 'Energy Efficient'],
        capacity: '7kg'
      },
      {
        id: 7,
        name: 'Samsung Air Conditioner',
        brand: 'Samsung',
        specs: '24,000 BTU, Inverter, WindFree Cooling',
        price: 109999,
        discount: 12,
        rating: 4.7,
        features: ['Inverter Technology', 'Smart Features', 'Energy Efficient'],
        capacity: '24,000 BTU'
      },
      {
        id: 8,
        name: 'LG Cordless Vacuum Cleaner',
        brand: 'LG',
        specs: 'CordZero, Self-Charging, 40min Runtime',
        price: 34999,
        rating: 4.5,
        features: ['Smart Features'],
        capacity: '0.8L'
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
        case 'capacity':
          // Extract numerical value from capacity string
          const aCapacity = parseFloat(a.capacity?.replace(/[^\d.]/g, '') || '0');
          const bCapacity = parseFloat(b.capacity?.replace(/[^\d.]/g, '') || '0');
          return bCapacity - aCapacity;
        default: // popularity
          return a.id - b.id;
      }
    });
  }

  resetFilters() {
    this.selectedBrands = [];
    this.selectedFeatures = [];
    this.priceRange = { min: 5000, max: 200000 };
    this.selectedSort = 'popularity';
    this.applyFilters();
  }

  onSearch(): void {
    alert('Search functionality is not implemented yet.');
    console.log('Search button clicked');
  }

  // Navigation methods
  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase().replace(' ', '-')}`]);
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