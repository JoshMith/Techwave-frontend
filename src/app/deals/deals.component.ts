import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-deals',
  imports: [CommonModule, RouterModule],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css'
})
export class DealsComponent {
  constructor(private router: Router) { }
  // Featured deals
  featuredDeals = [
    {
      id: 1,
      title: 'Flash Sale: Smartphones',
      description: 'Up to 40% off on latest smartphones',
      discount: 40,
      expiration: '2025-07-05T23:59:59',
      category: 'Phones',
      products: 24,
      image: 'phones'
    },
    {
      id: 2,
      title: 'Weekend Special: Laptops',
      description: 'Premium laptops at clearance prices',
      discount: 35,
      expiration: '2025-07-07T23:59:59',
      category: 'Laptops',
      products: 17,
      image: 'laptops'
    }
  ];

  // All active deals
  activeDeals = [
    {
      id: 1,
      title: 'Headphones Mania',
      description: 'Premium headphones starting from KSh 2,499',
      discount: 50,
      expiration: '2025-07-10T23:59:59',
      category: 'Accessories',
      products: 42,
      image: 'headphones'
    },
    {
      id: 2,
      title: 'Home Appliances Bundle',
      description: 'Save up to KSh 15,000 on appliance bundles',
      discount: 30,
      expiration: '2025-07-12T23:59:59',
      category: 'Home Appliances',
      products: 15,
      image: 'appliances'
    },
    {
      id: 3,
      title: 'Gaming Gear Extravaganza',
      description: 'Gaming accessories at lowest prices',
      discount: 25,
      expiration: '2025-07-08T23:59:59',
      category: 'Gaming',
      products: 28,
      image: 'gaming'
    },
    {
      id: 4,
      title: 'Audio System Sale',
      description: 'Premium sound systems with free installation',
      discount: 20,
      expiration: '2025-07-15T23:59:59',
      category: 'Audio',
      products: 19,
      image: 'audio'
    },
    {
      id: 5,
      title: 'Smartwatch Specials',
      description: 'Latest smartwatches with health tracking',
      discount: 15,
      expiration: '2025-07-09T23:59:59',
      category: 'Wearables',
      products: 23,
      image: 'smartwatches'
    },
    {
      id: 6,
      title: 'TV & Entertainment',
      description: '4K TVs with extended warranty',
      discount: 22,
      expiration: '2025-07-14T23:59:59',
      category: 'Home Entertainment',
      products: 12,
      image: 'tvs'
    }
  ];

  // Expiring soon deals (within 3 days)
  expiringDeals = [
    {
      id: 7,
      title: 'Laptop Accessories',
      description: 'Docks, bags and more at clearance prices',
      discount: 45,
      expiration: '2025-06-30T23:59:59',
      category: 'Accessories',
      products: 18,
      image: 'laptop-accessories'
    },
    {
      id: 8,
      title: 'Mobile Accessories',
      description: 'Cases, chargers and screen protectors',
      discount: 60,
      expiration: '2025-06-29T23:59:59',
      category: 'Accessories',
      products: 36,
      image: 'mobile-accessories'
    }
  ];

  // Categories for filtering
  categories = [
    { name: 'All Deals', icon: '🔥', count: this.activeDeals.length + this.expiringDeals.length },
    { name: 'Phones', icon: '📱', count: 24 },
    { name: 'Laptops', icon: '💻', count: 17 },
    { name: 'Accessories', icon: '🎧', count: 42 },
    { name: 'Home Appliances', icon: '🏠', count: 15 },
    { name: 'Gaming', icon: '🎮', count: 28 }
  ];

  selectedCategory = 'All Deals';

  // Filter deals by category
  filterDeals(category: string) {
    this.selectedCategory = category;
  }

  // Get filtered deals based on selection
  get filteredDeals() {
    if (this.selectedCategory === 'All Deals') {
      return [...this.activeDeals, ...this.expiringDeals];
    }
    return [...this.activeDeals, ...this.expiringDeals].filter(
      deal => deal.category === this.selectedCategory
    );
  }

  // Calculate days remaining for a deal
  daysRemaining(expiration: string): number {
    const expDate = new Date(expiration);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
  cartCount = 3;
  goToCart() {
    this.router.navigate(['/cart']);
  }
}
