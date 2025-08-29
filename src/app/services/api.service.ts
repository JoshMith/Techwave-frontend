import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public apiUrl = 'http://localhost:3000'; // Development URL
  // public apiUrl = 'https://techwave-backend-lepy.onrender.com'; // Production URL
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    withCredentials: true // This enables sending cookies with requests
  };

  constructor(private http: HttpClient) { }

  // ========== Auth Routes ==========
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData, this.httpOptions);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials, this.httpOptions);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, this.httpOptions);
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/verifyEmail?token=${token}`, this.httpOptions);
  }

  // Add this to handle the Google callback
  handleGoogleCallback(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/google/callback`, { withCredentials: true });
  }


  // ========== User Routes ==========
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, this.httpOptions);
  }

  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`, this.httpOptions);
  }

  getCurrentUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/profile`, this.httpOptions);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData, this.httpOptions);
  }

  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, userData, this.httpOptions);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, this.httpOptions);
  }

  // ========== Seller Routes ==========
  getSellers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers`, this.httpOptions);
  }

  getSellerById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/${id}`, this.httpOptions);
  }

  createSeller(sellerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sellers`, sellerData, this.httpOptions);
  }

  updateSeller(id: string, sellerData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sellers/${id}`, sellerData, this.httpOptions);
  }

  deleteSeller(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sellers/${id}`, this.httpOptions);
  }

  // ========== Address Routes ==========
  getAddresses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/addresses`, this.httpOptions);
  }

  getAddressById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/addresses/${id}`, this.httpOptions);
  }

  createAddress(addressData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addresses`, addressData, this.httpOptions);
  }

  updateAddress(id: string, addressData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/addresses/${id}`, addressData, this.httpOptions);
  }

  deleteAddress(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/addresses/${id}`, this.httpOptions);
  }

  // ========== Category Routes ==========
  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`, this.httpOptions);
  }

  getCategoryById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories/${id}`, this.httpOptions);
  }

  getProductCountByCategory(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories/${id}/product-count`, this.httpOptions)
  }


  createCategory(categoryData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, categoryData, this.httpOptions);
  }

  updateCategory(id: string, categoryData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${id}`, categoryData, this.httpOptions);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`, this.httpOptions);
  }

  // ========== Product Routes ==========
  getProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products`, this.httpOptions);
  }

  getProductById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${id}`, this.httpOptions);
  }

  getProductsCountByCategoryId(categoryId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/count/${categoryId}`, this.httpOptions);
  }

  getProductsByCategoryName(categoryName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/category/${categoryName}`, this.httpOptions);
  }

  createProduct(productData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, productData, this.httpOptions);
  }

  updateProduct(id: string, productData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, productData, this.httpOptions);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`, this.httpOptions);
  }

  // ========== Product Image Routes ==========
  getProductImages(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/product-images/${productId}`, this.httpOptions);
  }

  getProductImageUrl(filename: string): string {
    return `${this.apiUrl}/public/uploads/products/${filename}`;
  }

  uploadProductImages(images: FormData): Observable<any> {
    // Note: For file uploads, we need different headers
    const uploadOptions = {
      headers: new HttpHeaders({
        // 'Content-Type' is omitted for FormData as it will be set automatically
      }),
      withCredentials: true
    };
    return this.http.post(`${this.apiUrl}/product-images`, images, uploadOptions);
  }

  updateProductImage(productId: string, imageId: string, imageData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/product-images/${productId}/images/${imageId}`, imageData, this.httpOptions);
  }

  deleteProductImage(productId: string, imageId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/product-images/${productId}/images/${imageId}`, this.httpOptions);
  }

  // ========== Product Offer Routes ==========
  getProductOffers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/product-offers`, this.httpOptions);
  }

  getProductOfferByProductId(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/product-offers/${productId}`, this.httpOptions);
  }

  createProductOffer(offerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/product-offers`, offerData, this.httpOptions);
  }

  updateProductOffer(id: string, offerData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/product-offers/${id}`, offerData, this.httpOptions);
  }

  deleteProductOffer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/product-offers/${id}`, this.httpOptions);
  }

  // ========== Special Offer Routes ==========
  getSpecialOffers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/special-offers`, this.httpOptions);
  }

  getSpecialOfferById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/special-offers/${id}`, this.httpOptions);
  }

  createSpecialOffer(offerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/special-offers`, offerData, this.httpOptions);
  }

  updateSpecialOffer(id: string, offerData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/special-offers/${id}`, offerData, this.httpOptions);
  }

  toggleSpecialOfferActivation(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/special-offers/${id}/toggle-activation`, {}, this.httpOptions);
  }

  deleteSpecialOffer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/special-offers/${id}`, this.httpOptions);
  }

  // ========== Review Routes ==========
  getReviews(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews`, this.httpOptions);
  }

  getReviewById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews/${id}`, this.httpOptions);
  }

  getReviewsByProductId(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews/product/${productId}`, this.httpOptions);
  }

  createReview(reviewData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews`, reviewData, this.httpOptions);
  }

  updateReview(id: string, reviewData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/reviews/${id}`, reviewData, this.httpOptions);
  }

  deleteReview(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reviews/${id}`, this.httpOptions);
  }

  // ========== Delivery Price Routes ==========
  getDeliveryPrices(): Observable<any> {
    return this.http.get(`${this.apiUrl}/delivery-prices`, this.httpOptions);
  }

  getDeliveryPriceById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/delivery-prices/${id}`, this.httpOptions);
  }

  createDeliveryPrice(priceData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/delivery-prices`, priceData, this.httpOptions);
  }

  updateDeliveryPrice(id: string, priceData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/delivery-prices/${id}`, priceData, this.httpOptions);
  }

  deleteDeliveryPrice(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delivery-prices/${id}`, this.httpOptions);
  }

  // ========== Order Routes ==========
  getOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders`, this.httpOptions);
  }

  getOrderById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${id}`, this.httpOptions);
  }

  createOrder(orderData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, orderData, this.httpOptions);
  }

  updateOrder(id: string, orderData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}`, orderData, this.httpOptions);
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orders/${id}`, this.httpOptions);
  }

  // ========== Order Item Routes ==========
  getOrderItems(): Observable<any> {
    return this.http.get(`${this.apiUrl}/order-items`, this.httpOptions);
  }

  getOrderItemById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/order-items/${id}`, this.httpOptions);
  }

  createOrderItem(itemData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/order-items`, itemData, this.httpOptions);
  }

  // Note: Your backend has PUT and DELETE for order-items also calling createOrderItem
  // You might want to fix this in your backend
  updateOrderItem(id: string, itemData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/order-items/${id}`, itemData, this.httpOptions);
  }

  deleteOrderItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/order-items/${id}`, this.httpOptions);
  }

  // ========== Payment Routes ==========
  getPayments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments`, this.httpOptions);
  }

  getPaymentById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/${id}`, this.httpOptions);
  }

  createPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments`, paymentData, this.httpOptions);
  }

  confirmPayment(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/payments/${id}/confirm`, {}, this.httpOptions);
  }

  deletePayment(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/payments/${id}`, this.httpOptions);
  }
}