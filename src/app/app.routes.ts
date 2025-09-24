import { Routes } from '@angular/router';

import { HomepageComponent } from './homepage/homepage.component';
import { GamingComponent } from './categories/gaming/gaming.component';
import { HomeAppliancesComponent } from './categories/home-appliances/home-appliances.component';
import { AccessoriesComponent } from './categories/accessories/accessories.component';
import { LaptopsComponent } from './categories/laptops/laptops.component';
import { PhonesComponent } from './categories/phones/phones.component';
import { ShopComponent } from './shop/shop.component';
import { AudioSoundComponent } from './categories/audio-sound/audio-sound.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { DealsComponent } from './deals/deals.component';
import { CartComponent } from './closure/cart/cart.component';
import { DetailsComponent } from './closure/details/details.component';
import { PaymentComponent } from './closure/payment/payment.component';
import { ProfileComponent } from './profile/profile.component';
import { SellerDashboardComponent } from './seller-dashboard/seller-dashboard.component';
import { ProductComponent } from './product/product.component';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPwdComponent } from './auth/forgot-pwd/forgot-pwd.component';
import { SignupComponent } from './auth/signup/signup.component';
import { AddProductComponent } from './add-product/add-product.component';

export const routes: Routes = [
    { path: '', redirectTo: 'homepage', pathMatch: 'full' },//the default page
    { path: 'homepage', component: HomepageComponent },
    { path: 'shop', component: ShopComponent },
    { path: 'categories/Phones', component: PhonesComponent },
    { path: 'categories/Laptops', component: LaptopsComponent },
    { path: 'categories/Accessories', component: AccessoriesComponent },
    { path: 'categories/Home Appliances', component: HomeAppliancesComponent },
    { path: 'categories/Gaming', component: GamingComponent },
    { path: 'categories/Audio & Sound', component: AudioSoundComponent },
    { path: 'about', component: AboutComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'deals', component: DealsComponent },
    { path: 'cart', component: CartComponent },
    { path: 'details', component: DetailsComponent },
    { path: 'payment', component: PaymentComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'seller-dashboard', component: SellerDashboardComponent },
    { path: 'product', component: ProductComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'forgot-pwd', component: ForgotPwdComponent },
    { path: 'add-product', component: AddProductComponent },
];

