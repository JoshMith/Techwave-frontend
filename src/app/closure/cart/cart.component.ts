// cart.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

interface CartItem {
  id: number;
  name: string;
  specs: string;
  color: string;
  price: number;
  quantity: number;
  category: string;
}
@Component({
  selector: 'app-cart',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  constructor(private router: Router) { }

  cartItems: CartItem[] = [
    {
      id: 1,
      name: 'Samsung Galaxy A54',
      specs: '128GB, 5G, 8GB RAM',
      color: 'Blue',
      price: 34999,
      quantity: 1,
      category: 'Phones'
    },
    {
      id: 2,
      name: 'JBL Wireless Headphones',
      specs: 'Bluetooth 5.0, 20h Battery',
      color: 'Blue',
      price: 11999,
      quantity: 1,
      category: 'Accessories'
    },
    {
      id: 3,
      name: 'Samsung Wireless Charger',
      specs: '15W Fast Charging',
      color: 'White',
      price: 3499,
      quantity: 1,
      category: 'Accessories'
    },
    {
      id: 4,
      name: 'Lenovo IdeaPad 5',
      specs: 'Intel Core i5, 8GB RAM, 256GB SSD',
      color: 'Gray',
      price: 57499,
      quantity: 1,
      category: 'Laptops'
    },
    {
      id: 5,
      name: 'Samsung Microwave Oven',
      specs: '25L Capacity, Grill Function',
      color: 'Black',
      price: 18999,
      quantity: 1,
      category: 'Home Appliances'
    }
  ];

  couponCode = '';
  couponApplied = false;
  couponDiscount = 0;

  // Delivery information
  deliveryOptions = [
    { location: 'Nairobi', estimate: '1-2 business days' },
    { location: 'Meru', estimate: '2-3 business days' },
    { location: 'Other Areas', estimate: '3-5 business days' }
  ];

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get shipping(): number {
    return this.subtotal > 5000 ? 0 : 500;
  }

  get tax(): number {
    return this.subtotal * 0.16; // 16% VAT
  }

  get total(): number {
    return this.subtotal + this.shipping + this.tax - this.couponDiscount;
  }

  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity >= 1) {
      item.quantity = newQuantity;
    }
  }

  removeItem(item: CartItem): void {
    this.cartItems = this.cartItems.filter(i => i.id !== item.id);
  }

  applyCoupon(): void {
    if (this.couponCode.toUpperCase() === 'SAVE10' && !this.couponApplied) {
      this.couponDiscount = this.subtotal * 0.1; // 10% discount
      this.couponApplied = true;
    }
  }

  proceedToCheckout(): void {
    // In a real app, this would navigate to checkout
    alert('Proceeding to checkout...');
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
}
