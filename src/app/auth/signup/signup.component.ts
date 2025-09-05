import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  isLoading = false;
  signupMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private router: Router, private apiService: ApiService) {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      location: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
      newsletter: [false]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  togglePassword(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      
      // Prepare user data for API
      const userData = {
        name: this.signupForm.value.name,
        email: this.signupForm.value.email,
        phone: '+254' + this.signupForm.value.phone, // Add country code
        location: this.signupForm.value.location,
        password: this.signupForm.value.password,
        confirmPassword: this.signupForm.value.confirmPassword,
        newsletter: this.signupForm.value.newsletter
      };

      this.apiService.register(userData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.signupMessage = `Account created successfully for ${userData.email}!\nWelcome to TechWave Kenya!`;
          
          // Show success message and redirect after a delay
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          console.error('Registration error:', error);
        }
      });
    }
  }

  showTerms(): void {
    alert('Terms of Service would be displayed here');
  }

  showPrivacy(): void {
    alert('Privacy Policy would be displayed here');
  }

  showLogin(): void {
    this.router.navigate(['/login']);
  }

  signupWithGoogle(): void {
    this.isLoading = true;
    this.signupMessage = 'Redirecting to Google...';

    // Redirect to backend Google auth endpoint
    window.location.href = `${this.apiService.apiUrl}/auth/google`;
  }

  signupWithFacebook(): void {
    alert('Facebook OAuth signup functionality');
  }
}