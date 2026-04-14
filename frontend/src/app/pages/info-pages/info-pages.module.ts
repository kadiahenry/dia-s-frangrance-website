import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../../shared/shared.module';
import { AccessibilityComponent } from '../accessibility/accessibility.component';
import { AboutComponent } from '../about/about.component';
import { ContactusComponent } from '../contact/contactus.component';
import { CookiePolicyComponent } from '../cookie-policy/cookie-policy.component';
import { FaqComponent } from '../faq/faq.component';
import { PrivacyComponent } from '../privacy/privacy.component';
import { ReturnsComponent } from '../returns/returns.component';
import { ShippingComponent } from '../shipping/shipping.component';
import { InfoPagesRoutingModule } from './info-pages-routing.module';

@NgModule({
  declarations: [
    AboutComponent,
    AccessibilityComponent,
    ContactusComponent,
    CookiePolicyComponent,
    FaqComponent,
    ShippingComponent,
    ReturnsComponent,
    PrivacyComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    InfoPagesRoutingModule
  ]
})
export class InfoPagesModule {}
