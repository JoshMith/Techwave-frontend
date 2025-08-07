import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-forgot-pwd',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './forgot-pwd.component.html',
  styleUrls: ['./forgot-pwd.component.css']
})
export class ForgotPwdComponent {
  currentStep = 1;
  timeLeft = 60;
  countdownTimer: any;
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  verificationCode = ['', '', '', '', '', ''];
  passwordStrength = '';

  // Separate forms for each step
  emailForm: FormGroup;
  verificationForm: FormGroup;
  passwordForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.verificationForm = this.fb.group({
      code0: [''],
      code1: [''],
      code2: [''],
      code3: [''],
      code4: [''],
      code5: ['']
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmNewPassword')?.value
      ? null : { mismatch: true };
  }

  showStep(step: number): void {
    this.currentStep = step;
  }

  goToLogin(): void {
    alert('Redirecting to login page...');
  }

  togglePassword(field: 'newPassword' | 'confirmNewPassword'): void {
    if (field === 'newPassword') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  startCountdown(): void {
    this.timeLeft = 60;
    clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.countdownTimer);
      }
    }, 1000);
  }

  checkPasswordStrength(password: string): void {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score < 3) {
      this.passwordStrength = 'weak';
    } else if (score < 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  onEmailSubmit(): void {
    if (this.emailForm.valid) {
      this.isSubmitting = true;

      setTimeout(() => {
        this.showStep(2);
        this.startCountdown();
        this.isSubmitting = false;
      }, 2000);
    }
  }

  onVerificationSubmit(): void {
    const code = this.verificationCode.join('');

    if (code.length === 6) {
      this.isSubmitting = true;

      setTimeout(() => {
        if (code === '123456') { // Demo code
          this.showStep(3);
        } else {
          alert('Invalid verification code. Try: 123456');
        }
        this.isSubmitting = false;
      }, 1500);
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.valid && this.passwordStrength === 'strong') {
      this.isSubmitting = true;

      setTimeout(() => {
        this.showStep(4);
        this.isSubmitting = false;
      }, 2000);
    }
  }

  resendCode(): void {
    alert('Verification code resent!');
    this.startCountdown();
  }

  onVerificationInput(index: number, event: any): void {
    const value = event.target.value;
    this.verificationCode[index] = value;
    if (value && index < 5) {
      const nextInput = document.querySelector(`.verification-input[data-index="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  onVerificationKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.verificationCode[index] && index > 0) {
      const prevInput = document.querySelector(`.verification-input[data-index="${index - 1}"]`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  }
}