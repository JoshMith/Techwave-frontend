import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Thumbnail {
  imageSrc: string;
  thumbnailSrc: string;
  altText: string;
  active: boolean;
}

interface Review {
  reviewerName: string;
  rating: number;
  date: string;
  text: string;
}

interface Specification {
  label: string;
  value: string;
}

@Component({
  selector: 'app-product',
  imports: [CommonModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent {
  constructor(private router: Router) { }
  cartCount: number = 0;
  searchQuery: string = '';


  activeTab: string = 'description';
  isWishlisted: boolean = false;
  mainImageSrc: string = 'https://images.samsung.com/is/image/samsung/p6pim/ke/2302/gallery/ke-galaxy-a54-5g-a546-sm-a546elgdkke-534851051?$650_519_PNG$';
  cartButtonText: string = 'Add to Cart';

  thumbnails: Thumbnail[] = [
    {
      imageSrc: 'https://images.samsung.com/is/image/samsung/p6pim/ke/2302/gallery/ke-galaxy-a54-5g-a546-sm-a546elgdkke-534851051?$650_519_PNG$',
      thumbnailSrc: 'https://images.samsung.com/is/image/samsung/p6pim/ke/2302/gallery/ke-galaxy-a54-5g-a546-sm-a546elgdkke-534851051?$320_320_PNG$',
      altText: 'Front view',
      active: true
    },
    {
      imageSrc: 'https://images.samsung.com/is/image/samsung/p6pim/ke/2302/gallery/ke-galaxy-a54-5g-a546-sm-a546elgdkke-534851053?$650_519_PNG$',
      thumbnailSrc: 'https://images.samsung.com/is/image/samsung/p6pim/ke/2302/gallery/ke-galaxy-a54-5g-a546-sm-a546elgdkke-534851053?$320_320_PNG$',
      altText: 'Back view',
      active: false
    },
    {
      imageSrc: 'https://images.samsung.com/is/image/samsung/p6pim/ke/2302/gallery/ke-galaxy-a54-5g-a546-sm-a546elgdkke-534851054?$650_519_PNG$',
      thumbnailSrc: 'https://images.samsung.com/is/image/samsung/p6pim/ke/2302/gallery/ke-galaxy-a54-5g-a546-sm-a546elgdkke-534851054?$320_320_PNG$',
      altText: 'Side view',
      active: false
    },
    {
      imageSrc: 'https://images.samsung.com/is/image/samsung/p6pim/ke/2302/gallery/ke-galaxy-a54-5g-a546-sm-a546elgdkke-534851055?$650_519_PNG$',
      thumbnailSrc: 'https://images.samsung.com/is/image/samsung/p6pim/ke/2302/gallery/ke-galaxy-a54-5g-a546-sm-a546elgdkke-534851055?$320_320_PNG$',
      altText: 'Camera view',
      active: false
    }
  ];

  reviews: Review[] = [
    {
      reviewerName: 'John K.',
      rating: 5,
      date: '2 days ago',
      text: 'Excellent phone for the price! The camera quality is impressive and the battery lasts all day. 5G connectivity works great in Nairobi CBD. Delivery was super fast too.'
    },
    {
      reviewerName: 'Mary W.',
      rating: 4,
      date: '1 week ago',
      text: 'Great display and performance. Love taking photos with it. Only wish it had wireless charging, but overall very happy with the purchase.'
    },
    {
      reviewerName: 'David M.',
      rating: 5,
      date: '2 weeks ago',
      text: 'Perfect phone for work and entertainment. Fast delivery to Meru. The M-Pesa payment option made it very convenient. Highly recommended!'
    }
  ];

  specifications: Specification[] = [
    { label: 'Display Size', value: '6.4 inches' },
    { label: 'Display Type', value: 'Super AMOLED' },
    { label: 'Resolution', value: '2340 x 1080 (FHD+)' },
    { label: 'Processor', value: 'Exynos 1380' },
    { label: 'RAM', value: '8GB' },
    { label: 'Internal Storage', value: '128GB' },
    { label: 'Expandable Storage', value: 'Up to 1TB microSD' },
    { label: 'Main Camera', value: '50MP (f/1.8)' },
    { label: 'Ultra Wide Camera', value: '12MP (f/2.2)' },
    { label: 'Macro Camera', value: '5MP (f/2.4)' },
    { label: 'Front Camera', value: '32MP (f/2.2)' },
    { label: 'Battery', value: '5000mAh' },
    { label: 'Charging', value: '25W Fast Charging' },
    { label: 'Operating System', value: 'Android 13 with One UI 5.1' },
    { label: 'Connectivity', value: '5G, 4G LTE, Wi-Fi 6, Bluetooth 5.3' },
    { label: 'Colors Available', value: 'Awesome Graphite, Awesome Violet, Awesome Lime' }
  ];

  changeImage(thumbnail: Thumbnail): void {
    this.mainImageSrc = thumbnail.imageSrc;
    this.thumbnails.forEach(t => t.active = false);
    thumbnail.active = true;
  }

  showTab(tabName: string): void {
    this.activeTab = tabName;
  }

  addToCart(): void {
    this.cartButtonText = 'Added to Cart!';
    setTimeout(() => {
      this.cartButtonText = 'Add to Cart';
    }, 2000);
  }

  toggleWishlist(): void {
    this.isWishlisted = !this.isWishlisted;
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  getRatingPercentage(rating: number): number {
    const ratingCounts = [1, 2, 6, 13, 20]; // Counts for 1-5 stars
    const totalReviews = ratingCounts.reduce((a, b) => a + b, 0);
    return (ratingCounts[rating - 1] / totalReviews) * 100;
  }


  onSearch(query: string): void {
    if (query) {
      // this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  onCategoryClick(category: string): void {
    this.router.navigate([`/categories/${category.toLowerCase()}`]);
  }
}