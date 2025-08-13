import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  passwordFieldType = 'password';
  isLoading = false;
  loginMessage = '';

  constructor(private fb: FormBuilder, private login: ApiService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    this.passwordFieldType = this.showPassword ? 'text' : 'password';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const email = this.loginForm.get('email')?.value;
      alert(`Login attempt for: ${email}`);
      // Here you would typically make an API call to authenticate
    }
  }

  showForgotPassword(): void {
    alert('Redirecting to forgot password page...');
  }

  showSignup(): void {
    alert('Redirecting to signup page...');
  }

  loginWithMpesa(): void {
    alert('M-Pesa login functionality - Enter your phone number for quick access');
  }

  // Add this new method for Google login
  loginWithGoogle(): void {
    this.isLoading = true;
    this.loginMessage = 'Redirecting to Google...';
    
    // Redirect to backend Google auth endpoint
    window.location.href = `${this.login.apiUrl}/auth/google`;
  }

  loginWithFacebook(): void {
    alert('Facebook OAuth login functionality');
  }
}