import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Interface for Product data
interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  specs: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  features: {
    has5G: boolean;
    storage: number; // in GB
    ram: number; // in GB
  };
}

// Interface for Filters
interface Filters {
  priceRange: {
    min: number;
    max: number;
  };
  brands: string[];
  features: {
    has5G: boolean;
    has128GB: boolean;
    has8GBRAM: boolean;
  };
}


@Component({
  selector: 'app-phones',
  imports: [CommonModule, FormsModule],
  templateUrl: './phones.component.html',
  styleUrl: './phones.component.css'
})
export class PhonesComponent implements OnInit {

  constructor( private router: Router ) { }
  // Sample data - In real app, this would come from a service
  allProducts: Product[] = [
    {
      id: 1,
      name: 'Samsung Galaxy A54',
      brand: 'Samsung',
      price: 34900,
      specs: '128GB, 5G, 8GB RAM',
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/ke/2302/gallery/ke-galaxy-a54-5g-a546-sm-a546elgdkke-534851051',
      rating: 4.2,
      reviewCount: 42,
      features: { has5G: true, storage: 128, ram: 8 }
    },
    {
      id: 2,
      name: 'iPhone 15',
      brand: 'Apple',
      price: 129000,
      specs: '256GB, 5G, 8GB RAM',
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-pink_AV1',
      rating: 4.8,
      reviewCount: 78,
      features: { has5G: true, storage: 256, ram: 8 }
    },
    {
      id: 3,
      name: 'Xiaomi Redmi Note 12',
      brand: 'Xiaomi',
      price: 17490,
      specs: '64GB, 4G, 4GB RAM',
      imageUrl: 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F596/pms_1677559808.52945351.png',
      rating: 4.0,
      reviewCount: 156,
      features: { has5G: false, storage: 64, ram: 4 }
    },
    {
      id: 4,
      name: 'Google Pixel 8',
      brand: 'Google',
      price: 89900,
      specs: '128GB, 5G, 8GB RAM',
      imageUrl: 'https://lh3.googleusercontent.com/VlNzlW4O6WtGCF8x3FVn1I5ZNGTMWl3vgJ8XJqOuLhI8W5SZ8K6xzFEPHwY_kQ',
      rating: 4.6,
      reviewCount: 89,
      features: { has5G: true, storage: 128, ram: 8 }
    },
    {
      id: 5,
      name: 'Oppo A78',
      brand: 'Oppo',
      price: 24900,
      specs: '128GB, 4G, 8GB RAM',
      imageUrl: 'https://image01.oppo.com/content/dam/oppo/common/mkt/v2-2/a78-5g/navigation/OPPO-A78-5G-Black-PC.png',
      rating: 3.8,
      reviewCount: 67,
      features: { has5G: false, storage: 128, ram: 8 }
    },
    {
      id: 6,
      name: 'Huawei Nova 11',
      brand: 'Huawei',
      price: 45900,
      specs: '256GB, 4G, 8GB RAM',
      imageUrl: 'https://consumer.huawei.com/content/dam/huawei-cbg-site/common/mkt/pdp/phones/nova11/imgs/pc/nova11-kv-green.png',
      rating: 4.1,
      reviewCount: 34,
      features: { has5G: false, storage: 256, ram: 8 }
    },
    {
      id: 7,
      name: 'Tecno Camon 20',
      brand: 'Tecno',
      price: 19900,
      specs: '128GB, 4G, 8GB RAM',
      imageUrl: 'https://www.tecno-mobile.com/sites/default/files/2023-04/camon20-premiere-serenity-blue-1.png',
      rating: 3.9,
      reviewCount: 112,
      features: { has5G: false, storage: 128, ram: 8 }
    },
    {
      id: 8,
      name: 'OnePlus Nord 3',
      brand: 'OnePlus',
      price: 52900,
      specs: '128GB, 5G, 8GB RAM',
      imageUrl: 'https://opmobility.s3.amazonaws.com/ou-resources/nord-3-5g/images/gallery/nord-3-5g-tempest-gray-1.png',
      rating: 4.4,
      reviewCount: 91,
      features: { has5G: true, storage: 128, ram: 8 }
    },
    {
      id: 9,
      name: 'Infinix Note 30',
      brand: 'Infinix',
      price: 16900,
      specs: '128GB, 4G, 8GB RAM',
      imageUrl: 'https://www.infinixmobility.com/sites/default/files/note-30-obsidian-black-1.png',
      rating: 3.7,
      reviewCount: 203,
      features: { has5G: false, storage: 128, ram: 8 }
    },
    {
      id: 10,
      name: 'Realme GT Neo 5',
      brand: 'Realme',
      price: 39900,
      specs: '256GB, 5G, 12GB RAM',
      imageUrl: 'https://image01.realme.net/general/20230227/1677492341234.jpg',
      rating: 4.3,
      reviewCount: 156,
      features: { has5G: true, storage: 256, ram: 12 }
    }
  ];

  // Component state
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  loading = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 0;

  // Filters
  filters: Filters = {
    priceRange: {
      min: 5000,
      max: 200000
    },
    brands: [],
    features: {
      has5G: false,
      has128GB: false,
      has8GBRAM: false
    }
  };

  // Available filter options
  availableBrands: string[] = [];

  // Sorting
  sortBy = 'popularity';

  // Computed properties
  get totalProducts(): number {
    return this.filteredProducts.length;
  }

  get Math() {
    return Math;
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    this.loading = true;

    // Simulate API call delay
    setTimeout(() => {
      this.extractAvailableBrands();
      this.applyFilters();
      this.loading = false;
    }, 500);
  }

  private extractAvailableBrands(): void {
    const brands = new Set(this.allProducts.map(product => product.brand));
    this.availableBrands = Array.from(brands).sort();
  }

  // Filter methods
  onPriceChange(): void {
    // Ensure min doesn't exceed max
    if (this.filters.priceRange.min > this.filters.priceRange.max) {
      this.filters.priceRange.min = this.filters.priceRange.max;
    }
    this.applyFilters();
  }

  onBrandChange(brand: string, event: any): void {
    if (event.target.checked) {
      if (!this.filters.brands.includes(brand)) {
        this.filters.brands.push(brand);
      }
    } else {
      const index = this.filters.brands.indexOf(brand);
      if (index > -1) {
        this.filters.brands.splice(index, 1);
      }
    }
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredProducts = this.allProducts.filter(product => {
      // Price filter
      if (product.price < this.filters.priceRange.min || product.price > this.filters.priceRange.max) {
        return false;
      }

      // Brand filter
      if (this.filters.brands.length > 0 && !this.filters.brands.includes(product.brand)) {
        return false;
      }

      // Feature filters
      if (this.filters.features.has5G && !product.features.has5G) {
        return false;
      }

      if (this.filters.features.has128GB && product.features.storage < 128) {
        return false;
      }

      if (this.filters.features.has8GBRAM && product.features.ram < 8) {
        return false;
      }

      return true;
    });

    this.sortProducts();
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters(): void {
    this.filters = {
      priceRange: {
        min: 5000,
        max: 200000
      },
      brands: [],
      features: {
        has5G: false,
        has128GB: false,
        has8GBRAM: false
      }
    };
    this.applyFilters();
  }

  // Sorting methods
  onSortChange(): void {
    this.sortProducts();
    this.updatePagination();
  }

  private sortProducts(): void {
    switch (this.sortBy) {
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        this.filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        this.filteredProducts.sort((a, b) => b.id - a.id);
        break;
      case 'popularity':
      default:
        this.filteredProducts.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }
  }

  // Pagination methods
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    this.updatePaginatedProducts();
  }

  private updatePaginatedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProducts();
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      // Show dots if current page is far from start
      if (this.currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== this.totalPages) {
          pages.push(i);
        }
      }

      // Show dots if current page is far from end
      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }

      // Show last page
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }

    return pages;
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

  onImageError(event: any): void {
    // Fallback image when product image fails to load
    event.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
  }

  addToCart(product: Product): void {
    // Handle add to cart functionality
    console.log('Adding to cart:', product.name);
    // In a real app, you would dispatch an action to add to cart state/service
    alert(`${product.name} added to cart!`);
    this.router.navigate(['/cart']);
  }

}
