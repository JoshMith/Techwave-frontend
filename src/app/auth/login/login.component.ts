import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  passwordFieldType = 'password';
  isLoading = false;
  loginMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder, 
    private apiService: ApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
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
          
          // Store authentication token if available
          if (response.token) {
            localStorage.setItem('authToken', response.token);
          }
          
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
          }

          // Redirect to dashboard or homepage
          if (response.user?.role === 'seller') {
            sessionStorage.setItem('sellerData', JSON.stringify(response.sellerData || {}));
            this.router.navigate(['/seller-dashboard']);
          } else {
            this.router.navigate(['/homepage']);
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

  showForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  showSignup(): void {
    this.router.navigate(['/signup']);
  }

  loginWithMpesa(): void {
    alert('M-Pesa login functionality - Enter your phone number for quick access');
  }

  loginWithGoogle(): void {
    this.isLoading = true;
    this.loginMessage = 'Redirecting to Google...';
    
    // Redirect to backend Google auth endpoint
    window.location.href = `${this.apiService.apiUrl}/auth/google`;
  }

  loginWithFacebook(): void {
    alert('Facebook OAuth login functionality');
  }
}