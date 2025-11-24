import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // Use the same base URL as ApiService
  // public apiUrl = 'http://localhost:3000'; // Development URL
  // public apiUrl = 'https://miffiest-tom-pyramidally.ngrok-free.dev'; // Ngrok Production Testing URL
  public apiUrl = 'https://techwave-backend-lepy.onrender.com'; // Production URL
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    withCredentials: true // This enables sending cookies with requests
  };

  constructor(private http: HttpClient) { }

  // ========================================
  // DASHBOARD STATISTICS ENDPOINTS
  // ========================================

  /**
   * Get comprehensive dashboard statistics
   * @returns Complete dashboard overview with users, products, orders, revenue, etc.
   */
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/dashboard/stats`, this.httpOptions);
  }

  /**
   * Get revenue trends over time
   * @param period - Number of months (default: 12)
   * @returns Monthly revenue trends with order count and average order value
   */
  getRevenueTrends(period: number = 12): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard/revenue-trends?period=${period}`,
      this.httpOptions
    );
  }

  /**
   * Get daily revenue for current month
   * @returns Daily revenue breakdown with order counts
   */
  getDailyRevenue(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/dashboard/daily-revenue`, this.httpOptions);
  }

  /**
   * Get top selling products
   * @param limit - Number of results (default: 10)
   * @returns List of best-selling products with sales statistics
   */
  getTopProducts(limit: number = 10): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard/top-products?limit=${limit}`,
      this.httpOptions
    );
  }

  /**
   * Get top customers by spending
   * @param limit - Number of results (default: 10)
   * @returns List of highest spending customers
   */
  getTopCustomers(limit: number = 10): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard/top-customers?limit=${limit}`,
      this.httpOptions
    );
  }

  /**
   * Get top sellers by revenue
   * @param limit - Number of results (default: 10)
   * @returns List of top performing sellers
   */
  getTopSellers(limit: number = 10): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard/top-sellers?limit=${limit}`,
      this.httpOptions
    );
  }

  /**
   * Get products with low stock
   * @param threshold - Stock level threshold (default: 10)
   * @returns List of products that need restocking
   */
  getLowStockProducts(threshold: number = 10): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard/low-stock-products?threshold=${threshold}`,
      this.httpOptions
    );
  }

  /**
   * Get products that are out of stock
   * @returns List of products with zero inventory
   */
  getOutOfStockProducts(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard/out-of-stock-products`,
      this.httpOptions
    );
  }

  /**
   * Get recent orders
   * @param limit - Number of results (default: 20)
   * @returns List of most recent orders
   */
  getRecentOrders(limit: number = 20): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard/recent-orders?limit=${limit}`,
      this.httpOptions
    );
  }

  /**
   * Get recently registered users
   * @param limit - Number of results (default: 20)
   * @returns List of newest users
   */
  getRecentUsers(limit: number = 20): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard/recent-users?limit=${limit}`,
      this.httpOptions
    );
  }

  /**
   * Get recent product reviews
   * @param limit - Number of results (default: 20)
   * @returns List of most recent reviews
   */
  getRecentReviews(limit: number = 20): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard/recent-reviews?limit=${limit}`,
      this.httpOptions
    );
  }

  /**
   * Get category performance statistics
   * @returns Performance metrics for all categories
   */
  getCategoryPerformance(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/dashboard/category-performance`,
      this.httpOptions
    );
  }

  /**
   * Get system alerts and notifications
   * @returns List of system warnings and alerts
   */
  getSystemAlerts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/dashboard/alerts`, this.httpOptions);
  }

  /**
   * Get database table sizes and statistics
   * @returns Database performance information
   */
  getDatabaseStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/dashboard/database-stats`, this.httpOptions);
  }

  // ========================================
  // USER MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Bulk update users (delete, deactivate, etc.)
   * @param userIds - Array of user UUIDs
   * @param action - Action to perform ('delete' | 'deactivate')
   * @returns Result of bulk operation
   */
  bulkUpdateUsers(userIds: string[], action: 'delete' | 'deactivate'): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/admin/manage/users/bulk-update`,
      { userIds, action },
      this.httpOptions
    );
  }

  /**
   * Change user role
   * @param userId - User UUID
   * @param role - New role ('admin' | 'seller' | 'customer' | 'guest')
   * @returns Updated user information
   */
  changeUserRole(userId: string, role: 'admin' | 'seller' | 'customer' | 'guest'): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/admin/manage/users/${userId}/role`,
      { role },
      this.httpOptions
    );
  }

  /**
   * Reset user password (admin only)
   * @param userId - User UUID
   * @param newPassword - New password
   * @returns Confirmation of password reset
   */
  resetUserPassword(userId: string, newPassword: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/admin/manage/users/${userId}/reset-password`,
      { newPassword },
      this.httpOptions
    );
  }

  // ========================================
  // ORDER MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Bulk update order status
   * @param orderIds - Array of order UUIDs
   * @param status - New status ('pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed')
   * @returns Result of bulk operation
   */
  bulkUpdateOrders(
    orderIds: string[],
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed'
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/admin/manage/orders/bulk-update`,
      { orderIds, status },
      this.httpOptions
    );
  }

  /**
   * Get comprehensive order details
   * @param orderId - Order UUID
   * @returns Full order information including items, customer, and payment details
   */
  getOrderDetails(orderId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/manage/orders/${orderId}/details`,
      this.httpOptions
    );
  }

  // ========================================
  // PRODUCT MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Bulk update products (delete, update stock, update price)
   * @param productIds - Array of product UUIDs
   * @param action - Action to perform ('delete' | 'updateStock' | 'updatePrice')
   * @param value - Value for the action (stock quantity or price)
   * @returns Result of bulk operation
   */
  bulkUpdateProducts(
    productIds: string[],
    action: 'delete' | 'updateStock' | 'updatePrice',
    value?: number
  ): Observable<any> {
    const body: any = { productIds, action };
    if (value !== undefined) {
      body.value = value;
    }
    return this.http.put(
      `${this.apiUrl}/admin/manage/products/bulk-update`,
      body,
      this.httpOptions
    );
  }

  /**
   * Get comprehensive product details
   * @param productId - Product UUID
   * @returns Product with images, reviews, and sales statistics
   */
  getProductDetails(productId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/manage/products/${productId}/details`,
      this.httpOptions
    );
  }

  // ========================================
  // SELLER MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Approve or suspend seller account
   * @param sellerId - Seller UUID
   * @param action - Action to perform ('approve' | 'suspend')
   * @returns Updated seller status
   */
  updateSellerStatus(sellerId: string, action: 'approve' | 'suspend'): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/admin/manage/sellers/${sellerId}/status`,
      { action },
      this.httpOptions
    );
  }

  /**
   * Get comprehensive seller details
   * @param sellerId - Seller UUID
   * @returns Seller information, products, and statistics
   */
  getSellerDetails(sellerId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/manage/sellers/${sellerId}/details`,
      this.httpOptions
    );
  }

  // ========================================
  // PAYMENT MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Manually confirm or reject payment
   * @param paymentId - Payment UUID
   * @param isConfirmed - Whether payment is confirmed
   * @param notes - Optional admin notes
   * @returns Updated payment status
   */
  manualPaymentConfirmation(paymentId: string, isConfirmed: boolean, notes?: string): Observable<any> {
    const body: any = { isConfirmed };
    if (notes) {
      body.notes = notes;
    }
    return this.http.put(
      `${this.apiUrl}/admin/manage/payments/${paymentId}/confirm`,
      body,
      this.httpOptions
    );
  }

  /**
   * Get all pending payments
   * @returns List of unconfirmed payments
   */
  getPendingPayments(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/manage/payments/pending`,
      this.httpOptions
    );
  }

  // ========================================
  // CATEGORY MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Merge two categories
   * @param sourceCategoryId - Category to merge from
   * @param targetCategoryId - Category to merge into
   * @returns Result of merge operation
   */
  mergeCategories(sourceCategoryId: string, targetCategoryId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/manage/categories/merge`,
      { sourceCategoryId, targetCategoryId },
      this.httpOptions
    );
  }

  // ========================================
  // REVIEW MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Bulk delete reviews
   * @param reviewIds - Array of review UUIDs
   * @returns Result of bulk delete operation
   */
  bulkDeleteReviews(reviewIds: string[]): Observable<any> {
    return this.http.request(
      'DELETE',
      `${this.apiUrl}/admin/manage/reviews/bulk-delete`,
      {
        ...this.httpOptions,
        body: { reviewIds }
      }
    );
  }

  /**
   * Get flagged reviews (low ratings or suspicious content)
   * @returns List of reviews flagged for moderation
   */
  getFlaggedReviews(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/admin/manage/reviews/flagged`,
      this.httpOptions
    );
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get API base URL
   * @returns The current API base URL
   */
  getApiBaseUrl(): string {
    return this.apiUrl;
  }

  /**
   * Switch API environment (useful for development)
   * @param environment - 'local' | 'ngrok' | 'production'
   */
  switchEnvironment(environment: 'local' | 'ngrok' | 'production'): void {
    switch (environment) {
      case 'local':
        this.apiUrl = 'http://localhost:3000';
        break;
      case 'ngrok':
        this.apiUrl = 'https://miffiest-tom-pyramidally.ngrok-free.dev';
        break;
      case 'production':
        this.apiUrl = 'https://techwave-backend-lepy.onrender.com';
        break;
    }
  }
}