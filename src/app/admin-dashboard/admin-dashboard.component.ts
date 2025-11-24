import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { ApiService } from '../services/api.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Dashboard data
  dashboardStats: any = null;
  revenueChart: any = null;
  topProducts: any[] = [];
  topCustomers: any[] = [];
  topSellers: any[] = [];
  recentOrders: any[] = [];
  recentUsers: any[] = [];
  recentReviews: any[] = [];
  lowStockProducts: any[] = [];
  systemAlerts: any[] = [];
  categoryPerformance: any[] = [];

  // Loading states
  loading = {
    stats: false,
    revenue: false,
    products: false,
    customers: false,
    sellers: false,
    orders: false,
    users: false,
    reviews: false,
    lowStock: false,
    alerts: false,
    categories: false
  };

  // Error handling
  error: string | null = null;

  // User info
  currentUser: any = null;

  // Subscriptions
  private subscriptions: Subscription[] = [];
  private autoRefreshSubscription?: Subscription;

  // UI State
  selectedTab: 'overview' | 'products' | 'orders' | 'users' | 'analytics' = 'overview';
  showAlertsPanel = false;

  constructor(
    private adminService: AdminService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadAllDashboardData();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
  }

  // ========================================
  // INITIALIZATION METHODS
  // ========================================

  loadCurrentUser(): void {
    const sub = this.apiService.getCurrentUser().subscribe({
      next: (response) => {
        if (response.authenticated && response.user.role === 'admin') {
          this.currentUser = response.user;
        } else {
          this.error = 'Unauthorized: Admin access required';
        }
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.error = 'Failed to verify admin access';
      }
    });
    this.subscriptions.push(sub);
  }

  loadAllDashboardData(): void {
    this.loadDashboardStats();
    this.loadRevenueTrends();
    this.loadTopProducts();
    this.loadTopCustomers();
    this.loadTopSellers();
    this.loadRecentOrders();
    this.loadRecentUsers();
    this.loadRecentReviews();
    this.loadLowStockProducts();
    this.loadSystemAlerts();
    this.loadCategoryPerformance();
  }

  setupAutoRefresh(): void {
    // Auto-refresh dashboard stats every 5 minutes
    this.autoRefreshSubscription = interval(5 * 60 * 1000)
      .pipe(switchMap(() => this.adminService.getDashboardStats()))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dashboardStats = response.data;
            console.log('Dashboard auto-refreshed at', new Date().toLocaleTimeString());
          }
        },
        error: (error) => {
          console.error('Auto-refresh failed:', error);
        }
      });
  }

  // ========================================
  // DATA LOADING METHODS
  // ========================================

  loadDashboardStats(): void {
    this.loading.stats = true;
    const sub = this.adminService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardStats = response.data;
          this.loading.stats = false;
        }
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.error = 'Failed to load dashboard statistics';
        this.loading.stats = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadRevenueTrends(): void {
    this.loading.revenue = true;
    const sub = this.adminService.getRevenueTrends(6).subscribe({
      next: (response) => {
        if (response.success) {
          this.revenueChart = this.formatChartData(response.data);
          this.loading.revenue = false;
        }
      },
      error: (error) => {
        console.error('Error loading revenue trends:', error);
        this.loading.revenue = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadTopProducts(): void {
    this.loading.products = true;
    const sub = this.adminService.getTopProducts(5).subscribe({
      next: (response) => {
        if (response.success) {
          this.topProducts = response.data;
          this.loading.products = false;
        }
      },
      error: (error) => {
        console.error('Error loading top products:', error);
        this.loading.products = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadTopCustomers(): void {
    this.loading.customers = true;
    const sub = this.adminService.getTopCustomers(5).subscribe({
      next: (response) => {
        if (response.success) {
          this.topCustomers = response.data;
          this.loading.customers = false;
        }
      },
      error: (error) => {
        console.error('Error loading top customers:', error);
        this.loading.customers = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadTopSellers(): void {
    this.loading.sellers = true;
    const sub = this.adminService.getTopSellers(5).subscribe({
      next: (response) => {
        if (response.success) {
          this.topSellers = response.data;
          this.loading.sellers = false;
        }
      },
      error: (error) => {
        console.error('Error loading top sellers:', error);
        this.loading.sellers = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadRecentOrders(): void {
    this.loading.orders = true;
    const sub = this.adminService.getRecentOrders(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentOrders = response.data;
          this.loading.orders = false;
        }
      },
      error: (error) => {
        console.error('Error loading recent orders:', error);
        this.loading.orders = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadRecentUsers(): void {
    this.loading.users = true;
    const sub = this.adminService.getRecentUsers(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentUsers = response.data;
          this.loading.users = false;
        }
      },
      error: (error) => {
        console.error('Error loading recent users:', error);
        this.loading.users = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadRecentReviews(): void {
    this.loading.reviews = true;
    const sub = this.adminService.getRecentReviews(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentReviews = response.data;
          this.loading.reviews = false;
        }
      },
      error: (error) => {
        console.error('Error loading recent reviews:', error);
        this.loading.reviews = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadLowStockProducts(): void {
    this.loading.lowStock = true;
    const sub = this.adminService.getLowStockProducts(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.lowStockProducts = response.data;
          this.loading.lowStock = false;
        }
      },
      error: (error) => {
        console.error('Error loading low stock products:', error);
        this.loading.lowStock = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadSystemAlerts(): void {
    this.loading.alerts = true;
    const sub = this.adminService.getSystemAlerts().subscribe({
      next: (response) => {
        if (response.success) {
          this.systemAlerts = response.data;
          this.loading.alerts = false;
          
          // Show alerts panel if there are critical alerts
          const hasCriticalAlerts = this.systemAlerts.some(alert => 
            alert.type === 'error' || alert.type === 'warning'
          );
          if (hasCriticalAlerts) {
            this.showAlertsPanel = true;
          }
        }
      },
      error: (error) => {
        console.error('Error loading system alerts:', error);
        this.loading.alerts = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadCategoryPerformance(): void {
    this.loading.categories = true;
    const sub = this.adminService.getCategoryPerformance().subscribe({
      next: (response) => {
        if (response.success) {
          this.categoryPerformance = response.data;
          this.loading.categories = false;
        }
      },
      error: (error) => {
        console.error('Error loading category performance:', error);
        this.loading.categories = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  formatChartData(data: any[]): any {
    return {
      labels: data.map(d => d.month),
      values: data.map(d => parseFloat(d.revenue)),
      orders: data.map(d => d.orderCount)
    };
  }

  formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `KSh ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'badge-warning',
      'processing': 'badge-info',
      'shipped': 'badge-primary',
      'delivered': 'badge-success',
      'cancelled': 'badge-danger',
      'failed': 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  }

  getAlertClass(type: string): string {
    const typeMap: { [key: string]: string } = {
      'error': 'alert-danger',
      'warning': 'alert-warning',
      'info': 'alert-info',
      'success': 'alert-success'
    };
    return typeMap[type] || 'alert-secondary';
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  }

  getMaxValue(values: number[]): number {
    return Math.max(...values);
  }

  // ========================================
  // ACTION METHODS
  // ========================================

  refresh(): void {
    this.error = null;
    this.loadAllDashboardData();
  }

  selectTab(tab: 'overview' | 'products' | 'orders' | 'users' | 'analytics'): void {
    this.selectedTab = tab;
  }

  toggleAlertsPanel(): void {
    this.showAlertsPanel = !this.showAlertsPanel;
  }

  dismissAlert(alert: any): void {
    this.systemAlerts = this.systemAlerts.filter(a => a !== alert);
  }

  // Navigation helpers
  viewOrderDetails(orderId: string): void {
    // Implement navigation to order details
    console.log('Navigate to order:', orderId);
  }

  viewProductDetails(productId: string): void {
    // Implement navigation to product details
    console.log('Navigate to product:', productId);
  }

  viewUserDetails(userId: string): void {
    // Implement navigation to user details
    console.log('Navigate to user:', userId);
  }

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================

  get totalAlerts(): number {
    return this.systemAlerts.length;
  }

  get criticalAlertsCount(): number {
    return this.systemAlerts.filter(a => a.type === 'error').length;
  }

  get warningAlertsCount(): number {
    return this.systemAlerts.filter(a => a.type === 'warning').length;
  }

  get isLoading(): boolean {
    return Object.values(this.loading).some(state => state);
  }

  get hasData(): boolean {
    return this.dashboardStats !== null;
  }

  // Growth calculations
  get userGrowthPercentage(): number {
    if (!this.dashboardStats || !this.dashboardStats.users) return 0;
    const total = this.dashboardStats.users.total;
    const newUsers = this.dashboardStats.users.newLast30Days;
    return total > 0 ? (newUsers / total) * 100 : 0;
  }

  get revenueGrowthPercentage(): number {
    if (!this.dashboardStats || !this.dashboardStats.revenue) return 0;
    const total = parseFloat(this.dashboardStats.revenue.total);
    const last30Days = parseFloat(this.dashboardStats.revenue.last30Days);
    return total > 0 ? (last30Days / total) * 100 : 0;
  }
}