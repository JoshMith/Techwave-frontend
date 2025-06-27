// audio-sound.component.ts
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
  selector: 'app-audio-sound',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audio-sound.component.html',
  styleUrls: ['./audio-sound.component.css']
})
export class AudioSoundComponent implements OnInit {
  constructor(private router: Router) { }

  products: Product[] = [];
  filteredProducts: Product[] = [];

  // Filters
  priceRange = { min: 1000, max: 100000 };
  brands: string[] = ['Sony', 'Bose', 'JBL', 'Sennheiser', 'Apple', 'Marshall'];
  selectedBrands: string[] = [];
  features: string[] = ['Wireless', 'Noise Cancelling', 'Water Resistant', 'Bluetooth 5.0+', 'True Wireless', 'Surround Sound'];
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
        name: 'Sony WH-1000XM5 Wireless Headphones',
        brand: 'Sony',
        specs: 'Industry-leading noise cancellation, 30-hour battery',
        price: 42999,
        discount: 15,
        rating: 4.9,
        features: ['Wireless', 'Noise Cancelling', 'Bluetooth 5.0+']
      },
      {
        id: 2,
        name: 'Bose QuietComfort Ultra Earbuds',
        brand: 'Bose',
        specs: 'Immersive Audio, CustomTune technology',
        price: 35999,
        rating: 4.8,
        features: ['True Wireless', 'Noise Cancelling', 'Water Resistant']
      },
      {
        id: 3,
        name: 'JBL PartyBox 310 Portable Speaker',
        brand: 'JBL',
        specs: '240W RMS, IPX4 water resistance, light show',
        price: 79999,
        discount: 10,
        rating: 4.7,
        features: ['Wireless', 'Water Resistant', 'Bluetooth 5.0+']
      },
      {
        id: 4,
        name: 'Sennheiser Momentum True Wireless 4',
        brand: 'Sennheiser',
        specs: 'Hi-Res Audio, 7.5hr battery, premium sound',
        price: 28999,
        rating: 4.8,
        features: ['True Wireless', 'Bluetooth 5.0+']
      },
      {
        id: 5,
        name: 'Apple HomePod (2nd Generation)',
        brand: 'Apple',
        specs: 'Room-filling sound, spatial audio, smart assistant',
        price: 44999,
        discount: 5,
        rating: 4.6,
        features: ['Wireless', 'Surround Sound']
      },
      {
        id: 6,
        name: 'Marshall Woburn III Bluetooth Speaker',
        brand: 'Marshall',
        specs: '220W power, dynamic drivers, iconic design',
        price: 69999,
        rating: 4.7,
        features: ['Wireless', 'Bluetooth 5.0+']
      },
      {
        id: 7,
        name: 'Sony HT-A5000 Soundbar',
        brand: 'Sony',
        specs: '5.1.2ch Dolby Atmos, 360 Spatial Sound',
        price: 89999,
        discount: 12,
        rating: 4.8,
        features: ['Surround Sound', 'Bluetooth 5.0+']
      },
      {
        id: 8,
        name: 'Bose SoundLink Flex Bluetooth Speaker',
        brand: 'Bose',
        specs: 'PositionIQ technology, IP67 waterproof',
        price: 17999,
        rating: 4.5,
        features: ['Wireless', 'Water Resistant', 'Bluetooth 5.0+']
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
    this.priceRange = { min: 1000, max: 100000 };
    this.selectedSort = 'popularity';
    this.applyFilters();
  }

  getDiscountedPrice(price: number, discount?: number): number {
    return discount ? price * (1 - discount / 100) : price;
  }

  onCategoryClick(category: string) {
    this.router.navigate([`/${category}`]);
  }

  onSearch() {
    console.log('Searching audio products...');
    // Actual search implementation would go here
  }
  cartCount = 3;
  goToCart() {
    this.router.navigate(['/cart']);
  }
}