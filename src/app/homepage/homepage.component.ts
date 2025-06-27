import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Category {
  name: string;
  icon: string;
  count: number;
  key: string;
}


@Component({
  selector: 'app-homepage',
  imports: [CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent {
  constructor(private router: Router) { }

  activeCategory: string = '';

  /**
   * Handle Shop Now button click
   */
  onShopNow(): void {
    console.log('Shop Now clicked');
    this.router.navigate(['/shop']);
  }

  onSearch(): void {
    alert('Search functionality is not implemented yet.');
    console.log('Search button clicked');
  }

  // Featured categories with route keys
  featuredCategories: Category[] = [
    { name: 'Phones', icon: '📱', count: 24, key: 'phones' },
    { name: 'Laptops', icon: '💻', count: 17, key: 'laptops' },
    { name: 'Accessories', icon: '🎧', count: 42, key: 'accessories' },
    { name: 'Home Appliances', icon: '🏠', count: 15, key: 'home-appliances' },
    { name: 'Gaming', icon: '🎮', count: 32, key: 'gaming' },
    { name: 'Audio & Sound', icon: '🔊', count: 13, key: 'audio-sound' },
  ];

  /**
   * Handle category card clicks
   */
  selectCategory(category: Category): void {
    this.activeCategory = category.name;
    this.router.navigate(['/', category.key]);
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
