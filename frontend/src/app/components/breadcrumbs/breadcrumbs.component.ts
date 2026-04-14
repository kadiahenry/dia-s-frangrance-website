import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Breadcrumb, BreadcrumbService } from 'src/app/core/services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.css']
})
export class BreadcrumbsComponent {

  /**
   * Hide breadcrumbs on pages like Home.
   * Example: <app-breadcrumbs [hide]="true"></app-breadcrumbs>
   */
  @Input() hide: boolean = false;

  crumbs$: Observable<Breadcrumb[]>;

  constructor(private breadcrumbService: BreadcrumbService) {
    this.crumbs$ = this.breadcrumbService.crumbs$;
  }
}
