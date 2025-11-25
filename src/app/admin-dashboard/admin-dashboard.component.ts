import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { ApiService } from '../services/api.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

  // Track which data has been loaded
  private dataLoaded = {
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

  // Management UI State
  showUserManagement = false;
  showOrderManagement = false;
  showProductManagement = false;

  // Selected items for bulk operations
  selectedUserIds: string[] = [];
  selectedOrderIds: string[] = [];
  selectedProductIds: string[] = [];

  // Edit forms
  editingUser: any = null;
  editingOrder: any = null;
  editingProduct: any = null;

  // Filter and search
  userSearchTerm = '';
  orderSearchTerm = '';
  productSearchTerm = '';
  orderStatusFilter = 'all';
  userRoleFilter = 'all';

  constructor(
    private adminService: AdminService,
    private apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Load user first (fast, no delay)
    this.loadCurrentUser();

    // Load critical data immediately (optimized)
    this.loadCriticalDataFast();

    // Setup auto-refresh
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
  }

  // ========================================
  // OPTIMIZED INITIALIZATION METHODS
  // ========================================

  loadCriticalDataFast(): void {
    // Set placeholder data immediately to show UI faster
    this.dashboardStats = {
      users: { total: '...', customers: '...', sellers: '...', newLast30Days: '...' },
      products: { total: '...', inStock: '...', outOfStock: '...', lowStock: '...' },
      orders: { total: '...', pending: '...', processing: '...', delivered: '...' },
      revenue: { total: '...', last30Days: '...', averageOrderValue: '...' }
    };

    // Load actual data (single API call)
    this.loadDashboardStats();
  }

  loadAllDashboardData(): void {
    this.loadDashboardStats();
    this.loadTabData(this.selectedTab);
  }

  loadTabData(tab: 'overview' | 'products' | 'orders' | 'users' | 'analytics'): void {
    console.log('🔄 Loading data for tab:', tab);

    switch (tab) {
      case 'overview':
        this.loadRecentOrders();
        this.loadLowStockProducts();
        this.loadSystemAlerts();
        break;

      case 'analytics':
        this.loadRevenueTrends();
        this.loadTopProducts();
        this.loadTopCustomers();
        this.loadTopSellers();
        this.loadCategoryPerformance();
        break;

      case 'products':
        this.loadTopProducts();
        break;

      case 'orders':
        this.loadRecentOrders();
        break;

      case 'users':
        this.loadRecentUsers();
        break;
    }
  }

  loadCurrentUser(): void {
    const sub = this.apiService.getCurrentUser().subscribe({
      next: (response) => {
        if (response.authenticated && response.user.role === 'admin') {
          this.currentUser = response.user;
        } else {
          this.error = 'Unauthorized: Admin access required';
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.error = 'Failed to verify admin access';
        this.router.navigate(['/login']);
      }
    });
    this.subscriptions.push(sub);
  }

  setupAutoRefresh(): void {
    this.autoRefreshSubscription = interval(5 * 60 * 1000)
      .pipe(switchMap(() => this.adminService.getDashboardStats()))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dashboardStats = response.data;
            console.log('✅ Dashboard auto-refreshed at', new Date().toLocaleTimeString());
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
          this.dataLoaded.stats = true;
          this.loading.stats = false;
          console.log('✅ Dashboard stats loaded');
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
    if (this.dataLoaded.revenue && this.revenueChart) {
      console.log('✅ Revenue trends already loaded, skipping...');
      return;
    }

    this.loading.revenue = true;
    const sub = this.adminService.getRevenueTrends(6).subscribe({
      next: (response) => {
        if (response.success) {
          this.revenueChart = this.formatChartData(response.data);
          this.dataLoaded.revenue = true;
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
    if (this.dataLoaded.products && this.topProducts.length > 0) {
      console.log('✅ Top products already loaded, skipping...');
      return;
    }

    this.loading.products = true;
    const sub = this.adminService.getTopProducts(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.topProducts = response.data;
          this.dataLoaded.products = true;
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
    if (this.dataLoaded.customers && this.topCustomers.length > 0) {
      console.log('✅ Top customers already loaded, skipping...');
      return;
    }

    this.loading.customers = true;
    const sub = this.adminService.getTopCustomers(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.topCustomers = response.data;
          this.dataLoaded.customers = true;
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
    if (this.dataLoaded.sellers && this.topSellers.length > 0) {
      console.log('✅ Top sellers already loaded, skipping...');
      return;
    }

    this.loading.sellers = true;
    const sub = this.adminService.getTopSellers(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.topSellers = response.data;
          this.dataLoaded.sellers = true;
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
    if (this.dataLoaded.orders && this.recentOrders.length > 0) {
      console.log('✅ Recent orders already loaded, skipping...');
      return;
    }

    this.loading.orders = true;
    const sub = this.adminService.getRecentOrders(20).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentOrders = response.data;
          this.dataLoaded.orders = true;
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
    if (this.dataLoaded.users && this.recentUsers.length > 0) {
      console.log('✅ Recent users already loaded, skipping...');
      return;
    }

    this.loading.users = true;
    const sub = this.adminService.getRecentUsers(20).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentUsers = response.data;
          this.dataLoaded.users = true;
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
    if (this.dataLoaded.reviews && this.recentReviews.length > 0) {
      console.log('✅ Recent reviews already loaded, skipping...');
      return;
    }

    this.loading.reviews = true;
    const sub = this.adminService.getRecentReviews(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentReviews = response.data;
          this.dataLoaded.reviews = true;
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
    if (this.dataLoaded.lowStock && this.lowStockProducts.length > 0) {
      console.log('✅ Low stock products already loaded, skipping...');
      return;
    }

    this.loading.lowStock = true;
    const sub = this.adminService.getLowStockProducts(10).subscribe({
      next: (response) => {
        if (response.success) {
          this.lowStockProducts = response.data;
          this.dataLoaded.lowStock = true;
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
    if (this.dataLoaded.alerts && this.systemAlerts.length > 0) {
      console.log('✅ System alerts already loaded, skipping...');
      return;
    }

    this.loading.alerts = true;
    const sub = this.adminService.getSystemAlerts().subscribe({
      next: (response) => {
        if (response.success) {
          this.systemAlerts = response.data;
          this.dataLoaded.alerts = true;
          this.loading.alerts = false;

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
    if (this.dataLoaded.categories && this.categoryPerformance.length > 0) {
      console.log('✅ Category performance already loaded, skipping...');
      return;
    }

    this.loading.categories = true;
    const sub = this.adminService.getCategoryPerformance().subscribe({
      next: (response) => {
        if (response.success) {
          this.categoryPerformance = response.data;
          this.dataLoaded.categories = true;
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
  // USER MANAGEMENT METHODS
  // ========================================

  openUserManagement(): void {
    this.showUserManagement = true;
    this.loadRecentUsers();
  }

  closeUserManagement(): void {
    this.showUserManagement = false;
    this.editingUser = null;
    this.selectedUserIds = [];
  }

  editUser(user: any): void {
    this.editingUser = { ...user };
  }

  saveUser(): void {
    if (!this.editingUser) return;

    const sub = this.apiService.updateUser(this.editingUser.userId, this.editingUser).subscribe({
      next: (response) => {
        if (response.success) {
          const index = this.recentUsers.findIndex(u => u.userId === this.editingUser.userId);
          if (index !== -1) {
            this.recentUsers[index] = { ...this.editingUser };
          }
          this.editingUser = null;
          alert('✅ User updated successfully!');
        }
      },
      error: (error) => {
        console.error('Error updating user:', error);
        alert('❌ Failed to update user: ' + error.message);
      }
    });
    this.subscriptions.push(sub);
  }

  changeUserRole(userId: string, newRole: string): void {
    if (!confirm(`Change user role to "${newRole}"?`)) return;

    const sub = this.adminService.changeUserRole(userId, newRole as any).subscribe({
      next: (response) => {
        if (response.success) {
          const user = this.recentUsers.find(u => u.userId === userId);
          if (user) {
            user.role = newRole;
          }
          alert('✅ User role updated successfully!');
          this.loadDashboardStats(); // Refresh stats
        }
      },
      error: (error) => {
        console.error('Error changing user role:', error);
        alert('❌ Failed to change user role: ' + error.message);
      }
    });
    this.subscriptions.push(sub);
  }

  deleteUser(userId: string): void {
    if (!confirm('⚠️ Are you sure you want to delete this user? This action cannot be undone.')) return;

    const sub = this.apiService.deleteUser(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentUsers = this.recentUsers.filter(u => u.userId !== userId);
          alert('✅ User deleted successfully!');
          this.loadDashboardStats(); // Refresh stats
        }
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        alert('❌ Failed to delete user: ' + error.message);
      }
    });
    this.subscriptions.push(sub);
  }

  toggleUserSelection(userId: string): void {
    const index = this.selectedUserIds.indexOf(userId);
    if (index === -1) {
      this.selectedUserIds.push(userId);
    } else {
      this.selectedUserIds.splice(index, 1);
    }
  }

  bulkDeleteUsers(): void {
    if (this.selectedUserIds.length === 0) {
      alert('Please select users to delete');
      return;
    }

    if (!confirm(`⚠️ Delete ${this.selectedUserIds.length} selected users?`)) return;

    const sub = this.adminService.bulkUpdateUsers(this.selectedUserIds, 'delete').subscribe({
      next: (response) => {
        if (response.success) {
          this.recentUsers = this.recentUsers.filter(u => !this.selectedUserIds.includes(u.userId));
          this.selectedUserIds = [];
          alert(`✅ ${response.deletedCount || this.selectedUserIds.length} users deleted!`);
          this.loadDashboardStats();
        }
      },
      error: (error) => {
        console.error('Error bulk deleting users:', error);
        alert('❌ Failed to delete users: ' + error.message);
      }
    });
    this.subscriptions.push(sub);
  }

  // ========================================
  // ORDER MANAGEMENT METHODS
  // ========================================

  openOrderManagement(): void {
    this.showOrderManagement = true;
    this.loadRecentOrders();
  }

  closeOrderManagement(): void {
    this.showOrderManagement = false;
    this.editingOrder = null;
    this.selectedOrderIds = [];
    this.orderStatusFilter = 'all';
  }

  viewOrderDetails(orderId: string): void {
    const sub = this.adminService.getOrderDetails(orderId).subscribe({
      next: (response) => {
        if (response.success) {
          this.editingOrder = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        alert('Failed to load order details');
      }
    });
    this.subscriptions.push(sub);
  }

  updateOrderStatus(orderId: string, newStatus: string): void {
    if (!confirm(`Change order status to "${newStatus}"?`)) return;

    const orderData = { status: newStatus };
    const sub = this.apiService.updateOrder(orderId, orderData).subscribe({
      next: (response) => {
        if (response.success) {
          const order = this.recentOrders.find(o => o.orderId === orderId);
          if (order) {
            order.status = newStatus;
          }
          alert('✅ Order status updated successfully!');
          this.loadDashboardStats();
        }
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        alert('❌ Failed to update order status: ' + error.message);
      }
    });
    this.subscriptions.push(sub);
  }

  toggleOrderSelection(orderId: string): void {
    const index = this.selectedOrderIds.indexOf(orderId);
    if (index === -1) {
      this.selectedOrderIds.push(orderId);
    } else {
      this.selectedOrderIds.splice(index, 1);
    }
  }

  bulkUpdateOrderStatus(newStatus: string): void {
    if (this.selectedOrderIds.length === 0) {
      alert('Please select orders to update');
      return;
    }

    if (!confirm(`Update ${this.selectedOrderIds.length} orders to "${newStatus}"?`)) return;

    const sub = this.adminService.bulkUpdateOrders(this.selectedOrderIds, newStatus as any).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentOrders.forEach(order => {
            if (this.selectedOrderIds.includes(order.orderId)) {
              order.status = newStatus;
            }
          });
          this.selectedOrderIds = [];
          alert(`✅ ${response.updatedCount || this.selectedOrderIds.length} orders updated!`);
          this.loadDashboardStats();
        }
      },
      error: (error) => {
        console.error('Error bulk updating orders:', error);
        alert('❌ Failed to update orders: ' + error.message);
      }
    });
    this.subscriptions.push(sub);
  }

  deleteOrder(orderId: string): void {
    if (!confirm('⚠️ Delete this order? This action cannot be undone.')) return;

    const sub = this.apiService.deleteOrder(orderId).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentOrders = this.recentOrders.filter(o => o.orderId !== orderId);
          alert('✅ Order deleted successfully!');
          this.loadDashboardStats();
        }
      },
      error: (error) => {
        console.error('Error deleting order:', error);
        alert('❌ Failed to delete order: ' + error.message);
      }
    });
    this.subscriptions.push(sub);
  }

  // ========================================
  // PRODUCT MANAGEMENT METHODS
  // ========================================

  openProductManagement(): void {
    this.showProductManagement = true;
    this.loadTopProducts();
  }

  closeProductManagement(): void {
    this.showProductManagement = false;
    this.editingProduct = null;
    this.selectedProductIds = [];
  }

  viewProductDetails(productId: string): void {
    const sub = this.adminService.getProductDetails(productId).subscribe({
      next: (response) => {
        if (response.success) {
          this.editingProduct = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading product details:', error);
        alert('Failed to load product details');
      }
    });
    this.subscriptions.push(sub);
    }

    updateProductStock(productId: string, newStock: any): void {
    const stock = parseInt(newStock, 10);

    if (isNaN(stock) || stock < 0) return;

    if (!confirm(`Update product stock to ${stock} units?`)) return;

    const productData = { stock };
    const sub = this.apiService.updateProduct(productId, productData).subscribe({
      next: (response) => {
      if (response.success) {
        const product = this.topProducts.find(p => p.productId === productId);
        if (product) {
        product.stock = stock;
        }
        alert('✅ Product stock updated successfully!');
        this.loadDashboardStats();
      }
      },
      error: (error) => {
      console.error('Error updating product stock:', error);
      alert('❌ Failed to update stock: ' + error.message);
      }
    });
    this.subscriptions.push(sub);
    }

    deleteProduct(productId: string): void {
    if (!confirm('⚠️ Delete this product? This will also remove all related data.')) return;

    const sub = this.apiService.deleteProduct(productId).subscribe({
      next: (response) => {
        if (response.success) {
          this.topProducts = this.topProducts.filter(p => p.productId !== productId);
          alert('✅ Product deleted successfully!');
          this.loadDashboardStats();
        }
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        alert('❌ Failed to delete product: ' + error.message);
      }
    });
    this.subscriptions.push(sub);
  }

  toggleProductSelection(productId: string): void {
    const index = this.selectedProductIds.indexOf(productId);
    if (index === -1) {
      this.selectedProductIds.push(productId);
    } else {
      this.selectedProductIds.splice(index, 1);
    }
  }

  bulkDeleteProducts(): void {
    if (this.selectedProductIds.length === 0) {
      alert('Please select products to delete');
      return;
    }

    if (!confirm(`⚠️ Delete ${this.selectedProductIds.length} selected products?`)) return;

    const sub = this.adminService.bulkUpdateProducts(this.selectedProductIds, 'delete').subscribe({
      next: (response) => {
        if (response.success) {
          this.topProducts = this.topProducts.filter(p => !this.selectedProductIds.includes(p.productId));
          this.selectedProductIds = [];
          alert(`✅ ${response.deletedCount || this.selectedProductIds.length} products deleted!`);
          this.loadDashboardStats();
        }
      },
      error: (error) => {
        console.error('Error bulk deleting products:', error);
        alert('❌ Failed to delete products: ' + error.message);
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

  // Filter methods
  get filteredUsers(): any[] {
    let filtered = this.recentUsers;

    if (this.userSearchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(this.userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.userSearchTerm.toLowerCase())
      );
    }

    if (this.userRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === this.userRoleFilter);
    }

    return filtered;
  }

  get filteredOrders(): any[] {
    let filtered = this.recentOrders;

    if (this.orderSearchTerm) {
      filtered = filtered.filter(order =>
        order.orderId?.toLowerCase().includes(this.orderSearchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(this.orderSearchTerm.toLowerCase())
      );
    }

    if (this.orderStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === this.orderStatusFilter);
    }

    return filtered;
  }

  get filteredProducts(): any[] {
    if (this.productSearchTerm) {
      return this.topProducts.filter(product =>
        product.title?.toLowerCase().includes(this.productSearchTerm.toLowerCase()) ||
        product.categoryName?.toLowerCase().includes(this.productSearchTerm.toLowerCase())
      );
    }
    return this.topProducts;
  }


  // ========================================
  // ACTION METHODS
  loadAllData(): void {
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
  // ========================================

  refresh(): void {
    this.error = null;
    Object.keys(this.dataLoaded).forEach(key => {
      (this.dataLoaded as any)[key] = false;
    });
    this.loadAllData();
  }



  selectTab(tab: 'overview' | 'products' | 'orders' | 'users' | 'analytics'): void {
    this.selectedTab = tab;
    this.loadTabData(tab);
  }

  toggleAlertsPanel(): void {
    this.showAlertsPanel = !this.showAlertsPanel;
  }

  dismissAlert(alert: any): void {
    this.systemAlerts = this.systemAlerts.filter(a => a !== alert);
  }


  // User Management
  toggleAllUsers(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedUserIds = this.filteredUsers.map(u => u.userId);
    } else {
      this.selectedUserIds = [];
    }
  }

  // Order Management  
  toggleAllOrders(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedOrderIds = this.filteredOrders.map(o => o.orderId);
    } else {
      this.selectedOrderIds = [];
    }
  }

  // Product Management
  toggleAllProducts(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedProductIds = this.filteredProducts.map(p => p.productId);
    } else {
      this.selectedProductIds = [];
    }
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