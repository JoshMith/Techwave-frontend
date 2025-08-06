import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-product',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  standalone: true,
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent {
  productForm: FormGroup;
  uploadedImages: { file: File, url: string, name: string }[] = [];
  categories = [
    { value: 'phones', label: 'Phones' },
    { value: 'laptops', label: 'Laptops' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'home-appliances', label: 'Home Appliances' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'audio-sound', label: 'Audio & Sound' }
  ];
  conditions = [
    { value: 'new', label: 'Brand New' },
    { value: 'refurbished', label: 'Refurbished' },
    { value: 'used-like-new', label: 'Used - Like New' },
    { value: 'used-good', label: 'Used - Good' },
    { value: 'used-fair', label: 'Used - Fair' }
  ];
  specifications: { key: string, value: string }[] = [{ key: '', value: '' }];
  isSubmitting = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      category: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
      salePrice: ['', Validators.min(1)],
      stock: ['', [Validators.required, Validators.min(0)]],
      condition: ['', Validators.required]
    });
  }

  // Add this new method to handle cancel action
  onCancel(): void {
    // In a real app, you might want to confirm with the user before discarding changes
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/seller-dashboard']);
    }
  }

  // ... rest of the existing methods remain the same ...
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
    this.specifications.push({ key: '', value: '' });
  }

  removeSpecification(index: number): void {
    if (this.specifications.length > 1) {
      this.specifications.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      alert('Please fill in all required fields');
      return;
    }

    if (this.uploadedImages.length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    // Validate sale price
    const price = this.productForm.get('price')?.value;
    const salePrice = this.productForm.get('salePrice')?.value;
    if (salePrice && price && salePrice >= price) {
      alert('Sale price must be less than regular price');
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('title', this.productForm.get('title')?.value);
    formData.append('category', this.productForm.get('category')?.value);
    formData.append('description', this.productForm.get('description')?.value);
    formData.append('price', this.productForm.get('price')?.value);
    formData.append('salePrice', this.productForm.get('salePrice')?.value || '');
    formData.append('stock', this.productForm.get('stock')?.value);
    formData.append('condition', this.productForm.get('condition')?.value);

    // Add images
    this.uploadedImages.forEach((image, index) => {
      formData.append(`images[${index}]`, image.file);
    });

    // Add specifications (filter out empty ones)
    const validSpecs = this.specifications.filter(spec => spec.key.trim() && spec.value.trim());
    formData.append('specs', JSON.stringify(validSpecs));

    this.isSubmitting = true;

    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      alert('Product added successfully! It will be reviewed before being published.');
      this.router.navigate(['/seller-dashboard']);
    }, 2000);
  }
}