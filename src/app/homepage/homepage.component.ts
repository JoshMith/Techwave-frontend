import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { finalize } from 'rxjs/operators';

interface Category {
  category_id: number;
  name: string;
  description: string;
  featured: boolean;
  icon_path: string;
  created_at: string;
  // For display purposes
  icon?: string;
  count?: number;
  key?: string;
}

@Component({
  selector: 'app-homepage',
  imports: [CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent implements OnInit {
  constructor(
    private router: Router,
    private apiService: ApiService
  ) { }

  featuredCategories: Category[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Load categories from API
   */
  loadCategories(): void {
    this.isLoading = true;
    this.error = null;
    
    this.apiService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.featuredCategories = categories.map(category => ({
          ...category,
          icon: this.getCategoryIcon(category.name),
          key: this.createCategoryKey(category.name),
          count: 0 // Initialize with 0, will be updated
        }));
        
        // Fetch product counts for each category
        this.loadProductCounts();
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.error = 'Failed to load categories. Please try again later.';
        this.isLoading = false;
        this.featuredCategories = this.getDefaultCategories();
      }
    });
  }

  /**
   * Load product counts for all categories
   */
  private loadProductCounts(): void {
    const countRequests = this.featuredCategories.map(category => 
      this.apiService.getProductCountByCategory(category.category_id.toString()).pipe(
        finalize(() => {
          // When all requests complete, set loading to false
          if (this.featuredCategories.every(c => c.count !== undefined)) {
            this.isLoading = false;
          }
        })
      )
    );

    countRequests.forEach((request, index) => {
      request.subscribe({
        next: (response) => {
          this.featuredCategories[index].count = response.data.product_count;
        },
        error: (err) => {
          console.error(`Failed to load product count for category ${this.featuredCategories[index].name}:`, err);
          // Fallback to random count if API fails
          this.featuredCategories[index].count = this.getRandomProductCount();
        }
      });
    });
  }


  /**
   * Handle category card clicks
   */
  selectCategory(category: any): void {
    this.router.navigate(['/categories', category.name]);
  }

  /**
   * Create a URL-friendly key from category name
   */
  private createCategoryKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  /**
   * Get an emoji icon based on category name
   */
  private getCategoryIcon(name: string): string {
    const iconMap: {[key: string]: string} = {
      'Phones': '📱',
      'Laptops': '💻',
      'Accessories': '🎧',
      'Home Appliances': '🏠',
      'Gaming': '🎮',
      'Audio & Sound': '🔊',
      'Computers': '🖥️',
      'Tablets': '📱',
      'Cameras': '📷'
    };
    
    return iconMap[name] || '🛍️';
  }

  /**
   * Generate random product count (fallback when API fails)
   */
  private getRandomProductCount(): number {
    return Math.floor(Math.random() * 50) + 10;
  }

  /**
   * Default categories in case API fails
   */
  private getDefaultCategories(): Category[] {
    return [
      { name: 'Phones', icon: '📱', count: 24, key: 'Phones', category_id: 1, description: '', featured: true, icon_path: '', created_at: '' },
      { name: 'Laptops', icon: '💻', count: 17, key: 'Laptops', category_id: 2, description: '', featured: true, icon_path: '', created_at: '' },
      { name: 'Accessories', icon: '🎧', count: 42, key: 'Accessories', category_id: 3, description: '', featured: true, icon_path: '', created_at: '' },
      { name: 'Home Appliances', icon: '🏠', count: 15, key: 'Home Appliances', category_id: 4, description: '', featured: true, icon_path: '', created_at: '' },
      { name: 'Gaming', icon: '🎮', count: 32, key: 'Gaming', category_id: 5, description: '', featured: true, icon_path: '', created_at: '' },
      { name: 'Audio & Sound', icon: '🔊', count: 13, key: 'Audio & Sound', category_id: 6, description: '', featured: true, icon_path: '', created_at: '' },
    ];
  }

  /**
   * Handle category click
   */
  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase()}`]);
  }

  /**
   * Handle Shop Now button click
   */
  onShopNow(): void {
    this.router.navigate(['/shop']);
  }

  sellerPortal(): void {
    this.router.navigate(['/login']);
  }

  onSearch(): void {
    alert('Search functionality is not implemented yet.');
  }

  cartCount = 3;
  goToCart() {
    this.router.navigate(['/cart']);
  }
}