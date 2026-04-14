import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AboutComponent } from '../about/about.component';
import { AccessibilityComponent } from '../accessibility/accessibility.component';
import { ContactusComponent } from '../contact/contactus.component';
import { CookiePolicyComponent } from '../cookie-policy/cookie-policy.component';
import { FaqComponent } from '../faq/faq.component';
import { PrivacyComponent } from '../privacy/privacy.component';
import { ReturnsComponent } from '../returns/returns.component';
import { ShippingComponent } from '../shipping/shipping.component';

const routes: Routes = [
  { path: 'about', component: AboutComponent, data: { breadcrumb: 'About' } },
  { path: 'accessibility', component: AccessibilityComponent, data: { breadcrumb: 'Accessibility' } },
  { path: 'contact', component: ContactusComponent, data: { breadcrumb: 'Contact' } },
  { path: 'cookie-policy', component: CookiePolicyComponent, data: { breadcrumb: 'Cookie Policy' } },
  { path: 'faq', component: FaqComponent, data: { breadcrumb: 'FAQ' } },
  { path: 'shipping', component: ShippingComponent, data: { breadcrumb: 'Shipping' } },
  { path: 'returns', component: ReturnsComponent, data: { breadcrumb: 'Returns' } },
  { path: 'privacy', component: PrivacyComponent, data: { breadcrumb: 'Privacy Policy' } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InfoPagesRoutingModule {}
