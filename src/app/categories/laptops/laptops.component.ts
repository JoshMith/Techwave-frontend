import { CommonModule, NgFor } from '@angular/common';
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
}

@Component({
  selector: 'app-laptops',
  imports: [CommonModule, FormsModule],
  templateUrl: './laptops.component.html',
  styleUrl: './laptops.component.css'
})

export class LaptopsComponent  implements OnInit {
constructor(private router: Router) { }

products: Product[] = [];
  filteredProducts: Product[] = [];
  
  // Filters
  priceRange = { min: 20000, max: 100000 };
  brands: string[] = ['HP', 'Dell', 'Lenovo', 'Apple'];
  selectedBrands: string[] = [];
  features: string[] = ['Core i5', 'SSD', '8GB RAM+'];
  selectedFeatures: string[] = [];
  
  // Sorting
  sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
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
        name: 'Lenovo IdeaPad 5',
        brand: 'Lenovo',
        specs: 'Intel Core i5, 8GB RAM, 256GB SSD',
        price: 57499,
        features: ['Core i5', 'SSD', '8GB RAM+']
      },
      {
        id: 2,
        name: 'HP Pavilion 15',
        brand: 'HP',
        specs: 'Intel Core i5, 8GB RAM, 512GB SSD',
        price: 64999,
        features: ['Core i5', 'SSD', '8GB RAM+']
      },
      {
        id: 3,
        name: 'Dell Inspiron 14',
        brand: 'Dell',
        specs: 'Intel Core i7, 8GB RAM, 256GB SSD',
        price: 84999,
        features: ['SSD', '8GB RAM+']
      },
      {
        id: 4,
        name: 'MacBook Air',
        brand: 'Apple',
        specs: 'Apple MI Chip, 8GB RAM, 256GB SSD',
        price: 124999,
        features: ['SSD', '8GB RAM+']
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
        default: // popularity
          return a.id - b.id;
      }
    });
  }

  resetFilters() {
    this.selectedBrands = [];
    this.selectedFeatures = [];
    this.priceRange = { min: 20000, max: 100000 };
    this.selectedSort = 'popularity';
    this.applyFilters();
  }

  onSearch(): void {
  alert('Search functionality is not implemented yet.');
  console.log('Search button clicked');
  }

  /**
   * Handle category card clicks
   * @param category - The category that was clicked
   */
  onCategoryClick(category: string): void {
    console.log(`Category clicked: ${category}`);
    // Example: this.router.navigate(['/categories', category]);
    
    switch(category) {
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
}
