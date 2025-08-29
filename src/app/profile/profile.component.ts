import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  constructor(private router: Router) { }
  // User data
  user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    joined: 'January 2023',
    status: 'active'
  };

  // Account stats
  stats = {
    orders: 2,
    wishlist: 4,
    points: 100
  };

  // Recent orders
  orders = [
    {
      id: '#12345',
      status: 'In Progress',
      date: 'January 15, 2024',
      items: 3,
      total: 'KSh 42,597'
    },
    {
      id: '#12344',
      status: 'Delivered',
      date: 'December 28, 2023',
      items: 1,
      total: 'KSh 12,999'
    },
    {
      id: '#12343',
      status: 'Delivered',
      date: 'December 5, 2023',
      items: 2,
      total: 'KSh 24,498'
    }
  ];

  // Recommended products
  recommendedProducts = [
    {
      id: 1,
      name: 'Sony WH-1000XM5',
      category: 'Headphones',
      price: 'KSh 29,999',
      discount: '20% off'
    },
    {
      id: 2,
      name: 'Samsung Galaxy Tab S9',
      category: 'Tablet',
      price: 'KSh 69,999',
      discount: 'Free case included'
    },
    {
      id: 3,
      name: 'Apple Watch Series 8',
      category: 'Smartwatch',
      price: 'KSh 54,999',
      discount: 'Free shipping'
    },
    {
      id: 4,
      name: 'Logitech MX Master 3S',
      category: 'Mouse',
      price: 'KSh 12,499',
      discount: '15% off'
    }
  ];

  // Navigation handler
  navigateTo(path: string) {
    console.log(`Navigating to ${path}`);
    // In a real app: this.router.navigate([path]);
  }

  onSearch(): void {
    alert('Search functionality is not implemented yet.');
    console.log('Search button clicked');
  }

    /**
   * Handle category click
   */
  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase()}`]);
  }

  
  cartCount = 3;
  goToCart() {
    this.router.navigate(['/cart']);
  }
}
