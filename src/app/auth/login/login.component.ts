import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  passwordFieldType = 'password';
  isLoading = false;
  loginMessage = '';
  errorMessage = '';
  returnUrl: string = '/home'; // Default fallback

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Get the returnUrl from query parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    console.log('Return URL:', this.returnUrl);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    this.passwordFieldType = this.showPassword ? 'text' : 'password';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.apiService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.loginMessage = 'Login successful! Redirecting...';

          if (response.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
          }

          // Redirect to the intended destination or based on role
          if (response.user?.role === 'seller') {
            sessionStorage.setItem('sellerData', JSON.stringify(response.sellerData || {}));
            this.router.navigate(['/seller-dashboard']);
          } else {
            // Use the returnUrl from query parameters
            this.router.navigateByUrl(this.returnUrl);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
          console.error('Login error:', error);
        }
      });
    }
  }

  // ... rest of your methods remain the same
  showForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  showSignup(): void {
    this.router.navigate(['/signup']);
  }
  
  loginWithGoogle(): void {
    this.isLoading = true;
    this.loginMessage = 'Redirecting to Google...';

    // Redirect to backend Google auth endpoint with returnUrl
    const googleAuthUrl = `${this.apiService.apiUrl}/auth/google?returnUrl=${encodeURIComponent(this.returnUrl)}`;
    window.location.href = googleAuthUrl;
  }
}