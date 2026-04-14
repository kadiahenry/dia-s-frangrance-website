import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() background: string = 'default';

  // ✅ this is the input your Products page is binding to
  @Input() hideBreadcrumbs: boolean = false;
}
