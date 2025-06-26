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
import { SignupComponent } from './closure/signup/signup.component';

export const routes: Routes = [
    { path: '', redirectTo: 'homepage', pathMatch: 'full' },//the default page
    { path: 'homepage', component: HomepageComponent },
    { path: 'shop', component: ShopComponent },
    { path: 'phones', component: PhonesComponent },
    { path: 'laptops', component: LaptopsComponent },
    { path: 'accessories', component: AccessoriesComponent },
    { path: 'home-appliances', component: HomeAppliancesComponent },
    { path: 'gaming', component: GamingComponent },
    { path: 'audio-sound', component: AudioSoundComponent },
    { path: 'about', component: AboutComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'deals', component: DealsComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'cart', component: CartComponent },
    { path: 'details', component: DetailsComponent },
    { path: 'payment', component: PaymentComponent }
];
