import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, forkJoin, catchError, of } from 'rxjs';
import { ApiService } from '../services/api.service';

// Interfaces
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
  action: string;
}

interface PerformanceMetric {
  label: string;
  value: string;
  valueClass?: string;
}

interface Product {
  product_id?: string;
  seller_id?: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  sale_price?: number;
  stock: number;
  specs?: { key: string, value: string }[] | string;
  status?: string;
}

interface Category {
  category_id?: string;
  name: string;
}

interface SellerProfile {
  seller_id?: string;
  user_id?: string;
  business_name: string;
  tax_id: string;
  business_license: string;
  total_sales?: number;
  created_at?: string;
  name?: string;
  email?: string;
  phone?: string;
}

@Component({
  selector: 'app-seller-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.css'
})
export class SellerDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Navigation state
  currentView = 'dashboard';

  // User state
  notificationCount = 0;
  userName = 'Seller';
  userRole = '';
  isLoading = true;
  isAuthorized = false;
  error: string | null = null;

  // Dashboard data
  stats: StatCard[] = [
    {
      title: 'Total Revenue',
      value: 'Loading...',
      change: 'Loading...',
      changeClass: 'positive',
      icon: '💰',
      iconClass: 'revenue'
    },
    {
      title: 'Total Orders',
      value: 'Loading...',
      change: 'Loading...',
      changeClass: 'positive',
      icon: '📦',
      iconClass: 'orders'
    },
    {
      title: 'Active Products',
      value: 'Loading...',
      change: 'Loading...',
      changeClass: 'positive',
      icon: '📱',
      iconClass: 'products'
    },
    {
      title: 'Total Customers',
      value: 'Loading...',
      change: 'Loading...',
      changeClass: 'positive',
      icon: '👥',
      iconClass: 'customers'
    }
  ];

  orders: Order[] = [];
  activities: Activity[] = [];

  quickActions: QuickAction[] = [
    {
      icon: '➕',
      text: 'Add Product',
      action: 'add-product'
    },
    {
      icon: '📦',
      text: 'Manage Orders',
      action: 'manage-orders'
    },
    {
      icon: '📊',
      text: 'View Analytics',
      action: 'analytics'
    },
    {
      icon: '🎯',
      text: 'Create Deal',
      action: 'promotions'
    }
  ];

  performanceMetrics: PerformanceMetric[] = [
    {
      label: 'Conversion Rate',
      value: 'Loading...'
    },
    {
      label: 'Average Order Value',
      value: 'Loading...'
    },
    {
      label: 'Return Rate',
      value: 'Loading...'
    },
    {
      label: 'Customer Satisfaction',
      value: 'Loading...'
    }
  ];

  // Products management
  products: any[] = [];
  categories: Category[] = [];
  newProduct: Product = {
    category_id: '',
    title: '',
    description: '',
    price: 0,
    sale_price: undefined,
    stock: 0,
    specs: []
  };

  // NEW: Specifications array for add product form
  specs: { key: string, value: string }[] = [{ key: '', value: '' }];

  // NEW: Images array for add product form
  uploadedImages: { file: File, url: string, name: string }[] = [];

  editingProduct: Product | null = null;
  productError: string | null = null;
  productSuccess: string | null = null;

  // Orders management
  allOrders: any[] = [];
  filteredOrders: any[] = [];
  orderFilter = 'all';
  orderSearch = '';

  // Analytics data
  analyticsData: {
    salesTrend: { month: string; sales: number }[];
    topProducts: { name: string; sales: number; revenue: number }[];
    customerStats: {
      totalCustomers?: number;
      newCustomers?: number;
      returningCustomers?: number;
      customerSatisfaction?: number;
    };
    revenueByMonth: { month: string; revenue: number }[];
  } = {
      salesTrend: [],
      topProducts: [],
      customerStats: {},
      revenueByMonth: []
    };

  // Promotions/Deals
  specialOffers: any[] = [];
  newOffer = {
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    validFrom: '',
    validTo: '',
    isActive: true
  };

  // Profile management
  sellerProfile: SellerProfile | null = null;
  editingProfile = false;
  profileForm: SellerProfile = {
    business_name: '',
    tax_id: '',
    business_license: ''
  };
  profileError: string | null = null;
  profileSuccess: string | null = null;
  profileLoading = false;

  selectedOrder: any = null;
  orderDetails: {
    user?: any;
    address?: any;
    items?: any[];
    payment?: any;
  } = {};
  isLoadingOrderDetails = false;
  isSubmittingProduct = false;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeSellerData(): void {
    // localStorage.removeItem('sellerData');
    // this.loadDashboardData();
  }

  // Navigation methods
  navigateTo(view: string): void {
    this.currentView = view;
    this.clearMessages();

    switch (view) {
      case 'add-product':
        this.loadCategories();
        this.resetNewProduct();
        this.specs = [{ key: '', value: '' }];
        this.uploadedImages = [];
        break;
      case 'manage-orders':
        this.loadAllOrders();
        break;
      case 'analytics':
        this.loadAnalytics();
        break;
      case 'promotions':
        this.loadSpecialOffers();
        break;
      case 'products':
        this.loadProducts();
        break;
      case 'profile':
        this.loadSellerProfile();
        break;
    }
  }

  goToDashboard(): void {
    this.currentView = 'dashboard';
    this.clearMessages();
  }

  private clearMessages(): void {
    this.productError = null;
    this.productSuccess = null;
    this.profileError = null;
    this.profileSuccess = null;
  }

  // Authentication and data loading
  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;
    this.isAuthorized = false;

    try {
      const userString = localStorage.getItem('currentUser');

      if (userString) {
        const user = JSON.parse(userString);

        this.userName = user.firstName || user.name || 'User';
        this.userRole = user.role || 'buyer';

        if (this.userRole.toLowerCase() === 'seller' || this.userRole.toLowerCase() === 'admin') {
          this.isAuthorized = true;
          this.loadSellerData();
        } else {
          this.isAuthorized = false;
          this.isLoading = false;
        }
      } else {
        this.error = 'No user found. Please log in again.';
        this.isLoading = false;
      }
    } catch (error) {
      this.error = 'Invalid user data. Please log in again.';
      this.isLoading = false;
    }
  }

  private loadSellerData(): void {
    const dashboardData$ = forkJoin({
      orders: this.apiService.getOrders().pipe(catchError(() => of({ data: [] }))),
      products: this.apiService.getProducts().pipe(catchError(() => of({ data: [] }))),
      users: this.apiService.getUsers().pipe(catchError(() => of({ data: [] }))),
      payments: this.apiService.getPayments().pipe(catchError(() => of({ data: [] }))),
      reviews: this.apiService.getReviews().pipe(catchError(() => of({ data: [] })))
    });

    dashboardData$
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading dashboard data:', error);
          this.error = 'Failed to load dashboard data. Please try again.';
          return of(null);
        })
      )
      .subscribe(data => {
        if (data) {
          this.processOrders(data.orders.data || []);
          this.processProducts(data.products.data || []);
          this.processUsers(data.users.data || []);
          this.processPayments(data.payments.data || []);
          this.processReviews(data.reviews.data || []);
          this.generateActivities(data);
          this.calculatePerformanceMetrics(data);
        }
        this.isLoading = false;
      });
  }

  // Profile management methods
  private loadSellerProfile(): void {
    this.profileLoading = true;
    this.profileError = null;

    try {
      const userString = localStorage.getItem('currentUser');
      if (!userString) {
        this.profileError = 'User session expired. Please log in again.';
        this.profileLoading = false;
        return;
      }

      const user = JSON.parse(userString);
      const userId = user.id || user.user_id;

      this.apiService.getSellers()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (sellers) => {
            const userSeller = sellers.find((s: any) => s.user_id === userId);

            if (userSeller) {
              this.sellerProfile = userSeller;
              this.profileForm = {
                business_name: userSeller.business_name || '',
                tax_id: userSeller.tax_id || '',
                business_license: userSeller.business_license || ''
              };
            } else {
              this.sellerProfile = null;
            }
            this.profileLoading = false;
          },
          error: (error) => {
            console.error('Error loading seller profile:', error);
            this.profileError = 'Failed to load profile. Please try again.';
            this.profileLoading = false;
          }
        });
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.profileError = 'Invalid user session. Please log in again.';
      this.profileLoading = false;
    }
  }

  onEditProfile(): void {
    this.editingProfile = true;
    this.profileError = null;
    this.profileSuccess = null;
  }

  onCancelProfileEdit(): void {
    this.editingProfile = false;
    if (this.sellerProfile) {
      this.profileForm = {
        business_name: this.sellerProfile.business_name || '',
        tax_id: this.sellerProfile.tax_id || '',
        business_license: this.sellerProfile.business_license || ''
      };
    }
    this.profileError = null;
  }

  onSaveProfile(): void {
    if (!this.validateProfile()) {
      return;
    }

    this.profileLoading = true;
    this.profileError = null;
    this.profileSuccess = null;

    if (this.sellerProfile && this.sellerProfile.seller_id) {
      this.apiService.updateSeller(this.sellerProfile.seller_id.toString(), this.profileForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.profileSuccess = 'Profile updated successfully!';
            this.editingProfile = false;
            this.loadSellerProfile();
          },
          error: (error) => {
            console.error('Error updating profile:', error);
            this.profileError = 'Failed to update profile. Please try again.';
            this.profileLoading = false;
          }
        });
    } else {
      this.apiService.createSeller(this.profileForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.profileSuccess = 'Profile created successfully!';
            this.editingProfile = false;
            this.loadSellerProfile();
          },
          error: (error) => {
            console.error('Error creating profile:', error);
            this.profileError = 'Failed to create profile. Please try again.';
            this.profileLoading = false;
          }
        });
    }
  }

  private validateProfile(): boolean {
    if (!this.profileForm.business_name.trim()) {
      this.profileError = 'Business name is required';
      return false;
    }
    if (!this.profileForm.tax_id.trim()) {
      this.profileError = 'Tax ID is required';
      return false;
    }
    if (!this.profileForm.business_license.trim()) {
      this.profileError = 'Business license is required';
      return false;
    }
    return true;
  }

  // Products management methods
  private loadProducts(): void {
    this.apiService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.products = response || [];
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.productError = 'Failed to load products';
        }
      });
  }

  productSearch = '';
  productFilterCategory = '';
  productFilterMinPrice: number | null = null;
  productFilterMaxPrice: number | null = null;
  productFilterStatus = '';
  private filteredProductsList: any[] = [];

  get filteredProducts(): any[] {
    return this.filteredProductsList;
  }

  filterProducts(): void {
    const search = (this.productSearch || '').trim().toLowerCase();
    const category = this.productFilterCategory;
    const min = this.productFilterMinPrice !== null && this.productFilterMinPrice !== undefined
      ? Number(this.productFilterMinPrice)
      : null;
    const max = this.productFilterMaxPrice !== null && this.productFilterMaxPrice !== undefined
      ? Number(this.productFilterMaxPrice)
      : null;
    const status = (this.productFilterStatus || '').toLowerCase();

    let filtered = Array.isArray(this.products) ? [...this.products] : [];

    if (search) {
      filtered = filtered.filter((p: any) => {
        const title = (p.title || p.name || '').toString().toLowerCase();
        const desc = (p.description || p.desc || '').toString().toLowerCase();
        return title.includes(search) || desc.includes(search);
      });
    }

    if (category) {
      filtered = filtered.filter((p: any) =>
        (p.category_id || p.category || '').toString() === category.toString()
      );
    }

    if (min !== null && !Number.isNaN(min)) {
      filtered = filtered.filter((p: any) => Number(p.price || p.sale_price || 0) >= min);
    }

    if (max !== null && !Number.isNaN(max)) {
      filtered = filtered.filter((p: any) => Number(p.price || p.sale_price || 0) <= max);
    }

    if (status) {
      filtered = filtered.filter((p: any) => {
        const st = (p.status || (p.isActive === false ? 'inactive' : 'active') || '').toString().toLowerCase();
        return st === status;
      });
    }

    this.filteredProductsList = filtered;
  }

  clearProductFilters(): void {
    this.productSearch = '';
    this.productFilterCategory = '';
    this.productFilterMinPrice = null;
    this.productFilterMaxPrice = null;
    this.productFilterStatus = '';
    this.filteredProductsList = Array.isArray(this.products) ? [...this.products] : [];
  }

  private loadCategories(): void {
    this.apiService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories = response || [];
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  // NEW: Image handling methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.uploadedImages.push({
              file: file,
              url: e.target?.result as string,
              name: file.name
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    const uploadArea = event.currentTarget as HTMLElement;
    uploadArea.classList.add('dragover');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    const uploadArea = event.currentTarget as HTMLElement;
    uploadArea.classList.remove('dragover');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const uploadArea = event.currentTarget as HTMLElement;
    uploadArea.classList.remove('dragover');

    if (event.dataTransfer?.files) {
      Array.from(event.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.uploadedImages.push({
              file: file,
              url: e.target?.result as string,
              name: file.name
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
  }

  addSpecification(): void {
    this.specs.push({ key: '', value: '' });
  }

  removeSpecification(index: number): void {
    if (this.specs.length > 1) {
      this.specs.splice(index, 1);
    }
  }

  onAddProduct(): void {
    // Clear previous messages
    this.clearMessages();

    // Validate basic product info (images are optional for product creation)
    if (!this.validateProduct(this.newProduct)) {
      return;
    }

    // Check if images are provided (warn but don't block)
    const hasImages = this.uploadedImages.length > 0;
    if (!hasImages) {
      console.warn('⚠️ No images provided - product will be created without images');
    }

    // Filter and validate specifications
    const validSpecs = this.specs.filter(spec =>
      spec.key.trim() !== '' && spec.value.trim() !== ''
    );

    // Convert specs array to flat JSON object
    let specsObject: any = null;
    if (validSpecs.length > 0) {
      specsObject = {};
      validSpecs.forEach(spec => {
        specsObject[spec.key.trim()] = spec.value.trim();
      });
    }
    

    // Convert specs to JSON string
    const specsJson = specsObject ? JSON.stringify(specsObject) : null;

    this.isSubmittingProduct = true;

    try {
      const userString = localStorage.getItem('currentUser');
      const sellerString = sessionStorage.getItem('sellerData');

      if (!userString) {
        this.productError = 'User session expired. Please log in again.';
        this.isSubmittingProduct = false;
        return;
      }

      const user = JSON.parse(userString);
      const seller = sellerString ? JSON.parse(sellerString) : null;

      // Prepare product data (WITHOUT images)
      const productData = {
        seller_id: seller?.seller_id,
        category_id: this.newProduct.category_id,
        title: this.newProduct.title,
        description: this.newProduct.description,
        price: this.newProduct.price,
        sale_price: this.newProduct.sale_price || null,
        stock: this.newProduct.stock || 0,
        specs: specsJson
      };

      console.log('📦 Creating product:', productData);

      // STEP 1: Create the product first
      this.apiService.createProduct(productData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (productResponse) => {
            console.log('✅ Product created successfully:', productResponse);

            const createdProduct = productResponse.product || productResponse;
            const productId = createdProduct.product_id || createdProduct.id;

            // STEP 2: Upload images if available (independent operation)
            if (hasImages && productId) {
              this.uploadProductImages(productId, createdProduct.title);
            } else {
              // No images to upload - just show success
              this.handleProductCreationSuccess(createdProduct.title, false);
            }
          },
          error: (error) => {
            console.error('❌ Failed to create product:', error);
            this.productError = error.error?.message || 'Failed to create product. Please try again.';
            this.isSubmittingProduct = false;
          }
        });

    } catch (error) {
      console.error('❌ Error in product creation:', error);
      this.productError = 'An unexpected error occurred. Please try again.';
      this.isSubmittingProduct = false;
    }
  }

  /**
   * Upload images for a product (separate API call)
   */
  private uploadProductImages(productId: string | number, productTitle: string): void {
    console.log('📸 Uploading images for product:', productId);

    // Create FormData for image upload
    const formData = new FormData();
    formData.append('product_id', productId.toString());

    // Append all images
    this.uploadedImages.forEach((image, index) => {
      formData.append('images', image.file, image.file.name);
      // Set first image as primary
      if (index === 0) {
        formData.append('is_primary', 'true');
      }
    });

    this.apiService.uploadProductImages(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (imageResponse) => {
          console.log('✅ Images uploaded successfully:', imageResponse);
          this.handleProductCreationSuccess(productTitle, true);
        },
        error: (imageError) => {
          console.error('⚠️ Failed to upload images:', imageError);
          // Product was created successfully, but images failed
          this.handleProductCreationSuccess(productTitle, false, imageError.error?.message);
        }
      });
  }

  /**
   * Handle successful product creation with appropriate messaging
   */
  private handleProductCreationSuccess(
    productTitle: string,
    imagesUploaded: boolean,
    imageError?: string
  ): void {
    this.isSubmittingProduct = false;

    // Construct success message
    if (imagesUploaded) {
      this.productSuccess = `✅ Product "${productTitle}" created successfully with images!`;
    } else if (imageError) {
      this.productSuccess = `✅ Product "${productTitle}" created successfully, but images failed to upload: ${imageError}. You can add images later.`;
    } else {
      this.productSuccess = `✅ Product "${productTitle}" created successfully! You can add images later.`;
    }

    // Reset form
    this.resetNewProduct();
    this.specs = [{ key: '', value: '' }];
    this.uploadedImages = [];

    // Reload dashboard data
    this.loadSellerData();

    // Auto-navigate to products view after 3 seconds
    setTimeout(() => {
      if (this.currentView === 'add-product') {
        this.navigateTo('products');
      }
    }, 3000);
  }

  /**
   * Validate product data (images are now optional)
   */
  private validateProduct(product: Product): boolean {
    if (!product.title.trim()) {
      this.productError = 'Product title is required';
      return false;
    }
    if (product.title.length > 200) {
      this.productError = 'Product title must be 200 characters or less';
      return false;
    }
    if (!product.description.trim()) {
      this.productError = 'Product description is required';
      return false;
    }
    if (product.price <= 0) {
      this.productError = 'Product price must be greater than 0';
      return false;
    }
    if (!product.category_id) {
      this.productError = 'Please select a category';
      return false;
    }
    if (product.stock < 0) {
      this.productError = 'Stock cannot be negative';
      return false;
    }
    if (product.sale_price && product.sale_price >= product.price) {
      this.productError = 'Sale price must be less than regular price';
      return false;
    }

    return true;
  }

  /**
   * Reset product form
   */
  private resetNewProduct(): void {
    this.newProduct = {
      category_id: '',
      title: '',
      description: '',
      price: 0,
      sale_price: undefined,
      stock: 0,
      specs: []
    };
    this.isSubmittingProduct = false;
  }


  onEditProduct(product: any): void {
    this.editingProduct = { ...product };
  }

  onUpdateProduct(): void {
    if (this.editingProduct) {
      this.apiService.updateProduct(this.editingProduct.product_id!, this.editingProduct)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.productSuccess = 'Product updated successfully!';
            this.editingProduct = null;
            this.loadProducts();
          },
          error: (error) => {
            console.error('Error updating product:', error);
            this.productError = 'Failed to update product. Please try again.';
          }
        });
    }
  }

  onDeleteProduct(productId: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.apiService.deleteProduct(productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.productSuccess = 'Product deleted successfully!';
            this.loadProducts();
            this.loadSellerData();
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.productError = 'Failed to delete product. Please try again.';
          }
        });
    }
  }

  // Orders management methods
  private loadAllOrders(): void {
    this.apiService.getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allOrders = response || [];
          this.filteredOrders = this.allOrders;
        },
        error: (error) => {
          console.error('Error loading orders:', error);
        }
      });
  }

  filterOrders(): void {
    let filtered = this.allOrders;

    if (this.orderFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.status &&
        order.status.toLowerCase() === this.orderFilter.toLowerCase()
      );
    }

    if (this.orderSearch.trim()) {
      const searchTerm = this.orderSearch.toLowerCase();
      filtered = filtered.filter(order => {
        const id = (order.order_id || order._id || '').toString().toLowerCase();
        const customerName = (order.user_name || order.customer?.name || '').toLowerCase();
        const productName = (order.product_name || order.items?.[0]?.productName || '').toLowerCase();
        return (
          id.includes(searchTerm) ||
          customerName.includes(searchTerm) ||
          productName.includes(searchTerm)
        );
      });
    }

    this.filteredOrders = filtered;
  }

  updateOrderStatus(orderId: string, newStatus: string): void {
    this.apiService.updateOrder(orderId, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadAllOrders();
          this.loadSellerData();
        },
        error: (error) => {
          console.error('Error updating order status:', error);
        }
      });
  }

  // Analytics methods
  private loadAnalytics(): void {
    this.analyticsData = {
      salesTrend: [
        { month: 'Jan', sales: 12000 },
        { month: 'Feb', sales: 15000 },
        { month: 'Mar', sales: 18000 },
        { month: 'Apr', sales: 22000 },
        { month: 'May', sales: 25000 },
        { month: 'Jun', sales: 28000 }
      ],
      topProducts: [
        { name: 'iPhone 15', sales: 45, revenue: 129000 },
        { name: 'Samsung Galaxy A54', sales: 38, revenue: 95000 },
        { name: 'Google Pixel 8', sales: 25, revenue: 67500 }
      ],
      customerStats: {
        totalCustomers: 1247,
        newCustomers: 89,
        returningCustomers: 245,
        customerSatisfaction: 4.7
      },
      revenueByMonth: [
        { month: 'Jan', revenue: 45000 },
        { month: 'Feb', revenue: 52000 },
        { month: 'Mar', revenue: 48000 },
        { month: 'Apr', revenue: 65000 },
        { month: 'May', revenue: 58000 },
        { month: 'Jun', revenue: 72000 }
      ]
    };
  }

  // Promotions methods
  private loadSpecialOffers(): void {
    this.apiService.getSpecialOffers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.specialOffers = response || [];
        },
        error: (error) => {
          console.error('Error loading special offers:', error);
        }
      });
  }

  onCreateOffer(): void {
    this.apiService.createSpecialOffer(this.newOffer)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.productSuccess = 'Special offer created successfully!';
          this.resetNewOffer();
          this.loadSpecialOffers();
        },
        error: (error) => {
          console.error('Error creating offer:', error);
          this.productError = 'Failed to create offer. Please try again.';
        }
      });
  }

  toggleOfferStatus(offerId: string): void {
    this.apiService.toggleSpecialOfferActivation(offerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadSpecialOffers();
        },
        error: (error) => {
          console.error('Error toggling offer status:', error);
        }
      });
  }

  deleteOffer(offerId: string): void {
    if (confirm('Are you sure you want to delete this offer?')) {
      this.apiService.deleteSpecialOffer(offerId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.productSuccess = 'Offer deleted successfully!';
            this.loadSpecialOffers();
          },
          error: (error) => {
            console.error('Error deleting offer:', error);
            this.productError = 'Failed to delete offer. Please try again.';
          }
        });
    }
  }

  private resetNewOffer(): void {
    this.newOffer = {
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      validFrom: '',
      validTo: '',
      isActive: true
    };
  }

  // Data processing methods
  private processOrders(ordersData: any[]): void {
    this.stats[1].value = ordersData.length.toString();
    this.stats[1].change = this.calculateOrdersChange(ordersData);

    this.orders = ordersData
      .slice(0, 5)
      .map(order => ({
        id: order.id || order._id || 'N/A',
        customer: order.customerName || order.customer?.name || 'Unknown Customer',
        product: order.productName || order.items?.[0]?.productName || 'Unknown Product',
        amount: this.formatCurrency(order.totalAmount || order.total || 0),
        status: this.mapOrderStatus(order.status),
        date: this.formatDate(order.createdAt || order.orderDate),
        statusClass: this.getStatusClass(order.status)
      }));
  }

  private processProducts(productsData: any[]): void {
    const activeProducts = productsData.filter(product =>
      product.status === 'active' || product.isActive !== false
    );
    this.stats[2].value = activeProducts.length.toString();
    this.stats[2].change = this.calculateProductsChange(activeProducts);
  }

  private processUsers(usersData: any[]): void {
    const customers = usersData.filter(user =>
      !user.role || user.role === 'customer' || user.role === 'user'
    );
    this.stats[3].value = customers.length.toString();
    this.stats[3].change = this.calculateCustomersChange(customers);
  }

  private processPayments(paymentsData: any[]): void {
    const successfulPayments = paymentsData.filter(payment =>
      payment.status === 'completed' || payment.status === 'success' || payment.confirmed
    );

    const totalRevenue = successfulPayments.reduce((sum, payment) =>
      sum + (payment.amount || 0), 0
    );

    this.stats[0].value = this.formatCurrency(totalRevenue);
    this.stats[0].change = this.calculateRevenueChange(successfulPayments);
  }

  private processReviews(reviewsData: any[]): void {
    if (reviewsData.length > 0) {
      const avgRating = reviewsData.reduce((sum, review) =>
        sum + (review.rating || 0), 0
      ) / reviewsData.length;

      this.performanceMetrics[3] = {
        label: 'Customer Satisfaction',
        value: `${avgRating.toFixed(1)}/5.0`,
        valueClass: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'warning' : 'negative'
      };
    }
  }

  private generateActivities(data: any): void {
    const activities: Activity[] = [];

    const recentOrders = (data.orders.data || []).slice(0, 2);
    recentOrders.forEach((order: any) => {
      activities.push({
        icon: '📦',
        iconClass: 'order',
        text: `New order received for ${order.productName || 'product'}`,
        time: this.getRelativeTime(order.createdAt)
      });
    });

    const recentProducts = (data.products.data || []).slice(0, 1);
    recentProducts.forEach((product: any) => {
      activities.push({
        icon: '📱',
        iconClass: 'product',
        text: `${product.name || 'Product'} ${product.stock > 0 ? 'in stock' : 'out of stock'}`,
        time: this.getRelativeTime(product.updatedAt || product.createdAt)
      });
    });

    const recentReviews = (data.reviews.data || []).slice(0, 2);
    recentReviews.forEach((review: any) => {
      const stars = '⭐'.repeat(Math.min(review.rating || 5, 5));
      activities.push({
        icon: '⭐',
        iconClass: 'review',
        text: `New ${stars} review received`,
        time: this.getRelativeTime(review.createdAt)
      });
    });

    this.activities = activities.slice(0, 5);
  }

  private calculatePerformanceMetrics(data: any): void {
    const orders = data.orders.data || [];

    const totalVisits = orders.length * 10;
    const conversionRate = orders.length > 0 ? ((orders.length / totalVisits) * 100).toFixed(1) : '0.0';

    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const returnedOrders = orders.filter((order: any) => order.status === 'returned' || order.status === 'cancelled');
    const returnRate = orders.length > 0 ? ((returnedOrders.length / orders.length) * 100).toFixed(1) : '0.0';

    this.performanceMetrics = [
      {
        label: 'Conversion Rate',
        value: `${conversionRate}%`,
        valueClass: parseFloat(conversionRate) >= 3 ? 'positive' : 'warning'
      },
      {
        label: 'Average Order Value',
        value: this.formatCurrency(avgOrderValue)
      },
      {
        label: 'Return Rate',
        value: `${returnRate}%`,
        valueClass: parseFloat(returnRate) <= 5 ? 'positive' : 'warning'
      },
      ...this.performanceMetrics.slice(3)
    ];
  }

  // Utility methods
  private calculateOrdersChange(orders: any[]): string {
    const change = Math.floor(Math.random() * 20) - 5;
    return change > 0 ? `+${change}% from last month` : `${change}% from last month`;
  }

  private calculateProductsChange(products: any[]): string {
    const newProducts = Math.floor(Math.random() * 10) + 1;
    return `+${newProducts} new this week`;
  }

  private calculateCustomersChange(customers: any[]): string {
    const change = Math.floor(Math.random() * 25) + 5;
    return `+${change}% from last month`;
  }

  private calculateRevenueChange(payments: any[]): string {
    const change = Math.floor(Math.random() * 20) + 2;
    return `+${change}% from last month`;
  }

  public mapOrderStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'returned': 'Returned'
    };
    return statusMap[status?.toLowerCase()] || status || 'Unknown';
  }

  public getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'pending',
      'processing': 'processing',
      'shipped': 'processing',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'returned': 'cancelled'
    };
    return statusClasses[status?.toLowerCase()] || 'pending';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount).replace('KES', 'KSh');
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private getRelativeTime(dateString: string): string {
    if (!dateString) return 'Recently';

    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return this.formatDate(dateString);
  }

  // Event handlers
  onQuickActionClick(action: string): void {
    this.navigateTo(action);
  }

  onOrderClick(orderId: string): void {
    this.selectedOrder = null;
    this.isLoadingOrderDetails = true;
    this.orderDetails = {};

    this.apiService.getOrderById(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.selectedOrder = order;

          const userId = order.user_id;
          const addressId = order.address_id;

          forkJoin({
            user: userId ? this.apiService.getUserById(userId).pipe(catchError(() => of(null))) : of(null),
            address: addressId ? this.apiService.getAddressById(addressId).pipe(catchError(() => of(null))) : of(null),
            orderItems: this.apiService.getOrderItems().pipe(
              catchError(() => of({ data: [] }))
            ),
            payment: this.apiService.getPayments().pipe(
              catchError(() => of({ data: [] }))
            )
          }).subscribe({
            next: (data) => {
              this.orderDetails.user = data.user;
              this.orderDetails.address = data.address;

              const allItems = data.orderItems.data || data.orderItems || [];
              this.orderDetails.items = allItems.filter((item: any) =>
                item.order_id === orderId || item.order_id === order.order_id
              );

              const allPayments = data.payment.data || data.payment || [];
              this.orderDetails.payment = allPayments.find((payment: any) =>
                payment.order_id === orderId || payment.order_id === order.order_id
              );

              this.isLoadingOrderDetails = false;
              this.navigateTo('order-details');
            },
            error: (error) => {
              console.error('Error loading order details:', error);
              this.isLoadingOrderDetails = false;
            }
          });
        },
        error: (error) => {
          console.error('Error loading order:', error);
          alert(`Error Loading Order: ${error.error.message || 'Unknown error'}`);
          this.isLoadingOrderDetails = false;
        }
      });
  }

  closeOrderDetails(): void {
    this.selectedOrder = null;
    this.orderDetails = {};
    this.navigateTo('manage-orders');
  }

  onNotificationClick(): void {
    console.log('Notifications clicked');
  }

  onProfileClick(): void {
    this.navigateTo('profile');
  }

  refreshData(): void {
    this.loadDashboardData();
  }
}