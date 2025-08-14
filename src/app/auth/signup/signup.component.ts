import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
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

  constructor(private fb: FormBuilder, private router: Router, private signup: ApiService) {
    this.signupForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
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
      // Simulate API call
      setTimeout(() => {
        alert(`Account created successfully for ${this.signupForm.value.email}!\nWelcome to TechWave Kenya!`);
        this.isSubmitting = false;
      }, 2000);
    }
  }

  showTerms(): void {
    alert('Terms of Service would be displayed here');
  }

  showPrivacy(): void {
    alert('Privacy Policy would be displayed here');
  }

  showLogin(): void {
    alert('Redirecting to login page...');
    this.router.navigate(['/login']);
  }

  signupWithGoogle(): void {
    this.isLoading = true;
    this.signupMessage = 'Redirecting to Google...';

    // Redirect to backend Google auth endpoint
    window.location.href = `${this.signup.apiUrl}/auth/google`;
  }

  signupWithFacebook(): void {
    alert('Facebook OAuth signup functionality');
  }
}