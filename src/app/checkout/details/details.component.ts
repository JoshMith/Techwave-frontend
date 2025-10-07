import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface Address {
  address_id?: number;
  user_id?: number;
  city: string;
  street: string;
  building?: string;
  postal_code?: string;
  is_default: boolean;
  created_at?: string;
}

interface DeliveryPricing {
  rule_id: number;
  city: string;
  min_free_delivery: number;
  standard_fee: number;
  is_active: boolean;
}

@Component({
  selector: 'app-details',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})
export class DetailsComponent implements OnInit {
  isBrowser: boolean;
  addressForm: FormGroup;
  savedAddresses: Address[] = [];
  selectedAddressId: number | null = null;
  showAddressForm = false;
  deliveryPricing: DeliveryPricing[] = [];
  calculatedDeliveryFee = 0;

  currentUser: any = null;
  cartId: number | null = null;
  cartTotal = 0;
  loading = false;
  error: string | null = null;



  kenyaCities = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
    'Nyeri', 'Thika', 'Malindi', 'Kitale', 'Garissa',
    'Kakamega', 'Machakos', 'Meru', 'Naivasha', 'Kericho'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: any

  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Get cart info from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.cartId = navigation.extras.state['cartId'];
      this.cartTotal = navigation.extras.state['total'];
    }

    this.addressForm = this.fb.group({
      user_id: [this.currentUser?.user_id || ''],
      city: ['', Validators.required],
      street: ['', Validators.required],
      building: [''],
      postal_code: [''],
      is_default: [false]
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadSavedAddresses();
    this.loadDeliveryPricing();
  }


  loadCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return null;
    }
    const userId = JSON.parse(userStr).user_id;
    this.apiService.getCurrentUserProfile(userId).subscribe({
      next: (user) => {
        this.currentUser = user;
        // console.log('Current user:', this.currentUser);
      },
      error: (err) => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/checkout/details' }
        });
      }
    });
    return userId;
  }

  loadSavedAddresses(): void {
    // Fetch addresses for the current user
    this.apiService.getAddressByUserId(this.loadCurrentUser()).subscribe({
      next: (addresses) => {
        // console.log('Loaded addresses:', addresses);
        this.savedAddresses = addresses;
        // Auto-select default address
        const defaultAddress = addresses.find((a: Address) => a.is_default);
        if (defaultAddress && defaultAddress.address_id) {
          this.selectedAddressId = defaultAddress.address_id;
          this.calculateDeliveryFee(defaultAddress.city);
        }
      },
      error: (err) => {
        console.error('Failed to load addresses:', err);
      }
    });
  }

  loadDeliveryPricing(): void {
    this.apiService.getDeliveryPrices().subscribe({
      next: (pricing) => {
        this.deliveryPricing = pricing.filter((p: DeliveryPricing) => p.is_active);
      },
      error: (err) => {
        console.error('Failed to load delivery pricing:', err);
      }
    });
  }

  onAddressSelect(addressId: number): void {
    this.selectedAddressId = addressId;
    const address = this.savedAddresses.find(a => a.address_id === addressId);
    if (address) {
      this.calculateDeliveryFee(address.city);
    }
  }

  calculateDeliveryFee(city: string): void {
    const pricing = this.deliveryPricing.find(
      p => p.city.toLowerCase() === city.toLowerCase()
    );

    if (pricing) {
      if (this.cartTotal >= pricing.min_free_delivery) {
        this.calculatedDeliveryFee = 0;
      } else {
        this.calculatedDeliveryFee = pricing.standard_fee;
      }
    } else {
      // Default delivery fee for cities not in pricing table
      this.calculatedDeliveryFee = this.cartTotal >= 5000 ? 0 : 500;
    }
  }

  toggleAddressForm(): void {
    this.showAddressForm = !this.showAddressForm;
    if (!this.showAddressForm) {
      this.addressForm.reset({ is_default: false });
    }
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      Object.keys(this.addressForm.controls).forEach(key => {
        this.addressForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = null;

    const addressData = this.addressForm.value;

    this.apiService.createAddress(addressData).subscribe({
      next: (response) => {
        this.loading = false;
        this.showAddressForm = false;
        this.addressForm.reset({ is_default: false });
        this.loadSavedAddresses();
        alert('Address saved successfully!');
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to save address';
      }
    });
  }

  deleteAddress(addressId: number): void {
    if (!confirm('Delete this address?')) {
      return;
    }

    this.apiService.deleteAddress(addressId.toString()).subscribe({
      next: () => {
        this.savedAddresses = this.savedAddresses.filter(
          a => a.address_id !== addressId
        );
        if (this.selectedAddressId === addressId) {
          this.selectedAddressId = null;
        }
      },
      error: (err) => {
        alert('Failed to delete address: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  setDefaultAddress(addressId: number): void {
    const address = this.savedAddresses.find(a => a.address_id === addressId);
    if (!address) return;

    this.apiService.updateAddress(addressId.toString(), {
      ...address,
      is_default: true
    }).subscribe({
      next: () => {
        this.loadSavedAddresses();
      },
      error: (err) => {
        alert('Failed to set default address');
      }
    });
  }

  proceedToPayment(): void {
    if (!this.selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }

    if (!this.cartId) {
      alert('Cart information missing. Please return to cart.');
      this.router.navigate(['/cart']);
      return;
    }

    const selectedAddress = this.savedAddresses.find(
      a => a.address_id === this.selectedAddressId
    );

    // Navigate to payment with all required info
    this.router.navigate(['/checkout/payment'], {
      state: {
        cartId: this.cartId,
        addressId: this.selectedAddressId,
        subtotal: this.cartTotal,
        deliveryFee: this.calculatedDeliveryFee,
        total: this.cartTotal + this.calculatedDeliveryFee,
        deliveryCity: selectedAddress?.city
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/cart']);
  }
}