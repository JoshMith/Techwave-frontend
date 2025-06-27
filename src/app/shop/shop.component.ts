import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

// Define the Product interface
interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;
  price: number;
  discount?: number;
  rating: number;
  reviews: number;
  specs: string;
  image: string;
  inStock: boolean;
  colors: string[];
  features: string[];
}

@Component({
  selector: 'app-shop',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent implements OnInit {
  constructor(private router: Router) { }
  // All products data
  allProducts: Product[] = [
    {
      id: 1,
      name: 'Samsung Galaxy S24',
      category: 'Phones',
      brand: 'Samsung',
      price: 89999,
      discount: 10,
      rating: 4.8,
      reviews: 342,
      specs: '6.7" AMOLED, 256GB, 12GB RAM, 5G',
      image: 'phone1',
      inStock: true,
      colors: ['Black', 'Silver', 'Blue'],
      features: ['5G', '128GB+', '8GB RAM+', 'OLED Display']
    },
    {
      id: 2,
      name: 'iPhone 15 Pro',
      category: 'Phones',
      brand: 'Apple',
      price: 129999,
      rating: 4.9,
      reviews: 487,
      specs: '6.1" Super Retina XDR, 256GB, A17 Pro',
      image: 'phone2',
      inStock: true,
      colors: ['Space Black', 'Silver', 'Gold'],
      features: ['5G', '256GB+', 'Face ID', 'iOS']
    },
    {
      id: 3,
      name: 'Dell XPS 15',
      category: 'Laptops',
      brand: 'Dell',
      price: 149999,
      discount: 15,
      rating: 4.7,
      reviews: 231,
      specs: '15.6" 4K UHD, Intel Core i9, 32GB RAM, 1TB SSD',
      image: 'laptop1',
      inStock: true,
      colors: ['Platinum Silver'],
      features: ['Core i7+', '16GB RAM+', 'SSD', 'Touchscreen']
    },
    {
      id: 4,
      name: 'MacBook Air M2',
      category: 'Laptops',
      brand: 'Apple',
      price: 124999,
      rating: 4.8,
      reviews: 398,
      specs: '13.6" Retina, Apple M2, 16GB RAM, 512GB SSD',
      image: 'laptop2',
      inStock: true,
      colors: ['Space Gray', 'Silver', 'Gold'],
      features: ['Apple Silicon', 'SSD', 'Retina Display', 'Lightweight']
    },
    {
      id: 5,
      name: 'Sony WH-1000XM5',
      category: 'Accessories',
      brand: 'Sony',
      price: 29999,
      discount: 20,
      rating: 4.9,
      reviews: 512,
      specs: 'Wireless Noise Cancelling Headphones',
      image: 'headphones',
      inStock: true,
      colors: ['Black', 'Silver'],
      features: ['Noise Cancelling', 'Bluetooth 5.0', '30h Battery']
    },
    {
      id: 6,
      name: 'Samsung 65" QLED TV',
      category: 'Home Appliances',
      brand: 'Samsung',
      price: 89999,
      discount: 12,
      rating: 4.6,
      reviews: 187,
      specs: '65" 4K QLED Smart TV with HDR',
      image: 'tv',
      inStock: true,
      colors: ['Black'],
      features: ['4K Resolution', 'Smart TV', 'HDR', 'Voice Control']
    },
    {
      id: 7,
      name: 'Xiaomi Redmi Note 13',
      category: 'Phones',
      brand: 'Xiaomi',
      price: 24999,
      rating: 4.4,
      reviews: 156,
      specs: '6.5" AMOLED, 128GB, 8GB RAM, 5G',
      image: 'phone3',
      inStock: true,
      colors: ['Blue', 'Black', 'Green'],
      features: ['5G', '128GB', 'AMOLED', 'Fast Charging']
    },
    {
      id: 8,
      name: 'HP Pavilion Gaming',
      category: 'Laptops',
      brand: 'HP',
      price: 79999,
      discount: 8,
      rating: 4.3,
      reviews: 142,
      specs: '15.6" FHD, Intel i5, 16GB RAM, 512GB SSD, GTX 1650',
      image: 'laptop3',
      inStock: true,
      colors: ['Black'],
      features: ['Gaming', 'Dedicated GPU', 'Backlit Keyboard', 'SSD']
    },
    {
      id: 9,
      name: 'Apple Watch Series 9',
      category: 'Accessories',
      brand: 'Apple',
      price: 54999,
      rating: 4.7,
      reviews: 287,
      specs: '45mm GPS, Always-On Retina display',
      image: 'watch',
      inStock: true,
      colors: ['Midnight', 'Starlight', 'Product Red'],
      features: ['Health Tracking', 'Water Resistant', 'GPS', 'ECG']
    },
    {
      id: 10,
      name: 'LG Inverter Microwave',
      category: 'Home Appliances',
      brand: 'LG',
      price: 18999,
      discount: 15,
      rating: 4.5,
      reviews: 89,
      specs: '25L Capacity, Smart Inverter, Grill Function',
      image: 'microwave',
      inStock: true,
      colors: ['Silver'],
      features: ['Inverter', 'Grill', 'Convection', 'Smart Sensor']
    }
  ];

  // State variables
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchQuery: string = '';
  selectedCategory: string = 'all';
  selectedBrand: string = 'all';
  minPrice: number = 0;
  maxPrice: number = 200000;
  sortOption: string = 'featured';

  // Filter options
  categories: string[] = ['all', 'Phones', 'Laptops', 'Accessories', 'Home Appliances'];
  brands: string[] = ['all', 'Samsung', 'Apple', 'Dell', 'Sony', 'Xiaomi', 'HP', 'LG'];
  sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' }
  ];

  // Special offers
  specialOffers = [
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
    },
    {
      title: 'New Phone Launch',
      description: 'Galaxy S24 with trade-in bonus',
      category: 'Phones',
      discount: 15
    }
  ];

  // Featured categories
  featuredCategories = [
    { name: 'Phones', icon: '📱', count: 24 },
    { name: 'Laptops', icon: '💻', count: 17 },
    { name: 'Accessories', icon: '🎧', count: 42 },
    { name: 'Home Appliances', icon: '🏠', count: 15 }
  ];

  ngOnInit() {
    this.products = [...this.allProducts];
    this.filteredProducts = [...this.allProducts];
  }

  // Filter products based on selections
  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      // Category filter
      if (this.selectedCategory !== 'all' && product.category !== this.selectedCategory) {
        return false;
      }

      // Brand filter
      if (this.selectedBrand !== 'all' && product.brand !== this.selectedBrand) {
        return false;
      }

      // Price range filter
      if (product.price < this.minPrice || product.price > this.maxPrice) {
        return false;
      }

      // Search query filter
      if (this.searchQuery &&
        !product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
        !product.brand.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
        !product.specs.toLowerCase().includes(this.searchQuery.toLowerCase())) {
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
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => b.price - a.price);
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
    console.log(`Added to cart: ${product.name}`);
    // In a real app, you would call a cart service here
    alert(`Added ${product.name} to your cart!`);
  }

  // View product details
  viewDetails(product: Product) {
    console.log(`Viewing details for: ${product.name}`);
    // In a real app, you would navigate to product detail page
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
