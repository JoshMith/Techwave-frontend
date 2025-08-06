import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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

  constructor(private fb: FormBuilder) {
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

  loginWithGoogle(): void {
    alert('Google OAuth login functionality');
  }

  loginWithFacebook(): void {
    alert('Facebook OAuth login functionality');
  }
}