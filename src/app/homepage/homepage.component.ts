import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  imports: [],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent {
constructor(private router: Router) { }

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
