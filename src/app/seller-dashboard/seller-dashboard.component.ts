import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: string;
  date: string;
  statusClass: string;
}

interface Activity {
  icon: string;
  iconClass: string;
  text: string;
  time: string;
}

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeClass: string;
  icon: string;
  iconClass: string;
}

interface QuickAction {
  icon: string;
  text: string;
  link: string;
}

interface PerformanceMetric {
  label: string;
  value: string;
  valueClass?: string;
}

@Component({
  selector: 'app-seller-dashboard',
  imports: [CommonModule],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.css'
})
export class SellerDashboardComponent {
  notificationCount = 3;
  userName = 'John';

  stats: StatCard[] = [
    {
      title: 'Total Revenue',
      value: 'KSh 847,290',
      change: '+12.5% from last month',
      changeClass: 'positive',
      icon: '💰',
      iconClass: 'revenue'
    },
    {
      title: 'Total Orders',
      value: '342',
      change: '+8.2% from last month',
      changeClass: 'positive',
      icon: '📦',
      iconClass: 'orders'
    },
    {
      title: 'Active Products',
      value: '127',
      change: '+3 new this week',
      changeClass: 'positive',
      icon: '📱',
      iconClass: 'products'
    },
    {
      title: 'Total Customers',
      value: '1,247',
      change: '+15.3% from last month',
      changeClass: 'positive',
      icon: '👥',
      iconClass: 'customers'
    }
  ];

  orders: Order[] = [
    {
      id: '#ORD-2025-001',
      customer: 'Mary Wanjiku',
      product: 'Samsung Galaxy A54',
      amount: 'KSh 34,900',
      status: 'Processing',
      date: 'Jan 6, 2025',
      statusClass: 'processing'
    },
    {
      id: '#ORD-2025-002',
      customer: 'James Mwangi',
      product: 'iPhone 15',
      amount: 'KSh 129,000',
      status: 'Delivered',
      date: 'Jan 5, 2025',
      statusClass: 'delivered'
    },
    {
      id: '#ORD-2025-003',
      customer: 'Grace Nyong\'o',
      product: 'Xiaomi Redmi Note 12',
      amount: 'KSh 17,490',
      status: 'Pending',
      date: 'Jan 5, 2025',
      statusClass: 'pending'
    },
    {
      id: '#ORD-2025-004',
      customer: 'Peter Kiprotich',
      product: 'Google Pixel 8',
      amount: 'KSh 89,900',
      status: 'Processing',
      date: 'Jan 4, 2025',
      statusClass: 'processing'
    },
    {
      id: '#ORD-2025-005',
      customer: 'Sarah Achieng',
      product: 'Oppo A78',
      amount: 'KSh 24,900',
      status: 'Cancelled',
      date: 'Jan 3, 2025',
      statusClass: 'cancelled'
    }
  ];

  activities: Activity[] = [
    {
      icon: '📦',
      iconClass: 'order',
      text: 'New order received for Samsung Galaxy A54',
      time: '2 minutes ago'
    },
    {
      icon: '📱',
      iconClass: 'product',
      text: 'iPhone 15 stock updated (12 units remaining)',
      time: '1 hour ago'
    },
    {
      icon: '⭐',
      iconClass: 'review',
      text: 'New 5-star review for Google Pixel 8',
      time: '3 hours ago'
    },
    {
      icon: '📦',
      iconClass: 'order',
      text: 'Order #ORD-2025-002 marked as delivered',
      time: '5 hours ago'
    },
    {
      icon: '📱',
      iconClass: 'product',
      text: 'OnePlus Nord 3 added to inventory',
      time: '1 day ago'
    }
  ];

  quickActions: QuickAction[] = [
    {
      icon: '➕',
      text: 'Add Product',
      link: '/seller/products/add'
    },
    {
      icon: '📦',
      text: 'Manage Orders',
      link: '/seller/orders'
    },
    {
      icon: '📊',
      text: 'View Analytics',
      link: '/seller/analytics'
    },
    {
      icon: '🎯',
      text: 'Create Deal',
      link: '/seller/promotions'
    }
  ];

  performanceMetrics: PerformanceMetric[] = [
    {
      label: 'Conversion Rate',
      value: '3.2%',
      valueClass: 'positive'
    },
    {
      label: 'Average Order Value',
      value: 'KSh 42,150'
    },
    {
      label: 'Return Rate',
      value: '1.8%',
      valueClass: 'warning'
    },
    {
      label: 'Customer Satisfaction',
      value: '4.7/5.0',
      valueClass: 'positive'
    }
  ];

  onQuickActionClick(action: string): void {
    alert(`${action} functionality would be implemented here`);
  }

  onOrderClick(orderId: string): void {
    alert(`Order details for ${orderId} would be shown here`);
  }

  onNotificationClick(): void {
    alert('Notifications:\n• New order received\n• Low stock alert for iPhone 15\n• Payment received for Order #ORD-2025-002');
  }

  onProfileClick(): void {
    alert('Profile menu would open here');
  }
}